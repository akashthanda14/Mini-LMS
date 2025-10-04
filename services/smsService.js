// services/smsService.js
// SMS service for sending OTPs via Twilio

// Note: Twilio is optional. If not configured, SMS will be logged to console.

let twilioClient = null;

const getTwilioClient = async () => {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const twilio = await import('twilio');
      twilioClient = twilio.default(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    } catch (error) {
      console.warn('Twilio not configured or failed to initialize:', error.message);
    }
  }
  return twilioClient;
};

/**
 * Send OTP via SMS
 */
export const sendOTP = async (phoneNumber, otp, purpose = 'verification') => {
  try {
    // Check if Twilio is configured
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.warn(`⚠️  SMS not configured. Would send OTP ${otp} to ${phoneNumber}`);
      console.log(`📱 [DEV MODE] SMS OTP for ${phoneNumber}: ${otp}`);
      return { success: true, message: 'SMS not configured (dev mode)', otp };
    }

    const client = await getTwilioClient();
    
    if (!client) {
      console.warn(`⚠️  Twilio client not available. Would send OTP ${otp} to ${phoneNumber}`);
      console.log(`📱 [DEV MODE] SMS OTP for ${phoneNumber}: ${otp}`);
      return { success: true, message: 'SMS not configured (dev mode)', otp };
    }

    let message = '';
    
    switch (purpose) {
      case 'registration':
        message = `Your verification code is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`;
        break;
      case 'password_reset':
        message = `Your password reset code is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`;
        break;
      case 'phone_change':
        message = `Your phone change verification code is: ${otp}. Valid for ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`;
        break;
      default:
        message = `Your verification code is: ${otp}`;
    }

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`✅ SMS sent successfully to ${phoneNumber}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending SMS:', error);
    
    // In development, log the OTP even if SMS fails
    if (process.env.NODE_ENV === 'development') {
      console.log(`📱 [DEV MODE FALLBACK] SMS OTP for ${phoneNumber}: ${otp}`);
      return { success: true, message: 'SMS failed but logged for dev mode', otp };
    }
    
    return { success: false, error: error.message };
  }
};

/**
 * Send SMS notification
 */
export const sendSMS = async (phoneNumber, message) => {
  try {
    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
      console.warn(`SMS not configured. Would send to ${phoneNumber}: ${message}`);
      return { success: true, message: 'SMS not configured (dev mode)' };
    }

    const client = await getTwilioClient();
    
    if (!client) {
      console.warn(`Twilio client not available. Would send to ${phoneNumber}: ${message}`);
      return { success: true, message: 'SMS not configured (dev mode)' };
    }

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`SMS sent to ${phoneNumber}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendOTP,
  sendSMS,
};
