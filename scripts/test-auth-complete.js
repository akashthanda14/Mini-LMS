// scripts/test-auth-complete.js
// Complete authentication flow test for akashthanda14@gmail.com

import 'dotenv/config';
import axios from 'axios';

const BASE_URL ='http://localhost:4000/api';
const TEST_EMAIL = 'akashthanda14@gmail.com';
const TEST_PASSWORD = 'TestPass123!';
const TEST_NAME = 'Akash Thanda';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  step: (msg) => console.log(`${colors.cyan}📍 ${msg}${colors.reset}`),
};

// Store for test data
let testData = {
  userId: null,
  token: null,
  otp: null,
};

// Helper function to wait
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to prompt for OTP
const promptForOTP = () => {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question('Enter the 6-digit OTP received in your email: ', (otp) => {
      readline.close();
      resolve(otp.trim());
    });
  });
};

// Test functions
const tests = {
  // Test 1: Register with Email
  async registerEmail() {
    log.step('Test 1: Register with Email');
    try {
      const response = await axios.post(`${BASE_URL}/user-auth/register-email`, {
        name: TEST_NAME,
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        role: 'LEARNER',
      });

      if (response.data.success) {
        testData.userId = response.data.data.user.id;
        log.success('Registration successful');
        log.info(`User ID: ${testData.userId}`);
        log.info(`OTP sent to: ${TEST_EMAIL}`);
        log.info(`Expires in: ${response.data.data.expiresIn} seconds`);
        return true;
      }
    } catch (error) {
      if (error.response?.status === 409) {
        log.warning('Email already registered - will try to login instead');
        return 'already_exists';
      }
      log.error(`Registration failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  },

  // Test 2: Verify Email OTP
  async verifyEmailOTP() {
    log.step('Test 2: Verify Email OTP');
    
    log.info('Please check your email for the OTP code');
    const otp = await promptForOTP();
    testData.otp = otp;

    try {
  const response = await axios.post(`${BASE_URL}/user-auth/verify-email`, {
        email: TEST_EMAIL,
        otp: otp,
      });

      if (response.data.success) {
        log.success('Email verified successfully');
        log.info(`Verified at: ${response.data.data.user.verifiedAt}`);
        return true;
      }
    } catch (error) {
      log.error(`Verification failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  },

  // Test 3: Resend OTP
  async resendOTP() {
    log.step('Test 3: Resend OTP');
    try {
      const response = await axios.post(`${BASE_URL}/user-auth/resend-otp`, {
        email: TEST_EMAIL,
      });

      if (response.data.success) {
        log.success('OTP resent successfully');
        log.info(`OTP sent to: ${response.data.data.sentTo}`);
        log.info(`Expires in: ${response.data.data.expiresIn} seconds`);
        return true;
      }
    } catch (error) {
      log.error(`Resend OTP failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  },

  // Test 4: Login
  async login() {
    log.step('Test 4: Login with Email and Password');
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        emailOrPhone: TEST_EMAIL,
        password: TEST_PASSWORD,
      });

      if (response.data.success) {
        testData.token = response.data.token;
        testData.userId = response.data.user.id;
        log.success('Login successful');
        log.info(`Token: ${testData.token.substring(0, 50)}...`);
        log.info(`User: ${response.data.user.name}`);
        log.info(`Role: ${response.data.user.role}`);
        log.info(`Verified: ${response.data.user.isVerified}`);
        return true;
      }
    } catch (error) {
      log.error(`Login failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  },

  // Test 5: Get Profile
  async getProfile() {
    log.step('Test 5: Get User Profile');
    try {
      const response = await axios.get(`${BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${testData.token}`,
        },
      });

      if (response.data.success) {
        const user = response.data.data.user;
        log.success('Profile retrieved successfully');
        log.info(`Name: ${user.name}`);
        log.info(`Email: ${user.email}`);
        log.info(`Role: ${user.role}`);
        log.info(`Created: ${new Date(user.createdAt).toLocaleString()}`);
        return true;
      }
    } catch (error) {
      log.error(`Get profile failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  },

  // Test 6: Update Profile
  async updateProfile() {
    log.step('Test 6: Update Profile Name');
    const newName = `${TEST_NAME} (Updated)`;
    try {
      const response = await axios.put(
        `${BASE_URL}/profile`,
        { name: newName },
        {
          headers: {
            Authorization: `Bearer ${testData.token}`,
          },
        }
      );

      if (response.data.success) {
        log.success('Profile updated successfully');
        log.info(`New name: ${response.data.data.user.name}`);
        return true;
      }
    } catch (error) {
      log.error(`Update profile failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  },

  // Test 7: Request Password Reset
  async requestPasswordReset() {
    log.step('Test 7: Request Password Reset');
    try {
      const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: TEST_EMAIL,
      });

      if (response.data.success) {
        log.success('Password reset OTP sent');
        log.info(`OTP sent to: ${response.data.data.sentTo}`);
        log.info(`Expires in: ${response.data.data.expiresIn} seconds`);
        return true;
      }
    } catch (error) {
      log.error(`Password reset request failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  },

  // Test 8: Verify Reset OTP (Optional - requires manual OTP input)
  async verifyResetOTP() {
    log.step('Test 8: Verify Password Reset OTP (Optional)');
    log.warning('Skipping OTP verification to avoid password change');
    log.info('To test manually, check email and use the received OTP');
    return 'skipped';
  },

  // Test 9: Change Password
  async changePassword() {
    log.step('Test 9: Change Password');
    const newPassword = 'NewTestPass456!';
    try {
      const response = await axios.put(
        `${BASE_URL}/profile/change-password`,
        {
          currentPassword: TEST_PASSWORD,
          newPassword: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${testData.token}`,
          },
        }
      );

      if (response.data.success) {
        log.success('Password changed successfully');
        
        // Change it back
        log.info('Changing password back to original...');
        await axios.put(
          `${BASE_URL}/profile/change-password`,
          {
            currentPassword: newPassword,
            newPassword: TEST_PASSWORD,
          },
          {
            headers: {
              Authorization: `Bearer ${testData.token}`,
            },
          }
        );
        log.success('Password restored to original');
        return true;
      }
    } catch (error) {
      log.error(`Change password failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  },

  // Test 10: Request Email Change
  async requestEmailChange() {
    log.step('Test 10: Request Email Change (Simulation)');
    const newEmail = 'akash.test+new@gmail.com';
    try {
      const response = await axios.post(
        `${BASE_URL}/profile/change-email/request`,
        { newEmail: newEmail },
        {
          headers: {
            Authorization: `Bearer ${testData.token}`,
          },
        }
      );

      if (response.data.success) {
        log.success('Email change OTP sent');
        log.info(`OTP sent to: ${response.data.data.newEmail}`);
        log.warning('Not completing email change to keep original email');
        return true;
      }
    } catch (error) {
      if (error.response?.status === 409) {
        log.warning('New email already in use - test skipped');
        return 'skipped';
      }
      log.error(`Request email change failed: ${error.response?.data?.message || error.message}`);
      return false;
    }
  },

  // Test 11: Invalid Login Attempt
  async testInvalidLogin() {
    log.step('Test 11: Invalid Login Attempt (Security Test)');
    try {
      await axios.post(`${BASE_URL}/auth/login`, {
        emailOrPhone: TEST_EMAIL,
        password: 'WrongPassword123!',
      });
      log.error('Invalid login should have failed!');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        log.success('Invalid login correctly rejected');
        log.info(`Error message: ${error.response.data.message}`);
        return true;
      }
      log.error(`Unexpected error: ${error.message}`);
      return false;
    }
  },

  // Test 12: Unauthorized Access
  async testUnauthorizedAccess() {
    log.step('Test 12: Unauthorized Access (Security Test)');
    try {
      await axios.get(`${BASE_URL}/profile`);
      log.error('Unauthorized access should have failed!');
      return false;
    } catch (error) {
      if (error.response?.status === 401) {
        log.success('Unauthorized access correctly blocked');
        log.info(`Error message: ${error.response.data.message}`);
        return true;
      }
      log.error(`Unexpected error: ${error.message}`);
      return false;
    }
  },
};

// Main test runner
async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}🧪 Authentication API Test Suite${colors.reset}`);
  console.log(`${colors.cyan}📧 Testing with: ${TEST_EMAIL}${colors.reset}`);
  console.log(`${colors.cyan}🌐 API Base URL: ${BASE_URL}${colors.reset}`);
  console.log('='.repeat(70) + '\n');

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
  };

  try {
    // Phase 1: Registration & Verification
    console.log('\n' + '─'.repeat(70));
    console.log(`${colors.yellow}📝 Phase 1: Registration & Verification${colors.reset}`);
    console.log('─'.repeat(70) + '\n');

    const registerResult = await tests.registerEmail();
    results.total++;
    
    if (registerResult === true) {
      results.passed++;
      await wait(1000);
      
      // Verify email OTP
      const verifyResult = await tests.verifyEmailOTP();
      results.total++;
      if (verifyResult) results.passed++;
      else results.failed++;
      
      await wait(1000);
    } else if (registerResult === 'already_exists') {
      log.info('User already exists - skipping to login tests');
      results.skipped++;
    } else {
      results.failed++;
    }

    // Phase 2: Authentication
    console.log('\n' + '─'.repeat(70));
    console.log(`${colors.yellow}🔐 Phase 2: Authentication${colors.reset}`);
    console.log('─'.repeat(70) + '\n');

    const loginResult = await tests.login();
    results.total++;
    if (loginResult) results.passed++;
    else results.failed++;

    if (!loginResult) {
      log.error('Cannot proceed without login. Stopping tests.');
      return;
    }

    await wait(1000);

    // Phase 3: Profile Management
    console.log('\n' + '─'.repeat(70));
    console.log(`${colors.yellow}👤 Phase 3: Profile Management${colors.reset}`);
    console.log('─'.repeat(70) + '\n');

    const getProfileResult = await tests.getProfile();
    results.total++;
    if (getProfileResult) results.passed++;
    else results.failed++;

    await wait(1000);

    const updateProfileResult = await tests.updateProfile();
    results.total++;
    if (updateProfileResult) results.passed++;
    else results.failed++;

    await wait(1000);

    // Phase 4: Password Management
    console.log('\n' + '─'.repeat(70));
    console.log(`${colors.yellow}🔑 Phase 4: Password Management${colors.reset}`);
    console.log('─'.repeat(70) + '\n');

    const requestResetResult = await tests.requestPasswordReset();
    results.total++;
    if (requestResetResult) results.passed++;
    else results.failed++;

    await wait(1000);

    const verifyResetResult = await tests.verifyResetOTP();
    results.total++;
    if (verifyResetResult === 'skipped') results.skipped++;
    else if (verifyResetResult) results.passed++;
    else results.failed++;

    await wait(1000);

    const changePasswordResult = await tests.changePassword();
    results.total++;
    if (changePasswordResult) results.passed++;
    else results.failed++;

    await wait(1000);

    // Phase 5: Email Change (Optional)
    console.log('\n' + '─'.repeat(70));
    console.log(`${colors.yellow}📧 Phase 5: Email Management${colors.reset}`);
    console.log('─'.repeat(70) + '\n');

    const emailChangeResult = await tests.requestEmailChange();
    results.total++;
    if (emailChangeResult === 'skipped') results.skipped++;
    else if (emailChangeResult) results.passed++;
    else results.failed++;

    await wait(1000);

    // Phase 6: Security Tests
    console.log('\n' + '─'.repeat(70));
    console.log(`${colors.yellow}🛡️  Phase 6: Security Tests${colors.reset}`);
    console.log('─'.repeat(70) + '\n');

    const invalidLoginResult = await tests.testInvalidLogin();
    results.total++;
    if (invalidLoginResult) results.passed++;
    else results.failed++;

    await wait(1000);

    const unauthorizedResult = await tests.testUnauthorizedAccess();
    results.total++;
    if (unauthorizedResult) results.passed++;
    else results.failed++;

  } catch (error) {
    log.error(`Test suite error: ${error.message}`);
  }

  // Final Report
  console.log('\n' + '='.repeat(70));
  console.log(`${colors.cyan}📊 Test Results Summary${colors.reset}`);
  console.log('='.repeat(70));
  console.log(`Total Tests:   ${results.total}`);
  console.log(`${colors.green}✅ Passed:     ${results.passed}${colors.reset}`);
  console.log(`${colors.red}❌ Failed:     ${results.failed}${colors.reset}`);
  console.log(`${colors.yellow}⏭️  Skipped:    ${results.skipped}${colors.reset}`);
  console.log(`Success Rate:  ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(70) + '\n');

  if (results.failed === 0) {
    log.success('All tests passed! 🎉');
  } else {
    log.warning(`${results.failed} test(s) failed. Please review the logs above.`);
  }

  // Save test results
  if (testData.token) {
    console.log(`\n${colors.blue}💾 Saved Test Data:${colors.reset}`);
    console.log(`User ID: ${testData.userId}`);
    console.log(`Token: ${testData.token.substring(0, 50)}...`);
    console.log(`\nYou can use this token for manual API testing:`);
    console.log(`${colors.cyan}export TOKEN="${testData.token}"${colors.reset}`);
  }
}

// Run tests
runTests().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
