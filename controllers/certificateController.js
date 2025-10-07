// controllers/certificateController.js
// Controller for certificate operations

import {
  getCertificateByEnrollment,
  verifyCertificate,
  generateCertificatePDF,
  getUserCertificates
} from '../services/certificateService.js';
import prisma from '../lib/prisma.js';
import logger from '../config/logger.js';
import PDFDocument from 'pdfkit';
import { queueCertificateGeneration } from '../config/queue.js';
import { getEnrollmentById } from '../services/enrollmentService.js';

/**
 * Get certificate for enrollment
 * GET /enrollments/:id/certificate
 */
export const getEnrollmentCertificate = async (req, res) => {
  try {
    const { id: enrollmentId } = req.params;
    const userId = req.user.id;

    // Get certificate
    const certificate = await getCertificateByEnrollment(enrollmentId);

    if (!certificate) {
      // Provide extra debug info when requested so the frontend can surface useful error details.
      const debugRequested = req.query.debug === '1' || process.env.DEBUG_API === 'true' || process.env.NODE_ENV !== 'production';

      if (debugRequested) {
        // Try to fetch enrollment state to explain why certificate is missing
        const enrollment = await prisma.enrollment.findUnique({
          where: { id: enrollmentId },
          include: {
            user: { select: { id: true, name: true, email: true } },
            course: { select: { id: true, title: true } },
            certificate: true
          }
        });

        return res.status(404).json({
          success: false,
          message: 'Certificate not found - debug info included',
          debug: {
            enrollmentExists: !!enrollment,
            enrollmentId: enrollment ? enrollment.id : null,
            userId: enrollment?.user?.id || null,
            courseId: enrollment?.course?.id || null,
            progress: enrollment?.progress ?? null,
            completedAt: enrollment?.completedAt ?? null,
            certificateRecordExists: !!enrollment?.certificate,
            note: 'If progress < 100 or completedAt is null, the certificate will not be generated. If certificateRecordExists is false but progress===100, check worker/queue logs.'
          }
        });
      }

      return res.status(404).json({
        success: false,
        message: 'Certificate not found - course may not be completed yet'
      });
    }

    // Verify ownership
    if (certificate.enrollment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - not your certificate'
      });
    }

    // Check if progress is 100%
    if (certificate.enrollment.progress !== 100) {
      return res.status(400).json({
        success: false,
        message: 'Certificate not available - course not completed'
      });
    }

    // Get PDF data
    const pdfData = await generateCertificatePDF(certificate.id);

    logger.info('Certificate retrieved', {
      certificateId: certificate.id,
      enrollmentId,
      userId
    });

    res.json({
      success: true,
      data: {
        certificate: {
          id: certificate.id,
          serialHash: certificate.serialHash,
          issuedAt: certificate.issuedAt,
          learner: {
            name: pdfData.learnerName,
            email: pdfData.learnerEmail
          },
          course: {
            title: pdfData.courseTitle,
            level: pdfData.courseLevel,
            category: pdfData.courseCategory,
            duration: pdfData.courseDuration,
            instructor: pdfData.instructorName
          },
          completedAt: pdfData.completedAt,
          enrolledAt: pdfData.enrolledAt,
          verificationUrl: `${req.protocol}://${req.get('host')}/api/certificates/verify/${certificate.serialHash}`
        }
      }
    });
  } catch (error) {
    logger.error('Get enrollment certificate error', {
      enrollmentId: req.params.id,
      userId: req.user?.id,
      error: error.message
    });
    // Provide additional debug information when requested via query or enabled in non-production
    const showDebug = req.query?.debug === '1' || process.env.DEBUG_API === 'true' || process.env.NODE_ENV !== 'production';
    const payload = {
      success: false,
      message: 'Internal server error'
    };
    if (showDebug) {
      payload.error = {
        message: error.message,
        stack: (error.stack || '').split('\n').slice(0, 5)
      };
    }
    res.status(500).json(payload);
  }
};

  /**
   * Trigger certificate generation (async)
   * POST /enrollments/:id/certificate/generate
   * Requires auth and enrollment ownership
   */
  export const triggerCertificateGeneration = async (req, res) => {
    try {
      const { id: enrollmentId } = req.params;
      const userId = req.user.id;

      // Ensure enrollment exists and belongs to user
      const enrollment = await getEnrollmentById(enrollmentId);
      if (!enrollment) {
        return res.status(404).json({ success: false, message: 'Enrollment not found' });
      }
      if (enrollment.userId !== userId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      // If certificate already exists, return it immediately
      const existingCert = await getCertificateByEnrollment(enrollmentId);
      if (existingCert) {
        return res.status(200).json({
          success: true,
          message: 'Certificate already exists',
          data: {
            certificate: {
              id: existingCert.id,
              serialHash: existingCert.serialHash,
              issuedAt: existingCert.issuedAt
            }
          }
        });
      }

      // Queue certificate generation and return 202 Accepted
      await queueCertificateGeneration(enrollmentId);
      logger.info('Certificate generation queued via API', { enrollmentId, userId });
      return res.status(202).json({ success: true, message: 'Certificate generation queued' });
    } catch (error) {
      logger.error('Trigger certificate generation error', { enrollmentId: req.params.id, userId: req.user?.id, error: error.message });
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

/**
 * Verify certificate by serial hash
 * GET /certificates/verify/:serialHash
 * Public endpoint - no authentication required
 */
export const verifyCertificateByHash = async (req, res) => {
  try {
    const { serialHash } = req.params;

    // Verify certificate
    const verification = await verifyCertificate(serialHash);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found or invalid',
        valid: false
      });
    }

    logger.info('Certificate verified', {
      serialHash,
      learnerName: verification.learner.name,
      courseTitle: verification.course.title
    });

    res.json({
      success: true,
      data: verification
    });
  } catch (error) {
    logger.error('Verify certificate error', {
      serialHash: req.params.serialHash,
      error: error.message
    });
    const showDebug = req.query?.debug === '1' || process.env.DEBUG_API === 'true' || process.env.NODE_ENV !== 'production';
    const payload = {
      success: false,
      message: 'Internal server error'
    };
    if (showDebug) {
      payload.error = {
        message: error.message,
        stack: (error.stack || '').split('\n').slice(0, 5)
      };
    }
    res.status(500).json(payload);
  }
};

/**
 * Get all certificates for current user
 * GET /certificates
 */
export const getUserCertificatesList = async (req, res) => {
  try {
    const userId = req.user.id;

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    // Get paginated certificates
    const { certificates, total } = await getUserCertificates(userId, page, limit);

    logger.info('User certificates retrieved', {
      userId,
      count: certificates.length,
      page,
      limit,
      total
    });

    res.json({
      success: true,
      data: {
        certificates: certificates.map(cert => ({
          id: cert.id,
          serialHash: cert.serialHash,
          issuedAt: cert.issuedAt,
          course: {
            id: cert.enrollment.course.id,
            title: cert.enrollment.course.title,
            level: cert.enrollment.course.level,
            category: cert.enrollment.course.category,
            duration: cert.enrollment.course.duration
          },
          completedAt: cert.enrollment.completedAt,
          verificationUrl: `${req.protocol}://${req.get('host')}/api/certificates/verify/${cert.serialHash}`
        })),
        total,
        page,
        limit
      }
    });
  } catch (error) {
    logger.error('Get user certificates error', {
      userId: req.user?.id,
      error: error.message
    });
    const showDebug = req.query?.debug === '1' || process.env.DEBUG_API === 'true' || process.env.NODE_ENV !== 'production';
    const payload = {
      success: false,
      message: 'Internal server error'
    };
    if (showDebug) {
      payload.error = {
        message: error.message,
        stack: (error.stack || '').split('\n').slice(0, 5)
      };
    }
    res.status(500).json(payload);
  }
};

/**
 * Download certificate as PDF
 * GET /enrollments/:id/certificate/download
 * TODO: Implement PDF generation with pdfkit or puppeteer
 */
export const downloadCertificatePDF = async (req, res) => {
  try {
    const { id: enrollmentId } = req.params;
    const userId = req.user.id;

    // Get certificate
    const certificate = await getCertificateByEnrollment(enrollmentId);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Verify ownership
    if (certificate.enrollment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get PDF data
    const pdfData = await generateCertificatePDF(certificate.id);

    logger.info('Certificate download requested (streaming PDF)', {
      certificateId: certificate.id,
      enrollmentId,
      userId
    });

    // Create a PDF document and stream it to the response
    const doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Set response headers for PDF download
    const filename = `certificate-${certificate.id}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Basic PDF layout - adjust styling as needed
    doc.fontSize(20).text('Certificate of Completion', { align: 'center' });
    doc.moveDown();

    doc.fontSize(14).text(`This certifies that ${pdfData.learnerName} (${pdfData.learnerEmail})`, {
      align: 'center'
    });
    doc.moveDown();

    doc.fontSize(12).text(`Has successfully completed the course: ${pdfData.courseTitle}`, {
      align: 'center'
    });
    doc.moveDown();

    doc.fontSize(10).text(`Course Level: ${pdfData.courseLevel}    Category: ${pdfData.courseCategory}    Duration: ${pdfData.courseDuration} seconds`, {
      align: 'center'
    });
    doc.moveDown(2);

    doc.fontSize(10).text(`Instructor: ${pdfData.instructorName}`, { align: 'left' });
    doc.text(`Completed At: ${pdfData.completedAt}`, { align: 'left' });
    doc.text(`Issued At: ${new Date().toISOString()}`, { align: 'left' });
    doc.moveDown(2);

    doc.fontSize(8).text(`Serial Hash: ${certificate.serialHash}`, { align: 'left' });

    // Footer
    doc.moveDown(4);
    doc.fontSize(8).text('Powered by Mini-LMS', { align: 'center', opacity: 0.6 });

    // Finalize PDF and end the stream
    doc.end();
  } catch (error) {
    logger.error('Download certificate error', {
      enrollmentId: req.params.id,
      userId: req.user?.id,
      error: error.message
    });
    const showDebug = req.query?.debug === '1' || process.env.DEBUG_API === 'true' || process.env.NODE_ENV !== 'production';
    const payload = {
      success: false,
      message: 'Internal server error'
    };
    if (showDebug) {
      payload.error = {
        message: error.message,
        stack: (error.stack || '').split('\n').slice(0, 5)
      };
    }
    res.status(500).json(payload);
  }
};
