import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.js';
import { recalculateProgress } from './enrollmentService.js';

const prisma = new PrismaClient();

/**
 * Mark lesson as complete
 * @param {string} userId - User ID
 * @param {string} lessonId - Lesson ID
 * @returns {Promise<Object>} Lesson progress and updated enrollment
 */
export const markLessonComplete = async (userId, lessonId) => {
  try {
    // Get lesson with course info
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: true
      }
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        unique_user_course_enrollment: {
          userId,
          courseId: lesson.courseId
        }
      }
    });

    if (!enrollment) {
      throw new Error('Not enrolled in this course');
    }

    // Check if lesson progress already exists
    const existingProgress = await prisma.lessonProgress.findUnique({
      where: {
        unique_enrollment_lesson_progress: {
          enrollmentId: enrollment.id,
          lessonId
        }
      }
    });

    let lessonProgress;

    if (existingProgress) {
      // Update existing progress (idempotent)
      lessonProgress = await prisma.lessonProgress.update({
        where: {
          unique_enrollment_lesson_progress: {
            enrollmentId: enrollment.id,
            lessonId
          }
        },
        data: {
          completed: true,
          watchedAt: existingProgress.completed ? existingProgress.watchedAt : new Date()
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              order: true,
              duration: true
            }
          }
        }
      });

      logger.info('Lesson progress updated (idempotent)', {
        userId,
        lessonId,
        enrollmentId: enrollment.id,
        alreadyCompleted: existingProgress.completed
      });
    } else {
      // Create new progress entry
      lessonProgress = await prisma.lessonProgress.create({
        data: {
          enrollmentId: enrollment.id,
          lessonId,
          completed: true,
          watchedAt: new Date()
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              order: true,
              duration: true
            }
          }
        }
      });

      logger.info('Lesson marked as complete', {
        userId,
        lessonId,
        enrollmentId: enrollment.id
      });
    }

    // Recalculate course progress
    const updatedEnrollment = await recalculateProgress(enrollment.id);

    return {
      lessonProgress,
      enrollment: updatedEnrollment,
      progressUpdated: true
    };
  } catch (error) {
    logger.error('Error marking lesson complete', {
      userId,
      lessonId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get user's progress for a specific course
 * @param {string} userId - User ID
 * @param {string} courseId - Course ID
 * @returns {Promise<Object>} Course progress details
 */
export const getCourseProgress = async (userId, courseId) => {
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
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                order: true,
                duration: true
              }
            }
          },
          orderBy: {
            lesson: {
              order: 'asc'
            }
          }
        },
        course: {
          include: {
            lessons: {
              select: {
                id: true,
                title: true,
                order: true,
                duration: true
              },
              orderBy: {
                order: 'asc'
              }
            }
          }
        }
      }
    });

    if (!enrollment) {
      return null;
    }

    // Map completed lesson IDs for quick lookup
    const completedLessonIds = new Set(
      enrollment.lessonProgress
        .filter(lp => lp.completed)
        .map(lp => lp.lessonId)
    );

    // Format lessons with completion status
    const lessonsWithProgress = enrollment.course.lessons.map(lesson => ({
      ...lesson,
      completed: completedLessonIds.has(lesson.id),
      progress: enrollment.lessonProgress.find(lp => lp.lessonId === lesson.id) || null
    }));

    return {
      enrollmentId: enrollment.id,
      courseId: enrollment.courseId,
      progress: enrollment.progress,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      totalLessons: enrollment.course.lessons.length,
      completedLessons: completedLessonIds.size,
      lessons: lessonsWithProgress
    };
  } catch (error) {
    logger.error('Error getting course progress', {
      userId,
      courseId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get lesson progress for a user
 * @param {string} userId - User ID
 * @param {string} lessonId - Lesson ID
 * @returns {Promise<Object|null>} Lesson progress or null
 */
export const getLessonProgress = async (userId, lessonId) => {
  try {
    // Get lesson with course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      return null;
    }

    // Get enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        unique_user_course_enrollment: {
          userId,
          courseId: lesson.courseId
        }
      }
    });

    if (!enrollment) {
      return null;
    }

    // Get lesson progress
    const lessonProgress = await prisma.lessonProgress.findUnique({
      where: {
        unique_enrollment_lesson_progress: {
          enrollmentId: enrollment.id,
          lessonId
        }
      }
    });

    return lessonProgress;
  } catch (error) {
    logger.error('Error getting lesson progress', {
      userId,
      lessonId,
      error: error.message
    });
    throw error;
  }
};

/**
 * Reset lesson progress (mark as incomplete)
 * @param {string} userId - User ID
 * @param {string} lessonId - Lesson ID
 * @returns {Promise<Object>} Updated progress
 */
export const resetLessonProgress = async (userId, lessonId) => {
  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        unique_user_course_enrollment: {
          userId,
          courseId: lesson.courseId
        }
      }
    });

    if (!enrollment) {
      throw new Error('Not enrolled in this course');
    }

    // Update or create progress as incomplete
    const lessonProgress = await prisma.lessonProgress.upsert({
      where: {
        unique_enrollment_lesson_progress: {
          enrollmentId: enrollment.id,
          lessonId
        }
      },
      update: {
        completed: false,
        watchedAt: null
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        completed: false
      }
    });

    // Recalculate progress
    const updatedEnrollment = await recalculateProgress(enrollment.id);

    logger.info('Lesson progress reset', {
      userId,
      lessonId,
      enrollmentId: enrollment.id
    });

    return {
      lessonProgress,
      enrollment: updatedEnrollment
    };
  } catch (error) {
    logger.error('Error resetting lesson progress', {
      userId,
      lessonId,
      error: error.message
    });
    throw error;
  }
};

export default {
  markLessonComplete,
  getCourseProgress,
  getLessonProgress,
  resetLessonProgress
};
