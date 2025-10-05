// scripts/test-db-connection.js
// Test database connection and pool settings

import prisma from '../lib/prisma.js';
import { checkDatabaseConnection, getConnectionStats } from '../lib/db-health.js';

console.log('🔍 Testing PostgreSQL Connection...\n');

async function testConnection() {
  try {
    // Test 1: Simple query
    console.log('1️⃣ Testing basic connection...');
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('   ✅ Basic connection successful');

    // Test 2: Database info
    console.log('\n2️⃣ Getting database information...');
    const dbInfo = await prisma.$queryRaw`
      SELECT 
        current_database() as database,
        current_user as user,
        version() as version
    `;
    console.log('   Database:', dbInfo[0].database);
    console.log('   User:', dbInfo[0].user);
    console.log('   Version:', dbInfo[0].version.split(' ')[1]);

    // Test 3: Connection stats
    console.log('\n3️⃣ Getting connection statistics...');
    const stats = await getConnectionStats();
    if (stats) {
      console.log('   Total connections:', stats.total_connections);
      console.log('   Active connections:', stats.active_connections);
      console.log('   Idle connections:', stats.idle_connections);
    }

    // Test 4: Check connection pool settings
    console.log('\n4️⃣ Checking connection pool settings...');
    const poolSettings = await prisma.$queryRaw`
      SHOW max_connections
    `;
    console.log('   Max connections allowed:', poolSettings[0].max_connections);

    // Test 5: Count tables
    console.log('\n5️⃣ Counting database tables...');
    const tableCount = await prisma.$queryRaw`
      SELECT count(*) as table_count
      FROM information_schema.tables
      WHERE table_schema = 'public'
    `;
    console.log('   Tables in database:', tableCount[0].table_count);

    // Test 6: Check if User table exists
    console.log('\n6️⃣ Testing User table...');
    const userCount = await prisma.user.count();
    console.log('   Users in database:', userCount);

    console.log('\n✅ All database connection tests passed!\n');
    
  } catch (error) {
    console.error('\n❌ Database connection test failed:');
    console.error('   Error:', error.message);
    console.error('   Code:', error.code);
    
    if (error.message.includes('Closed')) {
      console.error('\n💡 This error suggests connection pool exhaustion.');
      console.error('   Fix: Update lib/prisma.js and add connection limits to DATABASE_URL');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Disconnected from database');
  }
}

testConnection();
