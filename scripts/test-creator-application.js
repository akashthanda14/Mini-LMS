// test-creator-application.js
// Comprehensive test suite for creator application and admin approval system

const BASE_URL = 'http://localhost:4000';

// Test accounts from seeded data
const LEARNER = {
  email: 'john@example.com',
  password: 'password123',
};

const ADMIN = {
  email: 'admin@microcourses.com',
  password: 'password123',
};

const CREATOR = {
  email: 'sarah@example.com',
  password: 'password123',
};

// Store tokens and application ID
let learnerToken = '';
let adminToken = '';
let creatorToken = '';
let applicationId = '';

// Test counter
let passed = 0;
let failed = 0;

// Helper function for API calls
async function apiCall(method, endpoint, token = null, body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  
  return { status: response.status, data };
}

// Helper function to print test results
function printResult(testName, passed, details = '') {
  if (passed) {
    console.log(`✅ ${testName}`);
    if (details) console.log(`   ${details}`);
  } else {
    console.log(`❌ ${testName}`);
    if (details) console.log(`   ${details}`);
  }
}

// Test 1: Login as learner
async function test1_LoginAsLearner() {
  console.log('\n📝 Test 1: Login as Learner');
  
  try {
    const { status, data } = await apiCall('POST', '/api/auth/login', null, {
      emailOrPhone: LEARNER.email,
      password: LEARNER.password,
    });

    if (status === 200 && data.success && data.token) {
      learnerToken = data.token;
      passed++;
      printResult('Learner login successful', true, `Role: ${data.user.role}`);
      return true;
    } else {
      failed++;
      printResult('Learner login failed', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Learner login failed', false, error.message);
    return false;
  }
}

// Test 2: Login as admin
async function test2_LoginAsAdmin() {
  console.log('\n📝 Test 2: Login as Admin');
  
  try {
    const { status, data } = await apiCall('POST', '/api/auth/login', null, {
      emailOrPhone: ADMIN.email,
      password: ADMIN.password,
    });

    if (status === 200 && data.success && data.token) {
      adminToken = data.token;
      passed++;
      printResult('Admin login successful', true, `Role: ${data.user.role}`);
      return true;
    } else {
      failed++;
      printResult('Admin login failed', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Admin login failed', false, error.message);
    return false;
  }
}

// Test 3: Login as creator
async function test3_LoginAsCreator() {
  console.log('\n📝 Test 3: Login as Creator');
  
  try {
    const { status, data } = await apiCall('POST', '/api/auth/login', null, {
      emailOrPhone: CREATOR.email,
      password: CREATOR.password,
    });

    if (status === 200 && data.success && data.token) {
      creatorToken = data.token;
      passed++;
      printResult('Creator login successful', true, `Role: ${data.user.role}`);
      return true;
    } else {
      failed++;
      printResult('Creator login failed', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Creator login failed', false, error.message);
    return false;
  }
}

// Test 4: Submit invalid application (bio too short)
async function test4_InvalidApplicationBioShort() {
  console.log('\n📝 Test 4: Submit Invalid Application (Bio Too Short)');
  
  try {
    const { status, data } = await apiCall('POST', '/api/creator/apply', learnerToken, {
      bio: 'Too short bio',
      portfolio: 'https://portfolio.com',
      experience: 'I have been teaching for 5 years with expertise in web development.',
    });

    if (status === 400 && data.message.includes('between 100 and 500')) {
      passed++;
      printResult('Validation works correctly', true, 'Bio too short rejected');
      return true;
    } else {
      failed++;
      printResult('Validation failed', false, `Expected 400 error, got ${status}`);
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Test failed', false, error.message);
    return false;
  }
}

// Test 5: Submit valid creator application
async function test5_SubmitValidApplication() {
  console.log('\n📝 Test 5: Submit Valid Creator Application');
  
  try {
    const { status, data } = await apiCall('POST', '/api/creator/apply', learnerToken, {
      bio: 'I am a passionate educator with over 10 years of experience in teaching web development and programming. I have taught at multiple universities and online platforms, helping thousands of students achieve their learning goals. My teaching style focuses on practical, hands-on learning with real-world projects.',
      portfolio: 'https://johndoe-portfolio.com',
      experience: 'I have been teaching web development for over 10 years, specializing in JavaScript, React, Node.js, and full-stack development. I have created multiple successful online courses with over 50,000 students enrolled. My courses focus on practical skills and real-world applications.',
    });

    if (status === 201 && data.success && data.application) {
      applicationId = data.application.id;
      passed++;
      printResult('Application submitted successfully', true, `Status: ${data.application.status}, ID: ${applicationId}`);
      return true;
    } else {
      failed++;
      printResult('Application submission failed', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Application submission failed', false, error.message);
    return false;
  }
}

// Test 6: Try to submit duplicate application
async function test6_DuplicateApplication() {
  console.log('\n📝 Test 6: Try to Submit Duplicate Application');
  
  try {
    const { status, data } = await apiCall('POST', '/api/creator/apply', learnerToken, {
      bio: 'Another bio that is long enough to pass the validation test with at least 100 characters required by the system for creator applications.',
      portfolio: 'https://another-portfolio.com',
      experience: 'More experience description that meets the minimum length requirement.',
    });

    if (status === 409 && data.message.includes('already have')) {
      passed++;
      printResult('Duplicate prevention works', true, 'Duplicate application rejected');
      return true;
    } else {
      failed++;
      printResult('Duplicate prevention failed', false, `Expected 409 error, got ${status}`);
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Test failed', false, error.message);
    return false;
  }
}

// Test 7: Check application status as learner
async function test7_CheckApplicationStatus() {
  console.log('\n📝 Test 7: Check Application Status as Learner');
  
  try {
    const { status, data } = await apiCall('GET', '/api/creator/status', learnerToken);

    if (status === 200 && data.success && data.application && data.application.status === 'PENDING') {
      passed++;
      printResult('Application status retrieved', true, `Status: ${data.application.status}`);
      return true;
    } else {
      failed++;
      printResult('Status check failed', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Status check failed', false, error.message);
    return false;
  }
}

// Test 8: Admin views pending applications
async function test8_AdminViewPendingApplications() {
  console.log('\n📝 Test 8: Admin Views Pending Applications');
  
  try {
    const { status, data } = await apiCall('GET', '/api/admin/applications/pending', adminToken);

    if (status === 200 && data.success && data.applications.length > 0) {
      passed++;
      printResult('Admin can view pending applications', true, `Found ${data.count} pending application(s)`);
      return true;
    } else {
      failed++;
      printResult('Admin view failed', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Admin view failed', false, error.message);
    return false;
  }
}

// Test 9: Try to approve application without admin role (should fail)
async function test9_NonAdminCannotApprove() {
  console.log('\n📝 Test 9: Non-Admin Cannot Approve Application');
  
  try {
    const { status, data } = await apiCall('POST', `/api/admin/applications/${applicationId}/approve`, learnerToken);

    if (status === 403) {
      passed++;
      printResult('Authorization works correctly', true, 'Non-admin blocked from approval');
      return true;
    } else {
      failed++;
      printResult('Authorization failed', false, `Expected 403 error, got ${status}`);
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Test failed', false, error.message);
    return false;
  }
}

// Test 10: Admin approves application
async function test10_AdminApprovesApplication() {
  console.log('\n📝 Test 10: Admin Approves Application');
  
  try {
    const { status, data } = await apiCall('POST', `/api/admin/applications/${applicationId}/approve`, adminToken);

    if (status === 200 && data.success && data.application.status === 'APPROVED') {
      passed++;
      printResult('Application approved successfully', true, `User role: ${data.application.applicant.role}`);
      return true;
    } else {
      failed++;
      printResult('Approval failed', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Approval failed', false, error.message);
    return false;
  }
}

// Test 11: Verify learner role upgraded to creator
async function test11_VerifyRoleUpgrade() {
  console.log('\n📝 Test 11: Verify Learner Role Upgraded to Creator');
  
  try {
    // Login again to get fresh token with new role
    const { status, data } = await apiCall('POST', '/api/auth/login', null, {
      emailOrPhone: LEARNER.email,
      password: LEARNER.password,
    });

    if (status === 200 && data.success && data.user.role === 'CREATOR') {
      learnerToken = data.token; // Update token
      passed++;
      printResult('Role upgrade confirmed', true, `New role: ${data.user.role}`);
      return true;
    } else {
      failed++;
      printResult('Role upgrade verification failed', false, `Role: ${data.user?.role}`);
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Role upgrade verification failed', false, error.message);
    return false;
  }
}

// Test 12: Creator can access creator dashboard
async function test12_CreatorAccessDashboard() {
  console.log('\n📝 Test 12: Creator Can Access Dashboard');
  
  try {
    const { status, data } = await apiCall('GET', '/api/creator/dashboard', learnerToken);

    if (status === 200 && data.success && data.dashboard) {
      passed++;
      printResult('Creator dashboard accessible', true, `Courses: ${data.dashboard.stats.totalCourses}`);
      return true;
    } else {
      failed++;
      printResult('Dashboard access failed', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Dashboard access failed', false, error.message);
    return false;
  }
}

// Test 13: Existing creator can access dashboard
async function test13_ExistingCreatorDashboard() {
  console.log('\n📝 Test 13: Existing Creator Can Access Dashboard');
  
  try {
    const { status, data } = await apiCall('GET', '/api/creator/dashboard', creatorToken);

    if (status === 200 && data.success && data.dashboard && data.dashboard.stats.totalCourses > 0) {
      passed++;
      printResult('Existing creator dashboard works', true, `Courses: ${data.dashboard.stats.totalCourses}, Enrollments: ${data.dashboard.stats.totalEnrollments}`);
      return true;
    } else {
      failed++;
      printResult('Dashboard access failed', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Dashboard access failed', false, error.message);
    return false;
  }
}

// Test 14: Admin views all applications
async function test14_AdminViewAllApplications() {
  console.log('\n📝 Test 14: Admin Views All Applications');
  
  try {
    const { status, data } = await apiCall('GET', '/api/admin/applications', adminToken);

    if (status === 200 && data.success && data.applications.length > 0) {
      const approved = data.applications.filter(app => app.status === 'APPROVED').length;
      passed++;
      printResult('Admin can view all applications', true, `Total: ${data.count}, Approved: ${approved}`);
      return true;
    } else {
      failed++;
      printResult('Admin view all failed', false, JSON.stringify(data));
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Admin view all failed', false, error.message);
    return false;
  }
}

// Test 15: Try to approve already approved application
async function test15_CannotReapproveApplication() {
  console.log('\n📝 Test 15: Cannot Re-approve Already Approved Application');
  
  try {
    const { status, data } = await apiCall('POST', `/api/admin/applications/${applicationId}/approve`, adminToken);

    if (status === 400 && data.message.includes('already been reviewed')) {
      passed++;
      printResult('Duplicate approval prevented', true, 'Cannot approve twice');
      return true;
    } else {
      failed++;
      printResult('Duplicate approval prevention failed', false, `Expected 400 error, got ${status}`);
      return false;
    }
  } catch (error) {
    failed++;
    printResult('Test failed', false, error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 CREATOR APPLICATION SYSTEM TEST SUITE\n');
  console.log('Testing creator application workflow and admin approval system...\n');
  console.log('='.repeat(70));

  // Run tests sequentially
  await test1_LoginAsLearner();
  await test2_LoginAsAdmin();
  await test3_LoginAsCreator();
  await test4_InvalidApplicationBioShort();
  await test5_SubmitValidApplication();
  await test6_DuplicateApplication();
  await test7_CheckApplicationStatus();
  await test8_AdminViewPendingApplications();
  await test9_NonAdminCannotApprove();
  await test10_AdminApprovesApplication();
  await test11_VerifyRoleUpgrade();
  await test12_CreatorAccessDashboard();
  await test13_ExistingCreatorDashboard();
  await test14_AdminViewAllApplications();
  await test15_CannotReapproveApplication();

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 TEST SUMMARY\n');
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Creator application system is working perfectly.\n');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
  }
}

// Run tests
runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
