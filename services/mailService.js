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
export const sendVerificationEmail = async (email, verificationLink, otp = null, userName = 'User') => {
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
      subject: 'Verify Your Email Address - LMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-bottom: 20px;">Verify Your Email Address</h2>
            <p style="font-size: 16px; color: #666; line-height: 1.5;">
              Hello ${userName},<br><br>
              Thank you for registering! Please verify your email address to complete your registration.
            </p>
            
            ${otp ? `
            <div style="background-color: #f4f4f4; padding: 20px; text-align: center; border-radius: 5px; margin: 25px 0;">
              <p style="font-size: 14px; color: #666; margin-bottom: 10px;">Your verification code is:</p>
              <h1 style="color: #4CAF50; font-size: 36px; margin: 10px 0; letter-spacing: 8px; font-weight: bold;">${otp}</h1>
              <p style="font-size: 12px; color: #999; margin-top: 10px;">This code will expire in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes</p>
            </div>
            ` : ''}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 14px 40px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block; font-weight: bold;">Verify Email</a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999; margin-bottom: 5px;">Or copy and paste this link into your browser:</p>
              <p style="font-size: 11px; color: #666; word-break: break-all; background-color: #f4f4f4; padding: 10px; border-radius: 3px;">${verificationLink}</p>
            </div>
            
            <p style="font-size: 13px; color: #999; margin-top: 20px; line-height: 1.5;">
              This verification link will expire in 24 hours.<br>
              If you didn't create an account, please ignore this email.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} LMS. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transport.sendMail(mailOptions);
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
