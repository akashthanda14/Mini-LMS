// lib/prisma.js
// Prisma client singleton with proper connection pooling and retry logic

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

// Create Prisma client with optimized settings for Neon and connection retry
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Connection retry logic
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const executeWithRetry = async (operation, retries = MAX_RETRIES) => {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0 && error.message.includes('Closed')) {
      console.log(`🔄 Retrying database operation (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return executeWithRetry(operation, retries - 1);
    }
    throw error;
  }
};

// Wrap Prisma methods with retry logic
const originalQueryRaw = prisma.$queryRaw.bind(prisma);
prisma.$queryRaw = (...args) => executeWithRetry(() => originalQueryRaw(...args));

const originalExecuteRaw = prisma.$executeRaw.bind(prisma);
prisma.$executeRaw = (...args) => executeWithRetry(() => originalExecuteRaw(...args));

// Ensure only one instance in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handlers
const disconnect = async () => {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error.message);
  }
};

process.on('beforeExit', disconnect);
process.on('SIGINT', async () => {
  await disconnect();
  process.exit(0);
});
process.on('SIGTERM', async () => {
  await disconnect();
  process.exit(0);
});

export default prisma;
