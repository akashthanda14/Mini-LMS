// services/certificateService.js
// Service layer for certificate generation and verification

import { createHash } from 'crypto';
import prisma from '../lib/prisma.js';
import logger from '../config/logger.js';

/**
 * Generate unique serial hash for certificate
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @param {Date} completedAt - Completion timestamp
 * @returns {string} SHA256 hash
 */
export const generateSerialHash = (userId, courseId, completedAt) => {
  const data = `${userId}${courseId}${completedAt.toISOString()}`;
  return createHash('sha256').update(data).digest('hex');
};

/**
 * Generate certificate for completed enrollment
 * @param {string} enrollmentId - Enrollment ID
 * @returns {Promise<Object>} Certificate data
 */
export const generateCertificate = async (enrollmentId) => {
  try {
    // Fetch enrollment with all required data
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            level: true,
            category: true,
            duration: true,
            creator: {
              select: {
                name: true
              }
            }
          }
        },
        certificate: true
      }
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    // Validate enrollment is complete
    if (enrollment.progress !== 100) {
      throw new Error('Cannot issue certificate - course not completed');
    }

    if (!enrollment.completedAt) {
      throw new Error('Cannot issue certificate - completedAt not set');
    }

    // Check if certificate already exists
    if (enrollment.certificate) {
      logger.info('Certificate already exists', {
        enrollmentId,
        certificateId: enrollment.certificate.id
      });
      return enrollment.certificate;
    }

    // Generate unique serial hash
    const serialHash = generateSerialHash(
      enrollment.userId,
      enrollment.courseId,
      enrollment.completedAt
    );

    // Check if serial hash already exists (should be impossible, but safety check)
    const existingCert = await prisma.certificate.findUnique({
      where: { serialHash }
    });

    if (existingCert) {
      logger.warn('Serial hash collision detected', {
        serialHash,
        enrollmentId,
        existingCertificateId: existingCert.id
      });
      throw new Error('Certificate serial hash collision');
    }

    // Create certificate record. Handle unique constraint race (another worker/manual script may have created it)
    let certificate;
    try {
      certificate = await prisma.certificate.create({
        data: {
          enrollmentId,
          userId: enrollment.userId,
          courseId: enrollment.courseId,
          serialHash,
          issuedAt: new Date()
        },
        include: {
          enrollment: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              course: {
                select: {
                  id: true,
                  title: true,
                  description: true,
                  level: true,
                  category: true,
                  duration: true,
                  creator: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    } catch (err) {
      // Prisma unique constraint error code P2002 indicates another record exists with same unique field
      if (err?.code === 'P2002') {
        logger.warn('Certificate already created by another process; fetching existing record', {
          enrollmentId,
          serialHash
        });
        certificate = await prisma.certificate.findUnique({
          where: { enrollmentId },
          include: {
            enrollment: {
              include: {
                user: { select: { id: true, name: true, email: true } },
                course: { select: { id: true, title: true, level: true, category: true, duration: true, creator: { select: { name: true } } } }
              }
            }
          }
        });

        if (certificate) return certificate;
        // if still not found, rethrow the original error to surface unexpected state
        throw err;
      }

      throw err;
    }

    logger.info('Certificate generated successfully', {
      enrollmentId,
      certificateId: certificate.id,
      serialHash: certificate.serialHash,
      userId: enrollment.userId,
      courseId: enrollment.courseId
    });

    return certificate;
  } catch (error) {
    logger.error('Error generating certificate', {
      enrollmentId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get certificate by enrollment ID
 * @param {string} enrollmentId - Enrollment ID
 * @returns {Promise<Object|null>} Certificate data or null
 */
export const getCertificateByEnrollment = async (enrollmentId) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { enrollmentId },
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            course: {
              select: {
                id: true,
                title: true,
                description: true,
                level: true,
                category: true,
                duration: true,
                creator: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return certificate;
  } catch (error) {
    logger.error('Error getting certificate by enrollment', {
      enrollmentId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Verify certificate by serial hash
 * @param {string} serialHash - Certificate serial hash
 * @returns {Promise<Object|null>} Certificate verification data or null
 */
export const verifyCertificate = async (serialHash) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { serialHash },
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            },
            course: {
              select: {
                title: true,
                description: true,
                level: true,
                category: true,
                duration: true,
                creator: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!certificate) {
      return null;
    }

    // Return public verification data
    return {
      valid: true,
      serialHash: certificate.serialHash,
      issuedAt: certificate.issuedAt,
      learner: {
        name: certificate.enrollment.user.name
      },
      course: {
        title: certificate.enrollment.course.title,
        level: certificate.enrollment.course.level,
        category: certificate.enrollment.course.category,
        duration: certificate.enrollment.course.duration,
        instructor: certificate.enrollment.course.creator.name
      },
      completedAt: certificate.enrollment.completedAt
    };
  } catch (error) {
    logger.error('Error verifying certificate', {
      serialHash,
      error: error.message
    });
    throw error;
  }
};

/**
 * Generate certificate PDF data
 * @param {string} certificateId - Certificate ID
 * @returns {Promise<Object>} Certificate PDF data
 */
export const generateCertificatePDF = async (certificateId) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: certificateId },
      include: {
        enrollment: {
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            },
            course: {
              select: {
                title: true,
                description: true,
                level: true,
                category: true,
                duration: true,
                creator: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!certificate) {
      throw new Error('Certificate not found');
    }

    // Prepare certificate data for PDF generation
    const pdfData = {
      certificateId: certificate.id,
      serialHash: certificate.serialHash,
      issuedAt: certificate.issuedAt,
      learnerName: certificate.enrollment.user.name,
      learnerEmail: certificate.enrollment.user.email,
      courseTitle: certificate.enrollment.course.title,
      courseLevel: certificate.enrollment.course.level,
      courseCategory: certificate.enrollment.course.category,
      courseDuration: certificate.enrollment.course.duration,
      instructorName: certificate.enrollment.course.creator.name,
      completedAt: certificate.enrollment.completedAt,
      enrolledAt: certificate.enrollment.enrolledAt
    };

    logger.info('Certificate PDF data generated', {
      certificateId,
      serialHash: certificate.serialHash
    });

    return pdfData;
  } catch (error) {
    logger.error('Error generating certificate PDF data', {
      certificateId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get all certificates for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of certificates
 */
export const getUserCertificates = async (userId, page = 1, limit = 10) => {
  try {
    const maxLimit = 100;
    const take = Math.min(limit || 10, maxLimit);
    const skip = (Math.max(page || 1, 1) - 1) * take;

    const where = {
      enrollment: {
        userId
      }
    };

    // total count for pagination
    const total = await prisma.certificate.count({ where });

    const certificates = await prisma.certificate.findMany({
      where,
      include: {
        enrollment: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                level: true,
                category: true,
                duration: true
              }
            }
          }
        }
      },
      orderBy: {
        issuedAt: 'desc'
      },
      skip,
      take
    });

    return { certificates, total };
  } catch (error) {
    logger.error('Error getting user certificates', {
      userId,
      error: error.message
    });
    throw error;
  }
};
