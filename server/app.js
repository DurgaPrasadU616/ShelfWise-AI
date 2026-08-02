import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import config from './config/env.js';
import logger from './utils/logger.js';
import routes from './routes/index.js';
import notFoundHandler from './middleware/notFound.js';
import errorHandler from './middleware/errorHandler.js';
import globalLimiter from './middleware/rateLimiter.js';
import { initCronJobs } from './jobs/cron.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  })
);
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use('/api', globalLimiter);

// Initialize Scheduled Jobs
initCronJobs();

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
