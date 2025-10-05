// routes/certificateRoutes.js
// Routes for certificate operations

import express from 'express';
import {
  getEnrollmentCertificate,
  verifyCertificateByHash,
  getUserCertificatesList,
  downloadCertificatePDF
} from '../controllers/certificateController.js';
import { ensureAuth } from '../middleware/authMiddleware.js';
import { validateUUID } from '../middleware/validationMiddleware.js';

const router = express.Router();

/**
 * @route   GET /api/enrollments/:id/certificate
 * @desc    Get certificate for enrollment
 * @access  Private (must own enrollment)
 */
router.get('/enrollments/:id/certificate', ensureAuth, validateUUID('id'), getEnrollmentCertificate);

/**
 * @route   GET /api/enrollments/:id/certificate/download
 * @desc    Download certificate as PDF
 * @access  Private (must own enrollment)
 */
router.get('/enrollments/:id/certificate/download', ensureAuth, validateUUID('id'), downloadCertificatePDF);

/**
 * @route   GET /api/certificates
 * @desc    Get all certificates for current user
 * @access  Private
 */
router.get('/certificates', ensureAuth, getUserCertificatesList);

/**
 * @route   GET /api/certificates/verify/:serialHash
 * @desc    Verify certificate by serial hash
 * @access  Public
 */
router.get('/certificates/verify/:serialHash', verifyCertificateByHash);

export default router;
