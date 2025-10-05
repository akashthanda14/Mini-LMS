// lib/prisma.js
// Prisma client singleton with proper connection pooling

import { PrismaClient } from '@prisma/client';

const globalForPrisma = global;

// Create Prisma client with optimized settings for Neon
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Ensure only one instance in development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown handlers
const disconnect = async () => {
  await prisma.$disconnect();
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
