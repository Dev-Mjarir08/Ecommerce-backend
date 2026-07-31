import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Sanitize & normalize configuration credentials
const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || process.env.SMTP_MAIL || '').trim();
const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.SMTP_PASSWORD || '').trim();
const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const isSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

// Creates and configures a production-ready Nodemailer transporter.
// Uses STARTTLS (Port 587) by default for cloud hosts (Render/Vercel) to prevent Port 465 SSL firewall drops.
const transporterOptions = {
  host: smtpHost,
  port: smtpPort,
  secure: isSecure, // false for port 587, true for port 465
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  dnsTimeout: 10000,
};

// Only attach service if not using custom host/port (service: 'gmail' forces port 465 SSL which Render blocks)
if (process.env.SMTP_SERVICE && process.env.SMTP_SERVICE !== 'gmail') {
  transporterOptions.service = process.env.SMTP_SERVICE;
}

const transporter = nodemailer.createTransport(transporterOptions);

/**
 * Verifies SMTP connection and authentication status.
 * @returns {Promise<boolean>} True if connected, throws error if connection fails.
 */
export const verifyTransporter = async () => {
  console.log('🔐 [NODEMAILER DIAGNOSTIC] Authenticating SMTP Transporter...');
  console.log(`📡 [SMTP CONFIG] Host: ${smtpHost} | Port: ${smtpPort} | Secure: ${isSecure} | User: ${smtpUser ? smtpUser.replace(/(.{2})(.*)(?=@)/, '$1***') : 'NOT_SET'}`);

  if (!smtpUser || !smtpPass) {
    console.warn('⚠️ [NODEMAILER WARN] SMTP user or password is not configured. Real email sending is disabled; fallback console logging is active.');
    return false;
  }

  try {
    const success = await transporter.verify();
    console.log('✅ [NODEMAILER] SMTP Transporter connected successfully and ready to deliver messages.');
    return success;
  } catch (error) {
    console.error('❌ [NODEMAILER ERROR] SMTP Transporter verification failed:', error.message);
    throw error;
  }
};

// Verify connection on non-production startup for developer feedback
if (process.env.NODE_ENV !== 'production' && smtpUser && smtpPass) {
  verifyTransporter().catch(() => {});
}

export default transporter;
