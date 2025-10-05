// scripts/test-registration-speed.js
// Test script to verify registration speed improvements

import fetch from 'node-fetch';

const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://your-production-url.com'  // Replace with your production URL
  : 'http://localhost:4000';

console.log('🚀 Testing Registration Speed...\n');

async function testRegistration() {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPhone = `+91${Math.floor(6000000000 + Math.random() * 4000000000)}`; // Random 10-digit number

  console.log('📧 Testing email registration...');
  const emailStart = Date.now();

  try {
    const emailResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail
      })
    });

    const emailTime = Date.now() - emailStart;
    const emailResult = await emailResponse.json();

    console.log(`   ⏱️  Response time: ${emailTime}ms`);
    console.log(`   📊 Status: ${emailResponse.status}`);
    console.log(`   ✅ Success: ${emailResult.success}`);

    if (emailTime > 2000) {
      console.log('   ⚠️  WARNING: Response took longer than 2 seconds');
    } else {
      console.log('   ✅ FAST: Response under 2 seconds');
    }

  } catch (error) {
    console.error('   ❌ Email registration test failed:', error.message);
  }

  console.log('\n📱 Testing phone registration...');
  const phoneStart = Date.now();

  try {
    const phoneResponse = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phoneNumber: testPhone
      })
    });

    const phoneTime = Date.now() - phoneStart;
    const phoneResult = await phoneResponse.json();

    console.log(`   ⏱️  Response time: ${phoneTime}ms`);
    console.log(`   📊 Status: ${phoneResponse.status}`);
    console.log(`   ✅ Success: ${phoneResult.success}`);

    if (phoneTime > 2000) {
      console.log('   ⚠️  WARNING: Response took longer than 2 seconds');
    } else {
      console.log('   ✅ FAST: Response under 2 seconds');
    }

  } catch (error) {
    console.error('   ❌ Phone registration test failed:', error.message);
  }

  console.log('\n📈 Summary:');
  console.log('   - Registration should now respond in <500ms (database + token generation only)');
  console.log('   - Email/SMS sending happens asynchronously in background');
  console.log('   - No more 15-second timeouts!');
  console.log('\n🔍 Check server logs for background email/SMS sending confirmation');
}

testRegistration().catch(console.error);
