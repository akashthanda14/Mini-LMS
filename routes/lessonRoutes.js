import express from 'express';
import {
  getUploadCredentials,
  createNewLesson,
  getCourseLessons,
  updateExistingLesson,
  deleteExistingLesson
} from '../controllers/lessonController.js';
import { ensureAuth } from '../middleware/authMiddleware.js';
import { requireCreator } from '../middleware/rbacMiddleware.js';

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
  getUploadCredentials
);

// Create new lesson (Creator only)
router.post(
  '/courses/:courseId/lessons',
  ensureAuth,
  requireCreator,
  createNewLesson
);

// Get all lessons for a course (Authenticated users)
router.get(
  '/courses/:courseId/lessons',
  ensureAuth,
  getCourseLessons
);

// Update lesson (Creator only)
router.patch(
  '/lessons/:id',
  ensureAuth,
  requireCreator,
  updateExistingLesson
);

// Delete lesson (Creator only)
router.delete(
  '/lessons/:id',
  ensureAuth,
  requireCreator,
  deleteExistingLesson
);

export default router;
