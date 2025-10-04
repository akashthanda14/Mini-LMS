import {
  enrollInCourse,
  getUserEnrollments,
  checkEnrollment
} from '../services/enrollmentService.js';
import {
  markLessonComplete,
  getCourseProgress
} from '../services/lessonProgressService.js';
import logger from '../config/logger.js';

/**
 * Enroll in course
 * POST /courses/:id/enroll
 */
export const enrollUserInCourse = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user.id;

    // Validate user role (must be LEARNER)
    if (req.user.role !== 'LEARNER') {
      return res.status(403).json({
        success: false,
        message: 'Only learners can enroll in courses'
      });
    }

    const enrollment = await enrollInCourse(userId, courseId);

    return res.status(201).json({
      success: true,
      message: 'Successfully enrolled in course',
      data: {
        enrollment
      }
    });
  } catch (error) {
    logger.error('Enroll in course error', {
      courseId: req.params.id,
      userId: req.user?.id,
      error: error.message
    });

    if (error.message === 'Course not found') {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (error.message === 'Cannot enroll in non-published course') {
      return res.status(400).json({
        success: false,
        message: 'Cannot enroll in non-published course'
      });
    }

    if (error.message === 'Already enrolled in this course') {
      return res.status(409).json({
        success: false,
        message: 'Already enrolled in this course'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get user's enrollments and progress
 * GET /progress
 */
export const getUserProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollments = await getUserEnrollments(userId);

    return res.status(200).json({
      success: true,
      data: {
        enrollments,
        totalEnrollments: enrollments.length,
        completedCourses: enrollments.filter(e => e.isCompleted).length
      }
    });
  } catch (error) {
    logger.error('Get user progress error', {
      userId: req.user?.id,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get progress for specific course
 * GET /courses/:id/progress
 */
export const getCourseProgressDetails = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user.id;

    const progress = await getCourseProgress(userId, courseId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Not enrolled in this course'
      });
    }

    return res.status(200).json({
      success: true,
      data: progress
    });
  } catch (error) {
    logger.error('Get course progress error', {
      courseId: req.params.id,
      userId: req.user?.id,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Mark lesson as complete
 * POST /lessons/:id/complete
 */
export const completeLessonForUser = async (req, res) => {
  try {
    const { id: lessonId } = req.params;
    const userId = req.user.id;

    // Validate user role (must be LEARNER)
    if (req.user.role !== 'LEARNER') {
      return res.status(403).json({
        success: false,
        message: 'Only learners can mark lessons as complete'
      });
    }

    const result = await markLessonComplete(userId, lessonId);

    return res.status(200).json({
      success: true,
      message: 'Lesson marked as complete',
      data: {
        lessonProgress: result.lessonProgress,
        courseProgress: {
          progress: result.enrollment.progress,
          completedAt: result.enrollment.completedAt,
          isCompleted: result.enrollment.progress === 100
        }
      }
    });
  } catch (error) {
    logger.error('Complete lesson error', {
      lessonId: req.params.id,
      userId: req.user?.id,
      error: error.message
    });

    if (error.message === 'Lesson not found') {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    if (error.message === 'Not enrolled in this course') {
      return res.status(403).json({
        success: false,
        message: 'You must be enrolled in the course to mark lessons as complete'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Check enrollment status for a course
 * GET /courses/:id/enrollment
 */
export const getEnrollmentStatus = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const userId = req.user.id;

    const enrollment = await checkEnrollment(userId, courseId);

    if (!enrollment) {
      return res.status(200).json({
        success: true,
        data: {
          enrolled: false,
          enrollment: null
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        enrolled: true,
        enrollment: {
          id: enrollment.id,
          progress: enrollment.progress,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt,
          completedLessons: enrollment.lessonProgress.filter(lp => lp.completed).length
        }
      }
    });
  } catch (error) {
    logger.error('Get enrollment status error', {
      courseId: req.params.id,
      userId: req.user?.id,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

export default {
  enrollUserInCourse,
  getUserProgress,
  getCourseProgressDetails,
  completeLessonForUser,
  getEnrollmentStatus
};
