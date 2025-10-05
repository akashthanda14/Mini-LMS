// lib/db-health.js
// Database connection health check and retry logic

import prisma from './prisma.js';
import logger from '../config/logger.js';

/**
 * Check if database connection is healthy
 * @returns {Promise<boolean>}
 */
export async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    logger.error('Database connection check failed:', {
      error: error.message,
      code: error.code,
    });
    return false;
  }
}

/**
 * Connect to database with retry logic
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} delay - Delay between retries in milliseconds
 * @returns {Promise<boolean>}
 */
export async function connectWithRetry(maxRetries = 5, delay = 3000) {
  for (let i = 0; i < maxRetries; i++) {
    logger.info(`Database connection attempt ${i + 1}/${maxRetries}...`);
    
    const connected = await checkDatabaseConnection();
    
    if (connected) {
      logger.info('✅ Database connected successfully');
      return true;
    }
    
    if (i < maxRetries - 1) {
      logger.warn(`⚠️ Connection attempt ${i + 1} failed. Retrying in ${delay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`❌ Failed to connect to database after ${maxRetries} attempts`);
}

/**
 * Get current database connection statistics
 * @returns {Promise<object>}
 */
export async function getConnectionStats() {
  try {
    const stats = await prisma.$queryRaw`
      SELECT 
        count(*) as total_connections,
        count(*) FILTER (WHERE state = 'active') as active_connections,
        count(*) FILTER (WHERE state = 'idle') as idle_connections
      FROM pg_stat_activity 
      WHERE datname = current_database()
    `;
    
    return stats[0];
  } catch (error) {
    logger.error('Failed to get connection stats:', error.message);
    return null;
  }
}

export default {
  checkDatabaseConnection,
  connectWithRetry,
  getConnectionStats,
};
