#!/bin/bash

# Production Environment Setup Script
# Run this on your production server

echo "🚀 Setting up Production Environment for Gymmawy"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from your project root."
    exit 1
fi

# Backend setup
echo -e "\n🔧 Setting up Backend Environment..."

if [ -d "gymmawy-backend" ]; then
    cd gymmawy-backend
    
    # Check if .env exists
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_status "Creating .env from .env.example"
            cp .env.example .env
        else
            print_error ".env.example not found in backend directory"
            exit 1
        fi
    else
        print_status ".env already exists"
    fi
    
    # Check for MaxMind credentials
    if grep -q "MAXMIND_ACCOUNT_ID=your_maxmind_account_id" .env; then
        print_warning "MaxMind credentials need to be configured"
        print_warning "Setting DEV_CURRENCY=EGP as temporary fix"
        
        # Add DEV_CURRENCY if not present
        if ! grep -q "DEV_CURRENCY=" .env; then
            echo "" >> .env
            echo "# Temporary fix: Use EGP as default currency" >> .env
            echo "DEV_CURRENCY=EGP" >> .env
            print_status "Added DEV_CURRENCY=EGP to .env"
        fi
    else
        print_status "MaxMind credentials appear to be configured"
    fi
    
    # Update CORS for production
    if grep -q "CORS_ORIGIN=" .env; then
        if ! grep -q "https://gym.omarelnemr.xyz" .env; then
            print_status "Adding production domain to CORS_ORIGIN"
            sed -i 's/CORS_ORIGIN=.*/CORS_ORIGIN=http:\/\/localhost:5173,http:\/\/localhost:3000,http:\/\/localhost:3001,https:\/\/gym.omarelnemr.xyz/' .env
        fi
    fi
    
    # Update BASE_URL for production
    if grep -q "BASE_URL=" .env; then
        if ! grep -q "https://gym.omarelnemr.xyz" .env; then
            print_status "Updating BASE_URL for production"
            sed -i 's|BASE_URL=.*|BASE_URL=https://gym.omarelnemr.xyz/api|' .env
        fi
    fi
    
    cd ..
else
    print_error "gymmawy-backend directory not found"
fi

# Frontend setup
echo -e "\n🎨 Setting up Frontend Environment..."

if [ -d "gymmawy-frontend" ]; then
    cd gymmawy-frontend
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        if [ -f ".env.example" ]; then
            print_status "Creating .env.production from .env.example"
            cp .env.example .env.production
        else
            print_error ".env.example not found in frontend directory"
            exit 1
        fi
    else
        print_status ".env.production already exists"
    fi
    
    # Update API URL for production
    if grep -q "VITE_API_BASE_URL=" .env.production; then
        if ! grep -q "https://gym.omarelnemr.xyz" .env.production; then
            print_status "Updating VITE_API_BASE_URL for production"
            sed -i 's|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=https://gym.omarelnemr.xyz/api|' .env.production
        fi
    fi
    
    cd ..
else
    print_error "gymmawy-frontend directory not found"
fi

echo -e "\n📋 Summary of Changes:"
echo "======================="

# Backend summary
if [ -d "gymmawy-backend" ]; then
    echo -e "\n🔧 Backend (.env):"
    if grep -q "DEV_CURRENCY=EGP" gymmawy-backend/.env; then
        echo "  ✅ DEV_CURRENCY=EGP (temporary fix for MaxMind)"
    fi
    if grep -q "https://gym.omarelnemr.xyz" gymmawy-backend/.env; then
        echo "  ✅ Production URLs configured"
    fi
fi

# Frontend summary
if [ -d "gymmawy-frontend" ]; then
    echo -e "\n🎨 Frontend (.env.production):"
    if grep -q "https://gym.omarelnemr.xyz" gymmawy-frontend/.env.production; then
        echo "  ✅ Production API URL configured"
    fi
fi

echo -e "\n🚀 Next Steps:"
echo "==============="
echo "1. Review and update your .env files with actual credentials"
echo "2. Install dependencies: npm install (in both directories)"
echo "3. Build frontend: cd gymmawy-frontend && npm run build"
echo "4. Start services with PM2:"
echo "   pm2 start ecosystem.config.js"
echo "5. Check logs: pm2 logs"

echo -e "\n💡 To fix MaxMind issues:"
echo "1. Get valid MaxMind credentials"
echo "2. Update MAXMIND_ACCOUNT_ID and MAXMIND_LICENSE_KEY in .env"
echo "3. Remove DEV_CURRENCY=EGP line to re-enable geolocation"
echo "4. Restart PM2: pm2 restart all"

print_status "Environment setup complete!"

