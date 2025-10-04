// user_modules/services/userService.js
// User service for database operations

import prisma from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

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

  // Hash password if provided
  let hashedPassword = null;
  if (password) {
    const saltRounds = 10;
    hashedPassword = await bcrypt.hash(password, saltRounds);
  }

  // Build update data
  const updateData = {
    name: name?.trim(),
    isProfileComplete: true,
    updatedAt: new Date(),
  };

  if (email) {
    updateData.email = email.trim().toLowerCase();
  }

  if (hashedPassword) {
    updateData.password = hashedPassword;
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        emailVerified: true,
        phoneVerified: true,
        isProfileComplete: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  } catch (error) {
    console.error('Error completing profile:', error);

    if (error.code === 'P2002') {
      throw new Error('Email already exists');
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

export default {
  createUser,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  updateProfile,
  updateProfileCompletion,
  verifyUserEmail,
  verifyUserPhone,
};
