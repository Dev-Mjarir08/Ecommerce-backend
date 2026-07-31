import sendEmail from '../utils/sendEmail.js';

/**
 * Service handling email templating and dispatch triggers.
 */
class EmailService {
  /**
   * Dispatches a Welcome email to a newly registered user.
   */
  async sendWelcomeEmail(email, name) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #00e676; text-align: center;">Welcome to Croma Clone, ${name}!</h2>
        <p>Thank you for creating an account with us. We are thrilled to have you join our shopping community.</p>
        <p>You can now browse products, manage your cart, customize wishlists, and track orders seamlessly.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}" style="background-color: #00e676; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Start Shopping</a>
        </div>
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 50px;">This email is auto-generated. Please do not reply directly.</p>
      </div>
    `;
    try {
      await sendEmail({ email, subject: 'Welcome to Croma Clone!', html });
    } catch (err) {
      console.error(`⚠️ [NODEMAILER WARN] Welcome email dispatch to ${email} failed:`, err.message);
    }
  }

  /**
   * Dispatches a forgot password reset URL to a user.
   */
  async sendForgotPasswordEmail(email, name, resetUrl) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #d32f2f; text-align: center;">Password Reset Request</h2>
        <p>Hello ${name},</p>
        <p>We received a request to reset the password associated with your account. Click the button below to specify a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>This reset link will expire in 10 minutes. If you did not make this request, please ignore this email.</p>
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 50px;">This email is auto-generated. Please do not reply directly.</p>
      </div>
    `;
    try {
      await sendEmail({ email, subject: 'Croma Clone - Reset Password Request', html });
    } catch (err) {
      console.error(`⚠️ [NODEMAILER WARN] Password reset email dispatch to ${email} failed:`, err.message);
    }
  }

  /**
   * Dispatches confirmation of a successful password change/reset.
   */
  async sendPasswordResetSuccessEmail(email, name) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #2e7d32; text-align: center;">Password Changed Successfully</h2>
        <p>Hello ${name},</p>
        <p>The password for your Croma Clone account has been successfully changed.</p>
        <p>If you did not execute this change, please contact our support desk immediately to secure your account.</p>
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 50px;">This email is auto-generated. Please do not reply directly.</p>
      </div>
    `;
    try {
      await sendEmail({ email, subject: 'Croma Clone - Password Security Alert', html });
    } catch (err) {
      console.error(`⚠️ [NODEMAILER WARN] Password reset success alert to ${email} failed:`, err.message);
    }
  }

  /**
   * Dispatches an OTP confirmation email.
   */
  async sendOtpEmail(email, name, otp) {
    console.log(`\n======================================================`);
    console.log(`🔑 [OTP DISPATCH SERVICE] Registered Email: ${email}`);
    console.log(`🔑 [VERIFICATION OTP CODE]: ${otp}`);
    console.log(`======================================================\n`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #0288d1; text-align: center;">Email Verification OTP</h2>
        <p>Hello ${name},</p>
        <p>Please use the following One-Time Password (OTP) to complete verification on your account:</p>
        <div style="text-align: center; margin: 30px 0; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #0288d1;">
          ${otp}
        </div>
        <p>This code is valid for 10 minutes. Do not share this OTP with anyone.</p>
      </div>
    `;

    try {
      await sendEmail({ email, subject: 'Croma Clone - Email Verification OTP', html });
    } catch (err) {
      console.error(`⚠️ [NODEMAILER WARN] Direct email dispatch to ${email} failed. Console OTP fallback is active. Code: ${otp}. Error:`, err.message);
    }
  }

  /**
   * Dispatches an Order Confirmation OTP email during checkout.
   */
  async sendOrderConfirmationOtpEmail(email, name, otp) {
    console.log(`\n======================================================`);
    console.log(`🛒 [ORDER OTP DISPATCH SERVICE] Registered Email: ${email}`);
    console.log(`🔑 [ORDER CONFIRMATION OTP CODE]: ${otp}`);
    console.log(`======================================================\n`);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; border-b: 1px solid #f0f0f0; padding-bottom: 15px; margin-bottom: 20px;">
          <h2 style="color: #2563eb; margin: 0;">CROMA Checkout Verification</h2>
        </div>
        <p style="color: #334155; font-size: 14px;">Hello <strong>${name}</strong>,</p>
        <p style="color: #475569; font-size: 14px;">Please use the following 6-digit One-Time Password (OTP) to authorize and confirm your order checkout:</p>
        <div style="text-align: center; margin: 30px 0; font-size: 34px; font-weight: 900; letter-spacing: 6px; color: #2563eb; background-color: #eff6ff; padding: 16px; border-radius: 8px; border: 1px border-blue-200;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 12px;">This Order OTP is valid for 10 minutes. For security reasons, do not share this OTP code with anyone.</p>
        <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #94a3b8; border-t: 1px solid #f1f5f9; padding-top: 15px;">
          © Croma Electronics. All rights reserved.
        </div>
      </div>
    `;

    try {
      await sendEmail({ email, subject: '🔑 Order Confirmation OTP - Croma', html });
    } catch (err) {
      console.error(`⚠️ [NODEMAILER WARN] Direct email dispatch to ${email} failed. Console Order OTP fallback is active. Code: ${otp}. Error:`, err.message);
    }
  }

  /**
   * Dispatches an itemized Order Confirmed Invoice email to customer upon order placement.
   */
  async sendOrderPlacedInvoiceEmail(email, name, order) {
    console.log(`\n======================================================`);
    console.log(`🎉 [ORDER INVOICE DISPATCH] Registered Email: ${email}`);
    console.log(`📦 [ORDER REFERENCE ID]: #${order._id}`);
    console.log(`======================================================\n`);

    const itemRows = (order.orderItems || []).map(
      (item) => `
        <tr style="border-bottom: 1px solid #f1f5f9;">
          <td style="padding: 12px; font-size: 13px; font-weight: bold; color: #1e293b;">
            ${item.name}
          </td>
          <td style="padding: 12px; font-size: 13px; color: #64748b; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 12px; font-size: 13px; color: #64748b; text-align: right;">
            ₹${item.price?.toLocaleString('en-IN')}
          </td>
          <td style="padding: 12px; font-size: 13px; font-weight: bold; color: #0f172a; text-align: right;">
            ₹${(item.price * item.quantity).toLocaleString('en-IN')}
          </td>
        </tr>
      `
    ).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 650px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        
        {/* Email Header */}
        <div style="background-color: #0f172a; color: #ffffff; padding: 24px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 900; letter-spacing: 1px;">CROMA<span style="color: #2563eb;">.</span></h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; font-weight: 500;">🎉 Your Order Has Been Confirmed!</p>
        </div>

        <p style="color: #334155; font-size: 14px; margin-top: 0;">Hello <strong>${name}</strong>,</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">Thank you for shopping with Croma! We have received your order <strong>#${order._id}</strong> and are preparing it for shipment.</p>

        {/* Order Details Card */}
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #475569;">
            <tr>
              <td><strong>Order ID:</strong> #${order._id}</td>
              <td style="text-align: right;"><strong>Payment Method:</strong> ${order.paymentMethod || 'COD'}</td>
            </tr>
            <tr>
              <td style="padding-top: 8px;"><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
              <td style="padding-top: 8px; text-align: right;"><strong>Status:</strong> <span style="color: #2563eb; font-weight: bold;">Confirmed / ${order.orderStatus || order.status || 'Pending'}</span></td>
            </tr>
          </table>
        </div>

        {/* Itemized Order Table */}
        <h3 style="font-size: 14px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">Purchased Electronics</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <thead>
            <tr style="background-color: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">
              <th style="padding: 10px 12px;">Item Name</th>
              <th style="padding: 10px 12px; text-align: center;">Qty</th>
              <th style="padding: 10px 12px; text-align: right;">Price</th>
              <th style="padding: 10px 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
          </tbody>
        </table>

        {/* Price Summary Breakdown */}
        <div style="margin-left: auto; max-width: 280px; margin-bottom: 24px;">
          <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0;">Items Subtotal:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #0f172a;">₹${order.itemsPrice?.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">GST Tax (5%):</td>
              <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #0f172a;">₹${order.taxPrice?.toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0;">Delivery Charges:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #0f172a;">${order.shippingPrice === 0 ? 'FREE' : '₹' + order.shippingPrice}</td>
            </tr>
            <tr style="border-top: 2px solid #e2e8f0;">
              <td style="padding: 10px 0; font-size: 15px; font-weight: 900; color: #0f172a;">Grand Total:</td>
              <td style="padding: 10px 0; text-align: right; font-size: 18px; font-weight: 900; color: #2563eb;">₹${order.totalPrice?.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>

        {/* Shipping Address */}
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 8px 0; font-size: 12px; text-transform: uppercase; color: #64748b;">Shipping Address</h4>
          <p style="margin: 0; font-size: 13px; font-weight: bold; color: #0f172a;">${order.shippingAddress?.address}</p>
          <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">${order.shippingAddress?.city}, ${order.shippingAddress?.postalCode}, ${order.shippingAddress?.country || 'India'}</p>
        </div>

        {/* Call to action */}
        <div style="text-align: center; margin: 30px 0 10px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders/my-orders" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 13px; display: inline-block;">Track Your Order</a>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #94a3b8; border-t: 1px solid #f1f5f9; padding-top: 15px;">
          Need help with your order? Contact Croma Support.<br/>
          © Croma Electronics. All rights reserved.
        </div>
      </div>
    `;

    try {
      await sendEmail({ email, subject: `🎉 Order Confirmed #${order._id} - Croma`, html });
    } catch (err) {
      console.error(`⚠️ [NODEMAILER WARN] Direct email dispatch to ${email} failed. Error:`, err.message);
    }
  }
}

export default new EmailService();
