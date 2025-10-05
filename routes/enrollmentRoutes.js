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
import { validateUUID } from '../middleware/validationMiddleware.js';

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
  validateUUID('id'),
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
  validateUUID('id'),
  getCourseProgressDetails
);

// Get enrollment status for a course
router.get(
  '/courses/:id/enrollment',
  ensureAuth,
  validateUUID('id'),
  getEnrollmentStatus
);

// Mark lesson as complete (Learner only)
router.post(
  '/lessons/:id/complete',
  ensureAuth,
  requireLearner,
  validateUUID('id'),
  completeLessonForUser
);

export default router;
