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
 * Create profile completion token
 * Used to secure the profile completion process after OTP verification
 */
export const createProfileCompletionToken = (userId) => {
  const token = jwt.sign(
    {
      userId,
      purpose: 'profile_completion',
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  
  return token;
};

/**
 * Verify profile completion token
 */
export const verifyProfileCompletionToken = (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.purpose !== 'profile_completion') {
      throw new Error('Invalid token purpose');
    }
    
    return {
      success: true,
      userId: decoded.userId,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
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
 * @param {Object} payload - User data to include in token
 * @param {string} payload.userId - User ID
 * @param {string} payload.email - User email
 * @param {string} payload.role - User role (LEARNER, CREATOR, ADMIN)
 * @param {string} expiresIn - Token expiration time
 */
export const createAuthToken = (payload, expiresIn = '7d') => {
  const { userId, email, role } = payload;
  
  const token = jwt.sign(
    {
      userId,
      email,
      role,
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
      email: decoded.email,
      role: decoded.role,
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
  createProfileCompletionToken,
  verifyProfileCompletionToken,
  createAuthToken,
  verifyAuthToken,
};
