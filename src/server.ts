import colors from 'colors';
import mongoose from 'mongoose';
import app from './app';
import config from './config';
import seedAdmin from './DB';
import { errorLogger, logger } from './shared/logger';

// Uncaught exception handler
process.on('uncaughtException', error => {
  errorLogger.error('UnhandleException Detected', error);
  process.exit(1);
});

// Unhandled rejection handler
process.on('unhandledRejection', error => {
  errorLogger.error('Unhandled Rejection Detected', error);
  process.exit(1);
});

// SIGTERM handler
process.on('SIGTERM', () => {
  logger.info('SIGTERM IS RECEIVED');
});

// Connect to database (works in both serverless and development)
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    logger.info('MongoDB is already connected');
    return;
  }

  try {
    await mongoose.connect(config.database.mongodb_uri as string);
    isConnected = true;
    logger.info(colors.green('🚀 Database connected successfully'));

    // Only seed admin in development environment
    if (process.env.NODE_ENV !== 'production') {
      seedAdmin();
    }
  } catch (error) {
    errorLogger.error(colors.red('🤢 Failed to connect Database'), error);
  }
};

// Connect to database
connectDB();

// Start server only in development environment
if (process.env.NODE_ENV !== 'production') {
  const port =
    typeof config.port === 'number' ? config.port : Number(config.port);
  app.listen(port, config.ip_address as string, () => {
    logger.info(
      colors.yellow(`♻️   Application listening on port: ${config.port}`)
    );
  });
}

export default app;
