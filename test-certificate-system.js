// test-certificate-system.js
// Integration test for certificate generation and verification

const BASE_URL = 'http://localhost:4000';

// Test state
let authToken = null;
let userId = null;
let courseId = null;
let lessonIds = [];
let enrollmentId = null;
let certificateSerialHash = null;

// Helper function to make HTTP requests
async function makeRequest(method, path, data = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const responseData = await response.json();
    return { status: response.status, data: responseData };
  } catch (error) {
    console.error(`Request failed: ${method} ${path}`, error.message);
    return { status: 500, data: { message: error.message } };
  }
}

// Test functions
async function test1_loginAsLearner() {
  console.log('\n1. Testing Login as Learner...');
  
  const { status, data } = await makeRequest('POST', '/api/auth/login', {
    emailOrPhone: 'john@example.com',
    password: 'password123'
  });

  if (status === 200 && data.token) {
    authToken = data.token;
    userId = data.user.id;
    console.log('✅ Login successful');
    console.log(`   User: ${data.user.name}`);
    console.log(`   Role: ${data.user.role}`);
    return true;
  } else {
    console.log('❌ Login failed:', data.message);
    return false;
  }
}

async function test2_getPublishedCourses() {
  console.log('\n2. Getting Published Courses...');
  
  const { status, data } = await makeRequest('GET', '/api/courses?status=PUBLISHED', null, authToken);

  if (status === 200 && data.data && data.data.length > 0) {
    // Find a course with lessons
    const courseWithLessons = data.data.find(c => c.lessonsCount && c.lessonsCount > 0);
    
    if (courseWithLessons) {
      courseId = courseWithLessons.id;
      console.log('✅ Found courses');
      console.log(`   Selected: ${courseWithLessons.title}`);
      console.log(`   Lessons: ${courseWithLessons.lessonsCount}`);
      return true;
    } else {
      console.log('❌ No courses with lessons found');
      return false;
    }
  } else {
    console.log('❌ Failed to get courses:', data.message);
    return false;
  }
}

async function test3_enrollInCourse() {
  console.log('\n3. Enrolling in Course...');
  
  const { status, data } = await makeRequest('POST', `/api/courses/${courseId}/enroll`, null, authToken);

  if (status === 201 || (status === 409 && data.message.includes('Already enrolled'))) {
    enrollmentId = data.data?.enrollment?.id;
    
    if (!enrollmentId) {
      // Already enrolled, get enrollment
      const { status: checkStatus, data: checkData } = await makeRequest('GET', `/api/courses/${courseId}/enrollment`, null, authToken);
      if (checkStatus === 200 && checkData.data.enrollment) {
        enrollmentId = checkData.data.enrollment.id;
      }
    }
    
    console.log('✅ Enrolled in course');
    console.log(`   Enrollment ID: ${enrollmentId}`);
    return true;
  } else {
    console.log('❌ Enrollment failed:', data.message);
    return false;
  }
}

async function test4_getCourseProgress() {
  console.log('\n4. Getting Course Progress...');
  
  const { status, data } = await makeRequest('GET', `/api/courses/${courseId}/progress`, null, authToken);

  if (status === 200 && data.data) {
    lessonIds = data.data.lessons.map(l => l.id);
    console.log('✅ Retrieved course progress');
    console.log(`   Total lessons: ${data.data.summary.totalLessons}`);
    console.log(`   Completed: ${data.data.summary.completedLessons}`);
    console.log(`   Progress: ${data.data.summary.progress}%`);
    return true;
  } else {
    console.log('❌ Failed to get progress:', data.message);
    return false;
  }
}

async function test5_completeAllLessons() {
  console.log('\n5. Completing All Lessons...');
  
  let completedCount = 0;
  
  for (const lessonId of lessonIds) {
    const { status, data } = await makeRequest('POST', `/api/lessons/${lessonId}/complete`, null, authToken);
    
    if (status === 200) {
      completedCount++;
      process.stdout.write(`   Completed ${completedCount}/${lessonIds.length} lessons (${data.data.enrollment.progress}%)\r`);
    } else {
      console.log(`\n   ⚠️ Failed to complete lesson ${lessonId}`);
    }
  }
  
  console.log('\n✅ All lessons completed');
  return true;
}

async function test6_verifyCompletion() {
  console.log('\n6. Verifying 100% Completion...');
  
  // Wait a moment for certificate generation
  console.log('   Waiting 3 seconds for certificate generation...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const { status, data } = await makeRequest('GET', `/api/courses/${courseId}/enrollment`, null, authToken);

  if (status === 200 && data.data.enrollment) {
    const enrollment = data.data.enrollment;
    console.log('✅ Enrollment verified');
    console.log(`   Progress: ${enrollment.progress}%`);
    console.log(`   Completed: ${enrollment.completedAt ? 'Yes' : 'No'}`);
    console.log(`   Completed at: ${enrollment.completedAt || 'N/A'}`);
    
    if (enrollment.progress === 100) {
      return true;
    } else {
      console.log('   ⚠️ Progress not at 100%');
      return false;
    }
  } else {
    console.log('❌ Failed to verify completion:', data.message);
    return false;
  }
}

async function test7_getCertificate() {
  console.log('\n7. Getting Certificate...');
  
  const { status, data } = await makeRequest('GET', `/api/enrollments/${enrollmentId}/certificate`, null, authToken);

  if (status === 200 && data.data.certificate) {
    certificateSerialHash = data.data.certificate.serialHash;
    console.log('✅ Certificate retrieved');
    console.log(`   Serial Hash: ${certificateSerialHash.substring(0, 16)}...`);
    console.log(`   Issued At: ${data.data.certificate.issuedAt}`);
    console.log(`   Learner: ${data.data.certificate.learner.name}`);
    console.log(`   Course: ${data.data.certificate.course.title}`);
    console.log(`   Verification URL: ${data.data.certificate.verificationUrl}`);
    return true;
  } else {
    console.log('❌ Failed to get certificate:', data.message);
    return false;
  }
}

async function test8_verifyCertificate() {
  console.log('\n8. Verifying Certificate (Public Endpoint)...');
  
  const { status, data } = await makeRequest('GET', `/api/certificates/verify/${certificateSerialHash}`);

  if (status === 200 && data.data && data.data.valid) {
    console.log('✅ Certificate verified successfully');
    console.log(`   Valid: ${data.data.valid}`);
    console.log(`   Learner: ${data.data.learner.name}`);
    console.log(`   Course: ${data.data.course.title}`);
    console.log(`   Level: ${data.data.course.level}`);
    console.log(`   Category: ${data.data.course.category}`);
    console.log(`   Instructor: ${data.data.course.instructor}`);
    console.log(`   Issued At: ${data.data.issuedAt}`);
    console.log(`   Completed At: ${data.data.completedAt}`);
    return true;
  } else {
    console.log('❌ Certificate verification failed:', data.message);
    return false;
  }
}

async function test9_verifyInvalidCertificate() {
  console.log('\n9. Testing Invalid Certificate Verification...');
  
  const fakeHash = 'a'.repeat(64); // Invalid 64-char hash
  const { status, data } = await makeRequest('GET', `/api/certificates/verify/${fakeHash}`);

  if (status === 404 && data.valid === false) {
    console.log('✅ Invalid certificate correctly rejected');
    console.log(`   Message: ${data.message}`);
    return true;
  } else {
    console.log('❌ Invalid certificate not properly rejected');
    return false;
  }
}

async function test10_getAllCertificates() {
  console.log('\n10. Getting All User Certificates...');
  
  const { status, data } = await makeRequest('GET', '/api/certificates', null, authToken);

  if (status === 200 && data.data.certificates) {
    console.log('✅ Retrieved user certificates');
    console.log(`   Total certificates: ${data.data.total}`);
    
    data.data.certificates.forEach((cert, index) => {
      console.log(`\n   Certificate ${index + 1}:`);
      console.log(`     Course: ${cert.course.title}`);
      console.log(`     Level: ${cert.course.level}`);
      console.log(`     Category: ${cert.course.category}`);
      console.log(`     Issued: ${new Date(cert.issuedAt).toLocaleDateString()}`);
      console.log(`     Serial: ${cert.serialHash.substring(0, 16)}...`);
    });
    
    return true;
  } else {
    console.log('❌ Failed to get certificates:', data.message);
    return false;
  }
}

async function test11_checkProgressWithCertificate() {
  console.log('\n11. Checking Progress Page Has Certificate Info...');
  
  const { status, data } = await makeRequest('GET', '/api/progress', null, authToken);

  if (status === 200 && data.data.enrollments) {
    const enrollment = data.data.enrollments.find(e => e.id === enrollmentId);
    
    if (enrollment) {
      console.log('✅ Enrollment found in progress');
      console.log(`   Course: ${enrollment.course.title}`);
      console.log(`   Progress: ${enrollment.progress}%`);
      console.log(`   Has Certificate: ${enrollment.hasCertificate ? 'Yes' : 'No'}`);
      
      if (enrollment.certificate) {
        console.log(`   Certificate Serial: ${enrollment.certificate.serialHash.substring(0, 16)}...`);
        console.log(`   Certificate Issued: ${enrollment.certificate.issuedAt}`);
      }
      
      return enrollment.hasCertificate === true;
    } else {
      console.log('❌ Enrollment not found in progress list');
      return false;
    }
  } else {
    console.log('❌ Failed to get progress:', data.message);
    return false;
  }
}

async function test12_downloadCertificate() {
  console.log('\n12. Testing Certificate Download...');
  
  const { status, data } = await makeRequest('GET', `/api/enrollments/${enrollmentId}/certificate/download`, null, authToken);

  if (status === 200) {
    console.log('✅ Certificate download endpoint working');
    console.log(`   Note: ${data.message}`);
    console.log('   ℹ️  PDF generation can be implemented with pdfkit or puppeteer');
    return true;
  } else {
    console.log('❌ Certificate download failed:', data.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('=======================================================');
  console.log('Certificate System Integration Test');
  console.log('=======================================================');

  const tests = [
    test1_loginAsLearner,
    test2_getPublishedCourses,
    test3_enrollInCourse,
    test4_getCourseProgress,
    test5_completeAllLessons,
    test6_verifyCompletion,
    test7_getCertificate,
    test8_verifyCertificate,
    test9_verifyInvalidCertificate,
    test10_getAllCertificates,
    test11_checkProgressWithCertificate,
    test12_downloadCertificate
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
      console.log(`❌ Test threw error: ${error.message}`);
      failed++;
    }
  }

  console.log('\n=======================================================');
  console.log('Test Summary');
  console.log('=======================================================');
  console.log(`Total Tests: ${tests.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%`);
  console.log('=======================================================\n');

  if (failed > 0) {
    console.log('⚠️  Some tests failed. Please check the output above.\n');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed!\n');
    process.exit(0);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
