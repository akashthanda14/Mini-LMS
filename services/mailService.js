// services/mailService.js
// Email service for sending verification emails and OTPs

import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';

// --- Constants ---
const RESET_TOKEN_EXPIRATION_MINUTES = 60; // Used in password reset email
const OTP_EXPIRATION_MINUTES = 10; // OTP expiration time

// --- Environment Variable Validation ---
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false, // Avoid self-signed cert errors
  },
});

// Verify transporter configuration at startup
(async () => {
  try {
    await transporter.verify();
    console.log('Email transporter is ready to send messages');
  } catch (error) {
    console.error('Email transporter configuration error:', error);
    throw new Error(`Failed to initialize email transporter: ${error.message}`);
  }
})();

// --- General Send Email Function ---
/**
 * Internal helper to send an email.
 * @param {Object} mailOptions - Nodemailer mailOptions
 * @returns {Promise<Object>} Email sending result
 * @throws {Error} If mailOptions is invalid or email sending fails
 */
const sendEmail = async (mailOptions) => {
  try {
    // Validate mailOptions
    if (!mailOptions || typeof mailOptions !== 'object') {
      throw new Error('Invalid mail options');
    }
    const { from, to, subject, html } = mailOptions;
    if (!to || typeof to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new Error('Invalid recipient email address');
    }
    if (!subject || typeof subject !== 'string') {
      throw new Error('Invalid email subject');
    }
    if (!html || typeof html !== 'string') {
      throw new Error('Invalid email HTML content');
    }
    if (from && from !== `"MicroCourse LMS" <${process.env.EMAIL_USER}>`) {
      throw new Error('Invalid sender address');
    }

    const info = await transporter.sendMail({
      from: `"MicroCourse LMS" <${process.env.EMAIL_USER}>`, // Ensure consistent sender
      ...mailOptions,
    });
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// ===========================
// Welcome Email
// ===========================
/**
 * Sends a welcome email to a new user.
 * @param {string} toEmail - Recipient email address
 * @param {string} [userName] - User's name (optional)
 * @returns {Promise<void>}
 * @throws {Error} If inputs are invalid or email sending fails
 */
export const sendWelcomeEmail = async (toEmail, userName = null) => {
  try {
    // Validate inputs
    if (!toEmail || typeof toEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      throw new Error('Invalid recipient email address');
    }
    if (userName && typeof userName !== 'string') {
      throw new Error('Invalid user name: must be a string');
    }

    const mailOptions = {
      from: `"MicroCourse LMS" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Welcome to MicroCourse LMS',
      html: `
        <div style="font-family: Arial, sans-serif; color: #222; max-width: 600px; margin: auto; background: #fafafa; padding: 32px; border-radius: 12px;">
          <h1 style="color: #0f172a;">Welcome to MicroCourse LMS, ${userName || 'Learner'}!</h1>
          <p style="font-size: 1.05em; line-height: 1.6; color:#374151;">
            Thank you for joining <strong>MicroCourse LMS</strong>. We're excited to support your learning journey with bite-sized courses and practical content.
          </p>
          <p style="font-size: 1em; line-height: 1.6; color:#374151;">
            Get started: <a href="${process.env.FRONTEND_URL || 'https://microcourse.example'}" style="color: #2563eb; text-decoration: underline;">Visit your dashboard</a> and explore recommended courses.
          </p>
          <hr style="margin: 28px 0;" />
          <p style="font-size: 0.95em; color: #6b7280;">
            Best regards,<br/>
            The MicroCourse LMS Team
          </p>
        </div>
      `,
    };
    await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
};

// ===========================
// Email Verification Email (OTP-only)
// ===========================
/**
 * Sends an email with an OTP for email verification (no verification link).
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - OTP code for verification
 * @param {string} [userName] - User's name (optional)
 * @returns {Promise<void>}
 * @throws {Error} If inputs are invalid or email sending fails
 */
export const sendVerificationEmail = async (toEmail, otp, userName = null) => {
  try {
    // Validate inputs
    if (!toEmail || typeof toEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      throw new Error('Invalid recipient email address');
    }
    if (!otp || typeof otp !== 'string') {
      throw new Error('Invalid OTP code');
    }
    if (userName && typeof userName !== 'string') {
      throw new Error('Invalid user name: must be a string');
    }

    const displayName = userName || 'Learner';

    const mailOptions = {
      from: `"MicroCourse LMS" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Verify Your Email – MicroCourse LMS',
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; max-width: 680px; margin: auto; background: #ffffff; padding: 28px; border-radius: 8px; border: 1px solid #e6eef8;">
          <div style="text-align: center; margin-bottom: 18px;">
            <h1 style="color: #0f172a; margin-bottom: 6px;">Verify Your Email</h1>
            <p style="color: #6b7280; font-size: 14px; margin: 0;">Hello ${displayName},</p>
          </div>
          <p style="font-size: 15px; color: #374151;">
            Welcome to <strong>MicroCourse LMS</strong>. Use the code below to verify your email and access your learning dashboard.
          </p>
          <div style="background:#f1f5f9;padding:18px;border-radius:8px;text-align:center;margin:26px 0;">
            <p style="margin:0;font-size:24px;font-weight:700;letter-spacing:6px;color:#1f2937;">${otp}</p>
            <p style="margin-top:8px;color:#6b7280;font-size:13px;">This code expires in ${OTP_EXPIRATION_MINUTES} minutes</p>
          </div>
          <hr style="margin:22px 0;border:none;border-top:1px solid #e6eef8;" />
          <p style="font-size:12px;color:#9ca3af;text-align:center;">
            If you did not request this, ignore this email. © ${new Date().getFullYear()} MicroCourse LMS.
          </p>
        </div>
      `,
    };
    await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
};

// ===========================
// OTP-Only Email
// ===========================
/**
 * Sends an email with OTP only (no verification link).
 * @param {string} toEmail - Recipient email address
 * @param {string} [userName='User'] - User's name (optional)
 * @param {string} otp - OTP code
 * @param {string} [purpose='verification'] - Purpose of OTP
 * @returns {Promise<void>}
 * @throws {Error} If inputs are invalid or email sending fails
 */
export const sendOTPEmail = async (toEmail, userName = 'User', otp, purpose = 'verification') => {
  try {
    // Validate inputs
    if (!toEmail || typeof toEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      throw new Error('Invalid recipient email address');
    }
    if (userName && typeof userName !== 'string') {
      throw new Error('Invalid user name: must be a string');
    }
    if (!otp || typeof otp !== 'string') {
      throw new Error('Invalid OTP code');
    }
    if (typeof purpose !== 'string') {
      throw new Error('Invalid purpose: must be a string');
    }

    const mailOptions = {
      from: `"MicroCourse LMS" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Your ${purpose} code – MicroCourse LMS`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; max-width: 600px; margin: auto; background: #ffffff; padding: 28px; border-radius: 10px; border:1px solid #e6eef8;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #0f172a;margin:0;">Hello ${userName}!</h1>
            <h2 style="color: #0f172a;font-size:18px;margin-top:6px;">Your Verification Code</h2>
          </div>
          <p style="font-size: 1.1em; line-height: 1.6; color: #333; text-align: center;">
            Use this code to complete your ${purpose}:
          </p>
          <div style="background:#f8fafc;padding:20px;border-radius:8px;margin:22px 0;text-align:center;">
            <p style="font-size:28px;font-weight:700;color:#2563eb;margin:0;letter-spacing:6px;">${otp}</p>
            <p style="font-size:13px;color:#6b7280;margin-top:10px;">Expires in ${OTP_EXPIRATION_MINUTES} minutes</p>
          </div>
          <div style="background: #fff7ed; padding: 12px; border-radius: 6px; border-left: 4px solid #ffb020; text-align:center;">
            <p style="font-size: 0.9em; color: #92400e; margin: 0;">
              <strong>Security Note:</strong> Never share this code with anyone. MicroCourse LMS will never ask for your verification code.
            </p>
          </div>
        </div>
      `,
    };
    await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error(`Failed to send OTP email: ${error.message}`);
  }
};

// ===========================
// Password Reset Email
// ===========================
/**
 * Sends a password reset email with a reset link.
 * @param {string} toEmail - Recipient email address
 * @param {string} [userName] - User's name (optional)
 * @param {string} token - Password reset token
 * @returns {Promise<void>}
 * @throws {Error} If inputs are invalid or email sending fails
 */
export const sendResetPasswordEmail = async (toEmail, userName, token) => {
  try {
    // Validate inputs
    if (!toEmail || typeof toEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      throw new Error('Invalid recipient email address');
    }
    if (userName && typeof userName !== 'string') {
      throw new Error('Invalid user name: must be a string');
    }
    if (!token || typeof token !== 'string') {
      throw new Error('Invalid reset token');
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'https://microcourse.example'}/reset-password?token=${token}`;
    const displayName = userName || 'Learner';

    const mailOptions = {
      from: `"MicroCourse LMS" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Reset Your Password – MicroCourse LMS',
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; max-width:600px;margin:auto;background:#fff;padding:24px;border-radius:8px;border:1px solid #eef2ff;">
          <h1 style="color:#0f172a;">Reset Your Password</h1>
          <p style="color:#374151;">Hello ${displayName},</p>
          <p style="color:#374151;">
            We received a request to reset your MicroCourse LMS password. Click the button below to set a new password. This link will expire in ${RESET_TOKEN_EXPIRATION_MINUTES} minutes.
          </p>
          <div style="text-align:center;margin:20px 0;">
            <a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Reset Password</a>
          </div>
          <div style="background:#fff7ed;padding:12px;border-radius:6px;border-left:4px solid #ffb020;">
            <p style="margin:0;color:#92400e;font-size:13px;"><strong>Important:</strong> If you did not request this, ignore this email.</p>
          </div>
        </div>
      `,
    };
    await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error(`Failed to send password reset email: ${error.message}`);
  }
};

// ===========================
// Account Activation Success Email
// ===========================
/**
 * Sends an account activation success email.
 * @param {string} toEmail - Recipient email address
 * @param {string} [userName] - User's name (optional)
 * @returns {Promise<void>}
 * @throws {Error} If inputs are invalid or email sending fails
 */
export const sendAccountActivatedEmail = async (toEmail, userName) => {
  try {
    // Validate inputs
    if (!toEmail || typeof toEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      throw new Error('Invalid recipient email address');
    }
    if (userName && typeof userName !== 'string') {
      throw new Error('Invalid user name: must be a string');
    }

    const displayName = userName || 'Learner';

    const mailOptions = {
      from: `"MicroCourse LMS" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: 'Account Activated – Welcome to MicroCourse LMS!',
      html: `
        <div style="font-family: Arial, sans-serif; color:#111827;max-width:600px;margin:auto;background:#fff;padding:24px;border-radius:10px;border:1px solid #eef2ff;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f172a;">🎉 Account Activated!</h1>
          </div>
          <p style="font-size:1.05em;color:#374151;">Congratulations ${displayName}! Your MicroCourse LMS account has been activated.</p>
          <p style="font-size:1em;color:#374151;">
            You can now access courses, track progress, and continue learning.
          </p>
          <div style="text-align:center;margin:20px 0;">
            <a href="${process.env.FRONTEND_URL || 'https://microcourse.example'}" style="background:#2563eb;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:600;">Go to Dashboard</a>
          </div>
          <hr style="margin:20px 0;" />
          <p style="font-size: 1em; color: #555;">
            Welcome aboard!<br/>
            The MicroCourse LMS Team
          </p>
        </div>
      `,
    };
    await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending account activation email:', error);
    throw new Error(`Failed to send account activation email: ${error.message}`);
  }
};

// ===========================
// Login OTP Email
// ===========================
/**
 * Sends an OTP email for login verification.
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - OTP code
 * @returns {Promise<void>}
 * @throws {Error} If inputs are invalid or email sending fails
 */
export const sendLoginOTPEmail = async (toEmail, otp) => {
  try {
    // Validate inputs
    if (!toEmail || typeof toEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(toEmail)) {
      throw new Error('Invalid recipient email address');
    }
    if (!otp || typeof otp !== 'string') {
      throw new Error('Invalid OTP code');
    }

    const purpose = 'login';
    const mailOptions = {
      from: `"MicroCourse LMS" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `Your ${purpose} code – MicroCourse LMS`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #111827; max-width: 600px; margin: auto; background: #ffffff; padding: 28px; border-radius: 10px; border:1px solid #e6eef8;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #0f172a;">Your Login Code</h1>
          </div>
          <p style="font-size: 1.1em; line-height: 1.6; color: #333; text-align: center;">
            Use this code to log in to your MicroCourse LMS account:
          </p>
          <div style="background:#f8fafc;padding:20px;border-radius:8px;margin:22px 0;text-align:center;">
            <p style="font-size:32px;font-weight:700;color:#2563eb;margin:0;letter-spacing:6px;">${otp}</p>
            <p style="font-size:13px;color:#6b7280;margin-top:10px;">Expires in ${OTP_EXPIRATION_MINUTES} minutes</p>
          </div>
          <div style="background:#fff7ed;padding:12px;border-radius:6px;border-left:4px solid #ffb020;text-align:center;">
            <p style="font-size: 0.9em; color: #92400e; margin: 0;">
              <strong>Security Note:</strong> Never share this code with anyone. MicroCourse LMS will never ask for your verification code.
            </p>
          </div>
        </div>
      `,
    };
    await sendEmail(mailOptions);
  } catch (error) {
    console.error('Error sending login OTP email:', error);
    throw new Error(`Failed to send login OTP email: ${error.message}`);
  }
};
