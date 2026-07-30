import transporter from '../config/nodemailer.js';

/**
 * Reusable utility function to dispatch emails via Nodemailer transporter.
 *
 * @param {Object} options - Email options
 * @param {string} options.email - Target recipient email
 * @param {string} options.subject - Email subject line
 * @param {string} options.html - HTML email content template
 * @returns {Promise<Object>} Sent message info
 */
const sendEmail = async ({ email, subject, html }) => {
  const senderEmail = process.env.EMAIL_FROM || process.env.SMTP_MAIL || process.env.EMAIL_USER;
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Croma Clone'}" <${senderEmail}>`,
    to: email,
    subject: subject,
    html: html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [NODEMAILER] Email dispatched successfully to ${email}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ [NODEMAILER] Email dispatch error to ${email}:`, error.message);
    throw error;
  }
};

export default sendEmail;
