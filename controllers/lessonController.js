import { generateUploadSignature, deleteVideo, extractPublicId } from '../config/cloudinary.js';
import { getCourseById } from '../services/courseService.js';
import {
  createLesson,
  getLessonsByCourse,
  getLessonById,
  updateLesson,
  deleteLesson as deleteLessonService
} from '../services/lessonService.js';
import {
  validateLessonData,
  isCreatorOfCourse,
  canModifyLessons,
  canAccessLessons,
  sanitizeLessonData,
  validateUpdatePermissions,
  validateDeletePermissions
} from '../services/lessonValidationService.js';
import { transcriptionQueue } from '../config/queue.js';
import logger from '../config/logger.js';

/**
 * Get upload credentials for Cloudinary
 * POST /courses/:courseId/lessons/upload
 */
export const getUploadCredentials = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id; // Changed from req.user.userId

    // Get course
    const course = await getCourseById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if user is the creator
    if (!isCreatorOfCourse(course, userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only the course creator can upload lessons'
      });
    }

    // Check if course is in DRAFT status
    if (!canModifyLessons(course)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add lessons to non-draft courses',
        currentStatus: course.status
      });
    }

    // Generate unique public ID
    const timestamp = Date.now();
    const publicId = `course_${courseId}_lesson_${timestamp}`;
    const folder = `courses/${courseId}/lessons`;

    // Generate upload signature
    const credentials = generateUploadSignature(publicId, folder);

    logger.info('Upload credentials generated', { courseId, userId });

    return res.status(200).json({
      success: true,
      data: {
        uploadUrl: `https://api.cloudinary.com/v1_1/${credentials.cloud_name}/video/upload`,
        signature: credentials.signature,
        timestamp: credentials.timestamp,
        apiKey: credentials.api_key,
        publicId: credentials.public_id,
        cloudName: credentials.cloud_name,
        folder: credentials.folder,
        resourceType: credentials.resource_type,
        eager: credentials.eager,
        eagerAsync: credentials.eager_async
      }
    });
  } catch (error) {
    logger.error('Get upload credentials error', { 
      error: error.message,
      courseId: req.params.courseId 
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create a new lesson
 * POST /courses/:courseId/lessons
 */
export const createNewLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id; // Changed from req.user.userId
    const lessonData = req.body;

    // Sanitize input
    const sanitized = sanitizeLessonData(lessonData);

    // Validate lesson data
    const validation = validateLessonData(sanitized, false);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Get course
    const course = await getCourseById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check permissions
    if (!isCreatorOfCourse(course, userId)) {
      return res.status(403).json({
        success: false,
        message: 'Only the course creator can add lessons'
      });
    }

    if (!canModifyLessons(course)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot add lessons to non-draft courses',
        currentStatus: course.status
      });
    }

    // Create lesson
    const lesson = await createLesson(courseId, sanitized);

    return res.status(201).json({
      success: true,
      message: 'Lesson created successfully',
      data: lesson
    });
  } catch (error) {
    logger.error('Create lesson error', { 
      error: error.message,
      courseId: req.params.courseId 
    });

    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get all lessons for a course
 * GET /courses/:courseId/lessons
 */
export const getCourseLessons = async (req, res) => {
  try {
    const { courseId } = req.params;
    const user = req.user;

    // Get course
    const course = await getCourseById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check access permissions
    if (!canAccessLessons(course, user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Course is not published yet.'
      });
    }

    // Get lessons
    const lessons = await getLessonsByCourse(courseId);

    return res.status(200).json({
      success: true,
      data: lessons
    });
  } catch (error) {
    logger.error('Get lessons error', { 
      error: error.message,
      courseId: req.params.courseId 
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Update a lesson
 * PATCH /lessons/:id
 */
export const updateExistingLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Changed from req.user.userId
    const updateData = req.body;

    // Sanitize input
    const sanitized = sanitizeLessonData(updateData);

    // Validate update data
    const validation = validateLessonData(sanitized, true);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors
      });
    }

    // Get lesson with course details
    const lesson = await getLessonById(id);

    // Check permissions
    const permissionCheck = validateUpdatePermissions(lesson, userId);
    if (!permissionCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: permissionCheck.message
      });
    }

    // Update lesson
    const updatedLesson = await updateLesson(id, sanitized);

    return res.status(200).json({
      success: true,
      message: 'Lesson updated successfully',
      data: updatedLesson
    });
  } catch (error) {
    logger.error('Update lesson error', { 
      error: error.message,
      lessonId: req.params.id 
    });

    if (error.message.includes('already exists')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Lesson not found') {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete a lesson
 * DELETE /lessons/:id
 */
export const deleteExistingLesson = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id; // Changed from req.user.userId
    const { deleteFromCloudinary = false } = req.query;

    // Get lesson with course details
    const lesson = await getLessonById(id);

    // Check permissions
    const permissionCheck = validateDeletePermissions(lesson, userId);
    if (!permissionCheck.allowed) {
      return res.status(403).json({
        success: false,
        message: permissionCheck.message
      });
    }

    // Delete from Cloudinary if requested
    if (deleteFromCloudinary === 'true') {
      try {
        const publicId = extractPublicId(lesson.videoUrl);
        if (publicId) {
          await deleteVideo(publicId);
          logger.info('Video deleted from Cloudinary', { lessonId: id, publicId });
        }
      } catch (error) {
        logger.error('Failed to delete video from Cloudinary', { 
          lessonId: id, 
          error: error.message 
        });
        // Continue with lesson deletion even if Cloudinary delete fails
      }
    }

    // Delete lesson
    await deleteLessonService(id);

    return res.status(200).json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    logger.error('Delete lesson error', { 
      error: error.message,
      lessonId: req.params.id 
    });

    if (error.message === 'Lesson not found') {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Get transcript status for a lesson
 * GET /lessons/:id/transcript-status
 */
export const getTranscriptStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Get lesson
    const lesson = await getLessonById(id);

    if (!lesson) {
      return res.status(404).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    // Check if user can access this lesson
    if (!canAccessLessons(lesson.course, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if transcript exists
    if (lesson.transcript) {
      return res.status(200).json({
        success: true,
        data: {
          status: 'completed',
          transcript: lesson.transcript,
          lessonId: lesson.id
        }
      });
    }

    // Check job status in queue
    try {
      const jobs = await transcriptionQueue.getJobs(['waiting', 'active', 'completed', 'failed']);
      const lessonJob = jobs.find(job => job.data.lessonId === id);

      if (!lessonJob) {
        return res.status(200).json({
          success: true,
          data: {
            status: 'not_queued',
            message: 'No transcription job found for this lesson',
            lessonId: lesson.id
          }
        });
      }

      const jobState = await lessonJob.getState();
      const progress = lessonJob.progress || 0;

      let status = jobState;
      let errorMessage = null;

      if (jobState === 'failed') {
        errorMessage = lessonJob.failedReason;
      }

      return res.status(200).json({
        success: true,
        data: {
          status,
          progress,
          jobId: lessonJob.id,
          lessonId: lesson.id,
          error: errorMessage,
          attempts: lessonJob.attemptsMade
        }
      });
    } catch (queueError) {
      logger.error('Error checking job status', { 
        lessonId: id,
        error: queueError.message 
      });

      return res.status(200).json({
        success: true,
        data: {
          status: 'unknown',
          message: 'Could not check job status',
          lessonId: lesson.id
        }
      });
    }
  } catch (error) {
    logger.error('Error getting transcript status', {
      lessonId: req.params.id,
      error: error.message
    });

    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
