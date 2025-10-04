import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.js';

const prisma = new PrismaClient();

/**
 * Enroll user in a course
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} Created enrollment
 */
export const enrollInCourse = async (userId, courseId) => {
  try {
    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: true
      }
    });

    if (!course) {
      throw new Error('Course not found');
    }

    if (course.status !== 'PUBLISHED') {
      throw new Error('Cannot enroll in non-published course');
    }

    // Check if already enrolled
    // Check if enrollment already exists
  const existingEnrollment = await prisma.enrollment.findUnique({
    where: {
      unique_user_course_enrollment: {
        userId,
        courseId
      }
    }
  });

    if (existingEnrollment) {
      throw new Error('Already enrolled in this course');
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        progress: 0,
        enrolledAt: new Date()
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            duration: true,
            level: true,
            category: true,
            status: true
          }
        }
      }
    });

    logger.info('User enrolled in course', {
      userId,
      courseId,
      enrollmentId: enrollment.id
    });

    return enrollment;
  } catch (error) {
    logger.error('Error enrolling in course', {
      userId,
      courseId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get user's enrollments with progress
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of enrollments with progress details
 */
export const getUserEnrollments = async (userId) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            description: true,
            thumbnail: true,
            duration: true,
            level: true,
            category: true,
            status: true,
            _count: {
              select: {
                lessons: true
              }
            }
          }
        },
        _count: {
          select: {
            lessonProgress: {
              where: {
                completed: true
              }
            }
          }
        }
      },
      orderBy: {
        enrolledAt: 'desc'
      }
    });

    // Format response with progress details
    const formattedEnrollments = enrollments.map(enrollment => ({
      id: enrollment.id,
      courseId: enrollment.courseId,
      course: enrollment.course,
      progress: enrollment.progress,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      certificateIssued: enrollment.certificateIssued,
      totalLessons: enrollment.course._count.lessons,
      completedLessons: enrollment._count.lessonProgress,
      isCompleted: enrollment.completedAt !== null
    }));

    logger.info('Retrieved user enrollments', {
      userId,
      count: formattedEnrollments.length
    });

    return formattedEnrollments;
  } catch (error) {
    logger.error('Error getting user enrollments', {
      userId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get enrollment by ID
 * @param {string} enrollmentId - Enrollment ID
 * @returns {Promise<Object>} Enrollment details
 */
export const getEnrollmentById = async (enrollmentId) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            lessons: {
              orderBy: {
                order: 'asc'
              }
            }
          }
        },
        lessonProgress: true
      }
    });

    return enrollment;
  } catch (error) {
    logger.error('Error getting enrollment', {
      enrollmentId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Check if user is enrolled in course
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Promise<Object|null>} Enrollment or null
 */
export const checkEnrollment = async (userId, courseId) => {
  try {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        unique_user_course_enrollment: {
          userId,
          courseId
        }
      },
      include: {
        lessonProgress: {
          select: {
            lessonId: true,
            completed: true,
            watchedAt: true
          }
        }
      }
    });

    return enrollment;
  } catch (error) {
    logger.error('Error checking enrollment', {
      userId,
      courseId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Recalculate course progress
 * @param {string} enrollmentId - Enrollment ID
 * @returns {Promise<Object>} Updated enrollment
 */
export const recalculateProgress = async (enrollmentId) => {
  try {
    // Get enrollment with course and lessons
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            lessons: true
          }
        },
        lessonProgress: {
          where: {
            completed: true
          }
        }
      }
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const totalLessons = enrollment.course.lessons.length;
    const completedLessons = enrollment.lessonProgress.length;

    // Calculate progress percentage
    const progress = totalLessons > 0 
      ? Math.round((completedLessons / totalLessons) * 100) 
      : 0;

    // Check if course is completed
    const isCompleted = progress === 100;
    const updateData = {
      progress
    };

    // If just completed, set completedAt
    if (isCompleted && !enrollment.completedAt) {
      updateData.completedAt = new Date();
      
      logger.info('Course completed!', {
        enrollmentId,
        userId: enrollment.userId,
        courseId: enrollment.courseId,
        progress
      });

      // TODO: Queue certificate issuance job
      // await queueCertificateIssuance(enrollmentId);
    }

    // Update enrollment
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: updateData,
      include: {
        course: {
          select: {
            id: true,
            title: true,
            duration: true
          }
        }
      }
    });

    logger.info('Progress recalculated', {
      enrollmentId,
      progress,
      completedLessons,
      totalLessons,
      isCompleted
    });

    return updatedEnrollment;
  } catch (error) {
    logger.error('Error recalculating progress', {
      enrollmentId,
      error: error.message
    });
    throw error;
  }
};

export default {
  enrollInCourse,
  getUserEnrollments,
  getEnrollmentById,
  checkEnrollment,
  recalculateProgress
};
