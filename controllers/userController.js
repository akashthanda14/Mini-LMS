// user_modules/controllers/userController.js
// User authentication and profile management controller

import validator from 'validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

// Import services
import {
  findUserByEmail,
  findUserByPhone,
  createUser,
  findUserById,
  updateProfile,
  updateProfileCompletion
} from '../services/userService.js';
import { verifyUserEmail } from '../services/userService.js';
import {
  storeEmailOTP,
  verifyEmailOtpService,
  storePhoneOTP,
  verifyPhoneOtpService
} from '../services/otpService.js';
import { sendOTP } from '../services/smsService.js';
import { sendVerificationEmail } from '../services/mailService.js';
import { 
  createEmailVerificationToken, 
  createAuthToken 
} from '../services/tokenService.js';

/**
 * REGISTER USER
 * Handles user registration with email or phone number
 */
export const registerUser = async (req, res) => {
  try {
  const { email, phoneNumber } = req.body;
  const perfStart = Date.now();
  const perf = {};

    /* --------------------------- email flow --------------------------- */
    if (email) {
      const t0 = Date.now();
      const existing = await findUserByEmail(email);
      perf.findUserByEmail = Date.now() - t0;
      if (existing) {
        if (existing.emailVerified) {
          return res.status(409).json({
            success: false,
            message: 'Email already registered. Log in instead.',
          });
        }

        /* resend verification email */
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const t1 = Date.now();
  await storeEmailOTP(existing.id, otp);
  perf.storeEmailOTP_existing = Date.now() - t1;

        // create verification token then send (fire-and-forget)
        const tokenExisting = await createEmailVerificationToken(existing.id);
        sendVerificationEmail(existing.email, tokenExisting, otp, 'User')
          .catch(err => console.error('Email resend failed:', err));

        return res.status(200).json({
          success: true,
          message: 'Verification email resent.',
          userId: existing.id,
          verificationType: 'email',
          requiresProfileCompletion: !existing.isProfileComplete,
        });
      }

      /* create new user */
  const t2 = Date.now();
  const user = await createUser({
        email: email.toLowerCase().trim(),
        emailVerified: false,
        phoneVerified: false,
        isProfileComplete: false,
      });
  perf.createUser = Date.now() - t2;

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const t3 = Date.now();
  await storeEmailOTP(user.id, otp);
  perf.storeEmailOTP_new = Date.now() - t3;

      // create verification token then send (fire-and-forget)
      const tokenNew = await createEmailVerificationToken(user.id);
      sendVerificationEmail(user.email, tokenNew, otp, 'User')
        .catch(err => console.error('Email send failed:', err));

      perf.total = Date.now() - perfStart;

      return res.status(201).json({
        success: true,
        message: 'Registration successful. Check your email for verification.',
        userId: user.id,
        verificationType: 'email',
        contactInfo: user.email,
        requiresProfileCompletion: true,
        perfTimings: perf,
      });
    } else if (phoneNumber) {
      /* --------------------------- phone flow --------------------------- */
    } else {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required for registration.',
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      message: 'Internal server error. Please try again later.',
    });
  }
};
    // Phone registration/OTP logic removed. Only email registration/OTP is supported.

/**
 * VERIFY EMAIL OTP
 * Verifies email OTP and marks email as verified
 */
export const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required.',
      });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email address.',
      });
    }

    // Verify email OTP
    const isValidOtp = await verifyEmailOtpService(email, otp);
    if (!isValidOtp.success) {
      return res.status(400).json({
        success: false,
        message: isValidOtp.message || 'Invalid or expired OTP.',
      });
    }

    // Mark email as verified using service
    await verifyUserEmail(user.id);

    // Check if profile is complete
    if (user.isProfileComplete && user.name && user.password) {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Create JWT with userId, email, and role
      const token = createAuthToken({
        userId: user.id,
        email: user.email,
        role: user.role
      });

      // User already has profile - login directly
      return res.status(200).json({
        success: true,
        message: 'Email verified successfully.',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          emailVerified: true,
          isProfileComplete: true,
        },
      });
    } else {
      // User needs to complete profile
      return res.status(200).json({
        success: true,
        message: 'Email verified successfully. Please complete your profile.',
        userId: user.id,
        requiresProfileCompletion: true,
      });
    }
  } catch (err) {
    console.error('Email OTP verification error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * VERIFY PHONE OTP
 * Verifies phone OTP and marks phone as verified
 */
export const verifyPhoneOtp = async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required.',
      });
    }

    const user = await findUserByPhone(phoneNumber);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this phone number.',
      });
    }

    // Verify phone OTP
    const isValidOtp = await verifyPhoneOtpService(user.id, otp);
    if (!isValidOtp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // Mark phone as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerified: true }
    });

    // Check if profile is complete
    if (user.isProfileComplete && user.name && user.password) {
      // User already has profile - login directly
      // Create a standard auth token
      const token = createAuthToken({
        userId: user.id,
        email: user.email || user.phoneNumber,
        role: user.role
      });

      return res.status(200).json({
        success: true,
        message: 'Phone verified successfully.',
        token,
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          name: user.name,
          phoneVerified: true,
          isProfileComplete: true,
        },
      });
    } else {
      // User needs to complete profile
      return res.status(200).json({
        success: true,
        message: 'Phone verified successfully. Please complete your profile.',
        userId: user.id,
        requiresProfileCompletion: true,
      });
    }
  } catch (err) {
    console.error('Phone OTP verification error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
};

/**
 * COMPLETE PROFILE
 * Completes user profile after OTP verification
 */
export const completeProfile = async (req, res) => {
  try {
    const {
      userId,
      name,
      password,
      username,
      fullName,
      country,
      state,
      zip,
    } = req.body;

    // Required field validation
    if (!userId || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'User ID, name, and password are required.',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
    }

    // Find user
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check if user is verified
    if (!user.emailVerified && !user.phoneVerified) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your email or phone first.',
      });
    }

    // Check if username is already taken (if provided)
    if (username) {
      const existingUsername = await prisma.user.findFirst({
        where: {
          username: username.trim().toLowerCase(),
          AND: { id: { not: userId } },
        },
      });

      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken.',
        });
      }
    }

    // Delegate update and password hashing to the service
    const updatedUser = await updateProfileCompletion(userId, {
      name,
      email: undefined,
      password,
      username,
      fullName,
      country,
      state,
      zip,
    });

    console.log('Profile completed for user:', userId);

    // Create JWT with userId, email/phone, and role
    const token = createAuthToken({
      userId: updatedUser.id,
      email: updatedUser.email || updatedUser.phoneNumber,
      role: updatedUser.role
    });

    return res.status(200).json({
      success: true,
      message: 'Profile completed successfully.',
      token,
      user: updatedUser,
    });
  } catch (err) {
    console.error('Profile completion error:', err);

    if (err.code === 'P2002') {
      const target = err.meta?.target;
      if (target?.includes('username')) {
        return res.status(409).json({
          success: false,
          message: 'Username is already taken.',
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Profile information already exists.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again.',
    });
  }
};

/**
 * LOGIN USER
 * Authenticates user with email/phone and password
 */
export const loginUser = async (req, res) => {
  try {
    const { emailOrPhone, password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required.',
      });
    }

    if (!emailOrPhone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required.',
      });
    }

    // Determine if input is phone or email
    const isPhone = /^\+?\d+$/.test(emailOrPhone.trim());
    let user;

    if (isPhone) {
      user = await findUserByPhone(emailOrPhone.trim());
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found with this phone number.',
        });
      }
      if (!user.phoneVerified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your phone number before logging in.',
        });
      }
    } else {
      const cleanEmail = emailOrPhone.trim().toLowerCase();
      user = await findUserByEmail(cleanEmail);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found with this email address.',
        });
      }
      if (!user.emailVerified) {
        return res.status(403).json({
          success: false,
          message: 'Please verify your email before logging in.',
        });
      }
    }

    if (!user.password) {
      return res.status(401).json({
        success: false,
        message: 'Please complete your profile setup first.',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password.',
      });
    }

    // Update last login timestamp
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Create JWT with userId, email, and role
    const token = createAuthToken({
      userId: user.id,
      email: user.email || user.phoneNumber,
      role: user.role
    });

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        isProfileComplete: user.isProfileComplete,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export default {
  registerUser,
  verifyEmailOtp,
  verifyPhoneOtp,
  completeProfile,
  loginUser
};
