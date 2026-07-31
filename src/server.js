import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

// Load environment variables immediately on startup
dotenv.config();

const PORT = process.env.PORT || 3000;

let server;

// Start Server and Database Connection
const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Start HTTP Server Listener
  server = app.listen(PORT, () => {
    console.log(
      '\x1b[36m%s\x1b[0m',
      `Server is running in [${process.env.NODE_ENV || 'development'}] mode on port ${PORT}`
    );
  });

  // Prevent socket hanging under high concurrency
  server.keepAliveTimeout = 65000; // Slightly higher than typical ALB idle timeout (60s)
  server.headersTimeout = 66000; // Must be greater than keepAliveTimeout
};

startServer();

// Graceful shutdown helper — allows in-flight requests to complete
const gracefulShutdown = (reason) => {
  console.log(`\x1b[33m%s\x1b[0m`, `Initiating graceful shutdown: ${reason}`);
  if (server) {
    server.close(() => {
      console.log('Server closed. All in-flight requests completed.');
      process.exit(1);
    });
    // Force shutdown after 30 seconds if connections don't drain
    setTimeout(() => {
      console.error('\x1b[31m%s\x1b[0m', 'Forced shutdown — connections did not drain within 30s.');
      process.exit(1);
    }, 30000).unref();
  } else {
    process.exit(1);
  }
};

// Handle Unhandled Promise Rejections
process.on('unhandledRejection', (err) => {
  console.error('\x1b[31m%s\x1b[0m', `Unhandled Rejection: ${err.message}`);
  gracefulShutdown('Unhandled Promise Rejection');
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.error('\x1b[31m%s\x1b[0m', `Uncaught Exception: ${err.message}`);
  gracefulShutdown('Uncaught Exception');
});

// Handle SIGTERM (sent by PM2, Docker, cloud platforms on deploy/restart)
process.on('SIGTERM', () => {
  gracefulShutdown('SIGTERM received');
});
