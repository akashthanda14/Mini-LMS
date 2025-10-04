// user_modules/routes/userRoutes.js
// User authentication routes

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
  ensureAuthWithStatus,
} from '../middleware/authMiddleware.js';

const router = express.Router();

// ================================
// REGISTRATION & VERIFICATION
// ================================

// Register user (sends OTP to email or phone)
router.post('/register', registerUser);

// Send OTP (alias for register for frontend compatibility)
router.post('/send-otp', registerUser);

// Verify Email OTP
router.post('/verify-email-otp', verifyEmailOtp);

// Verify Phone OTP
router.post('/verify-phone-otp', verifyPhoneOtp);

// Unified OTP verification endpoint
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, phoneNumber, otp } = req.body;

    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required',
      });
    }

    if (email) {
      await verifyEmailOtp(req, res);
    } else if (phoneNumber) {
      await verifyPhoneOtp(req, res);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required for OTP verification',
      });
    }
  } catch (error) {
    console.error('Unified OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify OTP',
    });
  }
});

// Complete profile for new users - After OTP verification
router.post('/complete-profile', completeProfile);

// ================================
// LOGIN & AUTHENTICATION
// ================================

// Login with email/phone and password
router.post('/login', loginUser);

// ================================
// PASSWORD MANAGEMENT
// ================================

// Forgot password - Send OTP
router.post('/forgot-password', forgotPassword);

// Reset password with OTP
router.post('/reset-password', resetPassword);

// ================================
// EMAIL & PHONE CHANGE (PROTECTED)
// ================================

// Request email change
router.post('/request-email-change', ensureAuth, requestEmailChange);

// Verify email change
router.post('/verify-email-change', ensureAuth, verifyEmailChange);

// Request phone change
router.post('/request-phone-change', ensureAuth, requestPhoneChange);

// Verify phone change
router.post('/verify-phone-change', ensureAuth, verifyPhoneChange);

// ================================
// AUTHENTICATION STATUS
// ================================

// Check authentication status
router.get(
  '/auth/status',
  ensureAuth,
  async (req, res) => {
    try {
      const { findUserById } = await import('../services/userService.js');
      const user = await findUserById(req.user.userId || req.user.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.json({
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
      res.status(500).json({
        success: false,
        message: 'Failed to get authentication status',
      });
    }
  }
);

// Resend OTP - unified endpoint
router.post('/auth/resend-otp', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required',
      });
    }

    req.body.isResend = true;
    await registerUser(req, res);
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend OTP',
    });
  }
});

export default router;
