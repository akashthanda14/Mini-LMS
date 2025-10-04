/**
 * Enrollment and Progress Integration Test
 * 
 * Tests:
 * 1. Login as learner
 * 2. Get published courses
 * 3. Enroll in a course
 * 4. Check enrollment status
 * 5. Mark first lesson complete
 * 6. Mark second lesson complete
 * 7. Check progress percentage
 * 8. Complete all remaining lessons
 * 9. Verify 100% completion
 * 10. Check /progress shows all enrollments
 */

const API_BASE = 'http://localhost:4000/api';

// Test credentials
const LEARNER = {
  emailOrPhone: 'john@example.com',
  password: 'password123'
};

let authToken = '';
let courseId = '';
let lessonIds = [];
let enrollmentId = '';

// Helper: Make API request
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...options.headers
  };

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();
  return { status: response.status, data };
}

// Test 1: Login as learner
async function testLogin() {
  console.log('\n1. Testing Login as Learner...');
  
  const { status, data } = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(LEARNER)
  });

  if (status === 200 && data.success && data.token) {
    authToken = data.token;
    console.log('✅ Login successful');
    console.log(`   Role: ${data.user.role}`);
    return true;
  }

  console.log('❌ Login failed:', data);
  return false;
}

// Test 2: Get published courses
async function testGetPublishedCourses() {
  console.log('\n2. Getting Published Courses...');
  
  const { status, data } = await apiRequest('/courses');

  if (status === 200 && data.success && data.courses) {
    const publishedCourses = data.courses.filter(c => c.status === 'PUBLISHED');
    
    if (publishedCourses.length > 0) {
      courseId = publishedCourses[0].id;
      console.log(`✅ Found ${publishedCourses.length} published course(s)`);
      console.log(`   Selected course: ${publishedCourses[0].title}`);
      console.log(`   Course ID: ${courseId}`);
      return true;
    }

    console.log('⚠️  No published courses found');
    return false;
  }

  console.log('❌ Failed to get courses:', data);
  return false;
}

// Test 3: Enroll in course
async function testEnrollInCourse() {
  console.log('\n3. Enrolling in Course...');
  
  const { status, data } = await apiRequest(`/courses/${courseId}/enroll`, {
    method: 'POST'
  });

  if (status === 201 && data.success && data.data.enrollment) {
    enrollmentId = data.data.enrollment.id;
    console.log('✅ Successfully enrolled');
    console.log(`   Enrollment ID: ${enrollmentId}`);
    console.log(`   Initial progress: ${data.data.enrollment.progress}%`);
    return true;
  }

  console.log('❌ Enrollment failed:', data);
  return false;
}

// Test 4: Check enrollment status
async function testCheckEnrollmentStatus() {
  console.log('\n4. Checking Enrollment Status...');
  
  const { status, data } = await apiRequest(`/courses/${courseId}/enrollment`);

  if (status === 200 && data.success && data.data.enrolled) {
    console.log('✅ Enrollment confirmed');
    console.log(`   Progress: ${data.data.enrollment.progress}%`);
    console.log(`   Enrolled at: ${new Date(data.data.enrollment.enrolledAt).toLocaleString()}`);
    return true;
  }

  console.log('❌ Enrollment status check failed:', data);
  return false;
}

// Test 5: Get course with lessons
async function testGetCourseLessons() {
  console.log('\n5. Getting Course Lessons...');
  
  const { status, data } = await apiRequest(`/courses/${courseId}`);

  if (status === 200 && data.success && data.course) {
    lessonIds = data.course.lessons.map(l => l.id);
    console.log(`✅ Retrieved ${lessonIds.length} lessons`);
    console.log(`   Enrollment status: ${data.course.isEnrolled ? 'Enrolled' : 'Not enrolled'}`);
    if (data.course.enrollment) {
      console.log(`   Current progress: ${data.course.enrollment.progress}%`);
    }
    return lessonIds.length > 0;
  }

  console.log('❌ Failed to get lessons:', data);
  return false;
}

// Test 6: Mark first lesson complete
async function testMarkFirstLessonComplete() {
  console.log('\n6. Marking First Lesson Complete...');
  
  if (lessonIds.length === 0) {
    console.log('❌ No lessons available');
    return false;
  }

  const { status, data } = await apiRequest(`/lessons/${lessonIds[0]}/complete`, {
    method: 'POST'
  });

  if (status === 200 && data.success) {
    console.log('✅ First lesson marked complete');
    console.log(`   Lesson: ${data.data.lessonProgress.lesson.title}`);
    console.log(`   Course progress: ${data.data.courseProgress.progress}%`);
    console.log(`   Completed: ${data.data.lessonProgress.completed}`);
    return true;
  }

  console.log('❌ Failed to mark lesson complete:', data);
  return false;
}

// Test 7: Mark second lesson complete
async function testMarkSecondLessonComplete() {
  console.log('\n7. Marking Second Lesson Complete...');
  
  if (lessonIds.length < 2) {
    console.log('⚠️  Only one lesson in course, skipping');
    return true;
  }

  const { status, data } = await apiRequest(`/lessons/${lessonIds[1]}/complete`, {
    method: 'POST'
  });

  if (status === 200 && data.success) {
    console.log('✅ Second lesson marked complete');
    console.log(`   Lesson: ${data.data.lessonProgress.lesson.title}`);
    console.log(`   Course progress: ${data.data.courseProgress.progress}%`);
    return true;
  }

  console.log('❌ Failed to mark lesson complete:', data);
  return false;
}

// Test 8: Test idempotency (mark same lesson twice)
async function testIdempotency() {
  console.log('\n8. Testing Idempotency (Mark Same Lesson Twice)...');
  
  if (lessonIds.length === 0) {
    console.log('❌ No lessons available');
    return false;
  }

  // Mark first lesson again
  const { status, data } = await apiRequest(`/lessons/${lessonIds[0]}/complete`, {
    method: 'POST'
  });

  if (status === 200 && data.success) {
    console.log('✅ Idempotency working - no error on duplicate');
    console.log(`   Progress still: ${data.data.courseProgress.progress}%`);
    return true;
  }

  console.log('❌ Idempotency test failed:', data);
  return false;
}

// Test 9: Complete all remaining lessons
async function testCompleteAllLessons() {
  console.log('\n9. Completing All Remaining Lessons...');
  
  let allCompleted = true;
  let finalProgress = 0;

  for (let i = 0; i < lessonIds.length; i++) {
    const { status, data } = await apiRequest(`/lessons/${lessonIds[i]}/complete`, {
      method: 'POST'
    });

    if (status === 200 && data.success) {
      finalProgress = data.data.courseProgress.progress;
      process.stdout.write(`\r   Completed ${i + 1}/${lessonIds.length} lessons (${finalProgress}%)${' '.repeat(20)}`);
    } else {
      allCompleted = false;
      console.log(`\n❌ Failed to complete lesson ${i + 1}`);
    }
  }

  console.log(); // New line after progress
  
  if (allCompleted) {
    console.log('✅ All lessons completed');
    console.log(`   Final progress: ${finalProgress}%`);
    return true;
  }

  return false;
}

// Test 10: Verify 100% completion
async function testVerify100Completion() {
  console.log('\n10. Verifying 100% Completion...');
  
  const { status, data } = await apiRequest(`/courses/${courseId}/progress`);

  if (status === 200 && data.success && data.data) {
    const progress = data.data.progress;
    const isCompleted = progress === 100;
    
    console.log(`✅ Progress verification complete`);
    console.log(`   Progress: ${progress}%`);
    console.log(`   Completed: ${isCompleted ? 'Yes' : 'No'}`);
    console.log(`   Completed lessons: ${data.data.completedLessons}/${data.data.totalLessons}`);
    
    if (data.data.completedAt) {
      console.log(`   Completed at: ${new Date(data.data.completedAt).toLocaleString()}`);
    }
    
    return isCompleted;
  }

  console.log('❌ Failed to verify completion:', data);
  return false;
}

// Test 11: Get all enrollments
async function testGetAllEnrollments() {
  console.log('\n11. Getting All Enrollments...');
  
  const { status, data } = await apiRequest('/progress');

  if (status === 200 && data.success && data.data.enrollments) {
    const enrollments = data.data.enrollments;
    console.log(`✅ Retrieved ${enrollments.length} enrollment(s)`);
    console.log(`   Total enrollments: ${data.data.totalEnrollments}`);
    console.log(`   Completed courses: ${data.data.completedCourses}`);
    
    enrollments.forEach((enrollment, index) => {
      console.log(`\n   Course ${index + 1}:`);
      console.log(`     Title: ${enrollment.course.title}`);
      console.log(`     Progress: ${enrollment.progress}%`);
      console.log(`     Completed: ${enrollment.isCompleted ? 'Yes' : 'No'}`);
      console.log(`     Lessons: ${enrollment.completedLessons}/${enrollment.totalLessons}`);
    });
    
    return true;
  }

  console.log('❌ Failed to get enrollments:', data);
  return false;
}

// Test 12: Try to enroll again (should fail)
async function testDuplicateEnrollment() {
  console.log('\n12. Testing Duplicate Enrollment Prevention...');
  
  const { status, data } = await apiRequest(`/courses/${courseId}/enroll`, {
    method: 'POST'
  });

  if (status === 409 && !data.success) {
    console.log('✅ Duplicate enrollment correctly prevented');
    console.log(`   Message: ${data.message}`);
    return true;
  }

  console.log('❌ Duplicate enrollment prevention failed:', data);
  return false;
}

// Run all tests
async function runTests() {
  console.log('=======================================================');
  console.log('Enrollment and Progress Integration Test');
  console.log('=======================================================');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  const tests = [
    { name: 'Login as Learner', fn: testLogin },
    { name: 'Get Published Courses', fn: testGetPublishedCourses },
    { name: 'Enroll in Course', fn: testEnrollInCourse },
    { name: 'Check Enrollment Status', fn: testCheckEnrollmentStatus },
    { name: 'Get Course Lessons', fn: testGetCourseLessons },
    { name: 'Mark First Lesson Complete', fn: testMarkFirstLessonComplete },
    { name: 'Mark Second Lesson Complete', fn: testMarkSecondLessonComplete },
    { name: 'Test Idempotency', fn: testIdempotency },
    { name: 'Complete All Lessons', fn: testCompleteAllLessons },
    { name: 'Verify 100% Completion', fn: testVerify100Completion },
    { name: 'Get All Enrollments', fn: testGetAllEnrollments },
    { name: 'Test Duplicate Enrollment', fn: testDuplicateEnrollment }
  ];

  for (const test of tests) {
    results.total++;
    
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} threw error:`, error.message);
      results.failed++;
    }
  }

  // Print summary
  console.log('\n=======================================================');
  console.log('Test Summary');
  console.log('=======================================================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('=======================================================\n');

  if (results.failed === 0) {
    console.log('🎉 All tests passed! Enrollment and progress system working perfectly.\n');
  } else {
    console.log('⚠️  Some tests failed. Please check the output above.\n');
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
