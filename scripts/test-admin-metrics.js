#!/usr/bin/env node
// scripts/test-admin-metrics.js
// Test script for admin metrics endpoints

import 'dotenv/config';

const BASE_URL = process.env.BASE_URL || 'http://localhost:4000';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  data: (msg) => console.log(`${colors.cyan}📊 ${msg}${colors.reset}`)
};

async function apiCall(method, endpoint, token, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

async function testAdminMetrics() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 TESTING ADMIN METRICS API');
  console.log('='.repeat(60) + '\n');

  let adminToken;

  // Step 1: Admin login
  log.info('Step 1: Logging in as admin...');
  try {
    const loginRes = await apiCall('POST', '/api/auth/login', null, {
      emailOrPhone: process.env.ADMIN_EMAIL || 'admin@example.com',
      password: process.env.ADMIN_PASSWORD || 'AdminPassword123'
    });

    if (loginRes.data.success && loginRes.data.token) {
      adminToken = loginRes.data.token;
      log.success('Admin login successful');
      log.data(`Role: ${loginRes.data.user?.role || 'ADMIN'}`);
    } else {
      log.error('Admin login failed: ' + loginRes.data.message);
      log.warn('Please ensure admin user exists in database with correct credentials');
      process.exit(1);
    }
  } catch (error) {
    log.error('Admin login error: ' + error.message);
    process.exit(1);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Step 2: Get comprehensive metrics
  log.info('Step 2: Fetching comprehensive metrics...');
  try {
    const metricsRes = await apiCall('GET', '/api/admin/metrics', adminToken);

    if (metricsRes.data.success) {
      log.success('Comprehensive metrics retrieved');
      const m = metricsRes.data.data;
      
      console.log('\n📊 METRICS SUMMARY:');
      console.log(`  Users: ${m.users.total} (Recent: ${m.users.recentSignups})`);
      console.log(`    - USER: ${m.users.byRole.USER}`);
      console.log(`    - CREATOR: ${m.users.byRole.CREATOR}`);
      console.log(`    - ADMIN: ${m.users.byRole.ADMIN}`);
      
      console.log(`  Courses: ${m.courses.total} (Recent: ${m.courses.recentlyCreated})`);
      console.log(`    - DRAFT: ${m.courses.byStatus.DRAFT}`);
      console.log(`    - PENDING: ${m.courses.byStatus.PENDING}`);
      console.log(`    - PUBLISHED: ${m.courses.byStatus.PUBLISHED}`);
      console.log(`    - REJECTED: ${m.courses.byStatus.REJECTED}`);
      
      console.log(`  Enrollments: ${m.enrollments.total}`);
      console.log(`    - Active: ${m.enrollments.active}`);
      console.log(`    - Completed: ${m.enrollments.completed}`);
      console.log(`    - Completion Rate: ${m.enrollments.completionRate}%`);
      
      console.log(`  Certificates: ${m.certificates.total}`);
      console.log(`    - Issuance Rate: ${m.certificates.issuanceRate}%`);
      
      console.log(`  Creator Applications: ${m.applications.total}`);
      console.log(`    - PENDING: ${m.applications.byStatus.PENDING}`);
      console.log(`    - APPROVED: ${m.applications.byStatus.APPROVED}`);
      console.log(`    - REJECTED: ${m.applications.byStatus.REJECTED}`);
    } else {
      log.error('Failed to fetch metrics: ' + metricsRes.data.message);
    }
  } catch (error) {
    log.error('Metrics fetch error: ' + error.message);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Step 3: Get summary (lightweight)
  log.info('Step 3: Fetching quick summary...');
  try {
    const summaryRes = await apiCall('GET', '/api/admin/metrics/summary', adminToken);

    if (summaryRes.data.success) {
      log.success('Summary retrieved successfully');
    } else {
      log.error('Failed to fetch summary: ' + summaryRes.data.message);
    }
  } catch (error) {
    log.error('Summary fetch error: ' + error.message);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Step 4: Get growth analytics
  log.info('Step 4: Fetching growth analytics...');
  try {
    const growthRes = await apiCall('GET', '/api/admin/metrics/growth', adminToken);

    if (growthRes.data.success) {
      log.success('Growth analytics retrieved');
      const g = growthRes.data.data;
      
      console.log('\n📈 GROWTH (Last 30 days vs Previous 30 days):');
      console.log(`  Users: ${g.users.current} (${g.users.growthPercentage > 0 ? '+' : ''}${g.users.growthPercentage}%)`);
      console.log(`  Courses: ${g.courses.current} (${g.courses.growthPercentage > 0 ? '+' : ''}${g.courses.growthPercentage}%)`);
      console.log(`  Enrollments: ${g.enrollments.current} (${g.enrollments.growthPercentage > 0 ? '+' : ''}${g.enrollments.growthPercentage}%)`);
    } else {
      log.error('Failed to fetch growth: ' + growthRes.data.message);
    }
  } catch (error) {
    log.error('Growth fetch error: ' + error.message);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Step 5: Get top courses
  log.info('Step 5: Fetching top 5 courses...');
  try {
    const topCoursesRes = await apiCall('GET', '/api/admin/metrics/top-courses?limit=5', adminToken);

    if (topCoursesRes.data.success) {
      log.success(`Top ${topCoursesRes.data.count} courses retrieved`);
      
      if (topCoursesRes.data.count > 0) {
        console.log('\n🏆 TOP COURSES:');
        topCoursesRes.data.data.forEach((course, index) => {
          console.log(`  ${index + 1}. "${course.title}" by ${course.creator.name}`);
          console.log(`     Enrollments: ${course.enrollmentCount} | Completion: ${course.completionRate}%`);
        });
      } else {
        log.warn('No published courses found');
      }
    } else {
      log.error('Failed to fetch top courses: ' + topCoursesRes.data.message);
    }
  } catch (error) {
    log.error('Top courses fetch error: ' + error.message);
  }

  console.log('\n' + '-'.repeat(60) + '\n');

  // Step 6: Get recent activity
  log.info('Step 6: Fetching recent activity...');
  try {
    const activityRes = await apiCall('GET', '/api/admin/metrics/activity?limit=10', adminToken);

    if (activityRes.data.success) {
      log.success(`${activityRes.data.count} recent activities retrieved`);
      
      if (activityRes.data.count > 0) {
        console.log('\n🕐 RECENT ACTIVITY:');
        activityRes.data.data.slice(0, 5).forEach((activity) => {
          const time = new Date(activity.timestamp).toLocaleString();
          console.log(`  [${activity.type}] ${activity.description}`);
          console.log(`    Time: ${time}`);
        });
      } else {
        log.warn('No recent activity found');
      }
    } else {
      log.error('Failed to fetch activity: ' + activityRes.data.message);
    }
  } catch (error) {
    log.error('Activity fetch error: ' + error.message);
  }

  console.log('\n' + '='.repeat(60));
  log.success('Admin metrics API test completed!');
  console.log('='.repeat(60) + '\n');
}

// Run tests
testAdminMetrics().catch(error => {
  log.error('Test suite error: ' + error.message);
  console.error(error);
  process.exit(1);
});
