// server.js
// Main server file for LMS Authentication System

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import prisma from './lib/prisma.js';
import swaggerSpec from './config/swagger.js';
import logger from './config/logger.js';
import { requestLogger, errorLogger } from './middleware/requestLogger.js';

// Import authentication routes
import userAuthRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
import creatorRoutes from './routes/creatorRoutes.js';
import adminApplicationRoutes from './routes/adminApplicationRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import adminCourseRoutes from './routes/adminCourseRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import enrollmentRoutes from './routes/enrollmentRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';

// Load environment variables
dotenv.config();

// Log application startup
logger.info('Starting LMS Authentication Server...');

// Initialize Express app
const app = express();

// ================================
// MIDDLEWARE CONFIGURATION
// ================================

// CORS Configuration
// Allow requests from any origin. Using `origin: true` reflects the request origin
// which works with `credentials: true` (unlike a wildcard '*').
const corsOptions = {
  origin: true,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware (Winston)
app.use(requestLogger);

// ================================
// ROOT ROUTE - IMPRESSIVE API INFO
// ================================

// Root endpoint with comprehensive API information
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Welcome to Mini-LMS API - A Modern Full-Stack Learning Management System',
    description: 'Production-ready LMS with role-based authentication, course management, video transcription, and cloud media storage. Built for scalability and performance.',
    version: '1.0.0',
    services: [
      'Node.js (ESM)', 'Express.js', 'Prisma ORM', 'PostgreSQL (Neon)', 'Redis (BullMQ)', 
      'Cloudinary (Media)', 'OpenAI Whisper (Transcription)', 'Fast2SMS (OTP)', 'JWT (Auth)', 
      'Multer (Uploads)', 'Nodemailer (Email)', 'Winston (Logging)', 'Zod (Validation)'
    ],
    apiDocs: '/api-docs',
    features: [
      'User Registration & Authentication (Email/Phone)',
      'Role-Based Access Control (LEARNER/CREATOR/ADMIN)',
      'Course Creation & Management with Image Uploads',
      'Video Transcription via OpenAI Whisper',
      'Certificate Generation & PDF Streaming',
      'Admin Dashboard with Metrics & Analytics',
      'Background Job Processing (BullMQ + Redis)',
      'Cloud Media Storage & Optimization'
    ],
    stats: {
      totalEndpoints: 25,
      supportedRoles: ['LEARNER', 'CREATOR', 'ADMIN'],
      mediaStorage: 'Cloudinary (Auto-optimized)',
      database: 'PostgreSQL with Prisma ORM',
      queueSystem: 'Redis + BullMQ Workers',
      aiIntegration: 'OpenAI Whisper for Video Transcription'
    },
    endpoints: {
      health: '/health',
      apiInfo: '/api',
      auth: '/api/auth',
      courses: '/api/courses',
      admin: '/api/admin',
      docs: '/api-docs',
      swaggerJson: '/api-docs.json'
    },
    documentation: 'Visit /api-docs for interactive Swagger documentation',
    github: 'https://github.com/akashthanda14/Mini-LMS',
    techStack: 'Full-stack LMS: Next.js 15 + React 18 frontend (TypeScript, Tailwind, React Query, Zod, Cloudinary); Node.js + Express backend (Prisma, PostgreSQL, Redis, BullMQ, OpenAI Whisper, JWT RBAC, Fast2SMS SMS, Multer→Cloudinary video/image uploads).'
  });
});

// ================================
// HEALTH CHECK & INFO ROUTES
// ================================

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    logger.debug('Health check: OK');
    
    res.json({
      status: 'OK',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      database: 'Connected',
      environment: process.env.NODE_ENV || 'development',
    });
  } catch (error) {
    logger.error('Health check failed:', { error: error.message });
    
    res.status(503).json({
      status: 'ERROR',
      message: 'Service unavailable',
      timestamp: new Date().toISOString(),
      database: 'Disconnected',
      error: error.message,
    });
  }
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'LMS Authentication API',
    version: '1.0.0',
    description: 'User authentication and profile management system',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      userAuth: '/api/user-auth',
      docs: '/api-docs',
      swaggerJson: '/api-docs.json',
    },
    documentation: 'See /api-docs for interactive API documentation',
  });
});

// ================================
// API DOCUMENTATION (SWAGGER)
// ================================

// Swagger UI options
const swaggerOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'LMS API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    syntaxHighlight: {
      activate: true,
      theme: 'monokai',
    },
  },
};

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerOptions));

// Serve Swagger JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// ================================
// AUTHENTICATION ROUTES
// ================================

// Authentication routes (login, register, /auth/me)
app.use('/api/auth', authRoutes);

// User authentication routes
app.use('/api/user-auth', userAuthRoutes);

// Creator application routes
app.use('/api/creator', creatorRoutes);

// Admin application review routes
app.use('/api/admin/applications', adminApplicationRoutes);

// Admin metrics and analytics routes
// Load admin metrics routes dynamically so missing files don't crash the server in some deploys
try {
  // top-level await is supported in Node 18+; dynamic import will throw if file missing
  const imported = await import('./routes/adminMetricsRoutes.js').catch(() => null);
  if (imported && imported.default) {
    app.use('/api/admin/metrics', imported.default);
  } else {
    logger.warn('Admin metrics routes not found, skipping mount');
  }
} catch (err) {
  logger.warn('Failed to load admin metrics routes, continuing without them', { error: err.message });
}

// Course routes
app.use('/api/courses', courseRoutes);

// Admin course review routes
app.use('/api/admin/courses', adminCourseRoutes);

// Lesson routes
app.use('/api', lessonRoutes);

// Enrollment and progress routes
app.use('/api', enrollmentRoutes);

// Certificate routes
app.use('/api', certificateRoutes);

// ================================
// ERROR HANDLING
// ================================

// 404 handler - Route not found
app.use((req, res, next) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Error logging middleware
app.use(errorLogger);

// Global error handler
app.use((err, req, res, next) => {
  // Error already logged by errorLogger middleware
  logger.error('Error in request handler', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access',
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ================================
// SERVER INITIALIZATION
// ================================

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  // Close database connections
  try {
    await prisma.$disconnect();
    logger.info('Database connections closed successfully');
  } catch (error) {
    logger.error('Error closing database connections', { error: error.message });
  }
  
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(PORT, HOST, async () => {
  logger.info('='.repeat(60));
  logger.info('🚀 LMS Authentication Server Started Successfully');
  logger.info('='.repeat(60));
  logger.info(`📍 Server URL: http://localhost:${PORT}`);
  logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`⏰ Started at: ${new Date().toLocaleString()}`);
  logger.info('='.repeat(60));
  logger.info('📚 Available Endpoints:');
  logger.info(`   Health Check:  http://localhost:${PORT}/health`);
  logger.info(`   API Info:      http://localhost:${PORT}/api`);
  logger.info(`   User Auth:     http://localhost:${PORT}/api/user-auth`);
  logger.info(`   📖 API Docs:   http://localhost:${PORT}/api-docs`);
  logger.info('='.repeat(60));
  
  // Test database connection
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed', { error: error.message });
    logger.warn('⚠️  Server is running but database is not connected');
  }
});

// Handle server errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    logger.error('Server error', { error: error.message, stack: error.stack });
    process.exit(1);
  }
});

export default app;
