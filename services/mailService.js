// services/mailService.js
// Email service for sending verification emails and OTPs

import nodemailer from 'nodemailer';

// Create reusable transporter
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
      },
    });
  }
  return transporter;
};

/**
 * Send OTP via email
 */
export const sendOTPEmail = async (email, otp, purpose = 'verification') => {
  try {
    const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
    
    if (!emailUser || !emailPass) {
      console.warn('⚠️  Email configuration not set. OTP:', otp);
      console.log(`📧 [DEV MODE] Email OTP for ${email}: ${otp}`);
      return { success: true, message: 'Email not configured (dev mode)' };
    }

    const transport = getTransporter();

    let subject = '';
    let text = '';

    switch (purpose) {
      case 'registration':
        subject = 'Verify Your Email - OTP Code';
        text = `Your OTP code for registration is: ${otp}\n\nThis code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.\n\nIf you didn't request this code, please ignore this email.`;
        break;
      case 'password_reset':
        subject = 'Password Reset - OTP Code';
        text = `Your OTP code for password reset is: ${otp}\n\nThis code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.\n\nIf you didn't request this code, please contact support immediately.`;
        break;
      case 'email_change':
        subject = 'Email Change Verification - OTP Code';
        text = `Your OTP code for email change is: ${otp}\n\nThis code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`;
        break;
      default:
        subject = 'Verification Code';
        text = `Your verification code is: ${otp}\n\nThis code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.`;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER,
      to: email,
      subject,
      text,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">${subject}</h2>
          <p style="font-size: 16px; color: #666;">Your verification code is:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <h1 style="color: #4CAF50; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p style="font-size: 14px; color: #999;">This code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
          <p style="font-size: 14px; color: #999;">If you didn't request this code, please ignore this email.</p>
        </div>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    console.log(`📧 [FALLBACK] OTP for ${email}: ${otp}`);
    return { success: false, error: error.message };
  }
};

/**
 * Send verification email with link and OTP
 */
export const sendVerificationEmail = async (email, otp = null, userName = 'User') => {
  try {
    const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
    
    if (!emailUser || !emailPass) {
      console.warn('⚠️  Email configuration not set.');
      console.log(`📧 [DEV MODE] Verification link: ${verificationLink}`);
      if (otp) console.log(`📧 [DEV MODE] OTP: ${otp}`);
      return { success: true, message: 'Email not configured (dev mode)' };
    }

    const transport = getTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || emailUser,
      to: email,
      subject: 'Your verification code - LMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h2 style="color: #333; margin-bottom: 10px;">Hello ${userName},</h2>
            <p style="font-size: 15px; color: #666;">Use the following one-time code to verify your email address:</p>
            ${otp ? `
            <div style="background-color: #f7fafc; padding: 18px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <h1 style="color: #111827; font-size: 34px; margin: 0; letter-spacing: 6px; font-weight: 700;">${otp}</h1>
              <p style="font-size: 12px; color: #9ca3af; margin-top: 8px;">Expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes</p>
            </div>
            ` : ''}
            <p style="font-size: 13px; color: #777; margin-top: 10px;">If you didn't request this, please ignore this message.</p>
          </div>
          <div style="text-align: center; margin-top: 18px; color: #9ca3af; font-size: 12px;">
            <p>© ${new Date().getFullYear()} LMS</p>
          </div>
        </div>
      `,
    };

    // ADD TIMEOUT: Max 3 seconds for email send in production
    const timeoutMs = process.env.NODE_ENV === 'production' ? 3000 : 10000;
    const sendPromise = transport.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Email timeout after ${timeoutMs}ms`)), timeoutMs)
    );

    await Promise.race([sendPromise, timeoutPromise]);
    console.log(`✅ Verification email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending verification email:', error);
    if (otp) console.log(`📧 [FALLBACK] OTP for ${email}: ${otp}`);
    return { success: false, error: error.message };
  }
};

/**
 * Send welcome email
 */
export const sendWelcomeEmail = async (email, name) => {
  try {
    const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;
    
    if (!emailUser || !emailPass) {
      console.warn('Email configuration not set.');
      return { success: true, message: 'Email not configured (dev mode)' };
    }

    const transport = getTransporter();

    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Our Platform!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome ${name || 'User'}!</h2>
          <p style="font-size: 16px; color: #666;">Thank you for joining our platform. We're excited to have you on board!</p>
          <p style="font-size: 14px; color: #999;">If you have any questions, feel free to contact our support team.</p>
        </div>
      `,
    };

    await transport.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

export default {
  sendOTPEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
};
