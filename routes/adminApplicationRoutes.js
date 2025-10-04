// routes/adminApplicationRoutes.js
// Routes for admin to review creator applications

import express from 'express';
import { ensureAuth } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/rbacMiddleware.js';
import {
  getAllCreatorApplications,
  getPendingApplications,
  approveCreatorApplication,
  rejectCreatorApplication,
  getApplicationById,
} from '../controllers/adminApplicationController.js';

const router = express.Router();

/**
 * @route   GET /api/admin/applications
 * @desc    Get all creator applications (with optional status query)
 * @access  Private - ADMIN only
 * @query   status - Optional filter: PENDING, APPROVED, REJECTED
 */
router.get('/', ensureAuth, requireAdmin, getAllCreatorApplications);

/**
 * @route   GET /api/admin/applications/pending
 * @desc    Get pending creator applications (convenience route)
 * @access  Private - ADMIN only
 */
router.get('/pending', ensureAuth, requireAdmin, getPendingApplications);

/**
 * @route   GET /api/admin/applications/:id
 * @desc    Get a single application by ID
 * @access  Private - ADMIN only
 */
router.get('/:id', ensureAuth, requireAdmin, getApplicationById);

/**
 * @route   POST /api/admin/applications/:id/approve
 * @desc    Approve a creator application
 * @access  Private - ADMIN only
 */
router.post('/:id/approve', ensureAuth, requireAdmin, approveCreatorApplication);

/**
 * @route   POST /api/admin/applications/:id/reject
 * @desc    Reject a creator application with reason
 * @access  Private - ADMIN only
 */
router.post('/:id/reject', ensureAuth, requireAdmin, rejectCreatorApplication);

export default router;
