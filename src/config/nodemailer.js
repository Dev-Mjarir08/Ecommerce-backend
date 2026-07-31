import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import dns from 'dns';

dotenv.config();

// Sanitize & normalize configuration credentials
const smtpUser = (process.env.SMTP_USER || process.env.EMAIL_USER || process.env.SMTP_MAIL || '').trim();
const smtpPass = (process.env.SMTP_PASS || process.env.EMAIL_PASS || process.env.SMTP_PASSWORD || '').trim();
const smtpHost = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const isSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;

// Force Node.js DNS resolver to ONLY return IPv4 addresses for SMTP host.
// Prevents ENETUNREACH / ETIMEDOUT errors on cloud providers (Render, Vercel) that lack IPv6 outbound routing.
const forceIPv4Lookup = (hostname, options, callback) => {
  let opts = { family: 4, all: false };
  let cb = callback;
  if (typeof options === 'function') {
    cb = options;
  } else if (typeof options === 'object' && options !== null) {
    opts = { ...options, family: 4, all: false };
  }
  return dns.lookup(hostname, opts, cb);
};

// Creates and configures a production-ready Nodemailer pooled transporter.
// Enables TCP connection pooling so open sockets are reused across email dispatches.
// Uses STARTTLS (Port 587) or SSL (Port 465) forced to IPv4 addressing.
const transporterOptions = {
  pool: true, // Reuse open TCP/TLS connections for super-fast delivery
  maxConnections: 5, // Maximum concurrent pooled SMTP connections
  maxMessages: 100, // Reuse a single SMTP connection for up to 100 messages
  host: smtpHost,
  port: smtpPort,
  secure: isSecure, // false for port 587, true for port 465
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2',
  },
  lookup: forceIPv4Lookup, // CRITICAL FOR RENDER: Overrides DNS lookup to guarantee IPv4 socket connection
  family: 4,
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 15000,
  dnsTimeout: 10000,
};

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
