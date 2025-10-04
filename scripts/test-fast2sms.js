// test-fast2sms.js
// Quick test script for Fast2SMS integration

import 'dotenv/config';
import { sendOTP, sendSMS } from '../services/smsService.js';

const testFast2SMS = async () => {
  console.log('🧪 Testing Fast2SMS Integration...\n');

  // Test 1: Send OTP
  console.log('📱 Test 1: Sending OTP...');
  const otpResult = await sendOTP('9876543210', '123456', 'registration');
  
  if (otpResult.success) {
    console.log('✅ OTP Test Passed!');
    console.log(`   Request ID: ${otpResult.requestId}`);
    console.log(`   Message: ${otpResult.message}\n`);
  } else {
    console.log('❌ OTP Test Failed!');
    console.log(`   Error: ${otpResult.error}\n`);
  }

  // Test 2: Send Custom SMS
  console.log('📱 Test 2: Sending Custom SMS...');
  const smsResult = await sendSMS(
    '9876543210', 
    'Welcome to our LMS! This is a test message.'
  );
  
  if (smsResult.success) {
    console.log('✅ Custom SMS Test Passed!');
    console.log(`   Request ID: ${smsResult.requestId}`);
    console.log(`   Message: ${smsResult.message}\n`);
  } else {
    console.log('❌ Custom SMS Test Failed!');
    console.log(`   Error: ${smsResult.error}\n`);
  }

  console.log('🎉 Fast2SMS integration test completed!\n');
};

// Run tests
testFast2SMS().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});
