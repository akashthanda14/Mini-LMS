// scripts/test-flash-sms.js
// Test script for sendFlashSMS in services/smsService.js

import dotenv from 'dotenv';
import smsService from '../services/smsService.js';

dotenv.config();

const args = process.argv.slice(2);
const phone = args.find(a => !a.startsWith('--')) || '+916239562383';
const message = args.find(a => !a.startsWith('--') && a !== phone) || `Test flash SMS at ${new Date().toISOString()}`;
const forceFlag = args.includes('--force') || args.includes('--f');
const senderArg = args.find(a => a.startsWith('--sender='));
if (forceFlag) process.env.FAST2SMS_ALLOW_FLASH = 'true';
if (senderArg) process.env.FAST2SMS_SENDER_ID = senderArg.split('=')[1];

(async () => {
  try {
    const res = await smsService.sendFlashSMS(phone, message);
    console.log('Result:', res);
  } catch (err) {
    console.error('Test failed:', err);
    process.exit(1);
  }
})();
