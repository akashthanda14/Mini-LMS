import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import logger from './logger.js';

// Create Redis connection for BullMQ
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

// Handle Redis connection events
redisConnection.on('connect', () => {
  logger.info('Redis connected successfully for BullMQ');
});

redisConnection.on('error', (err) => {
  logger.error('Redis connection error', { error: err.message });
});

redisConnection.on('close', () => {
  logger.warn('Redis connection closed');
});

/**
 * Transcript Generation Queue
 * Handles async video transcription jobs
 */
export const transcriptionQueue = new Queue('transcript-generation', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000
    },
    removeOnFail: {
      age: 7 * 24 * 3600 // Keep failed jobs for 7 days
    }
  }
});

// Log queue events
transcriptionQueue.on('error', (error) => {
  logger.error('Transcription queue error', { error: error.message });
});

transcriptionQueue.on('waiting', ({ jobId }) => {
  logger.info('Job waiting in transcription queue', { jobId });
});

/**
 * Add a transcription job to the queue
 * @param {string} lessonId - The lesson ID
 * @param {string} videoUrl - The Cloudinary video URL
 * @returns {Promise<Job>} The created job
 */
export const queueTranscription = async (lessonId, videoUrl) => {
  try {
    const job = await transcriptionQueue.add('generate-transcript', {
      lessonId,
      videoUrl,
      timestamp: new Date().toISOString()
    });

    logger.info('Transcription job queued', { 
      jobId: job.id, 
      lessonId, 
      videoUrl 
    });

    return job;
  } catch (error) {
    logger.error('Error queuing transcription job', { 
      lessonId, 
      error: error.message 
    });
    throw error;
  }
};

/**
 * Close all connections gracefully
 */
export const closeConnections = async () => {
  try {
    await transcriptionQueue.close();
    await redisConnection.quit();
    logger.info('BullMQ and Redis connections closed');
  } catch (error) {
    logger.error('Error closing connections', { error: error.message });
  }
};

export default {
  transcriptionQueue,
  queueTranscription,
  closeConnections,
  redisConnection
};
