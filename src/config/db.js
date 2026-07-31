import mongoose from 'mongoose';

/**
 * Establishes a connection to the MongoDB database using Mongoose.
 * Features try/catch block and ANSI colored terminal logs.
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      console.error('\x1b[31m%s\x1b[0m', 'Database Connection Error: MONGODB_URI environment variable is not defined.');
      process.exit(1);
    }

    const connectionInstance = await mongoose.connect(mongoUri);

    console.log(
      '\x1b[32m%s\x1b[0m',
      `MongoDB connected successfully! Database Host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', `MongoDB database connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
