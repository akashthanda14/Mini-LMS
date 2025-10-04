// services/courseService.js
// Service layer for course CRUD operations

import prisma from '../lib/prisma.js';
import logger from '../config/logger.js';

/**
 * Create a new course (DRAFT status)
 * @param {string} creatorId - Creator user ID
 * @param {Object} courseData - Course data
 * @returns {Promise<Object>} Created course
 */
export const createCourse = async (creatorId, courseData) => {
  try {
    const course = await prisma.course.create({
      data: {
        ...courseData,
        creatorId,
        status: 'DRAFT',
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          }
        }
      }
    });

    logger.info('Course created', { courseId: course.id, creatorId });
    return course;
  } catch (error) {
    logger.error('Error creating course:', { creatorId, error: error.message });
    throw error;
  }
};

/**
 * Get course by ID with lessons
 * @param {string} courseId - Course ID
 * @returns {Promise<Object|null>} Course with lessons
 */
export const getCourseById = async (courseId) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          }
        },
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
            duration: true,
            videoUrl: true,
            transcript: true,
          }
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            certificates: true,
          }
        }
      }
    });

    return course;
  } catch (error) {
    logger.error('Error getting course by ID:', { courseId, error: error.message });
    throw error;
  }
};

/**
 * Get course by ID with enrollment status for a user
 * @param {string} courseId - Course ID
 * @param {string} userId - User ID (optional)
 * @returns {Promise<Object|null>} Course with enrollment details
 */
export const getCourseWithEnrollment = async (courseId, userId = null) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          }
        },
        lessons: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            title: true,
            order: true,
            duration: true,
            videoUrl: true,
            transcript: true,
          }
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
            certificates: true,
          }
        }
      }
    });

    if (!course) {
      return null;
    }

    // If userId provided, check enrollment status
    let enrollment = null;
    if (userId) {
      enrollment = await prisma.enrollment.findUnique({
        where: {
          unique_user_course_enrollment: {
            userId,
            courseId
          }
        },
        select: {
          id: true,
          progress: true,
          enrolledAt: true,
          completedAt: true,
          certificate: {
            select: {
              id: true,
              issuedAt: true
            }
          }
        }
      });
    }

    return {
      ...course,
      enrollment: enrollment || null,
      isEnrolled: !!enrollment
    };
  } catch (error) {
    logger.error('Error getting course with enrollment:', { courseId, userId, error: error.message });
    throw error;
  }
};

/**
 * Get courses with filters
 * @param {Object} filters - Query filters
 * @returns {Promise<Array>} List of courses
 */
export const getCourses = async (filters = {}) => {
  try {
    const { status, creatorId, includeAll } = filters;
    
    const where = {};
    
    if (status) {
      where.status = status;
    }
    
    if (creatorId) {
      where.creatorId = creatorId;
    }

    const courses = await prisma.course.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
          }
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return courses;
  } catch (error) {
    logger.error('Error getting courses:', { filters, error: error.message });
    throw error;
  }
};

/**
 * Update course (DRAFT only)
 * @param {string} courseId - Course ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated course
 */
export const updateCourse = async (courseId, updateData) => {
  try {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      }
    });

    logger.info('Course updated', { courseId });
    return course;
  } catch (error) {
    logger.error('Error updating course:', { courseId, error: error.message });
    throw error;
  }
};

/**
 * Submit course for review (DRAFT → PENDING)
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} Updated course
 */
export const submitCourseForReview = async (courseId) => {
  try {
    // Check if course has at least one lesson
    const lessonCount = await prisma.lesson.count({
      where: { courseId }
    });

    if (lessonCount === 0) {
      throw new Error('Course must have at least one lesson before submitting');
    }

    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'PENDING',
        submittedAt: new Date(),
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            lessons: true,
          }
        }
      }
    });

    logger.info('Course submitted for review', { courseId, lessonCount });
    return course;
  } catch (error) {
    logger.error('Error submitting course:', { courseId, error: error.message });
    throw error;
  }
};

/**
 * Delete course (DRAFT only)
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} Deleted course
 */
export const deleteCourse = async (courseId) => {
  try {
    const course = await prisma.course.delete({
      where: { id: courseId }
    });

    logger.info('Course deleted', { courseId });
    return course;
  } catch (error) {
    logger.error('Error deleting course:', { courseId, error: error.message });
    throw error;
  }
};

/**
 * Publish course (PENDING → PUBLISHED) - Admin only
 * @param {string} courseId - Course ID
 * @param {string} adminId - Admin user ID
 * @returns {Promise<Object>} Published course
 */
export const publishCourse = async (courseId, adminId) => {
  try {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        reviewedBy: adminId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        _count: {
          select: {
            lessons: true,
          }
        }
      }
    });

    logger.info('Course published', { courseId, adminId });
    return course;
  } catch (error) {
    logger.error('Error publishing course:', { courseId, error: error.message });
    throw error;
  }
};

/**
 * Reject course (PENDING → REJECTED) - Admin only
 * @param {string} courseId - Course ID
 * @param {string} adminId - Admin user ID
 * @param {string} feedback - Rejection feedback
 * @returns {Promise<Object>} Rejected course
 */
export const rejectCourse = async (courseId, adminId, feedback) => {
  try {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'REJECTED',
        rejectionReason: feedback,
        reviewedBy: adminId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    logger.info('Course rejected', { courseId, adminId });
    return course;
  } catch (error) {
    logger.error('Error rejecting course:', { courseId, error: error.message });
    throw error;
  }
};

export default {
  createCourse,
  getCourseById,
  getCourseWithEnrollment,
  getCourses,
  updateCourse,
  submitCourseForReview,
  deleteCourse,
  publishCourse,
  rejectCourse,
};
