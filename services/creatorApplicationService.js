// services/creatorApplicationService.js
// Service for creator application operations

import prisma from '../lib/prisma.js';
import logger from '../config/logger.js';

/**
 * Create a new creator application
 * @param {string} userId - User ID
 * @param {Object} applicationData - Application data
 * @returns {Promise<Object>} Created application
 */
export const createCreatorApplication = async (userId, applicationData) => {
  try {
    const { bio, portfolio, experience } = applicationData;

    // Check if user already has an application
    const existingApplication = await prisma.creatorApplication.findUnique({
      where: { userId }
    });

    if (existingApplication) {
      throw new Error('You already have a creator application');
    }

    // Create application
    const application = await prisma.creatorApplication.create({
      data: {
        userId,
        bio,
        portfolio: portfolio || null,
        experience,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          }
        }
      }
    });

    logger.info('Creator application submitted', { userId, applicationId: application.id });

    return application;
  } catch (error) {
    logger.error('Error creating creator application:', { userId, error: error.message });
    throw error;
  }
};

/**
 * Get application status for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Application or null
 */
export const getApplicationByUserId = async (userId) => {
  try {
    const application = await prisma.creatorApplication.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    return application;
  } catch (error) {
    logger.error('Error getting application by user ID:', { userId, error: error.message });
    throw error;
  }
};

/**
 * Get pending applications (for admin)
 * @param {string} status - Application status filter
 * @returns {Promise<Array>} List of applications
 */
export const getApplicationsByStatus = async (status = 'PENDING') => {
  try {
    const applications = await prisma.creatorApplication.findMany({
      where: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phoneNumber: true,
            role: true,
            createdAt: true,
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    return applications;
  } catch (error) {
    logger.error('Error getting applications by status:', { status, error: error.message });
    throw error;
  }
};

/**
 * Approve creator application
 * @param {string} applicationId - Application ID
 * @param {string} adminId - Admin user ID
 * @returns {Promise<Object>} Updated application
 */
export const approveApplication = async (applicationId, adminId) => {
  try {
    // Get the application with user info
    const application = await prisma.creatorApplication.findUnique({
      where: { id: applicationId },
      include: { user: true }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'PENDING') {
      throw new Error('Application has already been reviewed');
    }

    // Use transaction to update both application and user role
    const result = await prisma.$transaction(async (tx) => {
      // Update user role to CREATOR first
      await tx.user.update({
        where: { id: application.userId },
        data: { role: 'CREATOR' }
      });

      // Update application status
      const updatedApplication = await tx.creatorApplication.update({
        where: { id: applicationId },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              role: true,
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          }
        }
      });

      return updatedApplication;
    });

    logger.info('Creator application approved', {
      applicationId,
      userId: application.userId,
      approvedBy: adminId
    });

    return result;
  } catch (error) {
    logger.error('Error approving application:', {
      applicationId,
      adminId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Reject creator application
 * @param {string} applicationId - Application ID
 * @param {string} adminId - Admin user ID
 * @param {string} rejectionReason - Reason for rejection
 * @returns {Promise<Object>} Updated application
 */
export const rejectApplication = async (applicationId, adminId, rejectionReason) => {
  try {
    const application = await prisma.creatorApplication.findUnique({
      where: { id: applicationId }
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'PENDING') {
      throw new Error('Application has already been reviewed');
    }

    const updatedApplication = await prisma.creatorApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: rejectionReason || 'Application does not meet requirements',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    logger.info('Creator application rejected', {
      applicationId,
      userId: application.userId,
      rejectedBy: adminId,
      reason: rejectionReason
    });

    return updatedApplication;
  } catch (error) {
    logger.error('Error rejecting application:', {
      applicationId,
      adminId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get all applications (admin view with all statuses)
 * @returns {Promise<Array>} List of all applications
 */
export const getAllApplications = async () => {
  try {
    const applications = await prisma.creatorApplication.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phoneNumber: true,
            role: true,
            createdAt: true,
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return applications;
  } catch (error) {
    logger.error('Error getting all applications:', { error: error.message });
    throw error;
  }
};

export default {
  createCreatorApplication,
  getApplicationByUserId,
  getApplicationsByStatus,
  approveApplication,
  rejectApplication,
  getAllApplications,
};
