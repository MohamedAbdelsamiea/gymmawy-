#!/bin/bash

# Database Update Script for Server
# Run this script on your server to update the database

set -e

echo "🗄️ Updating database on server..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Navigate to backend directory
if [ -d "gymmawy-backend" ]; then
    cd gymmawy-backend
    print_status "Working in gymmawy-backend directory"
elif [ -f "package.json" ] && grep -q "gymmawy-backend" package.json; then
    print_status "Already in backend directory"
else
    print_error "Please run this script from the gymmawy project root or gymmawy-backend directory"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create it first."
    print_status "Copy .env.example to .env and configure your database settings"
    exit 1
fi

# Check if Prisma is installed
if ! command -v npx &> /dev/null; then
    print_error "npx not found. Please install Node.js and npm first."
    exit 1
fi

# Check database connection
print_status "Checking database connection..."
if npx prisma db push --accept-data-loss > /dev/null 2>&1; then
    print_success "Database connection successful"
else
    print_error "Database connection failed. Check your DATABASE_URL in .env"
    print_status "Make sure your database is running and accessible"
    exit 1
fi

# Check migration status
print_status "Checking migration status..."
npx prisma migrate status

# Apply migrations
print_status "Applying database migrations..."
if npx prisma migrate deploy; then
    print_success "Migrations applied successfully"
else
    print_error "Migration failed"
    print_status "Check the error messages above and resolve any issues"
    exit 1
fi

# Generate Prisma client
print_status "Generating Prisma client..."
if npx prisma generate; then
    print_success "Prisma client generated successfully"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Sync schema (optional)
print_status "Syncing database schema..."
if npx prisma db push; then
    print_success "Database schema synced"
else
    print_warning "Schema sync had issues, but continuing..."
fi

# Final status check
print_status "Final migration status:"
npx prisma migrate status

# Check if PM2 is running and restart if needed
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "gymmawy-backend"; then
        print_status "Restarting backend service..."
        pm2 restart gymmawy-backend
        print_success "Backend service restarted"
    else
        print_warning "PM2 service 'gymmawy-backend' not found. You may need to start it manually."
    fi
else
    print_warning "PM2 not found. You may need to restart your application manually."
fi

echo ""
print_success "Database update completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Check your application logs: pm2 logs gymmawy-backend"
echo "2. Test your API: curl http://localhost:3000/api/health"
echo "3. Verify currency detection: curl http://localhost:3000/api/currency/detect"
echo "4. Test Tabby UAE: curl 'http://localhost:3000/api/tabby/availability?currency=AED'"
echo ""
print_success "Your database is now up to date and ready for production! 🚀"
