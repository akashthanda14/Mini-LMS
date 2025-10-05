// scripts/send-otp-test.js
// Quick script to test SMS sending via services/smsService.js

import dotenv from 'dotenv';
import { sendOTP, sendDirect } from '../services/smsService.js';

dotenv.config();

const args = process.argv.slice(2);
const phoneArg = args.find(a => !a.startsWith('--'));
const otpArg = args.find(a => /^\d{6}$/.test(a)) || String(Math.floor(100000 + Math.random() * 900000));
const transactionalFlag = args.includes('--transactional') || args.includes('-t');
const promoFlag = args.includes('--promo') || args.includes('-p');
const routeArg = args.find(a => a.startsWith('--route='));
const promoRoute = routeArg ? routeArg.split('=')[1] : null;
const directFlag = args.includes('--direct') || args.includes('-d');
const getFlag = args.includes('--get') || args.includes('-g');
// collect any key=value args after flags for direct mode
const kvArgs = args.filter(a => a.includes('=') && !a.startsWith('--route='));

if (!phoneArg) {
  console.error('Usage: node scripts/send-otp-test.js <phoneNumber> [otp]');
  process.exit(1);
}

(async () => {
  try {
  if (transactionalFlag) process.env.FAST2SMS_FORCE_TRANSACTIONAL = 'true';
  if (promoFlag) process.env.FAST2SMS_FORCE_PROMO = 'true';
  if (promoRoute) process.env.FAST2SMS_PROMO_ROUTE = promoRoute;

  if (directFlag) {
    // build params map: include numbers and message/variables_values by default
    const params = {};
    // default useful params for direct testing
    params.numbers = phoneArg.replace(/\D/g, '').slice(-10);
    params.message = `Your OTP is ${otpArg}. Do not share with anyone.`;
    // override/add from kvArgs
    kvArgs.forEach(kv => {
      const [k, v] = kv.split('=');
      if (k && v !== undefined) params[k] = v;
    });

  if (getFlag) params._useGet = 'true';

    console.log('Sending direct API request with params:', params);
    const res = await sendDirect(params);
    console.log('Result:', res);
    return;
  }

  console.log(`Sending OTP ${otpArg} to ${phoneArg}... (transactional=${transactionalFlag}, promo=${promoFlag}, route=${promoRoute || 'default'})`);
  const res = await sendOTP(phoneArg, otpArg);
    console.log('Result:', res);
  } catch (err) {
    console.error('Error during sendOTP test:', err.message || err);
  }
})();
