// config/swagger.js
// Swagger configuration for API documentation

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LMS Authentication API',
      version: '1.0.0',
      description: 'Learning Management System - User Authentication and Profile Management API',
      contact: {
        name: 'API Support',
        email: 'support@lms.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'http://localhost:4000',
        description: 'Alternative development server',
      },
      {
        url: 'https://api.lms.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            phoneNumber: {
              type: 'string',
              description: 'User phone number',
            },
            role: {
              type: 'string',
              enum: ['USER', 'ADMIN'],
              description: 'User role',
            },
            emailVerified: {
              type: 'boolean',
              description: 'Email verification status',
            },
            phoneVerified: {
              type: 'boolean',
              description: 'Phone verification status',
            },
            isProfileComplete: {
              type: 'boolean',
              description: 'Profile completion status',
            },
            isActive: {
              type: 'boolean',
              description: 'Account active status',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
            errors: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Detailed error messages',
            },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              description: 'Success message',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints (registration, login, password management)',
      },
      {
        name: 'Profile',
        description: 'User profile management endpoints (email/phone change)',
      },
      {
        name: 'Admin',
        description: 'Admin authentication and management endpoints',
      },
      {
        name: 'Health',
        description: 'Server health and status endpoints',
      },
    ],
  },
  apis: ['./swagger/**/*.yaml', './routes/*.js', './server.js'], // Path to API docs
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
