// user_modules/services/otpService.js
// OTP service for email and phone verification

import prisma from '../lib/prisma.js';

/**
 * STORE EMAIL OTP
 * Stores an email OTP for a user
 */
export const storeEmailOTP = async (userId, otp, type = 'EMAIL_VERIFICATION') => {
  if (!userId || !otp) throw new Error('userId and otp are required');

  try {
    // Delete existing OTPs for this user and type
    await prisma.emailOTP.deleteMany({
      where: {
        userId: userId.toString(),
        type: type,
      },
    });

    // Create new OTP with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    return await prisma.emailOTP.create({
      data: {
        userId: userId.toString(),
        otp: otp.toString(),
        expiresAt,
        type: type,
        attempts: 0,
        isUsed: false,
        maxAttempts: 3,
      },
    });
  } catch (error) {
    console.error('Error storing email OTP:', error);
    throw error;
  }
};

/**
 * VERIFY EMAIL OTP SERVICE
 * Verifies email OTP by email address
 */
export const verifyEmailOtpService = async (email, otp) => {
  if (!email || !otp) {
    return { success: false, message: 'Email and OTP are required' };
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Find OTP record
    const otpRecord = await prisma.emailOTP.findFirst({
      where: {
        userId: user.id,
        otp: otp.toString(),
        isUsed: false,
      },
    });

    if (!otpRecord) {
      return { success: false, message: 'Invalid OTP' };
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      await prisma.emailOTP.delete({ where: { id: otpRecord.id } });
      return { success: false, message: 'OTP has expired' };
    }

    // Mark OTP as used and delete it
    await prisma.emailOTP.delete({ where: { id: otpRecord.id } });
    return { success: true, message: 'OTP verified successfully' };
  } catch (error) {
    console.error('Error verifying email OTP:', error);
    return { success: false, message: 'Error verifying OTP' };
  }
};

/**
 * VERIFY EMAIL OTP BY USER ID
 * Verifies email OTP using user ID
 */
export const verifyEmailOTPByUserId = async (userId, otp) => {
  if (!userId || !otp) return false;

  try {
    const otpRecord = await prisma.emailOTP.findFirst({
      where: {
        userId: userId.toString(),
        otp: otp.toString(),
        isUsed: false,
      },
    });

    if (!otpRecord) {
      return false;
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      await prisma.emailOTP.delete({ where: { id: otpRecord.id } });
      return false;
    }

    // Mark OTP as used and delete it
    await prisma.emailOTP.delete({ where: { id: otpRecord.id } });
    return true;
  } catch (error) {
    console.error('Error verifying email OTP by userId:', error);
    return false;
  }
};

/**
 * STORE PHONE OTP
 * Stores a phone OTP for a user
 */
export const storePhoneOTP = async (userId, otp, type = 'PHONE_VERIFICATION') => {
  if (!userId || !otp) throw new Error('userId and otp are required');

  try {
    // Delete existing OTPs for this user and type
    await prisma.phoneOTP.deleteMany({
      where: {
        userId: userId.toString(),
        type: type,
      },
    });

    // Create new OTP with 10-minute expiration
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    return await prisma.phoneOTP.create({
      data: {
        userId: userId.toString(),
        otp: otp.toString(),
        expiresAt,
        type: type,
        attempts: 0,
        isUsed: false,
        maxAttempts: 3,
      },
    });
  } catch (error) {
    console.error('Error storing phone OTP:', error);
    throw error;
  }
};

/**
 * VERIFY PHONE OTP SERVICE
 * Verifies phone OTP for a user
 */
export const verifyPhoneOtpService = async (userId, otp) => {
  if (!userId || !otp) return false;

  try {
    const otpRecord = await prisma.phoneOTP.findFirst({
      where: {
        userId: userId.toString(),
        otp: otp.toString(),
        isUsed: false,
      },
    });

    if (!otpRecord) {
      return false;
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiresAt) {
      await prisma.phoneOTP.delete({ where: { id: otpRecord.id } });
      return false;
    }

    // Mark OTP as used and delete it
    await prisma.phoneOTP.delete({ where: { id: otpRecord.id } });
    return true;
  } catch (error) {
    console.error('Error verifying phone OTP:', error);
    return false;
  }
};

export default {
  storeEmailOTP,
  verifyEmailOtpService,
  verifyEmailOTPByUserId,
  storePhoneOTP,
  verifyPhoneOtpService,
};
