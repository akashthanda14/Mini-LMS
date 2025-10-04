// reset-test-data.js
// Reset John's account back to LEARNER for testing

import prisma from './lib/prisma.js';

async function resetTestData() {
  try {
    console.log('🔄 Resetting test data...\n');

    // Find John's user
    const john = await prisma.user.findUnique({
      where: { email: 'john@example.com' }
    });

    if (!john) {
      console.log('❌ John user not found');
      return;
    }

    console.log(`Found user: ${john.email} (Current role: ${john.role})`);

    // Delete John's creator applications
    const deletedApps = await prisma.creatorApplication.deleteMany({
      where: { userId: john.id }
    });

    console.log(`✅ Deleted ${deletedApps.count} application(s)`);

    // Reset John's role to LEARNER
    const updatedUser = await prisma.user.update({
      where: { id: john.id },
      data: { role: 'LEARNER' }
    });

    console.log(`✅ Reset ${updatedUser.email} role to: ${updatedUser.role}`);
    console.log('\n✨ Test data reset complete! You can now run tests again.\n');

  } catch (error) {
    console.error('❌ Error resetting test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetTestData();
