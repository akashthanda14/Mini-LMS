#!/usr/bin/env node
/**
 * Lesson CRUD Integration Test
 * Tests the complete flow with real API calls
 */

const BASE_URL = 'http://localhost:4000/api';

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, message = '') {
  const result = passed ? '✅' : '❌';
  console.log(`${result} ${name}`);
  if (message) console.log(`   ${message}`);
  
  testResults.tests.push({ name, passed, message });
  if (passed) testResults.passed++;
  else testResults.failed++;
}

async function request(method, path, body = null, token = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(`${BASE_URL}${path}`, options);
  const data = await response.json();
  
  return { status: response.status, data };
}

async function runTests() {
  console.log('\n🧪 LESSON CRUD INTEGRATION TEST\n');
  console.log('═'.repeat(60));
  
  let token, courseId, lessonId;
  
  try {
    // Test 1: Login
    console.log('\n📝 Authentication Tests');
    const login = await request('POST', '/auth/login', {
      emailOrPhone: 'sarah@example.com',
      password: 'password123'
    });
    
    logTest(
      'Login as Creator',
      login.status === 200 && login.data.token,
      login.status === 200 ? 'Token received' : `Status: ${login.status}`
    );
    
    if (login.status !== 200) {
      console.log('\n❌ Cannot proceed without authentication');
      return;
    }
    
    token = login.data.token;
    
    // Test 2: Create Course
    console.log('\n📝 Course Creation');
    const course = await request('POST', '/courses', {
      title: 'Lesson Test Course',
      description: 'A test course for lesson CRUD operations and video upload testing.'
    }, token);
    
    logTest(
      'Create DRAFT Course',
      course.status === 201 && (course.data.course?.id || course.data.data?.id),
      course.status === 201 
        ? `Course ID: ${course.data.course?.id || course.data.data?.id}` 
        : `Status: ${course.status}`
    );
    
    if (course.status !== 201) {
      console.log('\n❌ Cannot proceed without course');
      return;
    }
    
    courseId = course.data.course?.id || course.data.data?.id;
    
    // Test 3: Get Upload Credentials
    console.log('\n📝 Cloudinary Integration');
    const credentials = await request('POST', `/courses/${courseId}/lessons/upload`, {}, token);
    
    logTest(
      'Get Upload Credentials',
      credentials.status === 200 && credentials.data.data?.signature,
      credentials.status === 200 
        ? `Signature received, API Key: ${credentials.data.data.apiKey}` 
        : `Status: ${credentials.status}`
    );
    
    // Test 4: Create Lesson
    console.log('\n📝 Lesson Management');
    const lesson = await request('POST', `/courses/${courseId}/lessons`, {
      title: 'Test Lesson #1',
      videoUrl: 'https://res.cloudinary.com/dumurymxf/video/upload/v1696345678/test.mp4',
      order: 1,
      duration: 600
    }, token);
    
    logTest(
      'Create Lesson with Cloudinary URL',
      lesson.status === 201 && lesson.data.data?.id,
      lesson.status === 201 
        ? `Lesson ID: ${lesson.data.data.id}, Order: ${lesson.data.data.order}`
        : `Status: ${lesson.status} - ${lesson.data.message || ''}`
    );
    
    if (lesson.status === 201) {
      lessonId = lesson.data.data.id;
    }
    
    // Test 5: Create Second Lesson
    const lesson2 = await request('POST', `/courses/${courseId}/lessons`, {
      title: 'Test Lesson #2',
      videoUrl: 'https://res.cloudinary.com/dumurymxf/video/upload/v1696345679/test2.mp4',
      order: 2,
      duration: 720
    }, token);
    
    logTest(
      'Create Second Lesson',
      lesson2.status === 201,
      lesson2.status === 201 ? 'Order: 2' : `Status: ${lesson2.status}`
    );
    
    // Test 6: Duplicate Order (should fail)
    const lessonDup = await request('POST', `/courses/${courseId}/lessons`, {
      title: 'Duplicate Order Lesson',
      videoUrl: 'https://res.cloudinary.com/dumurymxf/video/upload/v1696345680/test3.mp4',
      order: 1,
      duration: 500
    }, token);
    
    logTest(
      'Duplicate Order Prevention',
      lessonDup.status === 400 && lessonDup.data.message?.includes('already exists'),
      lessonDup.status === 400 ? 'Correctly blocked' : `Status: ${lessonDup.status}`
    );
    
    // Test 7: Get Lessons
    console.log('\n📝 Lesson Retrieval');
    const lessons = await request('GET', `/courses/${courseId}/lessons`, null, token);
    
    logTest(
      'Get Course Lessons',
      lessons.status === 200 && Array.isArray(lessons.data.data) && lessons.data.data.length >= 2,
      lessons.status === 200 
        ? `Retrieved ${lessons.data.data?.length || 0} lessons`
        : `Status: ${lessons.status}`
    );
    
    // Test 8: Update Lesson
    if (lessonId) {
      const updateLesson = await request('PATCH', `/lessons/${lessonId}`, {
        title: 'Test Lesson #1 (Updated)'
      }, token);
      
      logTest(
        'Update Lesson Title',
        updateLesson.status === 200,
        updateLesson.status === 200 
          ? `New title: ${updateLesson.data.data.title}`
          : `Status: ${updateLesson.status}`
      );
    }
    
    // Test 9: Invalid Cloudinary URL
    console.log('\n📝 Validation Tests');
    const invalidUrl = await request('POST', `/courses/${courseId}/lessons`, {
      title: 'Invalid URL Lesson',
      videoUrl: 'https://youtube.com/watch?v=abc123',
      order: 3,
      duration: 300
    }, token);
    
    logTest(
      'Reject Non-Cloudinary URL',
      invalidUrl.status === 400,
      invalidUrl.status === 400 ? 'Validation working' : `Status: ${invalidUrl.status}`
    );
    
    // Test 10: Submit Course (change to PENDING)
    console.log('\n📝 Status Workflow');
    const submit = await request('POST', `/courses/${courseId}/submit`, {}, token);
    
    logTest(
      'Submit Course for Review',
      submit.status === 200,
      submit.status === 200 ? 'Status: PENDING' : `Status: ${submit.status}`
    );
    
    // Test 11: Try to add lesson to PENDING course (should fail)
    const pendingLesson = await request('POST', `/courses/${courseId}/lessons`, {
      title: 'Lesson on PENDING Course',
      videoUrl: 'https://res.cloudinary.com/dumurymxf/video/upload/v1696345681/test4.mp4',
      order: 4,
      duration: 400
    }, token);
    
    logTest(
      'Block Lesson Add to PENDING Course',
      pendingLesson.status === 400 && pendingLesson.data.message?.includes('non-draft'),
      pendingLesson.status === 400 ? 'Correctly blocked' : `Status: ${pendingLesson.status}`
    );
    
    // Test 12: Try to update lesson in PENDING course (should fail)
    if (lessonId) {
      const updatePending = await request('PATCH', `/lessons/${lessonId}`, {
        title: 'Try to Update'
      }, token);
      
      logTest(
        'Block Lesson Update in PENDING Course',
        updatePending.status === 403 && updatePending.data.message?.includes('non-draft'),
        updatePending.status === 403 ? 'Correctly blocked' : `Status: ${updatePending.status}`
      );
    }
    
    // Cleanup
    console.log('\n📝 Cleanup');
    // Note: Can't delete PENDING course directly, would need admin to reject it first
    console.log('   ℹ️  Course left in PENDING state (cleanup requires admin action)');
    
  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    testResults.failed++;
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`Total Tests: ${testResults.tests.length}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
  
  if (testResults.failed === 0) {
    console.log('\n🎉 All tests passed! Lesson CRUD system is working correctly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Review the output above.\n');
  }
  
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
