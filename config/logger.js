// config/logger.js
// Winston logger configuration for application-wide logging

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Determine log level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (for development)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => {
      const { timestamp, level, message, ...meta } = info;
      let msg = `${timestamp} [${level}]: ${message}`;
      
      // Add metadata if present
      if (Object.keys(meta).length > 0) {
        // Filter out empty objects and internal winston properties
        const filteredMeta = Object.entries(meta)
          .filter(([key, value]) => 
            !['splat', 'Symbol(level)', 'Symbol(message)'].includes(key) &&
            value !== undefined &&
            (typeof value !== 'object' || Object.keys(value).length > 0)
          )
          .reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {});
        
        if (Object.keys(filteredMeta).length > 0) {
          msg += `\n${JSON.stringify(filteredMeta, null, 2)}`;
        }
      }
      
      return msg;
    }
  )
);

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Define transports
const transports = [
  // Console transport (always enabled in development)
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
  }),

  // Error log file - rotate daily
  new DailyRotateFile({
    filename: path.join(logsDir, 'error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'error',
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days
    format: logFormat,
  }),

  // Combined log file - rotate daily
  new DailyRotateFile({
    filename: path.join(logsDir, 'combined-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxSize: '20m',
    maxFiles: '14d',
    format: logFormat,
  }),

  // HTTP requests log - rotate daily
  new DailyRotateFile({
    filename: path.join(logsDir, 'http-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    level: 'http',
    maxSize: '20m',
    maxFiles: '7d', // Keep HTTP logs for 7 days
    format: logFormat,
  }),
];

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Create a stream for Morgan HTTP logger
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

// Helper methods for structured logging
logger.logRequest = (req, message = 'Request received') => {
  logger.http(message, {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
  });
};

logger.logResponse = (req, res, duration) => {
  logger.http('Request completed', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip || req.connection.remoteAddress,
  });
};

logger.logError = (error, req = null) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    ...(req && {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
    }),
  };
  
  logger.error('Error occurred', errorInfo);
};

logger.logAuth = (action, userId, details = {}) => {
  logger.info(`Auth: ${action}`, {
    userId,
    ...details,
  });
};

logger.logDatabase = (operation, model, details = {}) => {
  logger.debug(`Database: ${operation}`, {
    model,
    ...details,
  });
};

// Log unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise,
    reason: reason instanceof Error ? reason.message : reason,
    stack: reason instanceof Error ? reason.stack : undefined,
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
  });
  
  // Give time for logs to write before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

export default logger;
