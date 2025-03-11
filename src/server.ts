// src\server.ts
import colors from 'colors';
import http from 'http';
import mongoose from 'mongoose';
import app from './app';
import config from './config';
import seedAdmin from './DB';
import { errorLogger, logger } from './shared/logger';

// Uncaught exception handler
process.on('uncaughtException', error => {
  errorLogger.error('Unhandle Exception Detected::', error);
  process.exit(1);
});

async function main() {
  try {
    seedAdmin();
    mongoose.connect(config.database.mongodb_uri as string);
    logger.info(colors.green('🚀 Database connected successfully'));

    const port =
      typeof config.port === 'number' ? config.port : Number(config.port);

    const server = http.createServer(app);

    server.listen(port, config.ip_address as string, () => {
      logger.info(
        colors.yellow(`♻️   Application listening on port: ${config.port}`)
      );
    });

    // Unhandled rejection handler
    process.on('unhandledRejection', error => {
      if (server) {
        server.close(() => {
          errorLogger.error('Unhandled Rejection Detected::', error);
          process.exit(1);
        });
      } else {
        process.exit(1);
      }
    });
  } catch (error) {
    errorLogger.error(colors.red('🤢 Failed to connect Database'), error);
  }
}

// SIGTERM handler
process.on('SIGTERM', () => {
  logger.info('SIGTERM IS RECEIVED');
});

main();
