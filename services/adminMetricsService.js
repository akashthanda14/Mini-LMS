// services/adminMetricsService.js
// Service for admin dashboard metrics and statistics

import prisma from '../lib/prisma.js';
import logger from '../config/logger.js';

/**
 * Get platform-wide dashboard metrics
 * @returns {Promise<object>} Dashboard metrics
 */
export const getDashboardMetrics = async () => {
  try {
    // Run all queries in parallel for better performance
    const [
      userStats,
      courseStats,
      enrollmentStats,
      certificateStats,
      applicationStats,
      recentUsers,
      recentCourses,
      recentEnrollments,
    ] = await Promise.all([
      // User statistics
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
        where: { isActive: true }
      }),

      // Course statistics
      prisma.course.groupBy({
        by: ['status'],
        _count: true
      }),

      // Enrollment statistics
      Promise.all([
        prisma.enrollment.count(),
        prisma.enrollment.count({ where: { completedAt: null } }), // Active (not completed)
        prisma.enrollment.count({ where: { completedAt: { not: null } } }) // Completed
      ]),

      // Certificate statistics
      prisma.certificate.count(),

      // Creator application statistics
      prisma.creatorApplication.groupBy({
        by: ['status'],
        _count: true
      }),

      // Recent users (last 7 days)
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Recent courses (last 30 days)
      prisma.course.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),

      // Recent enrollments (last 30 days)
      prisma.enrollment.count({
        where: {
          enrolledAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Format user stats
    const userMetrics = {
      total: userStats.reduce((sum, stat) => sum + stat._count, 0),
      byRole: {
        USER: userStats.find(s => s.role === 'USER')?._count || 0,
        CREATOR: userStats.find(s => s.role === 'CREATOR')?._count || 0,
        ADMIN: userStats.find(s => s.role === 'ADMIN')?._count || 0
      },
      recentSignups: recentUsers // Last 7 days
    };

    // Format course stats
    const courseMetrics = {
      total: courseStats.reduce((sum, stat) => sum + stat._count, 0),
      byStatus: {
        DRAFT: courseStats.find(s => s.status === 'DRAFT')?._count || 0,
        PENDING: courseStats.find(s => s.status === 'PENDING')?._count || 0,
        PUBLISHED: courseStats.find(s => s.status === 'PUBLISHED')?._count || 0,
        REJECTED: courseStats.find(s => s.status === 'REJECTED')?._count || 0
      },
      recentlyCreated: recentCourses // Last 30 days
    };

    // Format enrollment stats
    const enrollmentMetrics = {
      total: enrollmentStats[0],
      active: enrollmentStats[1], // Not completed yet
      completed: enrollmentStats[2],
      completionRate: enrollmentStats[0] > 0 
        ? ((enrollmentStats[2] / enrollmentStats[0]) * 100).toFixed(2)
        : '0.00',
      recentEnrollments: recentEnrollments // Last 30 days
    };

    // Format certificate stats
    const certificateMetrics = {
      total: certificateStats,
      issuanceRate: enrollmentStats[2] > 0
        ? ((certificateStats / enrollmentStats[2]) * 100).toFixed(2)
        : '0.00'
    };

    // Format application stats
    const applicationMetrics = {
      total: applicationStats.reduce((sum, stat) => sum + stat._count, 0),
      byStatus: {
        PENDING: applicationStats.find(s => s.status === 'PENDING')?._count || 0,
        APPROVED: applicationStats.find(s => s.status === 'APPROVED')?._count || 0,
        REJECTED: applicationStats.find(s => s.status === 'REJECTED')?._count || 0
      }
    };

    logger.info('Dashboard metrics retrieved successfully');

    return {
      users: userMetrics,
      courses: courseMetrics,
      enrollments: enrollmentMetrics,
      certificates: certificateMetrics,
      applications: applicationMetrics,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    logger.error('Error fetching dashboard metrics', { error: error.message });
    throw new Error('Failed to fetch dashboard metrics');
  }
};

/**
 * Get growth analytics (month-over-month)
 * @returns {Promise<object>} Growth metrics
 */
export const getGrowthAnalytics = async () => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
      currentMonthUsers,
      previousMonthUsers,
      currentMonthCourses,
      previousMonthCourses,
      currentMonthEnrollments,
      previousMonthEnrollments,
      currentMonthCertificates,
      previousMonthCertificates
    ] = await Promise.all([
      // Users - last 30 days
      prisma.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      // Users - previous 30 days
      prisma.user.count({
        where: { 
          createdAt: { 
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),
      // Courses - last 30 days
      prisma.course.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      // Courses - previous 30 days
      prisma.course.count({
        where: { 
          createdAt: { 
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),
      // Enrollments - last 30 days
      prisma.enrollment.count({
        where: { enrolledAt: { gte: thirtyDaysAgo } }
      }),
      // Enrollments - previous 30 days
      prisma.enrollment.count({
        where: { 
          enrolledAt: { 
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      }),
      // Certificates - last 30 days
      prisma.certificate.count({
        where: { issuedAt: { gte: thirtyDaysAgo } }
      }),
      // Certificates - previous 30 days
      prisma.certificate.count({
        where: { 
          issuedAt: { 
            gte: sixtyDaysAgo,
            lt: thirtyDaysAgo
          }
        }
      })
    ]);

    const calculateGrowthRate = (current, previous) => {
      if (previous === 0) {
        return current > 0 ? '+100.00%' : '0.00%';
      }
      const rate = ((current - previous) / previous * 100).toFixed(2);
      const sign = rate >= 0 ? '+' : '';
      return `${sign}${rate}%`;
    };

    return {
      users: {
        current: currentMonthUsers,
        previous: previousMonthUsers,
        growth: currentMonthUsers - previousMonthUsers,
        growthRate: calculateGrowthRate(currentMonthUsers, previousMonthUsers)
      },
      courses: {
        current: currentMonthCourses,
        previous: previousMonthCourses,
        growth: currentMonthCourses - previousMonthCourses,
        growthRate: calculateGrowthRate(currentMonthCourses, previousMonthCourses)
      },
      enrollments: {
        current: currentMonthEnrollments,
        previous: previousMonthEnrollments,
        growth: currentMonthEnrollments - previousMonthEnrollments,
        growthRate: calculateGrowthRate(currentMonthEnrollments, previousMonthEnrollments)
      },
      certificates: {
        current: currentMonthCertificates,
        previous: previousMonthCertificates,
        growth: currentMonthCertificates - previousMonthCertificates,
        growthRate: calculateGrowthRate(currentMonthCertificates, previousMonthCertificates)
      }
    };
  } catch (error) {
    logger.error('Error fetching growth analytics', { error: error.message });
    throw new Error('Failed to fetch growth analytics');
  }
};

/**
 * Get top performing courses
 * @param {number} limit - Number of courses to return
 * @returns {Promise<Array>} Top courses by enrollment
 */
export const getTopCourses = async (limit = 10) => {
  try {
    const topCourses = await prisma.course.findMany({
      where: {
        status: 'PUBLISHED'
      },
      select: {
        id: true,
        title: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            certificates: true
          }
        },
        enrollments: {
          select: {
            progress: true
          }
        }
      },
      orderBy: {
        enrollments: {
          _count: 'desc'
        }
      },
      take: limit
    });

    return {
      courses: topCourses.map(course => {
        const completionRate = course._count.enrollments > 0
          ? ((course._count.certificates / course._count.enrollments) * 100).toFixed(1)
          : '0.0';
        
        const avgProgress = course.enrollments.length > 0
          ? (course.enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / course.enrollments.length).toFixed(1)
          : '0.0';

        return {
          id: course.id,
          title: course.title,
          creator: {
            name: course.creator.name,
            email: course.creator.email
          },
          enrollmentCount: course._count.enrollments,
          completionRate: `${completionRate}%`,
          averageProgress: `${avgProgress}%`
        };
      })
    };
  } catch (error) {
    logger.error('Error fetching top courses', { error: error.message });
    throw new Error('Failed to fetch top courses');
  }
};

/**
 * Get platform activity summary (recent actions)
 * @param {number} limit - Number of activities to return
 * @returns {Promise<object>} Recent activities
 */
export const getRecentActivity = async (limit = 20) => {
  try {
    const [recentCourses, recentEnrollments, recentCertificates] = await Promise.all([
      // Recent course submissions (published)
      prisma.course.findMany({
        where: {
          status: 'PUBLISHED',
          publishedAt: { not: null }
        },
        select: {
          id: true,
          title: true,
          publishedAt: true,
          creator: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { publishedAt: 'desc' },
        take: Math.ceil(limit / 3)
      }),

      // Recent enrollments
      prisma.enrollment.findMany({
        select: {
          id: true,
          enrolledAt: true,
          user: {
            select: {
              id: true,
              name: true
            }
          },
          course: {
            select: {
              id: true,
              title: true
            }
          }
        },
        orderBy: { enrolledAt: 'desc' },
        take: Math.ceil(limit / 3)
      }),

      // Recent certificates
      prisma.certificate.findMany({
        select: {
          id: true,
          issuedAt: true,
          enrollment: {
            select: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              },
              course: {
                select: {
                  id: true,
                  title: true
                }
              }
            }
          }
        },
        orderBy: { issuedAt: 'desc' },
        take: Math.ceil(limit / 3)
      })
    ]);

    // Combine and format activities
    const activities = [
      ...recentCourses.map(course => ({
        id: `course-${course.id}`,
        type: 'course_published',
        timestamp: course.publishedAt,
        description: `New course '${course.title}' was published`,
        metadata: {
          courseId: course.id
        }
      })),
      ...recentEnrollments.map(enrollment => ({
        id: `enrollment-${enrollment.id}`,
        type: 'enrollment',
        timestamp: enrollment.enrolledAt,
        description: `${enrollment.user.name} enrolled in ${enrollment.course.title}`,
        metadata: {
          userId: enrollment.user.id,
          courseId: enrollment.course.id
        }
      })),
      ...recentCertificates.map(cert => ({
        id: `certificate-${cert.id}`,
        type: 'completion',
        timestamp: cert.issuedAt,
        description: `${cert.enrollment.user.name} completed ${cert.enrollment.course.title}`,
        metadata: {
          userId: cert.enrollment.user.id,
          courseId: cert.enrollment.course.id
        }
      }))
    ];

    // Sort by timestamp descending and limit
    return {
      activities: activities
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit)
    };
  } catch (error) {
    logger.error('Error fetching recent activity', { error: error.message });
    throw new Error('Failed to fetch recent activity');
  }
};

export default {
  getDashboardMetrics,
  getGrowthAnalytics,
  getTopCourses,
  getRecentActivity
};
