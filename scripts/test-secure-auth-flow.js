// scripts/test-secure-auth-flow.js
// Test script for the secure authentication flow

import fetch from 'node-fetch';
import readline from 'readline';
import chalk from 'chalk';

// Create readline interface for interactive input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify readline question
const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Base URL for API
const API_URL = 'http://localhost:4000/api';

// Test user data
const TEST_USER = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'SecurePass123!',
  username: `testuser${Math.floor(Math.random() * 10000)}` // Random username to avoid conflicts
};

// Headers
const headers = {
  'Content-Type': 'application/json'
};

/**
 * Test the secure authentication flow
 */
async function testSecureAuthFlow() {
  try {
    console.log(chalk.cyan('======================================================================'));
    console.log(chalk.cyan('🔐 Secure Authentication Flow Test'));
    console.log(chalk.cyan(`📧 Testing with: ${TEST_USER.email}`));
    console.log(chalk.cyan('======================================================================\n'));

    // Step 1: Register with email
    console.log(chalk.blue('📍 Step 1: Register with Email'));
    const registerResponse = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: TEST_USER.email })
    });
    
    const registerData = await registerResponse.json();
    console.log(chalk.green('✅ Registration initiated'));
    console.log(chalk.gray(`Response: ${JSON.stringify(registerData, null, 2)}`));
    
    if (!registerResponse.ok) {
      if (registerResponse.status === 409) {
        console.log(chalk.yellow('⚠️ User already exists. This is expected for re-runs.'));
      } else {
        throw new Error(`Registration failed: ${registerData.message || 'Unknown error'}`);
      }
    }

    // Step 2: Verify Email OTP
    console.log(chalk.blue('\n📍 Step 2: Verify Email OTP'));
    const otp = await question(chalk.yellow('Enter the 6-digit OTP received in your email: '));
    
    const verifyResponse = await fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email: TEST_USER.email, otp })
    });
    
    const verifyData = await verifyResponse.json();
    
    if (!verifyResponse.ok) {
      throw new Error(`Verification failed: ${verifyData.message || 'Unknown error'}`);
    }
    
    console.log(chalk.green('✅ Email verified successfully'));
    console.log(chalk.gray(`Response: ${JSON.stringify(verifyData, null, 2)}`));
    
    // Check if we need to complete the profile
    if (verifyData.requiresProfileCompletion) {
      // Step 3: Complete Profile
      console.log(chalk.blue('\n📍 Step 3: Complete Profile with Secure Token'));
      const profileToken = verifyData.profileToken;
      
      console.log(chalk.gray(`Using profile token: ${profileToken.substring(0, 20)}...`));
      
      const completeProfileResponse = await fetch(`${API_URL}/auth/complete-profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          profileToken,
          name: TEST_USER.name,
          password: TEST_USER.password,
          username: TEST_USER.username
        })
      });
      
      const completeProfileData = await completeProfileResponse.json();
      
      if (!completeProfileResponse.ok) {
        throw new Error(`Profile completion failed: ${completeProfileData.message || 'Unknown error'}`);
      }
      
      console.log(chalk.green('✅ Profile completed successfully'));
      console.log(chalk.gray(`Response: ${JSON.stringify({
        ...completeProfileData,
        token: completeProfileData.token ? `${completeProfileData.token.substring(0, 20)}...` : null
      }, null, 2)}`));
      
      // Save the token for subsequent requests
      const authToken = completeProfileData.token;
      
      // Step 4: Get User Profile (authenticated)
      console.log(chalk.blue('\n📍 Step 4: Get User Profile (Authenticated)'));
      
      const profileResponse = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          ...headers,
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const profileData = await profileResponse.json();
      
      if (!profileResponse.ok) {
        throw new Error(`Get profile failed: ${profileData.message || 'Unknown error'}`);
      }
      
      console.log(chalk.green('✅ Retrieved user profile successfully'));
      console.log(chalk.gray(`User Profile: ${JSON.stringify(profileData, null, 2)}`));
      
      // Step 5: Refresh Token
      console.log(chalk.blue('\n📍 Step 5: Refresh Token'));
      
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          ...headers,
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      const refreshData = await refreshResponse.json();
      
      if (!refreshResponse.ok) {
        throw new Error(`Token refresh failed: ${refreshData.message || 'Unknown error'}`);
      }
      
      console.log(chalk.green('✅ Token refreshed successfully'));
      console.log(chalk.gray(`New token: ${refreshData.token.substring(0, 20)}...`));
      
    } else {
      // User already has a profile
      console.log(chalk.yellow('\n⚠️ User already has a complete profile'));
      
      // Step 3: Login instead
      console.log(chalk.blue('\n📍 Step 3: Login with Email and Password'));
      
      const loginResponse = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          emailOrPhone: TEST_USER.email,
          password: TEST_USER.password
        })
      });
      
      const loginData = await loginResponse.json();
      
      if (!loginResponse.ok) {
        if (loginResponse.status === 401) {
          console.log(chalk.yellow(`⚠️ Login failed. If this is a test user, the default password is: ${TEST_USER.password}`));
        }
        throw new Error(`Login failed: ${loginData.message || 'Unknown error'}`);
      }
      
      console.log(chalk.green('✅ Login successful'));
      console.log(chalk.gray(`Token: ${loginData.token.substring(0, 20)}...`));
    }

    // Summary
    console.log(chalk.cyan('\n======================================================================'));
    console.log(chalk.cyan('📊 Test Results Summary'));
    console.log(chalk.cyan('======================================================================'));
    console.log(chalk.green('✅ Secure authentication flow completed successfully!'));
    console.log(chalk.cyan('======================================================================\n'));
    
  } catch (error) {
    console.error(chalk.red(`❌ Error: ${error.message}`));
    console.error(chalk.gray(error.stack));
  } finally {
    rl.close();
  }
}

// Run the test
testSecureAuthFlow();
