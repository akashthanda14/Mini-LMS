import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || (process.env.SMTP_SECURE === 'true' ? '465' : '587'), 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;

  if (!user || !pass) {
    console.error('Missing EMAIL_USER or EMAIL_PASSWORD in .env');
    process.exit(1);
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    logger: true,
    debug: true
  });

  try {
    await transporter.verify();
    console.log('SMTP connection OK');

    const info = await transporter.sendMail({
      from: `"Test" <${user}>`,
      to: process.env.EMAIL_TEST_TO || user,
      subject: 'Test email from LMS',
      text: 'Hello — this is a test email from the LMS project.',
      html: '<p>Hello — this is a <b>test</b> email from the LMS project.</p>'
    });

    console.log('Message sent:', info.messageId || info);
  } catch (err) {
    console.error('Send failed:', err);
    process.exitCode = 2;
  } finally {
    transporter.close();
  }
}

main();