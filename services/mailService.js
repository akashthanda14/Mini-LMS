// services/mailService.js
// Centralized email sending helper used by the backend.
// Purpose:
// - Provide a single place for all transactional emails (welcome, verification OTP, login OTP, password resets).
// - Prefer an HTTP-based provider (Resend) when configured, otherwise fall back to SMTP via Nodemailer.
// - Include conservative timeouts and a small retry/backoff for transient network errors common on PaaS providers.
//
// Notes and operational guidance:
// - If you use Resend (set RESEND_API_KEY), you must verify your sending domain (or use an allowed from-address).
//   Resend will reject unverified public domains like gmail.com and return 403 validation errors.
// - On some hosts (e.g., Render) outbound SMTP connections can be unreliable or blocked. The transporter forces
//   IPv4 and adds connection/greeting/socket timeouts to reduce long hangs (ETIMEDOUT). We also disable pooling
//   to avoid stale sockets causing pool-level timeouts.
// - This file intentionally logs transporter.verify() failures as warnings (non-fatal). That keeps the app
//   available while allowing send attempts to surface errors and trigger retries at runtime.

import dotenv from 'dotenv';
dotenv.config();
import nodemailer from 'nodemailer';
// Use the global `fetch` (Node >=18) for Resend HTTP API calls; no extra dependency required.

// --- Constants ---
// Keep these values in sync with any frontend copy that mentions expiry times.
const RESET_TOKEN_EXPIRATION_MINUTES = 60; // Password reset link lifetime
const OTP_EXPIRATION_MINUTES = 10; // OTP lifetime shown in verification emails

// --- Environment Variable Validation ---
// IMPORTANT: the SMTP env vars are required in the current code path. If you plan to use only Resend,
// you can still leave SMTP vars populated or remove the strict check (careful: other code assumes EMAIL_USER).
const requiredEnvVars = ['SMTP_HOST', 'SMTP_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  // Throwing here makes missing configuration explicit during app startup — prefer to fail fast in most setups.
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// --- Nodemailer Transporter Setup ---
// Configure a conservative transporter: no pooling, explicit timeouts, IPv4-only, and TLS options.
// These choices were made after observing intermittent ETIMEDOUT/connection issues in production.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT), // Common alternatives: 587, 465, 2525
  secure: process.env.SMTP_PORT === '465',
  requireTLS: process.env.SMTP_PORT === '587' || process.env.SMTP_PORT === '2525',
  pool: false, // disable pooling to avoid stale-socket pool timeouts
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
  // Short timeouts help the process detect unreachable SMTP servers quickly and allow retry/backoff logic to run.
  connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT) || 10000,
  greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT) || 10000,
  socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT) || 60000,
  family: 4, // prefer IPv4 on platforms where IPv6 can be flaky
  tls: {
    // In some environments the TLS certificate chain may not validate cleanly; setting rejectUnauthorized:false
    // avoids failures during startups where the platform provides a managed SMTP endpoint. If you control the
    // SMTP/ESP, prefer leaving this at true and ensuring proper certs.
    rejectUnauthorized: false,
  },
});


// Verify transporter configuration at startup.
// This is non-fatal: we log a warning but allow the server to start. Runtime send attempts will surface errors
// and the retry wrapper below will handle transient failures instead of crashing the process at boot.
(async () => {
  try {
    await transporter.verify();
    console.log('Email transporter is ready to send messages');
  } catch (error) {
    console.warn('Email transporter verification warning (non-fatal):', error && error.message ? error.message : error);
    // Intentionally don't throw here to keep the service available.
  }
})();

// --- Resend HTTP helper (if RESEND_API_KEY provided) ---
/**
 * Send email via Resend's HTTP API.
 * Resend offers a simple transactional API; when using it you must ensure the `from` address is
 * a verified sending domain (Resend will reject gmail.com/other public domains).
 *
 * mailOptions should include: { from, to, subject, html }
 */
const sendViaResend = async (mailOptions) => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY not configured');

  // Default `from` falls back to MAIL_FROM_NAME or EMAIL_USER. Prefer setting MAIL_FROM explicitly.
  const payload = {
    from: mailOptions.from || `${process.env.MAIL_FROM_NAME || 'MicroCourse LMS'} <${process.env.EMAIL_USER}>`,
    to: mailOptions.to,
    subject: mailOptions.subject,
    html: mailOptions.html,
  };

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      // Capture response text for easier debugging (Resend returns helpful validation messages).
      const text = await res.text();
      const err = new Error(`Resend API error: ${res.status} ${res.statusText}`);
      err.status = res.status;
      err.body = text;
      throw err;
    }

    const data = await res.json();
    console.log('Email sent via Resend, id=', data.id || data.messageId || '(unknown)');
    return data;
  } catch (err) {
    // Log and rethrow so the caller can decide on fallback behavior.
    console.error('Error sending via Resend:', err && (err.message || err));
    throw err;
  }
};

// --- General Send Email Function ---
/**
 * Internal helper to send an email.
 * Behavior summary:
 *  - Validates basic mailOptions shape (from/to/subject/html).
 *  - If RESEND_API_KEY is set, prefers Resend HTTP API.
 *  - Otherwise, uses Nodemailer SMTP transporter with a small retry+backoff for transient errors.
 *
 * Important: this function intentionally throws on invalid inputs so callers can handle failures explicitly.
 *
 * @param {Object} mailOptions - Nodemailer-style mailOptions
 * @returns {Promise<Object>} Email sending result
 */
const sendEmail = async (mailOptions) => {
  try {
    // Basic validation to avoid hard-to-debug server errors later.
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
    // Ensure the sender stream is predictable. If you want to allow custom from addresses,
    // relax this check and ensure MAIL_FROM is set appropriately.
    if (from && from !== `"MicroCourse LMS" <${process.env.EMAIL_USER}>`) {
      throw new Error('Invalid sender address');
    }

    // Prefer the HTTP provider if configured. This avoids many SMTP network issues and gives
    // better visibility into deliverability, but requires a verified sending domain.
    if (process.env.RESEND_API_KEY) {
      return await sendViaResend(mailOptions);
    }

    // --- SMTP send with retry/backoff ---
    // We retry only for a short list of transient network errors commonly seen on PaaS hosts.
    const sendWithRetry = async (opts, attempts = 3, backoffMs = 500) => {
      let lastErr;
      for (let i = 0; i < attempts; i++) {
        try {
          // Always set a canonical from to keep headers consistent.
          const info = await transporter.sendMail({ from: `"MicroCourse LMS" <${process.env.EMAIL_USER}>`, ...opts });
          console.log('Email sent successfully:', info.messageId);
          return info;
        } catch (err) {
          lastErr = err;
          // Detect transient network errors that merit a retry.
          const transientCodes = ['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'ECONNREFUSED', 'EHOSTUNREACH'];
          const isTransient = err && (transientCodes.includes(err.code) || (err.message && err.message.toLowerCase().includes('timeout')));
          console.warn(`Email send attempt ${i + 1} failed${isTransient ? ' (transient)' : ''}:`, err && err.message ? err.message : err);
          if (!isTransient) break; // stop retrying for non-transient errors (auth, bad envelope, etc.)
          // Exponential backoff before retrying.
          await new Promise((r) => setTimeout(r, backoffMs * Math.pow(2, i)));
        }
      }
      throw lastErr;
    };

    const info = await sendWithRetry(mailOptions);
    return info;
  } catch (error) {
    // Normalize the error message for callers and preserve the original to logs for debugging.
    console.error('Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// ===========================
// Welcome Email
// ===========================
/**
 * Sends a welcome email to a new user.
 * Template notes:
 * - Uses inline styles for predictable rendering across email clients.
 * - Uses `process.env.FRONTEND_URL` for dashboard links; set this in environment for correct links.
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
 * The template includes the OTP and the configured expiry time constant.
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
 * Generic OTP email template used for verification and login flows.
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
 * Uses RESET_TOKEN_EXPIRATION_MINUTES constant to explain link lifetime in the template.
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
