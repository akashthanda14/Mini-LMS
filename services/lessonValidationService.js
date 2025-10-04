import logger from '../config/logger.js';

/**
 * Validate lesson data for creation
 * @param {object} data - Lesson data
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {object} Validation result { valid, errors }
 */
export const validateLessonData = (data, isUpdate = false) => {
  const errors = [];

  // Title validation
  if (!isUpdate || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string') {
      errors.push('Title is required');
    } else if (data.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters');
    } else if (data.title.trim().length > 200) {
      errors.push('Title must not exceed 200 characters');
    }
  }

  // Video URL validation (only for creation)
  if (!isUpdate) {
    if (!data.videoUrl || typeof data.videoUrl !== 'string') {
      errors.push('Video URL is required');
    } else if (!data.videoUrl.includes('cloudinary.com')) {
      errors.push('Video URL must be from Cloudinary');
    }
  }

  // Order validation
  if (!isUpdate || data.order !== undefined) {
    if (data.order === undefined || data.order === null) {
      errors.push('Order is required');
    } else if (!Number.isInteger(data.order)) {
      errors.push('Order must be an integer');
    } else if (data.order < 1) {
      errors.push('Order must be at least 1');
    }
  }

  // Duration validation (optional)
  if (data.duration !== undefined && data.duration !== null) {
    if (!Number.isInteger(data.duration)) {
      errors.push('Duration must be an integer');
    } else if (data.duration < 0) {
      errors.push('Duration must be positive');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Check if user is the course creator
 * @param {object} course - Course object
 * @param {string} userId - User ID
 * @returns {boolean} True if user is the creator
 */
export const isCreatorOfCourse = (course, userId) => {
  return course.creatorId === userId;
};

/**
 * Check if course allows lesson modifications
 * @param {object} course - Course object
 * @returns {boolean} True if course is in DRAFT status
 */
export const canModifyLessons = (course) => {
  return course.status === 'DRAFT';
};

/**
 * Check if user can access course lessons
 * @param {object} course - Course object
 * @param {object} user - User object with role and userId
 * @returns {boolean} True if user can access
 */
export const canAccessLessons = (course, user) => {
  // Published courses are accessible to everyone
  if (course.status === 'PUBLISHED') {
    return true;
  }

  // Admins can access all courses
  if (user.role === 'ADMIN') {
    return true;
  }

  // Creators can access their own courses
  if (course.creatorId === user.id) {
    return true;
  }

  return false;
};

/**
 * Sanitize lesson data
 * @param {object} data - Raw lesson data
 * @returns {object} Sanitized data
 */
export const sanitizeLessonData = (data) => {
  const sanitized = {};

  if (data.title !== undefined) {
    sanitized.title = data.title.trim();
  }

  if (data.videoUrl !== undefined) {
    sanitized.videoUrl = data.videoUrl.trim();
  }

  if (data.order !== undefined) {
    sanitized.order = parseInt(data.order);
  }

  if (data.duration !== undefined && data.duration !== null) {
    sanitized.duration = parseInt(data.duration);
  }

  return sanitized;
};

/**
 * Validate update permissions
 * @param {object} lesson - Lesson with course details
 * @param {string} userId - User ID
 * @returns {object} Result { allowed, message }
 */
export const validateUpdatePermissions = (lesson, userId) => {
  // Check if user is creator
  if (lesson.course.creatorId !== userId) {
    return {
      allowed: false,
      message: 'Only the course creator can update lessons'
    };
  }

  // Check if course is in DRAFT status
  if (lesson.course.status !== 'DRAFT') {
    return {
      allowed: false,
      message: 'Cannot modify lessons in non-draft courses'
    };
  }

  return {
    allowed: true
  };
};

/**
 * Validate delete permissions
 * @param {object} lesson - Lesson with course details
 * @param {string} userId - User ID
 * @returns {object} Result { allowed, message }
 */
export const validateDeletePermissions = (lesson, userId) => {
  // Same rules as update
  return validateUpdatePermissions(lesson, userId);
};
