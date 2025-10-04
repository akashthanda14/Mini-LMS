import express from 'express';
import {
  enrollUserInCourse,
  getUserProgress,
  getCourseProgressDetails,
  completeLessonForUser,
  getEnrollmentStatus
} from '../controllers/enrollmentController.js';
import { ensureAuth } from '../middleware/authMiddleware.js';
import { requireLearner } from '../middleware/rbacMiddleware.js';

const router = express.Router();

/**
 * Enrollment & Progress Routes
 * All routes require authentication
 */

// Enroll in course (Learner only)
router.post(
  '/courses/:id/enroll',
  ensureAuth,
  requireLearner,
  enrollUserInCourse
);

// Get all user's enrollments and progress
router.get(
  '/progress',
  ensureAuth,
  getUserProgress
);

// Get progress for specific course
router.get(
  '/courses/:id/progress',
  ensureAuth,
  getCourseProgressDetails
);

// Get enrollment status for a course
router.get(
  '/courses/:id/enrollment',
  ensureAuth,
  getEnrollmentStatus
);

// Mark lesson as complete (Learner only)
router.post(
  '/lessons/:id/complete',
  ensureAuth,
  requireLearner,
  completeLessonForUser
);

export default router;
