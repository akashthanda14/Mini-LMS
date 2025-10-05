// controllers/adminMetricsController.js
// Controller for admin dashboard metrics and analytics

import {
  getDashboardMetrics,
  getGrowthAnalytics,
  getTopCourses,
  getRecentActivity
} from '../services/adminMetricsService.js';
import logger from '../config/logger.js';

/**
 * GET /api/admin/metrics
 * Get comprehensive dashboard metrics
 * @access Private - ADMIN only
 */
export const getMetrics = async (req, res) => {
  try {
    const metrics = await getDashboardMetrics();

    logger.info('Admin metrics retrieved', { adminId: req.user.id });

    return res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    logger.error('Get metrics error', {
      error: error.message,
      adminId: req.user.id
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics'
    });
  }
};

/**
 * GET /api/admin/metrics/growth
 * Get month-over-month growth analytics
 * @access Private - ADMIN only
 */
export const getGrowth = async (req, res) => {
  try {
    const growth = await getGrowthAnalytics();

    logger.info('Growth analytics retrieved', { adminId: req.user.id });

    return res.status(200).json({
      success: true,
      data: growth
    });
  } catch (error) {
    logger.error('Get growth analytics error', {
      error: error.message,
      adminId: req.user.id
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve growth analytics'
    });
  }
};

/**
 * GET /api/admin/metrics/top-courses
 * Get top performing courses by enrollment
 * @access Private - ADMIN only
 */
export const getTopPerformingCourses = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    if (limit < 1 || limit > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 50'
      });
    }

    const topCoursesData = await getTopCourses(limit);

    logger.info('Top courses retrieved', { 
      adminId: req.user.id,
      limit
    });

    return res.status(200).json({
      success: true,
      data: topCoursesData
    });
  } catch (error) {
    logger.error('Get top courses error', {
      error: error.message,
      adminId: req.user.id
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve top courses'
    });
  }
};

/**
 * GET /api/admin/metrics/activity
 * Get recent platform activity
 * @access Private - ADMIN only
 */
export const getActivity = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100'
      });
    }

    const activityData = await getRecentActivity(limit);

    logger.info('Recent activity retrieved', { 
      adminId: req.user.id,
      limit
    });

    return res.status(200).json({
      success: true,
      data: activityData
    });
  } catch (error) {
    logger.error('Get activity error', {
      error: error.message,
      adminId: req.user.id
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve activity'
    });
  }
};

/**
 * GET /api/admin/metrics/summary
 * Get quick summary metrics (lightweight endpoint)
 * @access Private - ADMIN only
 */
export const getSummary = async (req, res) => {
  try {
    const metrics = await getDashboardMetrics();

    // Return only the high-level summary
    const summary = {
      users: {
        total: metrics.users.total,
        recentSignups: metrics.users.recentSignups
      },
      courses: {
        total: metrics.courses.total,
        pending: metrics.courses.byStatus.PENDING,
        published: metrics.courses.byStatus.PUBLISHED
      },
      enrollments: {
        total: metrics.enrollments.total,
        active: metrics.enrollments.active
      },
      applications: {
        pending: metrics.applications.byStatus.PENDING
      },
      timestamp: metrics.timestamp
    };

    return res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Get summary error', {
      error: error.message,
      adminId: req.user.id
    });

    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve summary'
    });
  }
};

export default {
  getMetrics,
  getGrowth,
  getTopPerformingCourses,
  getActivity,
  getSummary
};
