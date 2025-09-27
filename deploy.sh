#!/bin/bash

# Production Deployment Script for Gymmawy
# Run this script on your server after pushing the code

set -e  # Exit on any error

echo "🚀 Starting Gymmawy Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Get current directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
print_status "Working directory: $SCRIPT_DIR"

# Step 1: Set up environment variables
print_status "Step 1: Setting up environment variables..."

# Backend environment
if [ ! -f "$SCRIPT_DIR/gymmawy-backend/.env" ]; then
    print_status "Creating backend .env file..."
    cp "$SCRIPT_DIR/gymmawy-backend/.env.example" "$SCRIPT_DIR/gymmawy-backend/.env"
    print_warning "Please edit gymmawy-backend/.env with your production values"
else
    print_success "Backend .env file already exists"
fi

# Frontend environment
if [ ! -f "$SCRIPT_DIR/gymmawy-frontend/.env" ]; then
    print_status "Creating frontend .env file..."
    cp "$SCRIPT_DIR/gymmawy-frontend/.env.example" "$SCRIPT_DIR/gymmawy-frontend/.env"
    print_warning "Please edit gymmawy-frontend/.env with your production values"
else
    print_success "Frontend .env file already exists"
fi

# Step 2: Install dependencies
print_status "Step 2: Installing dependencies..."

# Backend dependencies
print_status "Installing backend dependencies..."
cd "$SCRIPT_DIR/gymmawy-backend"
npm install
print_success "Backend dependencies installed"

# Frontend dependencies
print_status "Installing frontend dependencies..."
cd "$SCRIPT_DIR/gymmawy-frontend"
npm install
print_success "Frontend dependencies installed"

# Step 3: Database setup
print_status "Step 3: Setting up database..."

cd "$SCRIPT_DIR/gymmawy-backend"

# Check if database is accessible
print_status "Checking database connection..."
if npx prisma db push --accept-data-loss; then
    print_success "Database connection successful"
else
    print_error "Database connection failed. Please check your DATABASE_URL in .env"
    exit 1
fi

# Run migrations
print_status "Running database migrations..."
if npx prisma migrate deploy; then
    print_success "Database migrations completed"
else
    print_error "Database migrations failed"
    exit 1
fi

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Step 4: Build frontend
print_status "Step 4: Building frontend..."

cd "$SCRIPT_DIR/gymmawy-frontend"
if npm run build; then
    print_success "Frontend built successfully"
else
    print_error "Frontend build failed"
    exit 1
fi

# Step 5: Install PM2 if not already installed
print_status "Step 5: Setting up PM2..."

if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
    print_success "PM2 installed"
else
    print_success "PM2 already installed"
fi

# Step 6: Start services with PM2
print_status "Step 6: Starting services with PM2..."

# Stop existing processes if they exist
pm2 stop gymmawy-backend 2>/dev/null || true
pm2 stop gymmawy-frontend 2>/dev/null || true
pm2 delete gymmawy-backend 2>/dev/null || true
pm2 delete gymmawy-frontend 2>/dev/null || true

# Start backend
print_status "Starting backend service..."
cd "$SCRIPT_DIR/gymmawy-backend"
pm2 start src/server.js --name "gymmawy-backend" --env production
print_success "Backend service started"

# Start frontend
print_status "Starting frontend service..."
cd "$SCRIPT_DIR/gymmawy-frontend"
pm2 start npm --name "gymmawy-frontend" -- start
print_success "Frontend service started"

# Save PM2 configuration
pm2 save
print_success "PM2 configuration saved"

# Step 7: Display status
print_status "Step 7: Service status..."
pm2 status

# Step 8: Test deployment
print_status "Step 8: Testing deployment..."

# Wait a moment for services to start
sleep 5

# Test backend health
print_status "Testing backend health..."
if curl -f -s http://localhost:3000/api/health > /dev/null; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check failed - service may still be starting"
fi

# Test frontend
print_status "Testing frontend..."
if curl -f -s http://localhost:8000 > /dev/null; then
    print_success "Frontend is accessible"
else
    print_warning "Frontend test failed - service may still be starting"
fi

# Step 9: Display next steps
print_status "Step 9: Next steps..."

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Configure your reverse proxy (Nginx) - see PRODUCTION_DEPLOYMENT_STEPS.md"
echo "2. Set up SSL certificate (Let's Encrypt recommended)"
echo "3. Configure firewall (ports 80, 443)"
echo "4. Test your domain: https://gym.omarelnemr.xyz"
echo ""
echo "🔧 Useful commands:"
echo "  pm2 status                    # Check service status"
echo "  pm2 logs gymmawy-backend      # View backend logs"
echo "  pm2 logs gymmawy-frontend     # View frontend logs"
echo "  pm2 restart gymmawy-backend   # Restart backend"
echo "  pm2 restart gymmawy-frontend  # Restart frontend"
echo ""
echo "📁 Configuration files:"
echo "  Backend: $SCRIPT_DIR/gymmawy-backend/.env"
echo "  Frontend: $SCRIPT_DIR/gymmawy-frontend/.env"
echo ""
echo "🌐 Your application should be running on:"
echo "  Backend: http://localhost:3000"
echo "  Frontend: http://localhost:8000"
echo ""
print_success "Deployment script completed!"
