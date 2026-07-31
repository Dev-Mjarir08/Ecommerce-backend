import nodemailer from 'nodemailer';
import dns from 'dns';
import dotenv from 'dotenv';

dotenv.config();

// Force Node.js to prefer IPv4 over IPv6 (fixes ENETUNREACH on Render/Cloud hosts)
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

/**
 * Dynamically constructs Nodemailer transporter using current process.env variables.
 * Uses port 587 (STARTTLS) and IPv4 to avoid firewall port 465 blocks and timeouts on cloud hosts (Render/AWS).
 */
const getTransporter = () => {
  const smtpUser = process.env.EMAIL_USER || process.env.SMTP_MAIL;
  const smtpPass = process.env.EMAIL_PASS || process.env.SMTP_PASSWORD;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  // Prefer port 587 for STARTTLS on cloud platforms
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const isSecure = smtpPort === 465;

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: isSecure,
    requireTLS: !isSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false,
    },
    family: 4,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000,
  });
};

const transporter = {
  sendMail: (mailOptions) => getTransporter().sendMail(mailOptions),
  verify: (cb) => getTransporter().verify(cb),
};

export default transporter;
