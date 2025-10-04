import 'dotenv/config';
import { Worker } from 'bullmq';
import queueConfig from '../config/queue.js';
import { generateTranscript } from '../services/transcriptService.js';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.js';

const { redisConnection } = queueConfig;
const prisma = new PrismaClient();

/**
 * Process transcription job
 * @param {Object} job - BullMQ job object
 * @returns {Promise<Object>} Job result
 */
const processTranscription = async (job) => {
  const { lessonId, videoUrl } = job.data;

  logger.info('Processing transcription job', {
    jobId: job.id,
    lessonId,
    videoUrl,
    attempt: job.attemptsMade + 1
  });

  try {
    // Validate lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId }
    });

    if (!lesson) {
      throw new Error(`Lesson ${lessonId} not found`);
    }

    // Generate transcript
    const transcript = await generateTranscript(videoUrl);

    // Store transcript in database
    await prisma.lesson.update({
      where: { id: lessonId },
      data: { transcript }
    });

    logger.info('Transcription completed successfully', {
      jobId: job.id,
      lessonId,
      transcriptLength: transcript.length
    });

    // Update job progress
    await job.updateProgress(100);

    return {
      success: true,
      lessonId,
      transcriptLength: transcript.length,
      completedAt: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Transcription job failed', {
      jobId: job.id,
      lessonId,
      attempt: job.attemptsMade + 1,
      error: error.message,
      stack: error.stack
    });

    throw error; // Let BullMQ handle retries
  }
};

/**
 * Create and start transcription worker
 * @returns {Worker} BullMQ Worker instance
 */
export const createTranscriptionWorker = () => {
  const worker = new Worker(
    'transcript-generation',
    processTranscription,
    {
      connection: redisConnection,
      concurrency: 2, // Process 2 jobs simultaneously
      limiter: {
        max: 10, // Max 10 jobs
        duration: 60000 // per 60 seconds
      }
    }
  );

  // Event listeners
  worker.on('completed', (job, result) => {
    logger.info('Job completed', {
      jobId: job.id,
      lessonId: result.lessonId,
      transcriptLength: result.transcriptLength
    });
  });

  worker.on('failed', (job, error) => {
    logger.error('Job failed permanently', {
      jobId: job.id,
      lessonId: job.data.lessonId,
      attempts: job.attemptsMade,
      error: error.message
    });
  });

  worker.on('error', (error) => {
    logger.error('Worker error', { error: error.message });
  });

  worker.on('ready', () => {
    logger.info('Transcription worker is ready and waiting for jobs');
  });

  return worker;
};

/**
 * Graceful shutdown handler
 * @param {Worker} worker - BullMQ Worker instance
 */
export const shutdownWorker = async (worker) => {
  logger.info('Shutting down transcription worker...');
  
  try {
    await worker.close();
    await prisma.$disconnect();
    logger.info('Worker shutdown complete');
  } catch (error) {
    logger.error('Error during worker shutdown', { error: error.message });
    process.exit(1);
  }
};

// Start worker if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const worker = createTranscriptionWorker();

  // Handle shutdown signals
  process.on('SIGTERM', () => shutdownWorker(worker));
  process.on('SIGINT', () => shutdownWorker(worker));

  logger.info('Transcription worker started');
}

export default {
  createTranscriptionWorker,
  shutdownWorker
};
