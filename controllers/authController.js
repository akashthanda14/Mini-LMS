// user_modules/controllers/authController.js
// Authentication controller for user registration, login, and password management

import prisma from '../lib/prisma.js';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import bcrypt from 'bcrypt';

// Import services
import { 
  findUserByEmail, 
  findUserByPhone,
  createUser,
  updateProfileCompletion 
} from '../services/userService.js';
import { sendOTP as sendSMSOTP } from '../services/smsService.js';
import { sendOTPEmail } from '../services/mailService.js';

/**
 * FORGOT PASSWORD
 * Sends OTP to user's email or phone for password reset
 */
export const forgotPassword = async (req, res) => {
  const { emailOrPhone } = req.body;

  if (!emailOrPhone) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email or phone number is required.' 
    });
  }

  try {
    // Determine if input is phone or email
    const isPhone = /^\+91[6-9]\d{9}$/.test(emailOrPhone.trim());
    let user;
    let contactType;

    if (isPhone) {
      // Validate phone number format
      const phoneRegex = /^\+91[6-9]\d{9}$/;
      if (!phoneRegex.test(emailOrPhone.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid phone number format. Use +91XXXXXXXXXX format.'
        });
      }

      user = await findUserByPhone(emailOrPhone.trim());
      contactType = 'phone';
      
      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If an account with that phone number exists, an OTP has been sent.'
        });
      }

      if (!user.phoneVerified) {
        return res.status(400).json({
          success: false,
          message: 'Please verify your phone number first.'
        });
      }
    } else {
      // Validate email format
      if (!validator.isEmail(emailOrPhone.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format.'
        });
      }

      const cleanEmail = emailOrPhone.trim().toLowerCase();
      user = await findUserByEmail(cleanEmail);
      contactType = 'email';
      
      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'If an account with that email exists, an OTP has been sent.'
        });
      }

      if (!user.emailVerified) {
        return res.status(400).json({
          success: false,
          message: 'Please verify your email address first.'
        });
      }
    }

    // Check rate limiting
    const recentOTPs = isPhone 
      ? await prisma.phoneOTP.count({
          where: {
            userId: user.id,
            type: 'PASSWORD_RESET',
            createdAt: {
              gte: new Date(Date.now() - 60000) // Last 1 minute
            }
          }
        })
      : await prisma.emailOTP.count({
          where: {
            userId: user.id,
            type: 'PASSWORD_RESET',
            createdAt: {
              gte: new Date(Date.now() - 60000) // Last 1 minute
            }
          }
        });

    if (recentOTPs >= 3) {
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again in a minute.'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    if (isPhone) {
      // Clear existing password reset OTPs for this user
      await prisma.phoneOTP.deleteMany({
        where: {
          userId: user.id,
          type: 'PASSWORD_RESET'
        }
      });

      // Store phone OTP
      await prisma.phoneOTP.create({
        data: {
          userId: user.id,
          otp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          type: 'PASSWORD_RESET',
          attempts: 0,
          isUsed: false,
          maxAttempts: 3
        }
      });

      // Send OTP via SMS/WhatsApp
      try {
        await sendSMSOTP(user.phoneNumber, otp, 'password-reset');
        console.log('Password reset OTP sent via SMS to:', user.phoneNumber);
      } catch (smsError) {
        console.error('Failed to send SMS OTP:', smsError);
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP. Please try again.'
        });
      }
    } else {
      // Clear existing password reset OTPs for this user
      await prisma.emailOTP.deleteMany({
        where: {
          userId: user.id,
          type: 'PASSWORD_RESET'
        }
      });

      // Store email OTP
      await prisma.emailOTP.create({
        data: {
          userId: user.id,
          otp,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
          type: 'PASSWORD_RESET',
          attempts: 0,
          isUsed: false,
          maxAttempts: 3
        }
      });

      // Send OTP via email
      try {
        await sendOTPEmail(user.email, user.name || 'User', otp, 'password reset');
        console.log('Password reset OTP sent via email to:', user.email);
      } catch (emailError) {
        console.error('Failed to send email OTP:', emailError);
        return res.status(500).json({
          success: false,
          message: 'Failed to send OTP. Please try again.'
        });
      }
    }

    // Always return a generic success message to prevent user enumeration
    return res.status(200).json({
      success: true,
      message: `If an account with that ${contactType} exists, an OTP has been sent.`,
      contactType,
      expiresIn: 600 // 10 minutes
    });

  } catch (error) {
    console.error('Forgot Password Controller Error:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'An internal server error occurred.' 
    });
  }
};

/**
 * RESET PASSWORD
 * Verifies OTP and resets user's password
 */
export const resetPassword = async (req, res) => {
  const { emailOrPhone, otp, newPassword } = req.body;

  // Validate required fields
  if (!emailOrPhone || !otp || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'Email/phone number, OTP, and new password are required.' 
    });
  }

  // Validate OTP format
  if (!validator.isLength(otp.trim(), { min: 6, max: 6 }) || !validator.isNumeric(otp.trim())) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid OTP format. OTP must be 6 digits.' 
    });
  }

  // Validate password strength
  const passwordErrors = [];
  if (!validator.isLength(newPassword, { min: 10 })) {
    passwordErrors.push('Password must be at least 10 characters long.');
  }
  if (!/[A-Z]/.test(newPassword)) {
    passwordErrors.push('Password must contain at least one uppercase letter.');
  }
  if (!/\d/.test(newPassword)) {
    passwordErrors.push('Password must contain at least one number.');
  }
  if (passwordErrors.length > 0) {
    return res.status(400).json({ 
      success: false, 
      message: `Password does not meet requirements: ${passwordErrors.join(', ')}` 
    });
  }

  try {
    // Determine if input is phone or email
    const isPhone = /^\+\d{1,3}\d{7,}$/.test(emailOrPhone.trim());
    let user;
    let otpRecord;

    if (isPhone) {
      user = await findUserByPhone(emailOrPhone.trim());
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found with this phone number.'
        });
      }

      // Verify phone OTP
      otpRecord = await prisma.phoneOTP.findFirst({
        where: {
          userId: user.id,
          otp: otp.trim(),
          type: 'PASSWORD_RESET',
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    } else {
      const cleanEmail = emailOrPhone.trim().toLowerCase();
      user = await findUserByEmail(cleanEmail);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found with this email address.'
        });
      }

      // Verify email OTP
      otpRecord = await prisma.emailOTP.findFirst({
        where: {
          userId: user.id,
          otp: otp.trim(),
          type: 'PASSWORD_RESET',
          isUsed: false,
          expiresAt: {
            gt: new Date()
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
    }

    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired OTP.' 
      });
    }

    // Check if max attempts exceeded
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: 'OTP has exceeded maximum attempts. Please request a new one.'
      });
    }

    // Hash the new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword.trim(), saltRounds);

    // Update password and mark OTP as used in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user password
      await tx.user.update({
        where: { id: user.id },
        data: { 
          password: hashedPassword,
          updatedAt: new Date()
        }
      });

      // Mark OTP as used
      if (isPhone) {
        await tx.phoneOTP.update({
          where: { id: otpRecord.id },
          data: { 
            isUsed: true,
            attempts: otpRecord.attempts + 1
          }
        });
      } else {
        await tx.emailOTP.update({
          where: { id: otpRecord.id },
          data: { 
            isUsed: true,
            attempts: otpRecord.attempts + 1
          }
        });
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, phoneNumber: user.phoneNumber, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Password reset successfully for user:', user.id);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Reset Password Controller Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'An internal server error occurred.' 
    });
  }
};

export default {
  forgotPassword,
  resetPassword
};
