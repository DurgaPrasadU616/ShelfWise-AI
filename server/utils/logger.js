import { createLogger, format, transports } from 'winston';
import config from '../config/env.js';

const { combine, timestamp, printf, colorize, json, errors } = format;

const consoleFormat = combine(
  colorize({ level: true }),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    const stackString = stack ? `\n${stack}` : '';
    return `${ts} [${level}]: ${message}${metaString}${stackString}`;
  })
);

const fileFormat = combine(
  errors({ stack: true }),
  timestamp(),
  json()
);

const logger = createLogger({
  level: config.logger.level,
  format: fileFormat,
  transports: [
    new transports.Console({
      format: config.isProduction ? fileFormat : consoleFormat,
    }),
  ],
  exitOnError: false,
});

if (config.logger.fileEnabled) {
  logger.add(new transports.File({ filename: config.logger.filePath }));
}

export default logger;
