#!/bin/bash

# 🚀 Gymmawy Deployment Script for Railway
# This script prepares and deploys your PERN stack to Railway

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🚀 Starting Gymmawy deployment to Railway..."

# Setup environment files if they don't exist
if [ ! -f "gymmawy-backend/.env" ] || [ ! -f "gymmawy-frontend/.env" ]; then
    echo -e "${BLUE}[INFO]${NC} Setting up environment files..."
    ./setup-env.sh
fi

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

# Check if we're in the right directory
if [ ! -f "railway.json" ]; then
    print_error "railway.json not found. Please run this script from the project root."
    exit 1
fi

# Check if git is initialized
if [ ! -d ".git" ]; then
    print_warning "Git repository not initialized. Initializing..."
    git init
    git add .
    git commit -m "Initial commit: Gymmawy PERN stack"
fi

# Export current data
print_status "Exporting current database data..."
cd gymmawy-backend
npm run export-data
cd ..

# Check if data was exported
if [ ! -d "gymmawy-backend/data-exports" ] || [ -z "$(ls -A gymmawy-backend/data-exports)" ]; then
    print_error "No data exports found. Please check your database connection."
    exit 1
fi

print_success "Data exported successfully!"

# Add all files to git
print_status "Adding files to git..."
git add .
git commit -m "Deploy: Export data and prepare for Railway deployment" || true

# Check if remote origin exists
if ! git remote get-url origin >/dev/null 2>&1; then
    print_warning "No remote origin found. You'll need to add your GitHub repository:"
    echo "git remote add origin https://github.com/yourusername/your-repo.git"
    echo "git push -u origin main"
    exit 1
fi

# Push to GitHub
print_status "Pushing to GitHub..."
git push origin main

print_success "Code pushed to GitHub successfully!"

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Go to https://railway.app"
echo "2. Click 'New Project' and select 'Deploy from GitHub repo'"
echo "3. Connect your GitHub repository"
echo "4. Railway will automatically detect the configuration files"
echo "5. Add a PostgreSQL database service"
echo "6. Set environment variables:"
echo "   - DATABASE_URL (from PostgreSQL service)"
echo "   - JWT_SECRET (generate a secure secret)"
echo "   - CORS_ORIGIN (your frontend URL)"
echo "7. After deployment, run the data import:"
echo "   - Go to your backend service in Railway"
echo "   - Use the terminal feature"
echo "   - Run: npm run import-data"
echo ""
echo "📁 Your data export is saved in: gymmawy-backend/data-exports/"
echo "📋 Check RAILWAY_DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
print_success "Ready for Railway deployment! 🚀"
