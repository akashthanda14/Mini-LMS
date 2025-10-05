// services/smsService.js
// SMS service using OTP Route for cost-effective OTP delivery (₹0.15/SMS)
// Requires Fast2SMS website verification to be completed

import axios from 'axios';

const FAST2SMS_API_URL = 'https://www.fast2sms.com/dev/bulkV2';

// Promotional route config (provider-specific). Set FAST2SMS_PROMO_ROUTE to the
// exact route string expected by Fast2SMS for promotional/quick SMS (e.g. 'quick' or provider value).
const PROMO_ROUTE = process.env.FAST2SMS_PROMO_ROUTE || 'quick';
const SENDER_ID = process.env.FAST2SMS_SENDER_ID || null;

/**
 * Send OTP via Fast2SMS (OTP Route - ₹0.15/SMS)
 * Requires website verification to be completed on Fast2SMS dashboard
 * Message format: "Your OTP: {otp}" (predefined by Fast2SMS)
 */
export const sendOTP = async (phoneNumber, otp, purpose = 'verification') => {
  try {
  // If explicitly forced, use transactional route directly (costly)
  const forceTransactional = process.env.FAST2SMS_FORCE_TRANSACTIONAL === 'true';
  const forcePromo = process.env.FAST2SMS_FORCE_PROMO === 'true';
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

    // If forced to transactional, skip OTP route and send via transactional route
    if (forceTransactional) {
      console.warn('⚠️ FAST2SMS_FORCE_TRANSACTIONAL=true — sending OTP over transactional route (costly)');
      try {
    const txResp = await axios.post(
          FAST2SMS_API_URL,
          new URLSearchParams({
      message: `Your OTP is ${otp}. Do not share with anyone.`,
      language: 'english',
      route: 't',
      numbers: cleanPhone,
      ...(SENDER_ID ? { sender_id: SENDER_ID } : {}),
          }),
          {
            headers: {
              'authorization': process.env.FAST2SMS_API_KEY,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: process.env.NODE_ENV === 'production' ? 5000 : 15000,
          }
        );

        if (txResp.data && txResp.data.return) {
          console.log(`✅ Transactional SMS sent to ${cleanPhone}`);
          return {
            success: true,
            requestId: txResp.data.request_id,
            message: txResp.data.message?.[0] || 'OTP sent via transactional route',
            cost: '₹0.25',
            route: 'transactional',
            forced: true,
          };
        }

        console.error('❌ Transactional send returned error:', txResp.data);
      } catch (txErr) {
        console.error('❌ Transactional send failed:', txErr.response?.data || txErr.message);
        // If in development, still log the OTP
        if (process.env.NODE_ENV === 'development') {
          console.log(`📱 [DEV MODE FALLBACK] SMS OTP for ${phoneNumber}: ${otp}`);
          return { success: true, message: 'Transactional attempt failed but logged for dev mode', otp };
        }
        return { success: false, error: txErr.response?.data?.message || txErr.message };
      }
    }

    // If explicitly forced to promotional/quick route (very costly), attempt it
    if (forcePromo) {
      console.warn('⚠️ FAST2SMS_FORCE_PROMO=true — sending OTP over promotional/quick route (very costly)');
      try {
        const promoResp = await axios.post(
          FAST2SMS_API_URL,
          new URLSearchParams({
            message: `Your OTP is ${otp}. Do not share with anyone.`,
            language: 'english',
            route: PROMO_ROUTE, // promotional/quick route
            numbers: cleanPhone,
            ...(SENDER_ID ? { sender_id: SENDER_ID } : {}),
          }),
          {
            headers: {
              'authorization': process.env.FAST2SMS_API_KEY,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: process.env.NODE_ENV === 'production' ? 5000 : 15000,
          }
        );

        if (promoResp.data && promoResp.data.return) {
          console.log(`✅ Promotional SMS sent to ${cleanPhone}`);
          return {
            success: true,
            requestId: promoResp.data.request_id,
            message: promoResp.data.message?.[0] || 'OTP sent via promotional route',
            cost: '₹5.00',
            route: 'promotional',
            forced: true,
          };
        }

        console.error('❌ Promotional send returned error:', promoResp.data);
      } catch (promoErr) {
        console.error('❌ Promotional send failed:', promoErr.response?.data || promoErr.message);
        if (process.env.NODE_ENV === 'development') {
          console.log(`📱 [DEV MODE FALLBACK] SMS OTP for ${phoneNumber}: ${otp}`);
          return { success: true, message: 'Promotional attempt failed but logged for dev mode', otp };
        }
        return { success: false, error: promoErr.response?.data?.message || promoErr.message };
      }
    }

    // Send OTP using Fast2SMS OTP route (₹0.15/SMS)
    // Note: This requires website verification to be completed
    // Message will be: "Your OTP: {otp}" (predefined by Fast2SMS)
    const response = await axios.post(
      FAST2SMS_API_URL,
      new URLSearchParams({
        variables_values: otp.toString(), // Just the OTP number
        route: 'otp', // OTP route - ₹0.15/SMS (requires verification)
        numbers: cleanPhone,
      }),
      {
        headers: {
          'authorization': process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: process.env.NODE_ENV === 'production' ? 3000 : 10000, // 3s prod, 10s dev
      }
    );

    // Check Fast2SMS response
    if (response.data && response.data.return) {
      console.log(`✅ SMS OTP sent successfully to ${cleanPhone}`);
      console.log(`📱 Request ID: ${response.data.request_id}`);
      console.log(`💰 Cost: ₹0.15 (OTP Route)`);
      return { 
        success: true, 
        requestId: response.data.request_id,
        message: response.data.message?.[0] || 'OTP sent successfully',
        cost: '₹0.15',
        route: 'otp'
      };
    } else {
      console.error('❌ Fast2SMS returned error:', response.data);

      // Check if error is due to pending verification
      if (response.data?.status_code === 996) {
        console.error('⚠️  Website verification not completed yet.');
        console.error('📝 Please complete verification at: https://www.fast2sms.com/dashboard → OTP Message');

        // If configured, attempt the costlier transactional route as a fallback
        if (process.env.FAST2SMS_USE_TRANSACTIONAL === 'true') {
          console.warn('⚠️ FAST2SMS_USE_TRANSACTIONAL=true — attempting transactional (costlier) fallback');
          try {
      const txResponse = await axios.post(
              FAST2SMS_API_URL,
              new URLSearchParams({
        message: `Your OTP is ${otp}. Do not share with anyone.`,
                language: 'english',
                route: 't',
                numbers: cleanPhone,
              }),
              {
                headers: {
                  'authorization': process.env.FAST2SMS_API_KEY,
                  'Content-Type': 'application/x-www-form-urlencoded',
                },
                timeout: process.env.NODE_ENV === 'production' ? 5000 : 15000,
              }
            );

            if (txResponse.data && txResponse.data.return) {
              console.log(`✅ Transactional SMS sent as fallback to ${cleanPhone}`);
              console.log(`📱 Request ID: ${txResponse.data.request_id}`);
              console.log(`💰 Cost: ₹0.25 (Transactional Route)`);
              return {
                success: true,
                requestId: txResponse.data.request_id,
                message: txResponse.data.message?.[0] || 'OTP sent via transactional route',
                cost: '₹0.25',
                route: 'transactional',
                fallback: true,
              };
            }
            console.error('❌ Transactional fallback returned error:', txResponse.data);
          } catch (txErr) {
            console.error('❌ Transactional fallback failed:', txErr.response?.data || txErr.message);
          }
        }

        return {
          success: false,
          error: 'Website verification required. Please complete at Fast2SMS dashboard.',
          errorCode: 996,
          verificationUrl: 'https://www.fast2sms.com/dashboard'
        };
      }

      return { 
        success: false, 
        error: response.data.message || 'Failed to send SMS' 
      };
    }

  } catch (error) {
    console.error('❌ Error sending SMS via Fast2SMS:', error.response?.data || error.message);
    
    // Check if error is due to pending verification
    if (error.response?.data?.status_code === 996) {
      console.error('⚠️  Website verification not completed yet.');
      console.error('📝 Complete verification at: https://www.fast2sms.com/dashboard → OTP Message');
      console.error('⏳ Meanwhile, OTP will be logged in console for development.');
      
      // In development, log the OTP
      if (process.env.NODE_ENV === 'development') {
        console.log(`📱 [DEV MODE - VERIFICATION PENDING] SMS OTP for ${phoneNumber}: ${otp}`);
        return { 
          success: true, 
          message: 'Verification pending - OTP logged for dev mode', 
          otp,
          pendingVerification: true
        };
      }
      
      return {
        success: false,
        error: 'Website verification required. Please complete at Fast2SMS dashboard.',
        errorCode: 996,
        verificationUrl: 'https://www.fast2sms.com/dashboard'
      };
    }
    
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
 * Send custom SMS notification via Fast2SMS (Transactional Route)
 * Uses Transactional route for custom messages (₹0.25/SMS)
 * Note: Requires DLT templates for production use
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    // Check if Fast2SMS is configured
    if (!process.env.FAST2SMS_API_KEY) {
      console.warn(`⚠️  Fast2SMS not configured. Would send to ${phoneNumber}: ${message}`);
      return { success: true, message: 'SMS not configured (dev mode)' };
    }

    // Clean phone number (remove country code if present, keep only 10 digits)
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);

    // Validate phone number
    if (cleanPhone.length !== 10) {
      console.error(`❌ Invalid phone number format: ${phoneNumber}`);
      return { success: false, error: 'Invalid phone number format' };
    }

    // Send SMS using Fast2SMS Transactional route (₹0.25/SMS)
    const response = await axios.post(
      FAST2SMS_API_URL,
      new URLSearchParams({
        message: message,
        language: 'english',
        route: 't', // Transactional route - ₹0.25/SMS
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
      console.log(`💰 Cost: ₹0.25 (Transactional Route)`);
      return { 
        success: true, 
        requestId: response.data.request_id,
        message: response.data.message?.[0] || 'SMS sent successfully',
        cost: '₹0.25',
        route: 'transactional'
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
 * WARNING: Disabled to prevent high costs
 * Flash SMS typically uses Quick route (₹5.00/SMS)
 */
export const sendFlashSMS = async (phoneNumber, message) => {
  console.warn('⚠️  Flash SMS (quick/flash) is guarded. Enable FAST2SMS_ALLOW_FLASH=true to send (costly).');

  // Development: always log and return success to avoid accidental charges
  if (process.env.NODE_ENV === 'development') {
    console.log(`📱 [DEV MODE] Would send flash SMS to ${phoneNumber}: ${message}`);
    return {
      success: true,
      message: 'Flash SMS disabled - logged for dev mode',
      disabled: true,
    };
  }

  // Production: guarded by FAST2SMS_ALLOW_FLASH
  if (process.env.FAST2SMS_ALLOW_FLASH !== 'true') {
    return {
      success: false,
      error: 'Flash SMS disabled. Set FAST2SMS_ALLOW_FLASH=true to enable after confirming sender ID/DLT templates.',
      disabled: true,
    };
  }

  // Safety: require API key and sender id
  if (!process.env.FAST2SMS_API_KEY) {
    console.error('❌ FAST2SMS_API_KEY missing. Cannot send flash SMS.');
    return { success: false, error: 'FAST2SMS_API_KEY missing' };
  }
  const sender = process.env.FAST2SMS_SENDER_ID || SENDER_ID;
  if (!sender) {
    console.error('❌ FAST2SMS_SENDER_ID missing. Cannot send flash SMS.');
    return { success: false, error: 'FAST2SMS_SENDER_ID missing' };
  }

  // Clean phone number
  const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
  if (cleanPhone.length !== 10) {
    console.error(`❌ Invalid phone number format: ${phoneNumber}`);
    return { success: false, error: 'Invalid phone number format' };
  }

  // Attempt to send via promotional/quick route (costly)
  try {
    const resp = await axios.post(
      FAST2SMS_API_URL,
      new URLSearchParams({
        message,
        language: 'english',
        route: PROMO_ROUTE,
        numbers: cleanPhone,
        sender_id: sender,
      }),
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: process.env.NODE_ENV === 'production' ? 8000 : 20000,
      }
    );

    if (resp.data && resp.data.return) {
      console.log(`✅ Flash SMS sent to ${cleanPhone}`);
      return { success: true, requestId: resp.data.request_id, message: resp.data.message?.[0] || 'Flash SMS sent', cost: '₹5.00', route: 'promotional' };
    }

    console.error('❌ Flash SMS failed:', resp.data);
    return { success: false, error: resp.data || 'Failed to send flash SMS' };
  } catch (err) {
    console.error('❌ Error sending flash SMS:', err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
};

export default {
  sendOTP,
  sendSMS,
  sendFlashSMS,
};

/**
 * Send a raw/direct request to the Fast2SMS API using the provided params.
 * Useful for testing arbitrary payloads or using provider-specific fields.
 * Params: an object that will be serialized as application/x-www-form-urlencoded
 */
export const sendDirect = async (params = {}) => {
  try {
    // Inject API key / sender / template defaults where appropriate
    const outParams = { ...params };

    // Ensure numbers present and in cleaned format if provided
    if (outParams.numbers) {
      outParams.numbers = outParams.numbers.toString().replace(/\D/g, '').slice(-10);
    }

    // If sender_id not provided, try env
    if (!outParams.sender_id && (process.env.FAST2SMS_SENDER_ID || SENDER_ID)) {
      outParams.sender_id = process.env.FAST2SMS_SENDER_ID || SENDER_ID;
      console.log(`ℹ️ sendDirect: injecting sender_id=${outParams.sender_id}`);
    }

    // If no explicit template param provided, try common env vars
    if (!outParams.template_id && !outParams.template && process.env.FAST2SMS_TEMPLATE_ID) {
      outParams.template_id = process.env.FAST2SMS_TEMPLATE_ID;
      console.log(`ℹ️ sendDirect: injecting template_id from FAST2SMS_TEMPLATE_ID`);
    }

    if (!process.env.FAST2SMS_API_KEY) {
      console.warn('⚠️  Fast2SMS not configured. sendDirect would POST:', outParams);
      return { success: true, message: 'Fast2SMS not configured (dev)', params: outParams };
    }

    // Allow GET method if requested (some Fast2SMS examples use GET)
    let response;
    const useGet = outParams._method === 'GET' || outParams._useGet === 'true' || process.env.FAST2SMS_USE_GET === 'true';
    // remove control params before sending
    delete outParams._method;
    delete outParams._useGet;

    if (useGet) {
      console.log('ℹ️ sendDirect: using GET request for Fast2SMS');
      response = await axios.get(FAST2SMS_API_URL, {
        params: outParams,
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
        },
        timeout: process.env.NODE_ENV === 'production' ? 8000 : 20000,
      });
    } else {
      response = await axios.post(
        FAST2SMS_API_URL,
        new URLSearchParams(outParams),
        {
          headers: {
            authorization: process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: process.env.NODE_ENV === 'production' ? 8000 : 20000,
        }
      );
    }

    console.log('📡 Fast2SMS direct response:', response.data);
    return { success: true, data: response.data };
  } catch (err) {
    console.error('❌ Error in sendDirect:', err.response?.data || err.message);
    return { success: false, error: err.response?.data || err.message };
  }
};

// named export already provided above via `export const sendDirect = ...` so no extra export here
