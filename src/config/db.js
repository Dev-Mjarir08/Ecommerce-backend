import mongoose from 'mongoose';

/**
 * Establishes a connection to the MongoDB database using Mongoose.
 * Features try/catch block and ANSI colored terminal logs.
 */
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return;
  }

  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.error('\x1b[31m%s\x1b[0m', 'Database Connection Warning: MONGODB_URI environment variable is not defined.');
    return;
  }

  try {
    const connectionInstance = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      '\x1b[32m%s\x1b[0m',
      `MongoDB connected successfully! Database Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `MongoDB database connection failed: ${error.message}`);
  }
};

export default connectDB;
