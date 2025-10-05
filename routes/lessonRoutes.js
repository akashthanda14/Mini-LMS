import express from 'express';
import {
  getUploadCredentials,
  createNewLesson,
  getCourseLessons,
  getLessonDetails,
  updateExistingLesson,
  deleteExistingLesson,
  getTranscriptStatus
} from '../controllers/lessonController.js';
import { ensureAuth } from '../middleware/authMiddleware.js';
import { requireCreator } from '../middleware/rbacMiddleware.js';
import { validateUUID } from '../middleware/validationMiddleware.js';

const router = express.Router();

/**
 * Lesson Upload & Management Routes
 * All routes require authentication
 */

// Get upload credentials (Creator only)
router.post(
  '/courses/:courseId/lessons/upload',
  ensureAuth,
  requireCreator,
  validateUUID('courseId'),
  getUploadCredentials
);

// Create new lesson (Creator only)
router.post(
  '/courses/:courseId/lessons',
  ensureAuth,
  requireCreator,
  validateUUID('courseId'),
  createNewLesson
);

// Get all lessons for a course (Authenticated users)
router.get(
  '/courses/:courseId/lessons',
  ensureAuth,
  validateUUID('courseId'),
  getCourseLessons
);

// Update lesson (Creator only)
router.patch(
  '/lessons/:id',
  ensureAuth,
  requireCreator,
  validateUUID('id'),
  updateExistingLesson
);

// Delete lesson (Creator only)
router.delete(
  '/lessons/:id',
  ensureAuth,
  requireCreator,
  validateUUID('id'),
  deleteExistingLesson
);

// Get transcript status (Authenticated users)
router.get(
  '/lessons/:id/transcript-status',
  ensureAuth,
  validateUUID('id'),
  getTranscriptStatus
);

// Get single lesson details (Authenticated users)
router.get(
  '/lessons/:id',
  ensureAuth,
  validateUUID('id'),
  getLessonDetails
);

export default router;
