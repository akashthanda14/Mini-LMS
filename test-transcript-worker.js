/**
 * Transcript Worker Integration Test
 * 
 * Tests:
 * 1. Login as creator
 * 2. Create DRAFT course
 * 3. Create lesson (should queue transcript job)
 * 4. Check transcript status (should be queued/processing)
 * 5. Wait for job completion
 * 6. Verify transcript generated
 * 7. Check transcript status (should be completed)
 */

const API_BASE = 'http://localhost:4000/api';

// Test credentials
const CREATOR = {
  emailOrPhone: 'sarah@example.com',
  password: 'password123'
};

let authToken = '';
let courseId = '';
let lessonId = '';

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

// Helper: Sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test 1: Login
async function testLogin() {
  console.log('\n1. Testing Login...');
  
  const { status, data } = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(CREATOR)
  });

  if (status === 200 && data.success && data.token) {
    authToken = data.token;
    console.log('✅ Login successful');
    return true;
  }

  console.log('❌ Login failed:', data);
  return false;
}

// Test 2: Create Course
async function testCreateCourse() {
  console.log('\n2. Creating DRAFT Course...');
  
  const courseData = {
    title: 'Transcript Test Course',
    description: 'Testing transcript generation',
    duration: 60,
    level: 'BEGINNER',
    category: 'PROGRAMMING'
  };

  const { status, data } = await apiRequest('/courses', {
    method: 'POST',
    body: JSON.stringify(courseData)
  });

  if (status === 201 && data.success && data.course) {
    courseId = data.course.id;
    console.log(`✅ Course created: ${courseId}`);
    return true;
  }

  console.log('❌ Course creation failed:', data);
  return false;
}

// Test 3: Create Lesson
async function testCreateLesson() {
  console.log('\n3. Creating Lesson with Video...');
  
  const lessonData = {
    title: 'Transcript Test Lesson',
    videoUrl: 'https://res.cloudinary.com/demo/video/upload/v1234567890/test-video.mp4',
    order: 1,
    duration: 300
  };

  const { status, data } = await apiRequest(`/courses/${courseId}/lessons`, {
    method: 'POST',
    body: JSON.stringify(lessonData)
  });

  if (status === 201 && data.success && data.data) {
    lessonId = data.data.id;
    console.log(`✅ Lesson created: ${lessonId}`);
    console.log(`   Transcript job will be queued automatically`);
    return true;
  }

  console.log('❌ Lesson creation failed:', data);
  return false;
}

// Test 4: Check Initial Status
async function testInitialStatus() {
  console.log('\n4. Checking Initial Transcript Status...');
  
  if (!lessonId) {
    console.log('❌ No lesson ID available');
    return false;
  }

  const { status, data } = await apiRequest(`/lessons/${lessonId}/transcript-status`);

  if (status === 200 && data.success) {
    console.log(`✅ Status: ${data.data.status}`);
    console.log(`   Details:`, JSON.stringify(data.data, null, 2));
    return true;
  }

  console.log('❌ Status check failed:', data);
  return false;
}

// Test 5: Wait for Completion
async function testWaitForCompletion() {
  console.log('\n5. Waiting for Transcript Generation...');
  console.log('   (This may take a few seconds)');
  
  if (!lessonId) {
    console.log('❌ No lesson ID available');
    return false;
  }

  const maxAttempts = 30; // 30 seconds max
  let attempts = 0;

  while (attempts < maxAttempts) {
    await sleep(1000);
    attempts++;

    const { status, data } = await apiRequest(`/lessons/${lessonId}/transcript-status`);

    if (status === 200 && data.success) {
      const jobStatus = data.data.status;
      
      process.stdout.write(`\r   Attempt ${attempts}/${maxAttempts} - Status: ${jobStatus}${' '.repeat(20)}`);

      if (jobStatus === 'completed') {
        console.log('\n✅ Transcript generation completed!');
        return true;
      }

      if (jobStatus === 'failed') {
        console.log('\n❌ Transcript generation failed');
        console.log('   Error:', data.data.error);
        return false;
      }

      // Continue waiting for waiting, active, delayed states
    }
  }

  console.log('\n⚠️  Timeout waiting for completion');
  return false;
}

// Test 6: Verify Transcript
async function testVerifyTranscript() {
  console.log('\n6. Verifying Transcript Content...');
  
  if (!lessonId) {
    console.log('❌ No lesson ID available');
    return false;
  }

  const { status, data } = await apiRequest(`/lessons/${lessonId}/transcript-status`);

  if (status === 200 && data.success && data.data.transcript) {
    const transcriptLength = data.data.transcript.length;
    const preview = data.data.transcript.substring(0, 100);
    
    console.log(`✅ Transcript generated: ${transcriptLength} characters`);
    console.log(`   Preview: "${preview}..."`);
    
    // Check if it's a dummy transcript
    if (data.data.transcript.includes('dummy transcript')) {
      console.log('   ℹ️  Using dummy transcript (OpenAI not configured)');
    } else {
      console.log('   ℹ️  Real transcript from OpenAI Whisper');
    }
    
    return true;
  }

  console.log('❌ No transcript found:', data);
  return false;
}

// Test 7: Get Lesson with Transcript
async function testGetLesson() {
  console.log('\n7. Getting Lesson Details...');
  
  const { status, data } = await apiRequest(`/courses/${courseId}/lessons`);

  if (status === 200 && data.success && data.data) {
    const lesson = data.data.find(l => l.id === lessonId);
    
    if (lesson && lesson.transcript) {
      console.log('✅ Lesson includes transcript field');
      console.log(`   Transcript length: ${lesson.transcript.length} characters`);
      const preview = lesson.transcript.substring(0, 80);
      console.log(`   Preview: "${preview}..."`);
      return true;
    }

    console.log('⚠️  Lesson found but no transcript yet');
    return false;
  }

  console.log('❌ Failed to get lesson:', data);
  return false;
}

// Run all tests
async function runTests() {
  console.log('=================================================');
  console.log('Transcript Worker Integration Test');
  console.log('=================================================');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  const tests = [
    { name: 'Login', fn: testLogin },
    { name: 'Create Course', fn: testCreateCourse },
    { name: 'Create Lesson', fn: testCreateLesson },
    { name: 'Check Initial Status', fn: testInitialStatus },
    { name: 'Wait for Completion', fn: testWaitForCompletion },
    { name: 'Verify Transcript', fn: testVerifyTranscript },
    { name: 'Get Lesson', fn: testGetLesson }
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
  console.log('\n=================================================');
  console.log('Test Summary');
  console.log('=================================================');
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('=================================================\n');

  if (results.failed === 0) {
    console.log('🎉 All tests passed! Transcript worker is functioning correctly.\n');
  } else {
    console.log('⚠️  Some tests failed. Please check the worker is running and configured correctly.\n');
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
