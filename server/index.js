import app from './app.js';
import config from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import logger from './utils/logger.js';

const start = async () => {
  try {
    await connectDatabase();
  } catch (error) {
    logger.error('Server failed to start: database unavailable', {
      error: error.message,
    });
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    logger.info(`ShelfWise API running on port ${config.port} (${config.env})`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled rejection', { error: reason });
  });
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', { error: error.message, stack: error.stack });
    process.exit(1);
  });
};

start();
