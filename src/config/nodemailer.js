import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const smtpUser = process.env.EMAIL_USER || process.env.SMTP_MAIL;
const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);

/**
 * Creates and configures a Nodemailer transporter using SMTP options from environment variables.
 */
const transporter = nodemailer.createTransport({
  service: process.env.SMTP_SERVICE || 'gmail',
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Verify connection on startup (development only — prevents startup delay in production)
if (process.env.NODE_ENV !== 'production') {
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ [NODEMAILER] SMTP Transporter Verification Warning:', error.message);
    } else {
      console.log('✅ [NODEMAILER] SMTP Transporter connected successfully and ready to deliver messages.');
    }
  });
}

export default transporter;
