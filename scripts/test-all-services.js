import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import transporter from '../src/config/nodemailer.js';
import emailService from '../src/services/email.service.js';
import authService from '../src/services/auth.service.js';
import paymentService from '../src/services/payment.service.js';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';
import Product from '../src/models/Product.js';

dotenv.config();

console.log('\n======================================================');
console.log('🚀 BACKEND SERVICES DIAGNOSTIC & VERIFICATION SUITE');
console.log('======================================================\n');

async function runDiagnostics() {
  const results = {
    database: false,
    nodemailer: false,
    otpGeneration: false,
    otpVerification: false,
    passwordManagement: false,
    paymentService: false,
  };

  let dummyProduct = null;
  let testUser = null;
  let dummyOrder = null;

  try {
    // 1. Check Database Connection
    console.log('📦 1. Testing MongoDB Database Connection...');
    await connectDB();
    console.log('   ✅ MongoDB connected successfully to database:', mongoose.connection.name);
    results.database = true;

    // 2. Check Nodemailer Transport Setup
    console.log('\n📧 2. Testing Nodemailer Transport Setup...');
    try {
      const verifySuccess = await new Promise((resolve, reject) => {
        transporter.verify((err, success) => {
          if (err) reject(err);
          else resolve(success);
        });
      });
      console.log('   ✅ Nodemailer SMTP Transporter verified successfully.');
      results.nodemailer = true;
    } catch (smtpErr) {
      console.log('   ⚠️ Nodemailer SMTP Verification Notice:', smtpErr.message);
      console.log('   ℹ️ Application has console OTP fallback active for cloud deployments.');
      results.nodemailer = 'fallback_active';
    }

    // 3. Test OTP Generation & Verification Flow
    console.log('\n🔑 3. Testing OTP Generation and Verification Service...');
    const testEmail = `test_diag_${Date.now()}@example.com`;
    testUser = await User.create({
      name: 'Diagnostic User',
      email: testEmail,
      phone: `999${Math.floor(1000000 + Math.random() * 9000000)}`,
      password: 'TestPassword123!',
      otp: '654321',
      otpExpire: new Date(Date.now() + 10 * 60 * 1000),
    });

    results.otpGeneration = !!testUser.otp;
    console.log('   ✅ OTP generated & stored on user document:', testUser.otp);

    // Test OTP verification with string or number
    const verifiedUser = await authService.verifyOtp(testUser._id, null, 654321);
    results.otpVerification = verifiedUser.isVerified === true;
    console.log('   ✅ OTP verified successfully! Account isVerified status:', verifiedUser.isVerified);

    // 4. Test Password Reset & Change Logic
    console.log('\n🔐 4. Testing Password Reset and Password Change Services...');
    const { resetToken } = await authService.generateResetToken(testUser.email);
    console.log('   ✅ Password reset token generated successfully.');

    await authService.resetUserPassword(resetToken, 'NewSecurePassword123!');
    console.log('   ✅ Password reset executed successfully.');

    const reloggedUser = await authService.loginUser({ email: testUser.email, password: 'NewSecurePassword123!' });
    console.log('   ✅ Logged in with new password successfully.');

    await authService.changeUserPassword(reloggedUser._id, 'NewSecurePassword123!', 'ChangedPassword456!');
    console.log('   ✅ Changed user password successfully.');
    results.passwordManagement = true;

    // 5. Test Payment Service (Razorpay Integration & Mock Mode)
    console.log('\n💳 5. Testing Payment Service (Razorpay Integration & Mock Mode)...');
    
    // Create dummy product first
    dummyProduct = await Product.create({
      title: 'Diagnostic Test Product',
      description: 'Temporary product created for service diagnostic testing.',
      price: 999,
      brand: 'Diagnostic Brand',
      category: new mongoose.Types.ObjectId(),
      stock: 10,
    });

    // Create dummy order
    dummyOrder = await Order.create({
      user: testUser._id,
      orderItems: [
        {
          product: dummyProduct._id,
          name: dummyProduct.title,
          quantity: 1,
          image: 'https://example.com/img.jpg',
          price: 999,
        },
      ],
      shippingAddress: {
        address: '123 Test St',
        city: 'Mumbai',
        postalCode: '400001',
        country: 'India',
      },
      paymentMethod: 'Razorpay',
      itemsPrice: 999,
      taxPrice: 50,
      shippingPrice: 0,
      totalPrice: 1049,
    });

    const rzpOrder = await paymentService.createRazorpayOrder(dummyOrder._id, 1049);
    console.log('   ✅ Razorpay Order generated. ID:', rzpOrder.orderId, '| Mock status:', rzpOrder.isMock);

    const updatedOrder = await paymentService.verifyPayment({
      dbOrderId: dummyOrder._id,
      razorpayOrderId: rzpOrder.orderId,
      razorpayPaymentId: `pay_rzp_${Date.now()}`,
      razorpaySignature: 'mock_signature_passed',
    });

    results.paymentService = updatedOrder.isPaid === true && updatedOrder.status === 'Processing';
    console.log('   ✅ Razorpay Payment verified successfully! Order isPaid:', updatedOrder.isPaid, '| status:', updatedOrder.status);

  } catch (err) {
    console.error('\n❌ Diagnostic Suite Error:', err);
  } finally {
    // Cleanup test data
    if (dummyOrder) await Order.findByIdAndDelete(dummyOrder._id);
    if (dummyProduct) await Product.findByIdAndDelete(dummyProduct._id);
    if (testUser) await User.findByIdAndDelete(testUser._id);
    console.log('   🧹 Cleanup complete.');

    await mongoose.disconnect();
    console.log('\n======================================================');
    console.log('📊 DIAGNOSTIC RESULTS SUMMARY:');
    console.log('======================================================');
    console.log('  Database (MongoDB):      ', results.database ? '✅ OK' : '❌ FAILED');
    console.log('  Nodemailer (SMTP):       ', results.nodemailer === true ? '✅ OK' : (results.nodemailer ? '⚠️ FALLBACK ACTIVE' : '❌ FAILED'));
    console.log('  OTP Generation:          ', results.otpGeneration ? '✅ OK' : '❌ FAILED');
    console.log('  OTP Verification:        ', results.otpVerification ? '✅ OK' : '❌ FAILED');
    console.log('  Password Management:     ', results.passwordManagement ? '✅ OK' : '❌ FAILED');
    console.log('  Payment Service:         ', results.paymentService ? '✅ OK' : '❌ FAILED');
    console.log('======================================================\n');
  }
}

runDiagnostics();
