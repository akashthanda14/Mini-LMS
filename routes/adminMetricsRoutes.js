// routes/adminMetricsRoutes.js
// Routes for admin dashboard metrics and analytics

import express from 'express';
import { ensureAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/rbacMiddleware.js';
import {
  getMetrics,
  getGrowth,
  getTopPerformingCourses,
  getActivity,
  getSummary
} from '../controllers/adminMetricsController.js';

const router = express.Router();

/**
 * @route   GET /api/admin/metrics
 * @desc    Get comprehensive dashboard metrics
 * @access  Private - ADMIN only
 */
router.get('/', ensureAuth, requireAdmin, getMetrics);

/**
 * @route   GET /api/admin/metrics/summary
 * @desc    Get quick summary metrics (lightweight)
 * @access  Private - ADMIN only
 */
router.get('/summary', ensureAuth, requireAdmin, getSummary);

/**
 * @route   GET /api/admin/metrics/growth
 * @desc    Get month-over-month growth analytics
 * @access  Private - ADMIN only
 */
router.get('/growth', ensureAuth, requireAdmin, getGrowth);

/**
 * @route   GET /api/admin/metrics/top-courses
 * @desc    Get top performing courses by enrollment
 * @access  Private - ADMIN only
 * @query   limit - Number of courses to return (1-50, default: 10)
 */
router.get('/top-courses', ensureAuth, requireAdmin, getTopPerformingCourses);

/**
 * @route   GET /api/admin/metrics/activity
 * @desc    Get recent platform activity
 * @access  Private - ADMIN only
 * @query   limit - Number of activities to return (1-100, default: 20)
 */
router.get('/activity', ensureAuth, requireAdmin, getActivity);

export default router;
