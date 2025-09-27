#!/bin/bash

# Reset Database Script
# This script resets the database and creates a single QA test account

echo "🔄 Resetting database and creating QA test account..."

# Navigate to backend directory
cd /opt/gymmawy/gymmawy-backend

# Stop the backend service
echo "⏹️ Stopping backend service..."
pm2 stop gymmawy-backend || true

# Reset the database
echo "🗑️ Resetting database..."
npx prisma db push --force-reset --accept-data-loss

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Start the backend service
echo "▶️ Starting backend service..."
pm2 start gymmawy-backend

# Wait for service to start
echo "⏳ Waiting for service to start..."
sleep 5

# Create admin account
echo "👤 Creating admin account..."
npm run create-admin << EOF
admin@gymmaw.com
Admin123!
Admin
User
01115517665
Egypt
Cairo
EOF

# Create QA test account
echo "🧪 Creating QA test account..."
export ADMIN_EMAIL="admin@gymmaw.com"
export ADMIN_PASSWORD="Admin123!"
npm run create-tabby-accounts

echo "✅ Database reset and QA test account creation completed!"
echo ""
echo "📋 QA Test Account Credentials:"
echo "   Email: qa_tester@gymmawy.com"
echo "   Password: test1234"
echo "   Phone: +971501234567"
echo "   Role: MEMBER"
echo ""
echo "🔑 Admin Account Credentials:"
echo "   Email: admin@gymmaw.com"
echo "   Password: Admin123!"
echo "   Role: ADMIN"
