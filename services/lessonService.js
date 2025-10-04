import prisma from '../lib/prisma.js';
import logger from '../config/logger.js';
import { isCloudinaryUrl } from '../config/cloudinary.js';
import { queueTranscription } from '../config/queue.js';

/**
 * Create a new lesson for a course
 * @param {string} courseId - Course ID
 * @param {object} lessonData - Lesson data (title, videoUrl, order, duration)
 * @returns {Promise<object>} Created lesson
 */
export const createLesson = async (courseId, lessonData) => {
  const { title, videoUrl, order, duration } = lessonData;

  // Validate Cloudinary URL
  if (!isCloudinaryUrl(videoUrl)) {
    throw new Error('Video URL must be from Cloudinary');
  }

  // Check if order already exists for this course
  const existingLesson = await prisma.lesson.findFirst({
    where: {
      courseId,
      order
    }
  });

  if (existingLesson) {
    throw new Error(`Lesson with order ${order} already exists for this course`);
  }

  // Create lesson
  const lesson = await prisma.lesson.create({
    data: {
      courseId,
      title: title.trim(),
      videoUrl,
      order,
      duration: duration || null,
      transcript: null // Will be populated by background job
    }
  });

  logger.info('Lesson created', { lessonId: lesson.id, courseId, order });

  // Queue transcription job (non-blocking)
  try {
    await queueTranscription(lesson.id, videoUrl);
  } catch (error) {
    logger.error('Failed to queue transcription', { 
      lessonId: lesson.id, 
      error: error.message 
    });
    // Don't fail lesson creation if queue fails
  }

  return lesson;
};

/**
 * Get all lessons for a course
 * @param {string} courseId - Course ID
 * @returns {Promise<Array>} Array of lessons ordered by order field
 */
export const getLessonsByCourse = async (courseId) => {
  const lessons = await prisma.lesson.findMany({
    where: {
      courseId
    },
    orderBy: {
      order: 'asc'
    },
    select: {
      id: true,
      courseId: true,
      title: true,
      videoUrl: true,
      transcript: true,
      order: true,
      duration: true,
      createdAt: true,
      updatedAt: true
    }
  });

  logger.info('Lessons retrieved', { courseId, count: lessons.length });

  return lessons;
};

/**
 * Get a single lesson by ID
 * @param {string} lessonId - Lesson ID
 * @returns {Promise<object>} Lesson with course details
 */
export const getLessonById = async (lessonId) => {
  const lesson = await prisma.lesson.findUnique({
    where: {
      id: lessonId
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          creatorId: true,
          status: true
        }
      }
    }
  });

  if (!lesson) {
    throw new Error('Lesson not found');
  }

  return lesson;
};

/**
 * Update a lesson
 * @param {string} lessonId - Lesson ID
 * @param {object} updateData - Data to update (title, order)
 * @returns {Promise<object>} Updated lesson
 */
export const updateLesson = async (lessonId, updateData) => {
  const lesson = await getLessonById(lessonId);

  // If updating order, check for duplicates
  if (updateData.order !== undefined && updateData.order !== lesson.order) {
    const existingLesson = await prisma.lesson.findFirst({
      where: {
        courseId: lesson.courseId,
        order: updateData.order,
        id: {
          not: lessonId
        }
      }
    });

    if (existingLesson) {
      throw new Error(`Lesson with order ${updateData.order} already exists for this course`);
    }
  }

  // Prepare update data
  const data = {};
  if (updateData.title) data.title = updateData.title.trim();
  if (updateData.order !== undefined) data.order = updateData.order;

  // Update lesson
  const updatedLesson = await prisma.lesson.update({
    where: {
      id: lessonId
    },
    data
  });

  logger.info('Lesson updated', { lessonId, updates: Object.keys(data) });

  return updatedLesson;
};

/**
 * Delete a lesson
 * @param {string} lessonId - Lesson ID
 * @returns {Promise<void>}
 */
export const deleteLesson = async (lessonId) => {
  const lesson = await getLessonById(lessonId);

  await prisma.lesson.delete({
    where: {
      id: lessonId
    }
  });

  logger.info('Lesson deleted', { lessonId, courseId: lesson.courseId });

  return lesson;
};

/**
 * Get lesson count for a course
 * @param {string} courseId - Course ID
 * @returns {Promise<number>} Number of lessons
 */
export const getLessonCount = async (courseId) => {
  const count = await prisma.lesson.count({
    where: {
      courseId
    }
  });

  return count;
};

/**
 * Check if lesson order is unique
 * @param {string} courseId - Course ID
 * @param {number} order - Lesson order
 * @param {string} excludeLessonId - Lesson ID to exclude from check (for updates)
 * @returns {Promise<boolean>} True if order is unique
 */
export const isOrderUnique = async (courseId, order, excludeLessonId = null) => {
  const where = {
    courseId,
    order
  };

  if (excludeLessonId) {
    where.id = { not: excludeLessonId };
  }

  const existingLesson = await prisma.lesson.findFirst({ where });

  return !existingLesson;
};
