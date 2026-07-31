import transporter from '../config/nodemailer.js';

/**
 * Reusable utility function to dispatch emails via Nodemailer transporter.
 *
 * @param {Object} options - Email options
 * @param {string} options.email - Target recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML content template
 * @param {string} [options.text] - Plaintext alternative content
 * @returns {Promise<Object>} Sent message metadata
 */
const sendEmail = async ({ email, subject, html, text }) => {
  console.log(`\n======================================================`);
  console.log(`🚀 [EMAIL SERVICE] Request Received for Recipient: ${email}`);
  console.log(`📨 [EMAIL SERVICE] Preparing Email - Subject: "${subject}"`);

  if (!email || !email.trim()) {
    const err = new Error('Recipient email address is missing or invalid.');
    console.error(`❌ [EMAIL SERVICE] Validation Error: ${err.message}`);
    throw err;
  }

  if (!subject || !subject.trim()) {
    const err = new Error('Email subject line is required.');
    console.error(`❌ [EMAIL SERVICE] Validation Error: ${err.message}`);
    throw err;
  }

  const senderEmail = (process.env.EMAIL_FROM || process.env.SMTP_MAIL || process.env.EMAIL_USER || process.env.MAIL_FROM || '').trim();
  const senderName = (process.env.EMAIL_FROM_NAME || process.env.MAIL_FROM_NAME || 'Croma Clone').trim();

  if (!senderEmail) {
    console.warn('⚠️ [EMAIL SERVICE] Warning: Sender email environment variable (EMAIL_FROM/SMTP_MAIL/EMAIL_USER) is not set.');
  }

  const mailOptions = {
    from: senderEmail ? `"${senderName}" <${senderEmail}>` : `"${senderName}" <noreply@croma-clone.com>`,
    to: email.trim(),
    subject: subject.trim(),
    html: html,
    text: text || html.replace(/<[^>]*>?/gm, ''), // Fallback plaintext auto-strip
  };

  try {
    console.log(`🔐 [EMAIL SERVICE] Authenticating & Connecting to SMTP Server...`);
    console.log(`📤 [EMAIL SERVICE] Sending Email via Nodemailer to ${email}...`);

    const info = await transporter.sendMail(mailOptions);

    console.log(`✅ [EMAIL SERVICE] Email Sent Successfully!`);
    console.log(`📌 Message ID: ${info.messageId}`);
    console.log(`💬 SMTP Response: ${info.response || 'Accepted by gateway'}`);
    console.log(`======================================================\n`);

    return info;
  } catch (error) {
    console.error(`\n❌ [EMAIL SERVICE FAILED] Dispatch to ${email} Encountered Error!`);
    console.error(`------------------------------------------------------`);
    console.error(`📛 Error Name:       ${error.name || 'Error'}`);
    console.error(`🔢 Error Code:       ${error.code || 'UNKNOWN_CODE'}`);
    console.error(`💬 Error Message:    ${error.message}`);
    console.error(`📟 SMTP Response:    ${error.response || 'No SMTP response returned'}`);
    console.error(`🔢 SMTP Resp Code:   ${error.responseCode || 'N/A'}`);
    console.error(`🌐 Network Command:  ${error.command || 'N/A'}`);
    console.error(`📚 Stack Trace:\n${error.stack}`);
    console.error(`======================================================\n`);

    throw error;
  }
};

export default sendEmail;
