/**
 * Lesson CRUD & Cloudinary Upload Test Suite
 * 
 * Tests the complete flow:
 * 1. Get upload credentials
 * 2. Simulate Cloudinary upload
 * 3. Create lesson with Cloudinary URL
 * 4. Get, update, delete lessons
 * 5. Validation and permission checks
 */

const BASE_URL = 'http://localhost:4000/api';

// Test data
let creatorToken, learnerToken, adminToken;
let courseId, lessonId;
let testLessonIds = [];

// Mock Cloudinary URL (simulating successful upload)
const mockCloudinaryUrl = 'https://res.cloudinary.com/dumurymxf/video/upload/v1696345678/courses/test-course/lessons/lesson_1.mp4';

/**
 * Helper function to make API requests
 */
async function makeRequest(method, endpoint, data = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const responseData = await response.json();

  return {
    status: response.status,
    data: responseData,
  };
}

/**
 * Test 1: Setup - Login all users
 */
async function test1_loginUsers() {
  console.log('\n📝 Test 1: Setup - Login All Users');

  // Login Creator
  const creatorLogin = await makeRequest('POST', '/auth/login', {
    email: 'sarah@example.com',
    password: 'password123',
  });

  if (creatorLogin.status !== 200) {
    console.log('❌ Creator login failed');
    return false;
  }

  creatorToken = creatorLogin.data.data.token;

  // Login Learner
  const learnerLogin = await makeRequest('POST', '/auth/login', {
    email: 'john@example.com',
    password: 'password123',
  });

  if (learnerLogin.status !== 200) {
    console.log('❌ Learner login failed');
    return false;
  }

  learnerToken = learnerLogin.data.data.token;

  // Login Admin
  const adminLogin = await makeRequest('POST', '/auth/login', {
    email: 'admin@microcourses.com',
    password: 'admin123',
  });

  if (adminLogin.status !== 200) {
    console.log('❌ Admin login failed');
    return false;
  }

  adminToken = adminLogin.data.data.token;

  console.log('✅ All users logged in successfully');
  return true;
}

/**
 * Test 2: Create a DRAFT course for testing
 */
async function test2_createCourse() {
  console.log('\n📝 Test 2: Create DRAFT Course');

  const response = await makeRequest(
    'POST',
    '/courses',
    {
      title: 'React Advanced Patterns',
      description: 'Learn advanced React patterns including hooks, context, and performance optimization techniques.',
      category: 'Web Development',
      level: 'ADVANCED',
      duration: 180,
    },
    creatorToken
  );

  if (response.status !== 201) {
    console.log('❌ Course creation failed:', response.data);
    return false;
  }

  courseId = response.data.data.id;
  console.log(`✅ Course created: ${courseId}`);
  return true;
}

/**
 * Test 3: Get upload credentials
 */
async function test3_getUploadCredentials() {
  console.log('\n📝 Test 3: Get Upload Credentials');

  const response = await makeRequest(
    'POST',
    `/courses/${courseId}/lessons/upload`,
    {},
    creatorToken
  );

  if (response.status !== 200) {
    console.log('❌ Failed to get upload credentials:', response.data);
    return false;
  }

  const { uploadUrl, signature, timestamp, apiKey, publicId, cloudName } = response.data.data;

  if (!uploadUrl || !signature || !apiKey) {
    console.log('❌ Missing required credentials');
    return false;
  }

  console.log('✅ Upload credentials received');
  console.log(`   Upload URL: ${uploadUrl}`);
  console.log(`   Public ID: ${publicId}`);
  return true;
}

/**
 * Test 4: Non-creator cannot get upload credentials
 */
async function test4_uploadCredentialsPermission() {
  console.log('\n📝 Test 4: Non-Creator Cannot Get Upload Credentials');

  const response = await makeRequest(
    'POST',
    `/courses/${courseId}/lessons/upload`,
    {},
    learnerToken
  );

  if (response.status === 403) {
    console.log('✅ Upload blocked for non-creator');
    return true;
  }

  console.log('❌ Learner should not get upload credentials');
  return false;
}

/**
 * Test 5: Create lesson with Cloudinary URL
 */
async function test5_createLesson() {
  console.log('\n📝 Test 5: Create Lesson with Cloudinary URL');

  const response = await makeRequest(
    'POST',
    `/courses/${courseId}/lessons`,
    {
      title: 'Introduction to Advanced Hooks',
      videoUrl: mockCloudinaryUrl,
      order: 1,
      duration: 600,
    },
    creatorToken
  );

  if (response.status !== 201) {
    console.log('❌ Lesson creation failed:', response.data);
    return false;
  }

  lessonId = response.data.data.id;
  testLessonIds.push(lessonId);

  console.log(`✅ Lesson created: ${lessonId}`);
  console.log(`   Order: ${response.data.data.order}`);
  return true;
}

/**
 * Test 6: Create second lesson
 */
async function test6_createSecondLesson() {
  console.log('\n📝 Test 6: Create Second Lesson');

  const response = await makeRequest(
    'POST',
    `/courses/${courseId}/lessons`,
    {
      title: 'useState and useReducer Deep Dive',
      videoUrl: mockCloudinaryUrl.replace('lesson_1', 'lesson_2'),
      order: 2,
      duration: 720,
    },
    creatorToken
  );

  if (response.status !== 201) {
    console.log('❌ Second lesson creation failed:', response.data);
    return false;
  }

  testLessonIds.push(response.data.data.id);

  console.log('✅ Second lesson created');
  return true;
}

/**
 * Test 7: Cannot create lesson with duplicate order
 */
async function test7_duplicateOrder() {
  console.log('\n📝 Test 7: Duplicate Order Prevention');

  const response = await makeRequest(
    'POST',
    `/courses/${courseId}/lessons`,
    {
      title: 'Duplicate Order Lesson',
      videoUrl: mockCloudinaryUrl.replace('lesson_1', 'lesson_3'),
      order: 1, // Same as first lesson
      duration: 500,
    },
    creatorToken
  );

  if (response.status === 400 && response.data.message.includes('already exists')) {
    console.log('✅ Duplicate order blocked correctly');
    return true;
  }

  console.log('❌ Duplicate order should be rejected');
  return false;
}

/**
 * Test 8: Get lessons for course
 */
async function test8_getLessons() {
  console.log('\n📝 Test 8: Get Course Lessons');

  const response = await makeRequest(
    'GET',
    `/courses/${courseId}/lessons`,
    null,
    creatorToken
  );

  if (response.status !== 200) {
    console.log('❌ Failed to get lessons:', response.data);
    return false;
  }

  const lessons = response.data.data;

  if (lessons.length !== 2) {
    console.log(`❌ Expected 2 lessons, got ${lessons.length}`);
    return false;
  }

  if (lessons[0].order !== 1 || lessons[1].order !== 2) {
    console.log('❌ Lessons not ordered correctly');
    return false;
  }

  console.log(`✅ Retrieved ${lessons.length} lessons in correct order`);
  return true;
}

/**
 * Test 9: Learner cannot access DRAFT course lessons
 */
async function test9_learnerAccessDraft() {
  console.log('\n📝 Test 9: Learner Cannot Access DRAFT Course Lessons');

  const response = await makeRequest(
    'GET',
    `/courses/${courseId}/lessons`,
    null,
    learnerToken
  );

  if (response.status === 403) {
    console.log('✅ Access denied for learner on DRAFT course');
    return true;
  }

  console.log('❌ Learner should not access DRAFT course lessons');
  return false;
}

/**
 * Test 10: Update lesson title and order
 */
async function test10_updateLesson() {
  console.log('\n📝 Test 10: Update Lesson');

  const response = await makeRequest(
    'PATCH',
    `/lessons/${lessonId}`,
    {
      title: 'Introduction to Advanced Hooks (Updated)',
      order: 1, // Keep same order
    },
    creatorToken
  );

  if (response.status !== 200) {
    console.log('❌ Lesson update failed:', response.data);
    return false;
  }

  console.log('✅ Lesson updated successfully');
  console.log(`   New title: ${response.data.data.title}`);
  return true;
}

/**
 * Test 11: Cannot update to duplicate order
 */
async function test11_updateToDuplicateOrder() {
  console.log('\n📝 Test 11: Cannot Update to Duplicate Order');

  const response = await makeRequest(
    'PATCH',
    `/lessons/${lessonId}`,
    {
      order: 2, // Already taken by second lesson
    },
    creatorToken
  );

  if (response.status === 400 && response.data.message.includes('already exists')) {
    console.log('✅ Duplicate order update blocked');
    return true;
  }

  console.log('❌ Should not allow duplicate order');
  return false;
}

/**
 * Test 12: Submit course for review
 */
async function test12_submitCourse() {
  console.log('\n📝 Test 12: Submit Course for Review');

  const response = await makeRequest(
    'POST',
    `/courses/${courseId}/submit`,
    {},
    creatorToken
  );

  if (response.status !== 200) {
    console.log('❌ Course submission failed:', response.data);
    return false;
  }

  console.log('✅ Course submitted (PENDING status)');
  return true;
}

/**
 * Test 13: Cannot add lesson to PENDING course
 */
async function test13_cannotAddToPending() {
  console.log('\n📝 Test 13: Cannot Add Lesson to PENDING Course');

  const response = await makeRequest(
    'POST',
    `/courses/${courseId}/lessons`,
    {
      title: 'useContext and useRef',
      videoUrl: mockCloudinaryUrl.replace('lesson_1', 'lesson_4'),
      order: 3,
      duration: 550,
    },
    creatorToken
  );

  if (response.status === 400 && response.data.message.includes('non-draft')) {
    console.log('✅ Adding lesson to PENDING course blocked');
    return true;
  }

  console.log('❌ Should not allow adding lessons to PENDING course');
  return false;
}

/**
 * Test 14: Cannot update lesson in PENDING course
 */
async function test14_cannotUpdatePending() {
  console.log('\n📝 Test 14: Cannot Update Lesson in PENDING Course');

  const response = await makeRequest(
    'PATCH',
    `/lessons/${lessonId}`,
    {
      title: 'New Title',
    },
    creatorToken
  );

  if (response.status === 403 && response.data.message.includes('non-draft')) {
    console.log('✅ Updating lesson in PENDING course blocked');
    return true;
  }

  console.log('❌ Should not allow updating lessons in PENDING course');
  return false;
}

/**
 * Test 15: Cannot delete lesson from PENDING course
 */
async function test15_cannotDeletePending() {
  console.log('\n📝 Test 15: Cannot Delete Lesson from PENDING Course');

  const response = await makeRequest(
    'DELETE',
    `/lessons/${lessonId}`,
    null,
    creatorToken
  );

  if (response.status === 403 && response.data.message.includes('non-draft')) {
    console.log('✅ Deleting lesson from PENDING course blocked');
    return true;
  }

  console.log('❌ Should not allow deleting lessons from PENDING course');
  return false;
}

/**
 * Test 16: Publish course
 */
async function test16_publishCourse() {
  console.log('\n📝 Test 16: Admin Publishes Course');

  const response = await makeRequest(
    'POST',
    `/admin/courses/${courseId}/publish`,
    {},
    adminToken
  );

  if (response.status !== 200) {
    console.log('❌ Course publication failed:', response.data);
    return false;
  }

  console.log('✅ Course published');
  return true;
}

/**
 * Test 17: Learner can now access PUBLISHED course lessons
 */
async function test17_learnerAccessPublished() {
  console.log('\n📝 Test 17: Learner Can Access PUBLISHED Course Lessons');

  const response = await makeRequest(
    'GET',
    `/courses/${courseId}/lessons`,
    null,
    learnerToken
  );

  if (response.status !== 200) {
    console.log('❌ Learner access failed:', response.data);
    return false;
  }

  const lessons = response.data.data;

  console.log(`✅ Learner can access ${lessons.length} lessons`);
  return true;
}

/**
 * Test 18: Invalid video URL validation
 */
async function test18_invalidVideoUrl() {
  console.log('\n📝 Test 18: Invalid Video URL Validation');

  // Create new DRAFT course
  const courseRes = await makeRequest(
    'POST',
    '/courses',
    {
      title: 'Test Course for URL Validation',
      description: 'This course tests URL validation for lessons.',
    },
    creatorToken
  );

  const testCourseId = courseRes.data.data.id;

  // Try to create lesson with non-Cloudinary URL
  const response = await makeRequest(
    'POST',
    `/courses/${testCourseId}/lessons`,
    {
      title: 'Invalid URL Lesson',
      videoUrl: 'https://youtube.com/watch?v=abc123',
      order: 1,
      duration: 300,
    },
    creatorToken
  );

  // Cleanup
  await makeRequest('DELETE', `/courses/${testCourseId}`, null, creatorToken);

  if (response.status === 400 && response.data.message.includes('Cloudinary')) {
    console.log('✅ Non-Cloudinary URL blocked');
    return true;
  }

  console.log('❌ Should reject non-Cloudinary URLs');
  return false;
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('\n🚀 LESSON CRUD & CLOUDINARY UPLOAD TEST SUITE\n');
  console.log('Testing complete flow: Upload → Create → Manage → Permissions\n');
  console.log('======================================================================');

  const tests = [
    test1_loginUsers,
    test2_createCourse,
    test3_getUploadCredentials,
    test4_uploadCredentialsPermission,
    test5_createLesson,
    test6_createSecondLesson,
    test7_duplicateOrder,
    test8_getLessons,
    test9_learnerAccessDraft,
    test10_updateLesson,
    test11_updateToDuplicateOrder,
    test12_submitCourse,
    test13_cannotAddToPending,
    test14_cannotUpdatePending,
    test15_cannotDeletePending,
    test16_publishCourse,
    test17_learnerAccessPublished,
    test18_invalidVideoUrl,
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ Test error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n======================================================================');
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Lesson CRUD system is working perfectly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Test suite error:', error);
  process.exit(1);
});
