// middleware/authMiddleware.js
// Authentication middleware for protected routes

import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

/**
 * Ensure user is authenticated
 * Verifies JWT token and attaches user to request
 */
export const ensureAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phoneNumber: true,
        role: true,
        emailVerified: true,
        phoneVerified: true,
        isProfileComplete: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Authentication error.',
    });
  }
};

/**
 * Ensure user has completed their profile
 */
export const ensureProfileComplete = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated.',
      });
    }

    if (!req.user.isProfileComplete) {
      return res.status(403).json({
        success: false,
        message: 'Profile is not complete. Please complete your profile first.',
        profileComplete: false,
      });
    }

    next();
  } catch (error) {
    console.error('Profile check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking profile completion.',
    });
  }
};

/**
 * Ensure user is authenticated and return status
 * This is a more lenient version that provides auth status
 */
export const ensureAuthWithStatus = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.authStatus = {
        authenticated: false,
        message: 'No token provided',
      };
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          phoneNumber: true,
          role: true,
          emailVerified: true,
          phoneVerified: true,
          isProfileComplete: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        req.user = user;
        req.authStatus = {
          authenticated: true,
          user,
        };
      } else {
        req.authStatus = {
          authenticated: false,
          message: 'User not found or inactive',
        };
      }
    } catch (error) {
      req.authStatus = {
        authenticated: false,
        message: 'Invalid or expired token',
      };
    }

    next();
  } catch (error) {
    console.error('Auth status check error:', error);
    req.authStatus = {
      authenticated: false,
      message: 'Error checking authentication',
    };
    next();
  }
};

/**
 * Ensure user is an admin
 */
export const ensureAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated.',
      });
    }

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    next();
  } catch (error) {
    console.error('Admin check error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking admin privileges.',
    });
  }
};
