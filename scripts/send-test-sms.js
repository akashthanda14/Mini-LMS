// send-test-sms.js
// Send test SMS to specific number

import 'dotenv/config';
import { sendOTP, sendSMS } from '../services/smsService.js';

const testNumber = '+916239562383';

const sendTestMessages = async () => {
  console.log('📱 Sending test messages to:', testNumber);
  console.log('=' .repeat(60));
  
  // Test 1: Send OTP
  console.log('\n📤 Test 1: Sending OTP...');
  const otpResult = await sendOTP(testNumber, '123456', 'registration');
  
  console.log('\n📊 OTP Result:');
  console.log('  Success:', otpResult.success);
  if (otpResult.success) {
    console.log('  Request ID:', otpResult.requestId);
    console.log('  Message:', otpResult.message);
  } else {
    console.log('  Error:', otpResult.error);
  }
  
  // Wait 3 seconds before next SMS
  console.log('\n⏳ Waiting 3 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Test 2: Send Custom SMS
  console.log('📤 Test 2: Sending custom message...');
  const smsResult = await sendSMS(
    testNumber,
    'Hello! This is a test message from your LMS. Integration is working!'
  );
  
  console.log('\n📊 SMS Result:');
  console.log('  Success:', smsResult.success);
  if (smsResult.success) {
    console.log('  Request ID:', smsResult.requestId);
    console.log('  Message:', smsResult.message);
  } else {
    console.log('  Error:', smsResult.error);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('✅ Test completed!\n');
};

// Run test
sendTestMessages().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
