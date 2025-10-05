// middleware/dbConnectionMiddleware.js
// Middleware to handle database connection issues gracefully

import prisma from '../lib/prisma.js';
import logger from '../config/logger.js';

/**
 * Middleware to check database connection before processing requests
 * This helps prevent cascading failures when the database is down
 */
export const checkDbConnection = async (req, res, next) => {
  try {
    // Quick connection test
    await prisma.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    logger.error('Database connection check failed in middleware:', {
      error: error.message,
      path: req.path,
      method: req.method
    });

    // Return a more user-friendly error for API consumers
    return res.status(503).json({
      success: false,
      message: 'Database temporarily unavailable. Please try again in a moment.',
      error: 'SERVICE_UNAVAILABLE',
      retryAfter: 30, // seconds
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Wrapper for database operations with automatic retry
 */
export const withDbRetry = (operation, maxRetries = 2) => {
  return async (...args) => {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation(...args);
      } catch (error) {
        lastError = error;

        if (error.message.includes('Closed') && attempt < maxRetries) {
          logger.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying...`, {
            error: error.message
          });

          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          continue;
        }

        // If it's not a connection error or we've exhausted retries, throw
        throw error;
      }
    }

    throw lastError;
  };
};
