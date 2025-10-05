// routes/courseRoutes.js
// Routes for course CRUD operations

import express from 'express';
import { ensureAuth } from '../middleware/authMiddleware.js';
import { requireCreator } from '../middleware/rbacMiddleware.js';
import { validateUUID } from '../middleware/validationMiddleware.js';
import { uploadSingleImage, handleUploadError } from '../middleware/uploadMiddleware.js';
import {
  createNewCourse,
  getAllCourses,
  getCourseDetails,
  updateExistingCourse,
  submitCourse,
  deleteExistingCourse,
} from '../controllers/courseController.js';
import { getThumbnailUploadCredentials, saveCourseThumbnail } from '../controllers/courseController.js';

const router = express.Router();

/**
 * @route   POST /api/courses
 * @desc    Create a new course (DRAFT status) with optional thumbnail upload
 * @access  Private - CREATOR only
 * @body    multipart/form-data with 'thumbnail' file field + other course fields
 */
router.post(
  '/',
  ensureAuth,
  requireCreator,
  uploadSingleImage('thumbnail'),
  handleUploadError,
  createNewCourse
);

/**
 * @route   GET /api/courses
 * @desc    Get courses (filtered by role: LEARNER sees PUBLISHED, CREATOR sees own, ADMIN sees all)
 * @access  Private
 */
router.get('/', ensureAuth, getAllCourses);

/**
 * @route   GET /api/courses/:id
 * @desc    Get a single course with lessons
 * @access  Private
 */
router.get('/:id', ensureAuth, validateUUID('id'), getCourseDetails);

/**
 * @route   PATCH /api/courses/:id
 * @desc    Update a course (DRAFT only, own courses only) with optional thumbnail upload
 * @access  Private - CREATOR only
 * @body    multipart/form-data with optional 'thumbnail' file field + other course fields
 */
router.patch(
  '/:id',
  ensureAuth,
  requireCreator,
  validateUUID('id'),
  uploadSingleImage('thumbnail'),
  handleUploadError,
  updateExistingCourse
);

/**
 * @route   POST /api/courses/:courseId/thumbnail/upload
 * @desc    Get signed params to upload a thumbnail image to Cloudinary
 * @access  Private - CREATOR only
 */
router.post('/:courseId/thumbnail/upload', ensureAuth, requireCreator, validateUUID('courseId'), getThumbnailUploadCredentials);

/**
 * @route   PATCH /api/courses/:courseId/thumbnail
 * @desc    Save the uploaded thumbnail URL to the course record
 * @access  Private - CREATOR only
 */
router.patch('/:courseId/thumbnail', ensureAuth, requireCreator, validateUUID('courseId'), saveCourseThumbnail);

/**
 * @route   POST /api/courses/:id/submit
 * @desc    Submit course for review (DRAFT → PENDING)
 * @access  Private - CREATOR only
 */
router.post('/:id/submit', ensureAuth, requireCreator, validateUUID('id'), submitCourse);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete a course (DRAFT only, own courses only)
 * @access  Private - CREATOR only
 */
router.delete('/:id', ensureAuth, requireCreator, validateUUID('id'), deleteExistingCourse);

export default router;
