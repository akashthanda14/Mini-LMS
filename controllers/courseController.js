// controllers/courseController.js
// Controller for course CRUD operations

import {
  createCourse as createCourseService,
  getCourseById,
  getCourseWithEnrollment,
  getCourses,
  updateCourse as updateCourseService,
  submitCourseForReview,
  deleteCourse as deleteCourseService,
} from '../services/courseService.js';

import {
  validateCourseData,
  isCreatorOwner,
  canEditCourse,
  canDeleteCourse,
  canSubmitCourse,
  sanitizeCourseData,
} from '../services/courseValidationService.js';

/**
 * POST /courses
 * Create a new course
 * @access Private - CREATOR only
 */
export const createNewCourse = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const courseData = req.body;

    // Sanitize input
    const sanitizedData = sanitizeCourseData(courseData);

    // Validate course data
    const validation = validateCourseData(sanitizedData);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Create course
    const course = await createCourseService(creatorId, sanitizedData);

    return res.status(201).json({
      success: true,
      message: 'Course created successfully as DRAFT',
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        status: course.status,
        createdAt: course.createdAt,
      },
    });
  } catch (error) {
    console.error('Create course error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /courses
 * Get courses based on user role
 * @access Private
 */
export const getAllCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let filters = {};

    // LEARNER: Only PUBLISHED courses
    if (userRole === 'LEARNER') {
      filters.status = 'PUBLISHED';
    }
    // CREATOR: Only their own courses
    else if (userRole === 'CREATOR') {
      filters.creatorId = userId;
    }
    // ADMIN: All courses (no filters)
    
    const courses = await getCourses(filters);

    return res.status(200).json({
      success: true,
      count: courses.length,
      courses: courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        category: course.category,
        level: course.level,
        duration: course.duration,
        status: course.status,
        createdAt: course.createdAt,
        publishedAt: course.publishedAt,
        creator: course.creator,
        lessonCount: course._count.lessons,
        enrollmentCount: course._count.enrollments,
      })),
    });
  } catch (error) {
    console.error('Get courses error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /courses/:id
 * Get a single course by ID with enrollment status
 * @access Private
 */
export const getCourseDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get course with enrollment status for the current user
    const course = await getCourseWithEnrollment(id, userId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // LEARNER: Can only view PUBLISHED courses
    if (userRole === 'LEARNER' && course.status !== 'PUBLISHED') {
      return res.status(403).json({
        success: false,
        message: 'This course is not available yet',
      });
    }

    // CREATOR: Can only view their own courses (all statuses)
    if (userRole === 'CREATOR' && course.creatorId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own courses',
      });
    }

    // ADMIN: Can view all courses

    return res.status(200).json({
      success: true,
      course: {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail: course.thumbnail,
        category: course.category,
        level: course.level,
        duration: course.duration,
        status: course.status,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        submittedAt: course.submittedAt,
        publishedAt: course.publishedAt,
        rejectionReason: course.rejectionReason,
        creator: course.creator,
        lessons: course.lessons,
        stats: {
          lessonCount: course._count.lessons,
          enrollmentCount: course._count.enrollments,
          certificateCount: course._count.certificates,
        },
      },
    });
  } catch (error) {
    console.error('Get course details error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * PATCH /courses/:id
 * Update a course
 * @access Private - CREATOR only (own courses, DRAFT only)
 */
export const updateExistingCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    // Get course
    const course = await getCourseById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check ownership
    if (!isCreatorOwner(course, userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own courses',
      });
    }

    // Check if course can be edited
    const editCheck = canEditCourse(course);
    if (!editCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: editCheck.reason,
        currentStatus: course.status,
      });
    }

    // Sanitize input
    const sanitizedData = sanitizeCourseData(updateData);

    // Validate course data (only fields being updated)
    const validation = validateCourseData(sanitizedData, true);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Update course
    const updatedCourse = await updateCourse(id, sanitizedData);

    return res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      course: {
        id: updatedCourse.id,
        title: updatedCourse.title,
        description: updatedCourse.description,
        status: updatedCourse.status,
        updatedAt: updatedCourse.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update course error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * POST /courses/:id/submit
 * Submit course for review
 * @access Private - CREATOR only (own courses, DRAFT only)
 */
export const submitCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get course
    const course = await getCourseById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check ownership
    if (!isCreatorOwner(course, userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only submit your own courses',
      });
    }

    // Check if course can be submitted
    const submitCheck = canSubmitCourse(course);
    if (!submitCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: submitCheck.reason,
        currentStatus: course.status,
      });
    }

    // Submit course
    const submittedCourse = await submitCourseForReview(id);

    return res.status(200).json({
      success: true,
      message: 'Course submitted for review successfully',
      course: {
        id: submittedCourse.id,
        title: submittedCourse.title,
        status: submittedCourse.status,
        submittedAt: submittedCourse.submittedAt,
        lessonCount: submittedCourse._count.lessons,
      },
    });
  } catch (error) {
    console.error('Submit course error:', error);

    if (error.message.includes('at least one lesson')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * DELETE /courses/:id
 * Delete a course
 * @access Private - CREATOR only (own courses, DRAFT only)
 */
export const deleteExistingCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get course
    const course = await getCourseById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check ownership
    if (!isCreatorOwner(course, userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own courses',
      });
    }

    // Check if course can be deleted
    const deleteCheck = canDeleteCourse(course);
    if (!deleteCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: deleteCheck.reason,
        currentStatus: course.status,
      });
    }

    // Delete course
    await deleteCourse(id);

    return res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
    });
  } catch (error) {
    console.error('Delete course error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /courses/:courseId/thumbnail/upload
 * Get credentials for uploading course thumbnail to Cloudinary
 * @access Private - CREATOR only
 */
export const getThumbnailUploadCredentials = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Get course
    const course = await getCourseById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check ownership
    if (!isCreatorOwner(course, userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only upload thumbnails for your own courses',
      });
    }

    // Return Cloudinary credentials
    return res.status(200).json({
      success: true,
      data: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        uploadPreset: process.env.CLOUDINARY_UPLOAD_PRESET || 'course_thumbnails',
        folder: 'lms/course-thumbnails',
      },
    });
  } catch (error) {
    console.error('Get thumbnail upload credentials error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * PATCH /courses/:courseId/thumbnail
 * Save course thumbnail URL after successful upload
 * @access Private - CREATOR only
 */
export const saveCourseThumbnail = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { thumbnailUrl } = req.body;
    const userId = req.user.id;

    if (!thumbnailUrl) {
      return res.status(400).json({
        success: false,
        message: 'Thumbnail URL is required',
      });
    }

    // Get course
    const course = await getCourseById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // Check ownership
    if (!isCreatorOwner(course, userId)) {
      return res.status(403).json({
        success: false,
        message: 'You can only update thumbnails for your own courses',
      });
    }

    // Update course thumbnail
    const updatedCourse = await updateCourseService(courseId, { thumbnail: thumbnailUrl });

    return res.status(200).json({
      success: true,
      message: 'Thumbnail updated successfully',
      data: updatedCourse,
    });
  } catch (error) {
    console.error('Save course thumbnail error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export default {
  createNewCourse,
  getAllCourses,
  getCourseDetails,
  updateExistingCourse,
  submitCourse,
  deleteExistingCourse,
  getThumbnailUploadCredentials,
  saveCourseThumbnail,
};
