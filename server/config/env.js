import 'dotenv/config';

const parseBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseNumber(process.env.PORT, 5000),
  isProduction: process.env.NODE_ENV === 'production',

  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shelfwise',
    connectTimeoutMs: parseNumber(process.env.MONGO_CONNECT_TIMEOUT_MS, 10000),
    retries: parseNumber(process.env.MONGO_CONNECT_RETRIES, 5),
    retryDelayMs: parseNumber(process.env.MONGO_RETRY_DELAY_MS, 2000),
  },

  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    credentials: true,
  },

  rateLimit: {
    windowMs: parseNumber(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
    max: parseNumber(process.env.RATE_LIMIT_MAX, 300),
  },

  authRateLimit: {
    windowMs: parseNumber(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60 * 1000),
    max: parseNumber(process.env.AUTH_RATE_LIMIT_MAX, 10),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  },

  cookie: {
    name: 'sw_refresh',
    secure: parseBool(process.env.COOKIE_SECURE, false),
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    path: '/api/auth',
  },

  logger: {
    level: process.env.LOG_LEVEL || 'info',
    fileEnabled: parseBool(process.env.LOG_FILE_ENABLED, false),
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
  },
};

export default config;
