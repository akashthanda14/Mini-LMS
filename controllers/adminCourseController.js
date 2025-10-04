// controllers/adminCourseController.js
// Controller for admin course review operations

import {
  getCourses,
  getCourseById,
  publishCourse,
  rejectCourse,
} from '../services/courseService.js';

import {
  canReviewCourse,
} from '../services/courseValidationService.js';

/**
 * GET /admin/courses
 * Get courses for admin review (with optional status filter)
 * @access Private - ADMIN only
 */
export const getCoursesForReview = async (req, res) => {
  try {
    const { status } = req.query;

    // Validate status if provided
    if (status) {
      const validStatuses = ['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        });
      }
    }

    const filters = status ? { status } : {};
    const courses = await getCourses(filters);

    return res.status(200).json({
      success: true,
      count: courses.length,
      courses: courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        category: course.category,
        level: course.level,
        duration: course.duration,
        status: course.status,
        createdAt: course.createdAt,
        submittedAt: course.submittedAt,
        publishedAt: course.publishedAt,
        creator: {
          id: course.creator.id,
          name: course.creator.name,
          username: course.creator.username,
          email: course.creator.email,
        },
        lessonCount: course._count.lessons,
        enrollmentCount: course._count.enrollments,
      })),
    });
  } catch (error) {
    console.error('Get courses for review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /admin/courses/pending
 * Get pending courses awaiting review
 * @access Private - ADMIN only
 */
export const getPendingCourses = async (req, res) => {
  try {
    const courses = await getCourses({ status: 'PENDING' });

    return res.status(200).json({
      success: true,
      count: courses.length,
      courses: courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        category: course.category,
        level: course.level,
        status: course.status,
        submittedAt: course.submittedAt,
        creator: {
          id: course.creator.id,
          name: course.creator.name,
          email: course.creator.email,
        },
        lessonCount: course._count.lessons,
      })),
    });
  } catch (error) {
    console.error('Get pending courses error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * POST /admin/courses/:id/publish
 * Publish a course
 * @access Private - ADMIN only
 */
export const publishCourseByCourseId = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Get course
    const course = await getCourseById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if course can be reviewed
    const reviewCheck = canReviewCourse(course);
    if (!reviewCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: reviewCheck.reason,
        currentStatus: course.status,
      });
    }

    // Publish course
    const publishedCourse = await publishCourse(id, adminId);

    return res.status(200).json({
      success: true,
      message: 'Course published successfully',
      course: {
        id: publishedCourse.id,
        title: publishedCourse.title,
        status: publishedCourse.status,
        publishedAt: publishedCourse.publishedAt,
        creator: {
          id: publishedCourse.creator.id,
          name: publishedCourse.creator.name,
          email: publishedCourse.creator.email,
        },
        lessonCount: publishedCourse._count.lessons,
      },
    });
  } catch (error) {
    console.error('Publish course error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * POST /admin/courses/:id/reject
 * Reject a course with feedback
 * @access Private - ADMIN only
 */
export const rejectCourseByCourseId = async (req, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const adminId = req.user.id;

    // Validate feedback
    if (!feedback || feedback.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Rejection feedback is required and must be at least 10 characters',
      });
    }

    // Get course
    const course = await getCourseById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check if course can be reviewed
    const reviewCheck = canReviewCourse(course);
    if (!reviewCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: reviewCheck.reason,
        currentStatus: course.status,
      });
    }

    // Reject course
    const rejectedCourse = await rejectCourse(id, adminId, feedback.trim());

    return res.status(200).json({
      success: true,
      message: 'Course rejected',
      course: {
        id: rejectedCourse.id,
        title: rejectedCourse.title,
        status: rejectedCourse.status,
        rejectionReason: rejectedCourse.rejectionReason,
        creator: {
          id: rejectedCourse.creator.id,
          name: rejectedCourse.creator.name,
          email: rejectedCourse.creator.email,
        },
      },
    });
  } catch (error) {
    console.error('Reject course error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /admin/courses/:id
 * Get detailed course information for review
 * @access Private - ADMIN only
 */
export const getCourseForReview = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await getCourseById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    return res.status(200).json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        category: course.category,
        level: course.level,
        duration: course.duration,
        status: course.status,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        submittedAt: course.submittedAt,
        publishedAt: course.publishedAt,
        rejectionReason: course.rejectionReason,
        creator: course.creator,
        lessons: course.lessons,
        stats: {
          lessonCount: course._count.lessons,
          enrollmentCount: course._count.enrollments,
          certificateCount: course._count.certificates,
        },
      },
    });
  } catch (error) {
    console.error('Get course for review error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export default {
  getCoursesForReview,
  getPendingCourses,
  publishCourseByCourseId,
  rejectCourseByCourseId,
  getCourseForReview,
};
