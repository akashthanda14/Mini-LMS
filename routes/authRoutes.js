// routes/authRoutes.js
// Authentication routes for the LMS

import express from 'express';
import { ensureAuth } from '../middleware/authMiddleware.js';
import {
  registerUser,
  verifyEmailOtp,
  verifyPhoneOtp,
  completeProfile,
  loginUser,
} from '../controllers/userController.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user with email or phone
 * @access  Public
 */
router.post('/register', registerUser);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email OTP
 * @access  Public
 */
router.post('/verify-email', verifyEmailOtp);

/**
 * @route   POST /api/auth/verify-phone
 * @desc    Verify phone OTP
 * @access  Public
 */
router.post('/verify-phone', verifyPhoneOtp);

/**
 * @route   POST /api/auth/complete-profile
 * @desc    Complete user profile after verification
 * @access  Public
 */
router.post('/complete-profile', completeProfile);

/**
 * @route   POST /api/auth/login
 * @desc    Login user with email/phone and password
 * @access  Public
 */
router.post('/login', loginUser);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', ensureAuth, async (req, res) => {
  try {
    // User is already attached by ensureAuth middleware
    return res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        username: req.user.username,
        email: req.user.email,
        phoneNumber: req.user.phoneNumber,
        role: req.user.role,
        emailVerified: req.user.emailVerified,
        phoneVerified: req.user.phoneVerified,
        isProfileComplete: req.user.isProfileComplete,
        isActive: req.user.isActive,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', ensureAuth, async (req, res) => {
  try {
    const { createAuthToken } = await import('../services/tokenService.js');
    
    // Create new token with updated data
    const token = createAuthToken({
      userId: req.user.id,
      email: req.user.email || req.user.phoneNumber,
      role: req.user.role
    });

    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully.',
      token,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
});

export default router;
