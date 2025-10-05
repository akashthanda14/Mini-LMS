// scripts/diagnose-db-connection.js
// Comprehensive database connection diagnostic script

import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

console.log('🔍 Database Connection Diagnostic Tool\n');
console.log('=' .repeat(50));

const diagnoseConnection = async () => {
  const issues = [];
  const recommendations = [];

  // 1. Check environment variables
  console.log('1️⃣ Checking environment variables...');
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    issues.push('❌ DATABASE_URL environment variable is not set');
    recommendations.push('Set DATABASE_URL in your .env file');
  } else {
    console.log('   ✅ DATABASE_URL is set');

    // Parse DATABASE_URL
    try {
      const url = new URL(dbUrl);
      console.log(`   Host: ${url.hostname}`);
      console.log(`   Port: ${url.port}`);
      console.log(`   Database: ${url.pathname.slice(1)}`);
      console.log(`   SSL: ${url.searchParams.get('sslmode') || 'not specified'}`);

      // Check for connection pooling parameters
      const poolParams = ['connection_limit', 'pool_timeout', 'pgbouncer'];
      const hasPooling = poolParams.some(param => url.searchParams.has(param));
      if (!hasPooling) {
        recommendations.push('Consider adding connection pooling parameters to DATABASE_URL for better performance');
      }
    } catch (error) {
      issues.push('❌ DATABASE_URL format is invalid');
      recommendations.push('DATABASE_URL should be in format: postgresql://user:password@host:port/database?sslmode=require');
    }
  }

  // 2. Test basic connection
  console.log('\n2️⃣ Testing basic connection...');
  const prisma = new PrismaClient({
    log: ['error', 'warn'],
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });

  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1 as test`;
    const connectionTime = Date.now() - startTime;
    console.log(`   ✅ Basic connection successful (${connectionTime}ms)`);
  } catch (error) {
    issues.push(`❌ Basic connection failed: ${error.message}`);
    if (error.message.includes('authentication')) {
      recommendations.push('Check database credentials in DATABASE_URL');
    } else if (error.message.includes('connect')) {
      recommendations.push('Check network connectivity and firewall settings');
    } else if (error.message.includes('does not exist')) {
      recommendations.push('Verify database name in DATABASE_URL exists');
    }
  }

  // 3. Test connection stability
  console.log('\n3️⃣ Testing connection stability...');
  try {
    for (let i = 1; i <= 3; i++) {
      const startTime = Date.now();
      await prisma.$queryRaw`SELECT ${i} as test`;
      const queryTime = Date.now() - startTime;
      console.log(`   Query ${i}: ${queryTime}ms`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }
    console.log('   ✅ Connection stable');
  } catch (error) {
    issues.push(`❌ Connection stability test failed: ${error.message}`);
    recommendations.push('Connection may be unstable - check Neon dashboard for issues');
  }

  // 4. Check database information
  console.log('\n4️⃣ Getting database information...');
  try {
    const dbInfo = await prisma.$queryRaw`
      SELECT
        current_database() as database,
        current_user as user,
        version() as version,
        now() as current_time
    `;
    console.log(`   Database: ${dbInfo[0].database}`);
    console.log(`   User: ${dbInfo[0].user}`);
    console.log(`   Version: ${dbInfo[0].version.split(' ')[1]}`);
    console.log(`   Time: ${dbInfo[0].current_time}`);
  } catch (error) {
    issues.push(`❌ Could not get database info: ${error.message}`);
  }

  // 5. Check connection limits
  console.log('\n5️⃣ Checking connection limits...');
  try {
    const limits = await prisma.$queryRaw`
      SELECT
        (SELECT count(*) FROM pg_stat_activity) as active_connections,
        (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
    `;
    console.log(`   Active connections: ${limits[0].active_connections}`);
    console.log(`   Max connections: ${limits[0].max_connections}`);

    const active = parseInt(limits[0].active_connections);
    const max = parseInt(limits[0].max_connections);

    if (active > max * 0.8) {
      issues.push('⚠️ High connection usage detected');
      recommendations.push('Monitor connection pool usage - consider increasing limits or optimizing queries');
    }
  } catch (error) {
    console.log(`   Could not check limits: ${error.message}`);
  }

  await prisma.$disconnect();

  // 6. Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('=' .repeat(50));

  if (issues.length === 0) {
    console.log('✅ No issues detected! Database connection is healthy.');
  } else {
    console.log(`❌ Found ${issues.length} issue(s):`);
    issues.forEach(issue => console.log(`   ${issue}`));
  }

  if (recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    recommendations.forEach(rec => console.log(`   • ${rec}`));
  }

  console.log('\n🔗 Useful links:');
  console.log('   Neon Dashboard: https://console.neon.tech');
  console.log('   Prisma Docs: https://www.prisma.io/docs/concepts/database-connectors/postgresql');
  console.log('   Connection Issues: https://neon.tech/docs/connectivity-issues');

  if (issues.length > 0) {
    process.exit(1);
  }
};

diagnoseConnection().catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});
