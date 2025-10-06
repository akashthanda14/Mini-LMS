// routes/authRoutes.js
// Merged authentication routes for the LMS (combined auth + user routes)

import express from 'express';
import {
  registerUser,
  verifyEmailOtp,
  verifyPhoneOtp,
  completeProfile,
  loginUser,
} from '../controllers/userController.js';
import {
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import {
  requestEmailChange,
  verifyEmailChange,
  requestPhoneChange,
  verifyPhoneChange,
} from '../controllers/profileController.js';
import {
  ensureAuth,
  ensureProfileComplete,
} from '../middleware/authMiddleware.js';

const router = express.Router();

// ================================
// REGISTRATION & VERIFICATION
// ================================

/**
 * POST /api/auth/register
 * Register user (sends OTP to email or phone)
 */
router.post('/register', registerUser);

// Alias for frontend compatibility
router.post('/send-otp', registerUser);

/**
 * POST /api/auth/verify-email
 * Verify email OTP
 */
router.post('/verify-email', verifyEmailOtp);

/**
 * POST /api/auth/verify-phone
 * Verify phone OTP
 */
router.post('/verify-phone', verifyPhoneOtp);

/**
 * POST /api/auth/verify-otp
 * Unified endpoint that accepts { email | phoneNumber, otp }
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    if (email) return await verifyEmailOtp(req, res);
    if (phoneNumber) return await verifyPhoneOtp(req, res);
    return res.status(400).json({ success: false, message: 'Email or phoneNumber is required' });
  } catch (err) {
    console.error('Unified verify-otp error:', err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

/**
 * POST /api/auth/complete-profile
 * Complete user profile after verification
 */
router.post('/complete-profile', completeProfile);

// ================================
// LOGIN & AUTHENTICATION
// ================================

/**
 * POST /api/auth/login
 */
router.post('/login', loginUser);

// ================================
// PASSWORD MANAGEMENT
// ================================

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', forgotPassword);

/**
 * POST /api/auth/reset-password
 */
router.post('/reset-password', resetPassword);

// ================================
// EMAIL & PHONE CHANGE (PROTECTED)
// ================================

router.post('/request-email-change', ensureAuth, requestEmailChange);
router.post('/verify-email-change', ensureAuth, verifyEmailChange);
router.post('/request-phone-change', ensureAuth, requestPhoneChange);
router.post('/verify-phone-change', ensureAuth, verifyPhoneChange);

// ================================
// AUTHENTICATION STATUS & HELPERS
// ================================

/**
 * GET /api/auth/status
 * Check authentication status
 */
router.get('/status', ensureAuth, async (req, res) => {
  try {
    const { findUserById } = await import('../services/userService.js');
    const user = await findUserById(req.user.userId || req.user.id);

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    return res.json({
      success: true,
      isAuthenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        isProfileComplete: user.isProfileComplete,
        role: user.role,
      },
      requiresProfileCompletion: !user.isProfileComplete,
    });
  } catch (error) {
    console.error('Auth status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get auth status' });
  }
});

/**
 * POST /api/auth/resend-otp
 * Unified resend endpoint that reuses registerUser logic
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    if (!email && !phoneNumber) return res.status(400).json({ success: false, message: 'Email or phone number is required' });
    req.body.isResend = true;
    return await registerUser(req, res);
  } catch (err) {
    console.error('Resend OTP error:', err);
    return res.status(500).json({ success: false, message: 'Failed to resend OTP' });
  }
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', ensureAuth, async (req, res) => {
  try {
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
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh JWT token
 */
router.post('/refresh', ensureAuth, async (req, res) => {
  try {
    const { createAuthToken } = await import('../services/tokenService.js');
    const token = createAuthToken({ userId: req.user.id, email: req.user.email || req.user.phoneNumber, role: req.user.role });
    return res.status(200).json({ success: true, message: 'Token refreshed successfully.', token });
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

export default router;
