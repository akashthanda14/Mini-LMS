// user_modules/controllers/profileController.js
// User profile management: email change and phone change

import validator from 'validator';
import prisma from '../lib/prisma.js';

// Import services
import { findUserById, updateProfile } from '../services/userService.js';
import { storeEmailOTP, verifyEmailOTPByUserId } from '../services/otpService.js';
import { sendOTPEmail } from '../services/mailService.js';
import { sendOTP } from '../services/smsService.js';

/**
 * REQUEST EMAIL CHANGE
 * Sends OTP to new email for verification
 */
export const requestEmailChange = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const newEmail = (req.body?.newEmail || '').trim().toLowerCase();

    if (!newEmail) {
      return res.status(400).json({ error: 'Email required' });
    }
    
    if (!validator.isEmail(newEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email && user.email.toLowerCase() === newEmail) {
      return res.status(400).json({ error: 'New email is the same as current email' });
    }

    const existing = await prisma.user.findFirst({
      where: { email: newEmail, NOT: { id: userId } },
    });
    
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await storeEmailOTP(userId, otp, 'EMAIL_CHANGE');

    await prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: `EMAIL_CHANGE:${newEmail}`,
        pendingEmail: newEmail,
      },
    });

    await sendOTPEmail(newEmail, otp, 'email change');
    return res.status(200).json({ message: 'OTP sent to new e-mail' });
  } catch (err) {
    console.error('requestEmailChange error:', err);
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * VERIFY EMAIL CHANGE
 * Verifies OTP and updates email address
 */
export const verifyEmailChange = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { otp } = req.body;

    // Basic validation
    if (!otp) {
      return res.status(400).json({ error: 'OTP required' });
    }
    
    if (!validator.isLength(otp.trim(), { min: 6, max: 6 }) || !validator.isNumeric(otp.trim())) {
      return res.status(400).json({ error: 'Invalid OTP format' });
    }

    // Use the correct function that accepts userId
    const isValid = await verifyEmailOTPByUserId(userId, otp.trim());

    if (!isValid) {
      return res.status(400).json({
        error: 'Invalid or expired OTP',
      });
    }

    // Get user and update email
    const user = await findUserById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract new email from resetToken
    const newEmail = user.resetToken?.replace('EMAIL_CHANGE:', '').trim();
    if (!newEmail || !validator.isEmail(newEmail)) {
      return res.status(400).json({ error: 'No pending email change found' });
    }

    // Update user email
    await updateProfile(userId, {
      email: newEmail,
      emailVerified: true,
    });

    // Clear the resetToken
    await prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: null,
        pendingEmail: null,
        pendingEmailOtp: null,
        pendingEmailExpiry: null,
      },
    });

    return res.status(200).json({
      message: 'Email updated successfully',
      user: { email: newEmail },
    });
  } catch (err) {
    console.error('verifyEmailChange error:', err);

    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Email already in use' });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * REQUEST PHONE CHANGE
 * Sends OTP to new phone number for verification
 */
export const requestPhoneChange = async (req, res) => {
  try {
    const userId = req.user.id;
    const { newPhoneNumber } = req.body;

    // Input validation
    if (!newPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'New phone number is required.',
      });
    }

    // Validate phone number format
    if (!validator.isMobilePhone(newPhoneNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone number format.',
      });
    }

    // Check if phone number is already in use
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: newPhoneNumber },
    });

    if (existingUser && existingUser.id !== userId) {
      return res.status(409).json({
        success: false,
        message: 'Phone number already in use.',
      });
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Check if user is trying to set the same phone number
    if (user.phoneNumber === newPhoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'New phone number cannot be the same as current phone number.',
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Clear any existing phone OTPs for this user
    await prisma.phoneOTP.deleteMany({ where: { userId: userId } });

    // Store OTP in database using PhoneOTP model
    await prisma.phoneOTP.create({
      data: {
        userId: userId,
        otp: otp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
        type: 'PHONE_CHANGE',
        attempts: 0,
        isUsed: false,
        maxAttempts: 3,
      },
    });

    // Store new phone number in user's resetToken field with prefix
    await prisma.user.update({
      where: { id: userId },
      data: { resetToken: `PHONE_CHANGE:${newPhoneNumber}` },
    });

    // Send OTP via SMS
    await sendOTP(newPhoneNumber, otp, 'phone-change');

    return res.status(200).json({
      success: true,
      message: 'OTP sent to new phone number successfully.',
    });
  } catch (err) {
    console.error('requestPhoneChange error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * VERIFY PHONE CHANGE
 * Verifies OTP and updates phone number
 */
export const verifyPhoneChange = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp } = req.body;

    // Input validation
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required.',
      });
    }

    // Find the OTP record in PhoneOTP model
    const otpRecord = await prisma.phoneOTP.findFirst({
      where: {
        userId: userId,
        otp: otp,
        type: 'PHONE_CHANGE',
        isUsed: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OTP.',
      });
    }

    // Get the user to retrieve the new phone number from resetToken
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.resetToken || !user.resetToken.startsWith('PHONE_CHANGE:')) {
      return res.status(400).json({
        success: false,
        message: 'Phone change session not found.',
      });
    }

    const newPhoneNumber = user.resetToken.replace('PHONE_CHANGE:', '');

    // Check if the new phone number is still available
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: newPhoneNumber },
    });

    if (existingUser && existingUser.id !== userId) {
      // Delete the OTP record and clear resetToken
      await prisma.$transaction([
        prisma.phoneOTP.update({
          where: { id: otpRecord.id },
          data: { isUsed: true },
        }),
        prisma.user.update({
          where: { id: userId },
          data: { resetToken: null },
        }),
      ]);

      return res.status(409).json({
        success: false,
        message: 'Phone number is no longer available.',
      });
    }

    // Update user's phone number, mark OTP as used, and clear resetToken
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          phoneNumber: newPhoneNumber,
          resetToken: null,
        },
      }),
      prisma.phoneOTP.update({
        where: { id: otpRecord.id },
        data: { isUsed: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      message: 'Phone number updated successfully.',
    });
  } catch (err) {
    console.error('verifyPhoneChange error:', err);

    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Phone number already in use',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export default {
  requestEmailChange,
  verifyEmailChange,
  requestPhoneChange,
  verifyPhoneChange
};
