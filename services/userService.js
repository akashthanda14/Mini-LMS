// user_modules/services/userService.js
// User service for database operations

import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createEmailVerificationToken } from './tokenService.js';
import { sendVerificationEmail } from './mailService.js';

/**
 * CREATE USER
 * Creates a new user in the database
 */
export const createUser = async (userData) => {
  try {
    const cleanUserData = { ...userData };

    if (cleanUserData.email) {
      cleanUserData.email = cleanUserData.email.trim().toLowerCase();
    }

    if (cleanUserData.phoneNumber) {
      cleanUserData.phoneNumber = cleanUserData.phoneNumber.trim();
    }

    // Create userDataWithDefaults with name included
    const userDataWithDefaults = {
      name: cleanUserData.name || null,
      email: cleanUserData.email || null,
      phoneNumber: cleanUserData.phoneNumber || null,
      password: cleanUserData.password || null,
      role: cleanUserData.role || 'LEARNER', // Default role for new users
      emailVerified: cleanUserData.emailVerified ?? false,
      phoneVerified: cleanUserData.phoneVerified ?? false,
      isProfileComplete: cleanUserData.isProfileComplete ?? false,
    };

    const newUser = await prisma.user.create({
      data: userDataWithDefaults,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        emailVerified: true,
        phoneVerified: true,
        isActive: true,
        isProfileComplete: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('User created successfully:', {
      id: newUser.id,
      email: newUser.email,
      phoneNumber: newUser.phoneNumber,
    });

    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);

    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0] || 'field';
      throw new Error(
        `${field === 'email' ? 'Email' : 'Phone number'} already exists`
      );
    }

    throw new Error('Failed to create user: ' + error.message);
  }
};

/**
 * FIND USER BY EMAIL
 * Finds a user by email address
 */
export const findUserByEmail = async (email) => {
  if (!email) return null;
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
};

/**
 * FIND USER BY PHONE
 * Finds a user by phone number
 */
export const findUserByPhone = async (phoneNumber) => {
  if (!phoneNumber) return null;
  return prisma.user.findUnique({
    where: { phoneNumber: phoneNumber.trim() },
  });
};

/**
 * FIND USER BY ID
 * Finds a user by ID
 */
export const findUserById = async (id) => {
  if (!id) return null;

  return prisma.user.findUnique({
    where: { id: id },
    select: {
      id: true,
      name: true,
      username: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      emailVerified: true,
      phoneVerified: true,
      isProfileComplete: true,
      country: true,
      state: true,
      zip: true,
      dob: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      resetToken: true,
      pendingEmail: true,
      pendingEmailOtp: true,
      pendingEmailExpiry: true,
    },
  });
};

/**
 * UPDATE USER PROFILE
 * Updates user profile with allowed fields
 */
export const updateProfile = async (userId, updateData) => {
  const allowedFields = [
    'name',
    'username',
    'fullName',
    'email',
    'phoneNumber',
    'country',
    'state',
    'zip',
    'emailVerified',
    'phoneVerified',
    'isProfileComplete',
    'dob',
  ];

  const data = {};

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      data[field] = updateData[field];
    }
  }

  // Clean and format data
  if (data.email) data.email = data.email.trim().toLowerCase();
  if (data.phoneNumber) data.phoneNumber = data.phoneNumber.trim();
  if (data.username) data.username = data.username.trim().toLowerCase();
  if (data.fullName) data.fullName = data.fullName.trim();
  if (data.name) data.name = data.name.trim();
  if (data.country) data.country = data.country.trim();
  if (data.state) data.state = data.state.trim();
  if (data.zip) data.zip = data.zip.trim();
  if (data.dob) {
    data.dob = new Date(data.dob);
    if (isNaN(data.dob.getTime())) {
      throw new Error('Invalid date of birth format. Use YYYY-MM-DD.');
    }
  }

  if (Object.keys(data).length === 0) {
    throw new Error('No fields provided for update.');
  }

  try {
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        name: true,
        username: true,
        fullName: true,
        email: true,
        phoneNumber: true,
        emailVerified: true,
        phoneVerified: true,
        isProfileComplete: true,
        country: true,
        state: true,
        zip: true,
        dob: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * UPDATE PROFILE COMPLETION
 * Updates user profile and marks as complete
 */
export const updateProfileCompletion = async (userId, profileData) => {
  const { name, email, password } = profileData;

  try {
    const updateData = {
      name: name.trim(),
      phoneVerified: true,
      isProfileComplete: true,
    };

    if (email && email.trim()) {
      updateData.email = email.trim().toLowerCase();

      const existingEmailUser = await prisma.user.findUnique({
        where: { email: updateData.email },
      });

      if (existingEmailUser && existingEmailUser.id !== userId) {
        throw new Error(
          'Email address is already registered with another account'
        );
      }
    }

    if (password && password.trim()) {
      const saltRounds = 12;
      updateData.password = await bcrypt.hash(password.trim(), saltRounds);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId }, // Use string userId
      data: updateData,
      select: {
        id: true,
        phoneNumber: true,
        name: true,
        email: true,
        phoneVerified: true,
        emailVerified: true,
        isProfileComplete: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('Profile completed for user:', userId);
    return updatedUser;
  } catch (error) {
    console.error('Error updating profile completion:', error);

    if (error.code === 'P2002') {
      throw new Error('Email address is already registered');
    }

    throw error;
  }
};

/**
 * VERIFY USER EMAIL
 * Marks user's email as verified
 */
export const verifyUserEmail = async (userId) => {
  if (!userId) throw new Error('userId is required');
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true },
    });
  } catch (error) {
    console.error('Error verifying user email:', error);
    throw error;
  }
};

/**
 * VERIFY USER PHONE
 * Marks user's phone as verified
 */
export const verifyUserPhone = async (userId) => {
  if (!userId) throw new Error('userId is required');
  try {
    return await prisma.user.update({
      where: { id: userId },
      data: { phoneVerified: true },
    });
  } catch (error) {
    console.error('Error verifying user phone:', error);
    throw error;
  }
};

// --- Added: checkUserExistenceService ---
export const checkUserExistenceService = async (emailOrPhone) => {
  try {
    const isPhone = /^\+?\d+$/.test(emailOrPhone.trim());

    const user = isPhone
      ? await findUserByPhone(emailOrPhone.trim())
      : await findUserByEmail(emailOrPhone.trim().toLowerCase());

    if (!user) {
      return {
        exists: false,
        loginMethods: ['otp'],
        requiresRegistration: true,
      };
    }

    const loginMethods = ['otp'];
    const hasVerifiedContact = isPhone ? user.phoneVerified : user.emailVerified;

    if (hasVerifiedContact && user.password) {
      loginMethods.push('password');
    }

    return {
      exists: true,
      loginMethods,
      userRole: user.role,
      isProfileComplete: user.isProfileComplete,
      requiresRegistration: false,
    };
  } catch (error) {
    console.error('Error in checkUserExistenceService:', error);
    throw new Error('Failed to check user existence');
  }
};

// --- Added: resendEmailVerificationService ---
export const resendEmailVerificationService = async (email) => {
  if (!email) return { success: false, userFound: false, alreadyVerified: false };

  const cleanEmail = String(email).trim().toLowerCase();
  const user = await findUserByEmail(cleanEmail);

  if (!user) {
    return { success: false, userFound: false, alreadyVerified: false };
  }

  if (user.emailVerified) {
    return { success: false, userFound: true, alreadyVerified: true };
  }

  try {
    // Generate a 6-digit OTP and expiry (10 minutes)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    // Persist OTP to the user record (no token created/used)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        pendingEmail: user.email,
        pendingEmailOtp: otp,
        pendingEmailExpiry: expiry,
        updatedAt: new Date(),
      },
    });

    // Send OTP email
    await sendVerificationEmail(user.email, otp, user.name || 'User');

    return { success: true, userFound: true, alreadyVerified: false };
  } catch (error) {
    console.error('Error in resendEmailVerificationService (OTP flow):', error);
    throw error;
  }
};

// --- Added: determineAuthFlow ---
export const determineAuthFlow = async (phoneNumber) => {
  const cleanPhone = phoneNumber.trim();

  try {
    const user = await findUserByPhone(cleanPhone);

    if (!user) {
      return { flowType: 'signup', user: null };
    } else if (user.phoneVerified && user.isProfileComplete) {
      return { flowType: 'signin', user };
    } else {
      return { flowType: 'signup', user };
    }
  } catch (error) {
    console.error('Error determining auth flow:', error);
    throw new Error('Failed to determine authentication flow');
  }
};

// --- Added: findOrCreateUser ---
export const findOrCreateUser = async (phoneNumber) => {
  const cleanPhone = phoneNumber.trim();

  try {
    let user = await findUserByPhone(cleanPhone);

    if (!user) {
      user = await createUser({
        phoneNumber: cleanPhone,
      });

      console.log('Created new user for phone:', cleanPhone, 'with ID:', user.id);
    }

    return user;
  } catch (error) {
    console.error('Error in findOrCreateUser:', error);

    if (error.code === 'P2002') {
      throw new Error('Phone number already exists with another account');
    }

    throw new Error('Failed to create or find user');
  }
};

// --- Added: getUserAuthStatus ---
export const getUserAuthStatus = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        emailVerified: true,
        phoneVerified: true,
        isProfileComplete: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      ...user,
      isLocked: false,
      lockedUntil: null,
    };
  } catch (error) {
    console.error('Error getting user auth status:', error);
    throw error;
  }
};

// --- Added: sendEmailVerification (helper) ---
export const sendEmailVerification = async (userId, email, userName, otp = null) => {
  const token = await createEmailVerificationToken(userId);
  await sendVerificationEmail(email,otp, userName || 'User');
  return { success: true };
};

// --- Added: cleanupExpiredTokens ---
export const cleanupExpiredTokens = async () => {
  try {
    const result = await prisma.emailVerificationToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return { success: true, deletedCount: result.count };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// --- Added: verifyUserEmailToken (verifies token, marks user, returns JWT) ---
export const verifyUserEmailToken = async (email, otp) => {
  try {
    if (!email || !otp) {
      return { success: false, error: 'INVALID_PARAMETERS' };
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    // Find user by either their current email or pendingEmail (in case email change flow)
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: cleanEmail }, { pendingEmail: cleanEmail }],
      },
    });

    if (!user) {
      return { success: false, error: 'USER_NOT_FOUND' };
    }

    // If already verified
    if (user.emailVerified && user.email === cleanEmail) {
      return { success: false, error: 'ALREADY_VERIFIED' };
    }

    // Ensure there is an OTP to validate against
    if (!user.pendingEmailOtp) {
      return { success: false, error: 'OTP_NOT_FOUND' };
    }

    // Check expiry
    if (!user.pendingEmailExpiry || user.pendingEmailExpiry < new Date()) {
      return { success: false, error: 'OTP_EXPIRED' };
    }

    // Validate OTP
    if (String(user.pendingEmailOtp).trim() !== cleanOtp) {
      return { success: false, error: 'OTP_INVALID' };
    }

    // All good — mark email as verified and clear pending fields
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.user.update({
        where: { id: user.id },
        data: {
          // Promote pendingEmail to email if present, otherwise keep existing
          email: user.pendingEmail ? user.pendingEmail : user.email,
          emailVerified: true,
          pendingEmail: null,
          pendingEmailOtp: null,
          pendingEmailExpiry: null,
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          emailVerified: true,
          phoneVerified: true,
          isProfileComplete: true,
          role: true,
        },
      });

      return updated;
    });

    const authToken = jwt.sign(
      {
        userId: result.id,
        email: result.email,
        role: result.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const requiresProfileCompletion = !result.isProfileComplete;

    return {
      success: true,
      user: result,
      authToken,
      requiresProfileCompletion,
      nextStep: requiresProfileCompletion ? 'profile-completion' : 'dashboard',
    };
  } catch (error) {
    console.error('Error in verifyUserEmailToken (OTP flow):', error);
    return {
      success: false,
      error: 'DATABASE_ERROR',
      details: error.message,
    };
  }
};

export default {
  createUser,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  updateProfile,
  updateProfileCompletion,
  verifyUserEmail,
  verifyUserPhone,
  checkUserExistenceService,
  resendEmailVerificationService,
  determineAuthFlow,
  findOrCreateUser,
  getUserAuthStatus,
  sendEmailVerification,
  cleanupExpiredTokens,
};
