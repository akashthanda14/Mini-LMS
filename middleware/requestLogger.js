// middleware/requestLogger.js
// HTTP request logging middleware using Winston

import logger from '../config/logger.js';

/**
 * Request logging middleware
 * Logs all incoming requests with timing information
 */
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log incoming request
  logger.http(`Incoming ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;
    
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Log response with appropriate level
    const logLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'http';
    
    logger.log(logLevel, `${req.method} ${req.url} ${statusCode}`, {
      method: req.method,
      url: req.url,
      statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
    });
    
    return res.send(data);
  };

  next();
};

/**
 * Error logging middleware
 * Must be used after all routes
 */
export const errorLogger = (err, req, res, next) => {
  logger.logError(err, req);
  next(err);
};

export default requestLogger;
