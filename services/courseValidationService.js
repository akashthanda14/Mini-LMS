// services/courseValidationService.js
// Validation service for course operations

import validator from 'validator';

/**
 * Validate course creation/update data
 * @param {Object} data - Course data
 * @param {boolean} isUpdate - Whether this is an update operation
 * @returns {Object} Validation result
 */
export const validateCourseData = (data, isUpdate = false) => {
  const errors = [];

  // Title validation
  if (data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string') {
      if (!isUpdate) errors.push('Title is required');
    } else if (data.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters');
    } else if (data.title.trim().length > 100) {
      errors.push('Title must not exceed 100 characters');
    }
  } else if (!isUpdate) {
    errors.push('Title is required');
  }

  // Description validation
  if (data.description !== undefined) {
    if (!data.description || typeof data.description !== 'string') {
      if (!isUpdate) errors.push('Description is required');
    } else if (data.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters');
    } else if (data.description.trim().length > 1000) {
      errors.push('Description must not exceed 1000 characters');
    }
  } else if (!isUpdate) {
    errors.push('Description is required');
  }

  // Thumbnail validation (optional)
  if (data.thumbnail && !validator.isURL(data.thumbnail)) {
    errors.push('Thumbnail must be a valid URL');
  }

  // Category validation (optional)
  if (data.category && typeof data.category !== 'string') {
    errors.push('Category must be a string');
  }

  // Level validation (optional)
  if (data.level) {
    const validLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
    if (!validLevels.includes(data.level)) {
      errors.push(`Level must be one of: ${validLevels.join(', ')}`);
    }
  }

  // Duration validation (optional)
  if (data.duration !== undefined) {
    const duration = parseInt(data.duration);
    if (isNaN(duration) || duration < 0) {
      errors.push('Duration must be a positive number');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate course ownership
 * @param {Object} course - Course object
 * @param {string} userId - User ID to check
 * @returns {boolean} True if user owns the course
 */
export const isCreatorOwner = (course, userId) => {
  return course.creatorId === userId;
};

/**
 * Check if course can be edited
 * @param {Object} course - Course object
 * @returns {Object} Check result
 */
export const canEditCourse = (course) => {
  if (course.status !== 'DRAFT') {
    return {
      allowed: false,
      reason: `Cannot edit course with status ${course.status}. Only DRAFT courses can be edited.`
    };
  }

  return {
    allowed: true,
  };
};

/**
 * Check if course can be deleted
 * @param {Object} course - Course object
 * @returns {Object} Check result
 */
export const canDeleteCourse = (course) => {
  if (course.status !== 'DRAFT') {
    return {
      allowed: false,
      reason: `Cannot delete course with status ${course.status}. Only DRAFT courses can be deleted.`
    };
  }

  return {
    allowed: true,
  };
};

/**
 * Check if course can be submitted for review
 * @param {Object} course - Course object
 * @returns {Object} Check result
 */
export const canSubmitCourse = (course) => {
  if (course.status !== 'DRAFT') {
    return {
      allowed: false,
      reason: `Cannot submit course with status ${course.status}. Only DRAFT courses can be submitted.`
    };
  }

  return {
    allowed: true,
  };
};

/**
 * Check if course can be reviewed (published/rejected)
 * @param {Object} course - Course object
 * @returns {Object} Check result
 */
export const canReviewCourse = (course) => {
  if (course.status !== 'PENDING') {
    return {
      allowed: false,
      reason: `Cannot review course with status ${course.status}. Only PENDING courses can be reviewed.`
    };
  }

  return {
    allowed: true,
  };
};

/**
 * Sanitize course data for creation/update
 * @param {Object} data - Raw course data
 * @returns {Object} Sanitized data
 */
export const sanitizeCourseData = (data) => {
  const sanitized = {};

  if (data.title) {
    sanitized.title = data.title.trim();
  }

  if (data.description) {
    sanitized.description = data.description.trim();
  }

  if (data.thumbnail) {
    sanitized.thumbnail = data.thumbnail.trim();
  }

  if (data.category) {
    sanitized.category = data.category.trim();
  }

  if (data.level) {
    sanitized.level = data.level;
  }

  if (data.duration !== undefined) {
    sanitized.duration = parseInt(data.duration);
  }

  return sanitized;
};

export default {
  validateCourseData,
  isCreatorOwner,
  canEditCourse,
  canDeleteCourse,
  canSubmitCourse,
  canReviewCourse,
  sanitizeCourseData,
};
