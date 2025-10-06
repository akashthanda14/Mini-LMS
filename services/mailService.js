// services/mailService.js
// Email service for sending verification emails and OTPs

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const CONNECTION_TIMEOUT = parseInt(process.env.SMTP_CONNECTION_TIMEOUT || '60000', 10);
const GREETING_TIMEOUT = parseInt(process.env.SMTP_GREETING_TIMEOUT || '60000', 10);
const SOCKET_TIMEOUT = parseInt(process.env.SMTP_SOCKET_TIMEOUT || '60000', 10);
const MAIL_SEND_TIMEOUT = parseInt(process.env.MAIL_SEND_TIMEOUT || '30000', 10);
const MAX_SEND_ATTEMPTS = parseInt(process.env.MAIL_SEND_ATTEMPTS || '3', 10);

let transporter = null;

function createTransporter() {
  // prefer SendGrid (HTTP) if API key present
  if (process.env.SENDGRID_API_KEY) {
    console.log('[MAILER] Using SendGrid HTTP API (SENDGRID_API_KEY present)');
    return null; // handled in send path
  }

  // fallback to username/password SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: (process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465'),
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD },
    logger: false,
    pool: false, // IMPORTANT: disable pool on Render
    connectionTimeout: CONNECTION_TIMEOUT,
    greetingTimeout: GREETING_TIMEOUT,
    socketTimeout: SOCKET_TIMEOUT
  });
}

transporter = createTransporter();
if (transporter) {
  transporter.verify().then(() => console.log('[MAILER] SMTP verified')).catch(err => console.warn('[MAILER] SMTP verify failed', err && err.code ? err.code : err.message || err));
} else {
  console.log('[MAILER] Transporter skipped (SendGrid HTTP will be used)');
}

function isTransient(err) {
  const codes = ['ETIMEDOUT', 'ECONNRESET', 'EAI_AGAIN', 'ECONNREFUSED', 'ENOTFOUND'];
  return err && (codes.includes(err.code) || /timeout|socket|connection/i.test(err.message || ''));
}

async function sendViaSendGrid(mailOptions) {
  const sg = await import('@sendgrid/mail').then(m => m.default || m);
  sg.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    to: mailOptions.to,
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    subject: mailOptions.subject,
    text: mailOptions.text,
    html: mailOptions.html
  };
  const res = await sg.send(msg);
  return { messageId: (res && res[0] && res[0].headers && res[0].headers['x-message-id']) || null, raw: res };
}

async function sendAttempt(mailOptions) {
  if (process.env.SENDGRID_API_KEY) {
    console.log('[MAILER] sendAttempt -> SendGrid');
    return sendViaSendGrid(mailOptions);
  }
  // envelope ensures MAIL FROM equals authenticated user
  const envelope = { from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to: mailOptions.to };
  const sendPromise = transporter.sendMail({ ...mailOptions, envelope });
  const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error(`Email timeout after ${MAIL_SEND_TIMEOUT}ms`)), MAIL_SEND_TIMEOUT));
  return Promise.race([sendPromise, timeout]);
}

export async function sendVerificationEmail(to, otp, name = 'User') {
  const mailOptions = { from: process.env.EMAIL_FROM || process.env.EMAIL_USER, to, subject: 'Your verification code', text: `OTP: ${otp}`, html: `<p>Your OTP: <b>${otp}</b></p>` };

  for (let i = 1; i <= MAX_SEND_ATTEMPTS; i++) {
    try {
      console.log(`[MAILER] attempt ${i} -> sending to ${to}`);
      const info = await sendAttempt(mailOptions);
      console.log('[MAILER] sent:', info && info.messageId ? info.messageId : info);
      return { success: true, messageId: info?.messageId || null };
    } catch (err) {
      console.error(`[MAILER] attempt ${i} failed:`, err && err.code ? err.code : err.message || err);
      if (i === MAX_SEND_ATTEMPTS || !isTransient(err)) {
        console.log(`[MAILER] fallback OTP for ${to}: ${otp}`);
        return { success: false, error: err?.message || String(err) };
      }
      await new Promise(r => setTimeout(r, Math.min(500 * 2 ** (i - 1), 5000)));
    }
  }
  return { success: false, error: 'unknown' };
}

export async function sendWelcomeEmail(to, name) {
  return sendVerificationEmail(to, null, name);
}

export default transporter;
