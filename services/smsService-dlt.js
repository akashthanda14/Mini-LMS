// services/smsService-dlt.js
// Fast2SMS service with DLT compliance for ₹0.15-0.25 per SMS pricing

import axios from 'axios';

const FAST2SMS_API_URL = 'https://www.fast2sms.com/dev/bulkV2';

/**
 * DLT-COMPLIANT OTP ROUTE (₹0.15-0.17 per SMS)
 * 
 * IMPORTANT: This requires DLT (Distributed Ledger Technology) registration
 * 
 * Steps to enable DLT and reduce costs:
 * 1. Go to Fast2SMS Dashboard → DLT Management
 * 2. Register your Entity ID and Template IDs
 * 3. Get approved template for OTP messages
 * 4. Use template variables in this code
 * 
 * Without DLT, Fast2SMS charges ₹5.00 per SMS (Quick route pricing)
 */

/**
 * Send OTP via Fast2SMS OTP Route (DLT Required)
 * Cost: ₹0.15-0.17 per SMS
 */
export const sendOTP = async (phoneNumber, otp, purpose = 'verification') => {
  try {
    if (!process.env.FAST2SMS_API_KEY) {
      console.warn(`⚠️  Fast2SMS not configured. Would send OTP ${otp} to ${phoneNumber}`);
      console.log(`📱 [DEV MODE] SMS OTP for ${phoneNumber}: ${otp}`);
      return { success: true, message: 'SMS not configured (dev mode)', otp };
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      console.error(`❌ Invalid phone number format: ${phoneNumber}`);
      return { success: false, error: 'Invalid phone number format' };
    }

    // METHOD 1: OTP Route (Requires DLT + Website Verification)
    // Message format: "Your OTP: {otp}" (predefined by Fast2SMS)
    const response = await axios.post(
      FAST2SMS_API_URL,
      new URLSearchParams({
        variables_values: otp.toString(), // OTP value only
        route: 'otp', // OTP route - ₹0.15-0.17 per SMS
        numbers: cleanPhone,
      }),
      {
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data && response.data.return) {
      console.log(`✅ OTP sent successfully to ${cleanPhone}`);
      console.log(`📱 Request ID: ${response.data.request_id}`);
      console.log(`💰 Estimated Cost: ₹0.15-0.17`);
      return { 
        success: true, 
        requestId: response.data.request_id,
        message: response.data.message?.[0] || 'OTP sent successfully',
        estimatedCost: '₹0.15-0.17'
      };
    } else {
      console.error('❌ Fast2SMS returned error:', response.data);
      return { 
        success: false, 
        error: response.data.message || 'Failed to send SMS' 
      };
    }

  } catch (error) {
    console.error('❌ Error sending SMS via Fast2SMS:', error.response?.data || error.message);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 [DEV MODE FALLBACK] SMS OTP for ${phoneNumber}: ${otp}`);
      return { success: true, message: 'SMS failed but logged for dev mode', otp };
    }
    
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Send OTP via DLT Template Route (Alternative - Requires DLT Templates)
 * Cost: ₹0.15-0.25 per SMS
 */
export const sendOTPWithDLT = async (phoneNumber, otp, templateId) => {
  try {
    if (!process.env.FAST2SMS_API_KEY) {
      console.warn(`⚠️  Fast2SMS not configured.`);
      return { success: false, error: 'Fast2SMS not configured' };
    }

    if (!templateId) {
      console.error('❌ DLT Template ID required');
      return { success: false, error: 'Template ID required for DLT route' };
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      console.error(`❌ Invalid phone number format: ${phoneNumber}`);
      return { success: false, error: 'Invalid phone number format' };
    }

    // METHOD 2: DLT Template Route
    // Requires: Registered DLT template with variables
    const response = await axios.post(
      FAST2SMS_API_URL,
      new URLSearchParams({
        variables_values: otp.toString(),
        route: 'dlt', // DLT route - ₹0.15-0.25 per SMS
        numbers: cleanPhone,
        template_id: templateId,
      }),
      {
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data && response.data.return) {
      console.log(`✅ DLT SMS sent successfully to ${cleanPhone}`);
      console.log(`📱 Request ID: ${response.data.request_id}`);
      console.log(`💰 Estimated Cost: ₹0.15-0.25`);
      return { 
        success: true, 
        requestId: response.data.request_id,
        message: response.data.message?.[0] || 'SMS sent successfully',
        estimatedCost: '₹0.15-0.25'
      };
    } else {
      console.error('❌ Fast2SMS returned error:', response.data);
      return { 
        success: false, 
        error: response.data.message || 'Failed to send SMS' 
      };
    }

  } catch (error) {
    console.error('❌ Error sending DLT SMS:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Send custom SMS via Transactional Route (Requires DLT)
 * Cost: ₹0.25 per SMS
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    if (!process.env.FAST2SMS_API_KEY) {
      console.warn(`⚠️  Fast2SMS not configured.`);
      return { success: false, error: 'Fast2SMS not configured' };
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      console.error(`❌ Invalid phone number format: ${phoneNumber}`);
      return { success: false, error: 'Invalid phone number format' };
    }

    // Transactional route - requires DLT
    const response = await axios.post(
      FAST2SMS_API_URL,
      new URLSearchParams({
        message: message,
        route: 't', // Transactional route - ₹0.25 per SMS
        numbers: cleanPhone,
      }),
      {
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data && response.data.return) {
      console.log(`✅ SMS sent successfully to ${cleanPhone}`);
      console.log(`💰 Estimated Cost: ₹0.25`);
      return { 
        success: true, 
        requestId: response.data.request_id,
        message: response.data.message?.[0] || 'SMS sent successfully',
        estimatedCost: '₹0.25'
      };
    } else {
      console.error('❌ Fast2SMS returned error:', response.data);
      return { 
        success: false, 
        error: response.data.message || 'Failed to send SMS' 
      };
    }

  } catch (error) {
    console.error('❌ Error sending SMS:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

export const sendFlashSMS = async (phoneNumber, message) => {
  console.warn('⚠️  Flash SMS not recommended - high cost. Use Quick route if needed.');
  return { success: false, error: 'Flash SMS disabled to prevent high charges' };
};

export default {
  sendOTP,
  sendOTPWithDLT,
  sendSMS,
  sendFlashSMS,
};
