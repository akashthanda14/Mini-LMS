// routes/adminCourseRoutes.js
// Routes for admin course review operations

import express from 'express';
import { ensureAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/rbacMiddleware.js';
import {
  getCoursesForReview,
  getPendingCourses,
  publishCourseByCourseId,
  rejectCourseByCourseId,
  getCourseForReview,
} from '../controllers/adminCourseController.js';

const router = express.Router();

/**
 * @route   GET /api/admin/courses
 * @desc    Get all courses with optional status filter
 * @access  Private - ADMIN only
 * @query   status - Optional: DRAFT, PENDING, PUBLISHED, REJECTED
 */
router.get('/', ensureAuth, requireAdmin, getCoursesForReview);

/**
 * @route   GET /api/admin/courses/pending
 * @desc    Get pending courses awaiting review
 * @access  Private - ADMIN only
 */
router.get('/pending', ensureAuth, requireAdmin, getPendingCourses);

/**
 * @route   GET /api/admin/courses/:id
 * @desc    Get detailed course information for review
 * @access  Private - ADMIN only
 */
router.get('/:id', ensureAuth, requireAdmin, getCourseForReview);

/**
 * @route   POST /api/admin/courses/:id/publish
 * @desc    Publish a course (PENDING → PUBLISHED)
 * @access  Private - ADMIN only
 */
router.post('/:id/publish', ensureAuth, requireAdmin, publishCourseByCourseId);

/**
 * @route   POST /api/admin/courses/:id/reject
 * @desc    Reject a course with feedback (PENDING → REJECTED)
 * @access  Private - ADMIN only
 */
router.post('/:id/reject', ensureAuth, requireAdmin, rejectCourseByCourseId);

export default router;
