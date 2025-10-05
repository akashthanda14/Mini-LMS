// controllers/certificateController.js
// Controller for certificate operations

import {
  getCertificateByEnrollment,
  verifyCertificate,
  generateCertificatePDF,
  getUserCertificates
} from '../services/certificateService.js';
import logger from '../config/logger.js';

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

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
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

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all certificates for current user
 * GET /certificates
 */
export const getUserCertificatesList = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all certificates
    const certificates = await getUserCertificates(userId);

    logger.info('User certificates retrieved', {
      userId,
      count: certificates.length
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
        total: certificates.length
      }
    });
  } catch (error) {
    logger.error('Get user certificates error', {
      userId: req.user?.id,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
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

    // For now, return JSON data
    // In production, generate actual PDF using pdfkit or puppeteer
    logger.info('Certificate download requested', {
      certificateId: certificate.id,
      enrollmentId,
      userId
    });

    res.json({
      success: true,
      message: 'PDF generation not yet implemented - returning certificate data',
      data: {
        certificate: pdfData,
        note: 'Integrate pdfkit or puppeteer to generate actual PDF'
      }
    });
  } catch (error) {
    logger.error('Download certificate error', {
      enrollmentId: req.params.id,
      userId: req.user?.id,
      error: error.message
    });

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
