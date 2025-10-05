#!/bin/bash

# Quick fix script for PostgreSQL connection issues
# Run this when you get connection errors

echo "🔧 PostgreSQL Connection Fix Script"
echo "===================================="
echo ""

# Step 1: Kill existing processes
echo "1️⃣ Killing existing Node.js processes on port 4000..."
lsof -ti:4000 | xargs kill -9 2>/dev/null || echo "   No processes found on port 4000"

# Step 2: Clean up logs
echo ""
echo "2️⃣ Cleaning up old log files..."
rm -f server.log certificate-worker.log worker.log 2>/dev/null
echo "   ✅ Logs cleaned"

# Step 3: Check if database is reachable
echo ""
echo "3️⃣ Testing database connection..."
node -e "
import prisma from './lib/prisma.js';
prisma.\$queryRaw\`SELECT 1\`
  .then(() => {
    console.log('   ✅ Database connection successful');
    process.exit(0);
  })
  .catch((err) => {
    console.log('   ❌ Database connection failed:', err.message);
    process.exit(1);
  });
" 2>&1

# Step 4: Check for zombie processes
echo ""
echo "4️⃣ Checking for zombie Node processes..."
ZOMBIE_PROCS=$(ps aux | grep -i node | grep -v grep | wc -l)
if [ "$ZOMBIE_PROCS" -gt 0 ]; then
  echo "   ⚠️ Found $ZOMBIE_PROCS Node.js process(es)"
  echo "   Run: pkill -f node (to kill all)"
else
  echo "   ✅ No zombie processes"
fi

# Step 5: Show connection recommendations
echo ""
echo "5️⃣ Recommendations:"
echo "   - Add connection_limit=10 to DATABASE_URL"
echo "   - Add pool_timeout=20 to DATABASE_URL"
echo "   - Use 'npm start' instead of 'node server.js'"
echo ""

# Step 6: Offer to restart
echo "===================================="
echo "Ready to start server? (y/n)"
read -r response

if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
  echo ""
  echo "🚀 Starting server..."
  npm start
else
  echo ""
  echo "✅ Fix complete. Run 'npm start' when ready."
fi
