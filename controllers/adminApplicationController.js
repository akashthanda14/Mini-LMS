// controllers/adminApplicationController.js
// Controller for admin to review creator applications

import prisma from '../lib/prisma.js';
import {
  getAllApplications,
  getApplicationsByStatus,
  approveApplication,
  rejectApplication,
} from '../services/creatorApplicationService.js';

/**
 * GET /admin/applications
 * Get all creator applications with optional status filter
 * @access Private - ADMIN only
 */
export const getAllCreatorApplications = async (req, res) => {
  try {
    const { status } = req.query;

    let applications;

    if (status) {
      // Validate status
      const validStatuses = ['PENDING', 'APPROVED', 'REJECTED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }

      applications = await getApplicationsByStatus(status);
    } else {
      applications = await getAllApplications();
    }

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications: applications.map(app => ({
        id: app.id,
        status: app.status,
        createdAt: app.createdAt,
        reviewedAt: app.reviewedAt,
        rejectionReason: app.rejectionReason,
        applicant: {
          id: app.user.id,
          name: app.user.name,
          username: app.user.username,
          email: app.user.email,
          role: app.user.role,
        },
        bio: app.bio,
        portfolio: app.portfolio,
        experience: app.experience,
        reviewer: app.reviewer ? {
          id: app.reviewer.id,
          name: app.reviewer.name,
          email: app.reviewer.email,
        } : null,
      })),
    });
  } catch (error) {
    console.error('Get all applications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * GET /admin/applications/pending
 * Get pending creator applications (convenience route)
 * @access Private - ADMIN only
 */
export const getPendingApplications = async (req, res) => {
  try {
    const applications = await getApplicationsByStatus('PENDING');

    return res.status(200).json({
      success: true,
      count: applications.length,
      applications: applications.map(app => ({
        id: app.id,
        status: app.status,
        createdAt: app.createdAt,
        applicant: {
          id: app.user.id,
          name: app.user.name,
          username: app.user.username,
          email: app.user.email,
        },
        bio: app.bio,
        portfolio: app.portfolio,
        experience: app.experience,
      })),
    });
  } catch (error) {
    console.error('Get pending applications error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * POST /admin/applications/:id/approve
 * Approve a creator application
 * @access Private - ADMIN only
 */
export const approveCreatorApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const application = await approveApplication(id, adminId);

    return res.status(200).json({
      success: true,
      message: 'Creator application approved successfully. User role upgraded to CREATOR.',
      application: {
        id: application.id,
        status: application.status,
        reviewedAt: application.reviewedAt,
        applicant: {
          id: application.user.id,
          name: application.user.name,
          email: application.user.email,
          role: application.user.role, // Should now be CREATOR
        },
      },
    });
  } catch (error) {
    console.error('Approve application error:', error);

    if (error.message === 'Application not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'Application has already been reviewed') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * POST /admin/applications/:id/reject
 * Reject a creator application with reason
 * @access Private - ADMIN only
 */
export const rejectCreatorApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Validate reason
    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required and must be at least 10 characters.',
      });
    }

    const application = await rejectApplication(id, adminId, reason.trim());

    return res.status(200).json({
      success: true,
      message: 'Creator application rejected.',
      application: {
        id: application.id,
        status: application.status,
        reviewedAt: application.reviewedAt,
        rejectionReason: application.rejectionReason,
        applicant: {
          id: application.user.id,
          name: application.user.name,
          email: application.user.email,
        },
      },
    });
  } catch (error) {
    console.error('Reject application error:', error);

    if (error.message === 'Application not found') {
      return res.status(404).json({
        success: false,
        message: error.message,
      });
    }

    if (error.message === 'Application has already been reviewed') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * GET /admin/applications/:id
 * Get a single application by ID
 * @access Private - ADMIN only
 */
export const getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await prisma.creatorApplication.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            role: true,
            profileComplete: true,
            createdAt: true,
            lastLoginAt: true,
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

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.',
      });
    }

    return res.status(200).json({
      success: true,
      application: {
        id: application.id,
        status: application.status,
        bio: application.bio,
        portfolio: application.portfolio,
        experience: application.experience,
        createdAt: application.createdAt,
        reviewedAt: application.reviewedAt,
        rejectionReason: application.rejectionReason,
        applicant: application.user,
        reviewer: application.reviewer,
      },
    });
  } catch (error) {
    console.error('Get application by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

export default {
  getAllCreatorApplications,
  getPendingApplications,
  approveCreatorApplication,
  rejectCreatorApplication,
  getApplicationById,
};
