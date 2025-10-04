// services/smsService-quickroute.js
// SMS service using Quick Route for all messages (no verification needed)
// This is an alternative to the OTP route that works immediately after recharge

import axios from 'axios';

const FAST2SMS_API_URL = 'https://www.fast2sms.com/dev/bulkV2';

/**
 * Send OTP via Fast2SMS (Quick Route - No Verification Required)
 * Uses Quick route with custom message format
 */
export const sendOTP = async (phoneNumber, otp, purpose = 'verification') => {
  try {
    // Check if Fast2SMS is configured
    if (!process.env.FAST2SMS_API_KEY) {
      console.warn(`⚠️  Fast2SMS not configured. Would send OTP ${otp} to ${phoneNumber}`);
      console.log(`📱 [DEV MODE] SMS OTP for ${phoneNumber}: ${otp}`);
      return { success: true, message: 'SMS not configured (dev mode)', otp };
    }

    // Clean phone number (remove country code if present, keep only 10 digits)
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);

    // Validate phone number
    if (cleanPhone.length !== 10) {
      console.error(`❌ Invalid phone number format: ${phoneNumber}`);
      return { success: false, error: 'Invalid phone number format' };
    }

    // Create message based on purpose
    let message = '';
    const expiryMinutes = process.env.OTP_EXPIRY_MINUTES || 10;
    
    switch (purpose) {
      case 'registration':
        message = `Your registration OTP is ${otp}. Valid for ${expiryMinutes} minutes. Do not share with anyone.`;
        break;
      case 'password_reset':
        message = `Your password reset OTP is ${otp}. Valid for ${expiryMinutes} minutes. Do not share with anyone.`;
        break;
      case 'phone_change':
        message = `Your phone verification OTP is ${otp}. Valid for ${expiryMinutes} minutes. Do not share with anyone.`;
        break;
      default:
        message = `Your OTP is ${otp}. Valid for ${expiryMinutes} minutes. Do not share with anyone.`;
    }

    // Send OTP using Fast2SMS Quick route (works without verification)
    const response = await axios.post(
      FAST2SMS_API_URL,
      new URLSearchParams({
        message: message,
        language: 'english',
        route: 'q', // Quick route - no verification needed
        numbers: cleanPhone,
      }),
      {
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Check Fast2SMS response
    if (response.data && response.data.return) {
      console.log(`✅ SMS OTP sent successfully to ${cleanPhone}`);
      console.log(`📱 Request ID: ${response.data.request_id}`);
      return { 
        success: true, 
        requestId: response.data.request_id,
        message: response.data.message?.[0] || 'OTP sent successfully'
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
    
    // In development, log the OTP even if SMS fails
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
 * Send custom SMS notification via Fast2SMS (Quick Route)
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    // Check if Fast2SMS is configured
    if (!process.env.FAST2SMS_API_KEY) {
      console.warn(`⚠️  Fast2SMS not configured. Would send to ${phoneNumber}: ${message}`);
      return { success: true, message: 'SMS not configured (dev mode)' };
    }

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);

    // Validate phone number
    if (cleanPhone.length !== 10) {
      console.error(`❌ Invalid phone number format: ${phoneNumber}`);
      return { success: false, error: 'Invalid phone number format' };
    }

    // Send SMS using Fast2SMS Quick route
    const response = await axios.post(
      FAST2SMS_API_URL,
      new URLSearchParams({
        message: message,
        language: 'english',
        route: 'q',
        numbers: cleanPhone,
      }),
      {
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    // Check Fast2SMS response
    if (response.data && response.data.return) {
      console.log(`✅ SMS sent successfully to ${cleanPhone}`);
      console.log(`📱 Request ID: ${response.data.request_id}`);
      return { 
        success: true, 
        requestId: response.data.request_id,
        message: response.data.message?.[0] || 'SMS sent successfully'
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
    
    // In development, log the message even if SMS fails
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 [DEV MODE FALLBACK] SMS for ${phoneNumber}: ${message}`);
      return { success: true, message: 'SMS failed but logged for dev mode' };
    }
    
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

/**
 * Send Flash SMS (appears directly on screen)
 */
export const sendFlashSMS = async (phoneNumber, message) => {
  try {
    if (!process.env.FAST2SMS_API_KEY) {
      console.warn(`⚠️  Fast2SMS not configured. Would send flash SMS to ${phoneNumber}: ${message}`);
      return { success: true, message: 'SMS not configured (dev mode)' };
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
      console.error(`❌ Invalid phone number format: ${phoneNumber}`);
      return { success: false, error: 'Invalid phone number format' };
    }

    const response = await axios.post(
      FAST2SMS_API_URL,
      new URLSearchParams({
        message: message,
        language: 'english',
        route: 'q',
        numbers: cleanPhone,
        flash: '1', // Enable flash message
      }),
      {
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    if (response.data && response.data.return) {
      console.log(`✅ Flash SMS sent successfully to ${cleanPhone}`);
      return { 
        success: true, 
        requestId: response.data.request_id,
        message: response.data.message?.[0] || 'Flash SMS sent successfully'
      };
    } else {
      console.error('❌ Fast2SMS returned error:', response.data);
      return { 
        success: false, 
        error: response.data.message || 'Failed to send flash SMS' 
      };
    }

  } catch (error) {
    console.error('❌ Error sending flash SMS via Fast2SMS:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.message || error.message 
    };
  }
};

export default {
  sendOTP,
  sendSMS,
  sendFlashSMS,
};
