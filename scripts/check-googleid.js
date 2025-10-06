import prisma from '../lib/prisma.js';

(async function() {
  try {
    const u = await prisma.user.findFirst({ where: { googleId: { not: null } } });
    console.log('RESULT:', JSON.stringify(u, null, 2));
  } catch (e) {
    console.error('ERROR:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
