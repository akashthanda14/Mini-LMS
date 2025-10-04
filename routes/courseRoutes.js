// routes/courseRoutes.js
// Routes for course CRUD operations

import express from 'express';
import { ensureAuth } from '../middleware/authMiddleware.js';
import { requireCreator } from '../middleware/rbacMiddleware.js';
import {
  createNewCourse,
  getAllCourses,
  getCourseDetails,
  updateExistingCourse,
  submitCourse,
  deleteExistingCourse,
} from '../controllers/courseController.js';

const router = express.Router();

/**
 * @route   POST /api/courses
 * @desc    Create a new course (DRAFT status)
 * @access  Private - CREATOR only
 */
router.post('/', ensureAuth, requireCreator, createNewCourse);

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
router.get('/:id', ensureAuth, getCourseDetails);

/**
 * @route   PATCH /api/courses/:id
 * @desc    Update a course (DRAFT only, own courses only)
 * @access  Private - CREATOR only
 */
router.patch('/:id', ensureAuth, requireCreator, updateExistingCourse);

/**
 * @route   POST /api/courses/:id/submit
 * @desc    Submit course for review (DRAFT → PENDING)
 * @access  Private - CREATOR only
 */
router.post('/:id/submit', ensureAuth, requireCreator, submitCourse);

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete a course (DRAFT only, own courses only)
 * @access  Private - CREATOR only
 */
router.delete('/:id', ensureAuth, requireCreator, deleteExistingCourse);

export default router;
