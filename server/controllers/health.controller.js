import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';
import { getDbState, isDbConnected } from '../utils/dbState.js';

export const getHealth = asyncHandler(async (_req, res) => {
  const dbConnected = isDbConnected();

  const payload = {
    status: dbConnected ? 'ok' : 'degraded',
    uptime: process.uptime(),
    db: getDbState(),
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  };

  if (!dbConnected) {
    throw new AppError('DB_UNAVAILABLE', 'Database is not connected', 503, payload);
  }

  return res.status(200).json({ success: true, data: payload });
});
