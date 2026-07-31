import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

// Load environment variables immediately on startup
dotenv.config();

const PORT = process.env.PORT || 3000;

let server;

// Start Server and Database Connection for local environment
if (!process.env.VERCEL) {
  const startServer = async () => {
    try {
      await connectDB();
    } catch (err) {
      console.error('Database connection error on local startup:', err);
    }
    server = app.listen(PORT, () => {
      console.log(
        '\x1b[36m%s\x1b[0m',
        `Server is running in [${process.env.NODE_ENV || 'development'}] mode on port ${PORT}`
      );
    });

    server.keepAliveTimeout = 65000;
    server.headersTimeout = 66000;
  };

  startServer();

  // Graceful shutdown helper — only for standalone local server
  const gracefulShutdown = (reason) => {
    console.log(`\x1b[33m%s\x1b[0m`, `Initiating graceful shutdown: ${reason}`);
    if (server) {
      server.close(() => {
        console.log('Server closed. All in-flight requests completed.');
        process.exit(1);
      });
      setTimeout(() => {
        console.error('\x1b[31m%s\x1b[0m', 'Forced shutdown — connections did not drain within 30s.');
        process.exit(1);
      }, 30000).unref();
    } else {
      process.exit(1);
    }
  };

  process.on('unhandledRejection', (err) => {
    console.error('\x1b[31m%s\x1b[0m', `Unhandled Rejection: ${err.message}`);
    gracefulShutdown('Unhandled Promise Rejection');
  });

  process.on('uncaughtException', (err) => {
    console.error('\x1b[31m%s\x1b[0m', `Uncaught Exception: ${err.message}`);
    gracefulShutdown('Uncaught Exception');
  });

  process.on('SIGTERM', () => {
    gracefulShutdown('SIGTERM received');
  });
}

// Serverless Handler for Vercel
const vercelHandler = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection error in Vercel handler:', err);
  }
  return app(req, res);
};

export default process.env.VERCEL ? vercelHandler : app;
