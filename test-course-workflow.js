// test-course-workflow.js
// Complete course workflow test: Create → Add Lessons → Submit → Admin Review → Publish

const BASE_URL = 'http://localhost:4000';

const CREATOR = { email: 'sarah@example.com', password: 'password123' };
const LEARNER = { email: 'john@example.com', password: 'password123' };
const ADMIN = { email: 'admin@microcourses.com', password: 'password123' };

let creatorToken = '';
let learnerToken = '';
let adminToken = '';
let courseId = '';
let lessonId = '';

let passed = 0;
let failed = 0;

async function apiCall(method, endpoint, token = null, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) options.headers['Authorization'] = `Bearer ${token}`;
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  return { status: response.status, data };
}

function printResult(testName, success, details = '') {
  if (success) {
    console.log(`✅ ${testName}`);
    if (details) console.log(`   ${details}`);
    passed++;
  } else {
    console.log(`❌ ${testName}`);
    if (details) console.log(`   ${details}`);
    failed++;
  }
}

async function test1_SetupLogins() {
  console.log('\n📝 Test 1: Setup - Login All Users');
  
  const creatorRes = await apiCall('POST', '/api/auth/login', null, {
    emailOrPhone: CREATOR.email, password: CREATOR.password
  });
  const learnerRes = await apiCall('POST', '/api/auth/login', null, {
    emailOrPhone: LEARNER.email, password: LEARNER.password
  });
  const adminRes = await apiCall('POST', '/api/auth/login', null, {
    emailOrPhone: ADMIN.email, password: ADMIN.password
  });

  if (creatorRes.status === 200 && learnerRes.status === 200 && adminRes.status === 200) {
    creatorToken = creatorRes.data.token;
    learnerToken = learnerRes.data.token;
    adminToken = adminRes.data.token;
    printResult('All users logged in successfully', true, 
      `Creator: ${creatorRes.data.user.role}, Learner: ${learnerRes.data.user.role}, Admin: ${adminRes.data.user.role}`);
  } else {
    printResult('Login failed', false);
  }
}

async function test2_CreateCourse() {
  console.log('\n📝 Test 2: Creator Creates Course (DRAFT)');
  
  const { status, data } = await apiCall('POST', '/api/courses', creatorToken, {
    title: 'Complete Node.js Masterclass',
    description: 'Master Node.js from basics to advanced topics including Express, databases, authentication, testing, and deployment strategies.',
    category: 'Programming',
    level: 'INTERMEDIATE',
    duration: 300,
    thumbnail: 'https://example.com/nodejs-course.jpg',
  });

  if (status === 201 && data.course && data.course.status === 'DRAFT') {
    courseId = data.course.id;
    printResult('Course created as DRAFT', true, `ID: ${courseId}`);
  } else {
    printResult('Course creation failed', false, JSON.stringify(data));
  }
}

async function test3_AddLessonToCourse() {
  console.log('\n📝 Test 3: Creator Adds Lesson to Course');
  
  // Manually add lesson via Prisma since lesson routes aren't implemented yet
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title: 'Introduction to Node.js',
        videoUrl: 'https://example.com/videos/intro.mp4',
        order: 1,
        duration: 30,
        transcript: 'Welcome to the Node.js masterclass...',
      }
    });
    
    lessonId = lesson.id;
    await prisma.$disconnect();
    printResult('Lesson added successfully', true, `Lesson ID: ${lessonId}`);
  } catch (error) {
    await prisma.$disconnect();
    printResult('Lesson creation failed', false, error.message);
  }
}

async function test4_SubmitCourseForReview() {
  console.log('\n📝 Test 4: Creator Submits Course for Review (DRAFT → PENDING)');
  
  const { status, data } = await apiCall('POST', `/api/courses/${courseId}/submit`, creatorToken);

  if (status === 200 && data.course && data.course.status === 'PENDING') {
    printResult('Course submitted for review', true, `Status: ${data.course.status}`);
  } else {
    printResult('Course submission failed', false, JSON.stringify(data));
  }
}

async function test5_CreatorCannotEditPending() {
  console.log('\n📝 Test 5: Creator Cannot Edit PENDING Course');
  
  const { status, data } = await apiCall('PATCH', `/api/courses/${courseId}`, creatorToken, {
    title: 'Updated Title',
  });

  if (status === 400 && data.message.includes('PENDING')) {
    printResult('Edit blocked correctly', true, 'PENDING courses cannot be edited');
  } else {
    printResult('Edit blocking failed', false, `Expected 400, got ${status}`);
  }
}

async function test6_CreatorCannotDeletePending() {
  console.log('\n📝 Test 6: Creator Cannot Delete PENDING Course');
  
  const { status, data } = await apiCall('DELETE', `/api/courses/${courseId}`, creatorToken);

  if (status === 400 && data.message.includes('PENDING')) {
    printResult('Delete blocked correctly', true, 'PENDING courses cannot be deleted');
  } else {
    printResult('Delete blocking failed', false, `Expected 400, got ${status}`);
  }
}

async function test7_AdminViewsPendingCourses() {
  console.log('\n📝 Test 7: Admin Views Pending Courses');
  
  const { status, data } = await apiCall('GET', '/api/admin/courses/pending', adminToken);

  if (status === 200 && data.courses && data.courses.length > 0) {
    const hasCourse = data.courses.some(c => c.id === courseId);
    printResult('Admin can see pending courses', hasCourse, `Found ${data.count} pending course(s)`);
  } else {
    printResult('Admin view failed', false, JSON.stringify(data));
  }
}

async function test8_AdminPublishesCourse() {
  console.log('\n📝 Test 8: Admin Publishes Course (PENDING → PUBLISHED)');
  
  const { status, data } = await apiCall('POST', `/api/admin/courses/${courseId}/publish`, adminToken);

  if (status === 200 && data.course && data.course.status === 'PUBLISHED') {
    printResult('Course published successfully', true, `Status: ${data.course.status}, Published at: ${data.course.publishedAt}`);
  } else {
    printResult('Course publication failed', false, JSON.stringify(data));
  }
}

async function test9_LearnerCanNowSeeCourse() {
  console.log('\n📝 Test 9: Learner Can See PUBLISHED Course');
  
  const { status, data } = await apiCall('GET', '/api/courses', learnerToken);

  if (status === 200 && data.courses) {
    const publishedCourse = data.courses.find(c => c.id === courseId);
    if (publishedCourse && publishedCourse.status === 'PUBLISHED') {
      printResult('Learner can see published course', true, `Found course: ${publishedCourse.title}`);
    } else {
      printResult('Course not visible to learner', false);
    }
  } else {
    printResult('Get courses failed', false);
  }
}

async function test10_LearnerCanAccessCourseDetails() {
  console.log('\n📝 Test 10: Learner Can Access PUBLISHED Course Details');
  
  const { status, data } = await apiCall('GET', `/api/courses/${courseId}`, learnerToken);

  if (status === 200 && data.course && data.course.lessons) {
    printResult('Learner can access course details', true, 
      `Title: ${data.course.title}, Lessons: ${data.course.lessons.length}`);
  } else {
    printResult('Course access failed', false, JSON.stringify(data));
  }
}

async function test11_CannotRepublish() {
  console.log('\n📝 Test 11: Cannot Re-publish PUBLISHED Course');
  
  const { status, data } = await apiCall('POST', `/api/admin/courses/${courseId}/publish`, adminToken);

  if (status === 400 && data.message.includes('PUBLISHED')) {
    printResult('Re-publish blocked correctly', true, 'Already published courses cannot be re-published');
  } else {
    printResult('Re-publish blocking failed', false, `Expected 400, got ${status}`);
  }
}

async function test12_TestRejectionWorkflow() {
  console.log('\n📝 Test 12: Test Rejection Workflow');
  
  // Create another course to test rejection
  const createRes = await apiCall('POST', '/api/courses', creatorToken, {
    title: 'Python for Beginners',
    description: 'Learn Python programming from scratch with hands-on examples and real-world projects.',
    category: 'Programming',
    level: 'BEGINNER',
  });

  if (createRes.status !== 201) {
    printResult('Test course creation failed', false);
    return;
  }

  const testCourseId = createRes.data.course.id;

  // Add a lesson
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    await prisma.lesson.create({
      data: {
        courseId: testCourseId,
        title: 'Python Basics',
        videoUrl: 'https://example.com/python-intro.mp4',
        order: 1,
        duration: 25,
      }
    });
    await prisma.$disconnect();
  } catch (error) {
    await prisma.$disconnect();
  }

  // Submit
  await apiCall('POST', `/api/courses/${testCourseId}/submit`, creatorToken);

  // Reject
  const rejectRes = await apiCall('POST', `/api/admin/courses/${testCourseId}/reject`, adminToken, {
    feedback: 'The course content needs more detail and better structure. Please add more comprehensive examples.',
  });

  if (rejectRes.status === 200 && rejectRes.data.course.status === 'REJECTED') {
    printResult('Course rejection workflow works', true, 
      `Status: REJECTED, Feedback: ${rejectRes.data.course.rejectionReason}`);
  } else {
    printResult('Rejection failed', false, JSON.stringify(rejectRes.data));
  }
}

async function runAllTests() {
  console.log('\n🚀 COMPLETE COURSE WORKFLOW TEST SUITE\n');
  console.log('Testing full lifecycle: Create → Submit → Review → Publish\n');
  console.log('='.repeat(70));

  await test1_SetupLogins();
  await test2_CreateCourse();
  await test3_AddLessonToCourse();
  await test4_SubmitCourseForReview();
  await test5_CreatorCannotEditPending();
  await test6_CreatorCannotDeletePending();
  await test7_AdminViewsPendingCourses();
  await test8_AdminPublishesCourse();
  await test9_LearnerCanNowSeeCourse();
  await test10_LearnerCanAccessCourseDetails();
  await test11_CannotRepublish();
  await test12_TestRejectionWorkflow();

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Complete course workflow is working perfectly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
  }
}

runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
