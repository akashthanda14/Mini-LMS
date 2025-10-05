// controllers/creatorController.js
// Controller for creator application and dashboard

import validator from 'validator';
import prisma from '../lib/prisma.js';
import {
  createCreatorApplication,
  getApplicationByUserId,
} from '../services/creatorApplicationService.js';

/**
 * POST /creator/apply
 * Submit creator application
 * @access Private - LEARNER only
 */
export const submitApplication = async (req, res) => {
  try {
    const { bio, portfolio, experience } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!bio || !experience) {
      return res.status(400).json({
        success: false,
        message: 'Bio and experience are required fields.',
      });
    }

    // Validate bio length (100-500 characters)
    if (bio.length < 100 || bio.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Bio must be between 100 and 500 characters.',
        bioLength: bio.length,
      });
    }

    // Validate portfolio URL if provided
    if (portfolio && !validator.isURL(portfolio)) {
      return res.status(400).json({
        success: false,
        message: 'Portfolio must be a valid URL.',
      });
    }

    // Validate experience length
    if (experience.length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Experience must be at least 50 characters.',
      });
    }

    // Check if user is a learner
    if (req.user.role !== 'LEARNER') {
      return res.status(403).json({
        success: false,
        message: 'Only learners can apply to become creators.',
        currentRole: req.user.role,
      });
    }

    // Create application
    const application = await createCreatorApplication(userId, {
      bio: bio.trim(),
      portfolio: portfolio ? portfolio.trim() : null,
      experience: experience.trim(),
    });

    return res.status(201).json({
      success: true,
      message: 'Creator application submitted successfully. You will be notified once reviewed.',
      application: {
        id: application.id,
        status: application.status,
        createdAt: application.createdAt,
      },
    });
  } catch (error) {
    console.error('Submit application error:', error);

    if (error.message === 'You already have a creator application') {
      return res.status(409).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
    });
  }
};

/**
 * GET /creator/status
 * Get application status for current user
 * @access Private
 */
export const getApplicationStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const application = await getApplicationByUserId(userId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'No application found. You can submit an application to become a creator.',
        canApply: req.user.role === 'LEARNER',
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
        updatedAt: application.updatedAt,
        reviewedAt: application.reviewedAt,
        rejectionReason: application.rejectionReason,
        reviewer: application.reviewer ? {
          name: application.reviewer.name,
          email: application.reviewer.email,
        } : null,
      },
    });
  } catch (error) {
    console.error('Get application status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * GET /creator/dashboard
 * Get creator dashboard with courses and stats
 * @access Private - CREATOR only
 */
export const getCreatorDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get creator's courses
    const courses = await prisma.course.findMany({
      where: { creatorId: userId },
      include: {
        lessons: {
          select: {
            id: true,
            title: true,
            order: true,
            duration: true,
          },
          orderBy: { order: 'asc' }
        },
        enrollments: {
          select: {
            id: true,
            userId: true,
            progress: true,
            enrolledAt: true,
          }
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            certificates: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate stats
    const totalCourses = courses.length;
    const publishedCourses = courses.filter(c => c.status === 'PUBLISHED').length;
    const draftCourses = courses.filter(c => c.status === 'DRAFT').length;
    const totalEnrollments = courses.reduce((sum, c) => sum + c._count.enrollments, 0);
    const totalLessons = courses.reduce((sum, c) => sum + c._count.lessons, 0);
    const totalCertificates = courses.reduce((sum, c) => sum + c._count.certificates, 0);

    // Get creator application
    const application = await getApplicationByUserId(userId);

    return res.status(200).json({
      success: true,
      dashboard: {
        creator: {
          id: req.user.id,
          name: req.user.name,
          username: req.user.username,
          email: req.user.email,
        },
        application: application ? {
          approvedAt: application.reviewedAt,
          status: application.status,
        } : null,
        stats: {
          totalCourses,
          publishedCourses,
          draftCourses,
          totalEnrollments,
          totalLessons,
          totalCertificates,
        },
        courses: courses.map(course => ({
          id: course.id,
          title: course.title,
          description: course.description,
          thumbnail: course.thumbnail,
          category: course.category,
          level: course.level,
          status: course.status,
          duration: course.duration,
          createdAt: course.createdAt,
          publishedAt: course.publishedAt,
          lessonCount: course._count.lessons,
          enrollmentCount: course._count.enrollments,
          certificateCount: course._count.certificates,
          lessons: course.lessons,
        })),
      },
    });
  } catch (error) {
    console.error('Get creator dashboard error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

export default {
  submitApplication,
  getApplicationStatus,
  getCreatorDashboard,
};
