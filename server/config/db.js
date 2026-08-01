import mongoose from 'mongoose';
import config from './env.js';
import logger from '../utils/logger.js';

const connectWithRetry = async (retriesLeft = config.mongo.retries) => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongo.uri, {
      serverSelectionTimeoutMS: config.mongo.connectTimeoutMs,
    });
    logger.info('MongoDB connected', { uri: config.mongo.uri });
  } catch (error) {
    if (retriesLeft <= 0) {
      logger.error('MongoDB connection failed after retries', {
        error: error.message,
      });
      throw error;
    }
    logger.warn(
      `MongoDB connection failed, retrying in ${config.mongo.retryDelayMs}ms (${retriesLeft} left)`,
      { error: error.message }
    );
    await new Promise((resolve) => setTimeout(resolve, config.mongo.retryDelayMs));
    return connectWithRetry(retriesLeft - 1);
  }
};

export const connectDatabase = () => connectWithRetry();

export const disconnectDatabase = async () => {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected');
};

export default mongoose;
