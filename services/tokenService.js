// services/tokenService.js
// Token generation service for email verification and password reset

import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Generate a random token
 */
export const generateRandomToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Create email verification token
 */
export const createEmailVerificationToken = (userId, email) => {
  const token = jwt.sign(
    {
      userId,
      email,
      purpose: 'email_verification',
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  return token;
};

/**
 * Verify email verification token
 */
export const verifyEmailVerificationToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.purpose !== 'email_verification') {
      throw new Error('Invalid token purpose');
    }
    
    return {
      success: true,
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Create password reset token
 */
export const createPasswordResetToken = (userId, email) => {
  const token = jwt.sign(
    {
      userId,
      email,
      purpose: 'password_reset',
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  return token;
};

/**
 * Verify password reset token
 */
export const verifyPasswordResetToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.purpose !== 'password_reset') {
      throw new Error('Invalid token purpose');
    }
    
    return {
      success: true,
      userId: decoded.userId,
      email: decoded.email,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Create JWT token for authentication
 */
export const createAuthToken = (userId, expiresIn = '7d') => {
  const token = jwt.sign(
    {
      userId,
      purpose: 'authentication',
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
  
  return token;
};

/**
 * Verify authentication token
 */
export const verifyAuthToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    return {
      success: true,
      userId: decoded.userId,
      purpose: decoded.purpose,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

export default {
  generateRandomToken,
  createEmailVerificationToken,
  verifyEmailVerificationToken,
  createPasswordResetToken,
  verifyPasswordResetToken,
  createAuthToken,
  verifyAuthToken,
};
