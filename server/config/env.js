import 'dotenv/config';

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_ACCESS_SECRET || !process.env.JWT_REFRESH_SECRET) {
    console.error('FATAL ERROR: JWT_ACCESS_SECRET and JWT_REFRESH_SECRET environment variables are required in production.');
    process.exit(1);
  }
}

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
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL || '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL || '7d',
  },

  cookie: {
    name: 'sw_refresh',
    secure: process.env.NODE_ENV === 'production' ? true : parseBool(process.env.COOKIE_SECURE, false),
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : (process.env.COOKIE_SAME_SITE || 'lax'),
    path: '/api/auth',
  },

  logger: {
    level: process.env.LOG_LEVEL || 'info',
    fileEnabled: parseBool(process.env.LOG_FILE_ENABLED, false),
    filePath: process.env.LOG_FILE_PATH || 'logs/app.log',
  },

  email: {
    host: process.env.EMAIL_HOST || '',
    port: parseNumber(process.env.EMAIL_PORT, 587),
    secure: parseBool(process.env.EMAIL_SECURE, false),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || 'ShelfWise AI <noreply@shelfwise.ai>',
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    ocrTimeoutMs: parseNumber(process.env.GEMINI_OCR_TIMEOUT_MS, 60000),
  },
};

export default config;
