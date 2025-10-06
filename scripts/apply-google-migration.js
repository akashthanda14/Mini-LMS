import prisma from '../lib/prisma.js';

const alterSql = `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleAccessToken" VARCHAR(500);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleAvatar" VARCHAR(500);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleId" VARCHAR(255);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "googleRefreshToken" VARCHAR(500);`;

const createIndexSql = `CREATE UNIQUE INDEX IF NOT EXISTS "users_googleId_key" ON "users"("googleId");`;

(async function() {
  try {
    console.log('Applying ALTER TABLE statements...');
    for (const stmt of alterSql.split('\n').filter(Boolean)) {
      await prisma.$executeRawUnsafe(stmt);
    }
    console.log('ALTER TABLE statements applied.');

    console.log('Creating index...');
    await prisma.$executeRawUnsafe(createIndexSql);
    console.log('Index creation attempted.');
  } catch (e) {
    console.error('Migration failed:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
