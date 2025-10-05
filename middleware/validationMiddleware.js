// middleware/validationMiddleware.js
// Validation middleware for common request validations

import { validate as isUUID } from 'uuid';
import logger from '../config/logger.js';

/**
 * Middleware to validate UUID parameters
 * @param {string} paramName - The name of the parameter to validate (default: 'id')
 */
export const validateUUID = (paramName = 'id') => {
  return (req, res, next) => {
    const paramValue = req.params[paramName];

    if (!paramValue) {
      logger.warn('UUID validation failed: Missing parameter', {
        paramName,
        url: req.originalUrl,
      });
      return res.status(400).json({
        success: false,
        message: `Missing required parameter: ${paramName}`,
      });
    }

    if (!isUUID(paramValue)) {
      logger.warn('UUID validation failed: Invalid UUID format', {
        paramName,
        paramValue,
        url: req.originalUrl,
      });
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format. Expected a valid UUID.`,
        received: paramValue,
      });
    }

    next();
  };
};

/**
 * Middleware to validate email format
 */
export const validateEmail = (fieldName = 'email') => {
  return (req, res, next) => {
    const email = req.body[fieldName];

    if (!email) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} is required`,
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${fieldName} format`,
      });
    }

    next();
  };
};

/**
 * Middleware to validate phone number format
 */
export const validatePhone = (fieldName = 'phone') => {
  return (req, res, next) => {
    const phone = req.body[fieldName];

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} is required`,
      });
    }

    // Basic phone validation (can be customized based on requirements)
    const phoneRegex = /^\+?[1-9]\d{9,14}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${fieldName} format. Expected format: +1234567890`,
      });
    }

    next();
  };
};

/**
 * Middleware to validate required fields
 */
export const validateRequiredFields = (fields = []) => {
  return (req, res, next) => {
    const missingFields = [];

    for (const field of fields) {
      if (!req.body[field]) {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields,
      });
    }

    next();
  };
};
