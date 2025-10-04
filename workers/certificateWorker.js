// workers/certificateWorker.js
// BullMQ worker for certificate generation

import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { generateCertificate } from '../services/certificateService.js';
import logger from '../config/logger.js';

// Create Redis connection for worker
const redisConnection = new IORedis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

/**
 * Process certificate generation job
 * @param {Object} job - BullMQ job
 * @returns {Promise<Object>} Certificate data
 */
const processCertificateGeneration = async (job) => {
  const { enrollmentId } = job.data;

  logger.info('Processing certificate generation job', {
    jobId: job.id,
    enrollmentId
  });

  try {
    // Generate certificate
    const certificate = await generateCertificate(enrollmentId);

    logger.info('Certificate generation completed', {
      jobId: job.id,
      enrollmentId,
      certificateId: certificate.id,
      serialHash: certificate.serialHash
    });

    return {
      success: true,
      certificateId: certificate.id,
      serialHash: certificate.serialHash,
      enrollmentId
    };
  } catch (error) {
    logger.error('Certificate generation failed', {
      jobId: job.id,
      enrollmentId,
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

// Create certificate worker
const certificateWorker = new Worker(
  'certificate-generation',
  processCertificateGeneration,
  {
    connection: redisConnection,
    concurrency: 5, // Process 5 certificates concurrently
    removeOnComplete: {
      count: 100 // Keep last 100 completed jobs
    },
    removeOnFail: {
      count: 50 // Keep last 50 failed jobs
    }
  }
);

// Worker event listeners
certificateWorker.on('completed', (job, result) => {
  logger.info('Certificate job completed', {
    jobId: job.id,
    enrollmentId: job.data.enrollmentId,
    certificateId: result.certificateId,
    serialHash: result.serialHash
  });
});

certificateWorker.on('failed', (job, error) => {
  logger.error('Certificate job failed', {
    jobId: job?.id,
    enrollmentId: job?.data?.enrollmentId,
    error: error.message,
    attempts: job?.attemptsMade
  });
});

certificateWorker.on('error', (error) => {
  logger.error('Certificate worker error', {
    error: error.message,
    stack: error.stack
  });
});

logger.info('Certificate worker started', {
  queueName: 'certificate-generation',
  concurrency: 5
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing certificate worker...');
  await certificateWorker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing certificate worker...');
  await certificateWorker.close();
  process.exit(0);
});

export default certificateWorker;
