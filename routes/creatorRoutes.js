// routes/creatorRoutes.js
// Routes for creator application and dashboard

import express from 'express';
import { ensureAuth } from '../middleware/authMiddleware.js';
import { requireLearner, requireCreator } from '../middleware/rbacMiddleware.js';
import {
  submitApplication,
  getApplicationStatus,
  getCreatorDashboard,
} from '../controllers/creatorController.js';

const router = express.Router();

/**
 * @route   POST /api/creator/apply
 * @desc    Submit creator application
 * @access  Private - LEARNER only
 */
router.post('/apply', ensureAuth, requireLearner, submitApplication);

/**
 * @route   GET /api/creator/status
 * @desc    Get application status for current user
 * @access  Private
 */
router.get('/status', ensureAuth, getApplicationStatus);

/**
 * @route   GET /api/creator/dashboard
 * @desc    Get creator dashboard with courses and stats
 * @access  Private - CREATOR only
 */
router.get('/dashboard', ensureAuth, requireCreator, getCreatorDashboard);

export default router;
