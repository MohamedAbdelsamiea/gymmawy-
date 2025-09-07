#!/bin/bash

# 🚀 Gymmawy Replit Setup Script
# This script sets up your PERN stack for Replit

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up Gymmawy for Replit...${NC}"

# Install root dependencies
echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
npm install

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd gymmawy-backend
npm install
cd ..

# Install frontend dependencies
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd gymmawy-frontend
npm install
cd ..

# Setup environment files
echo -e "${YELLOW}🔧 Setting up environment files...${NC}"

# Backend .env
if [ ! -f "gymmawy-backend/.env" ]; then
    cp replit.env.example gymmawy-backend/.env
    echo -e "${GREEN}✅ Backend .env created${NC}"
else
    echo -e "${YELLOW}⚠️  Backend .env already exists${NC}"
fi

# Frontend .env
if [ ! -f "gymmawy-frontend/.env" ]; then
    cat > gymmawy-frontend/.env << 'EOF'
REACT_APP_API_URL=https://your-repl-url.replit.dev/api
REACT_APP_ENVIRONMENT=development
GENERATE_SOURCEMAP=true
EOF
    echo -e "${GREEN}✅ Frontend .env created${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend .env already exists${NC}"
fi

# Generate Prisma client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
cd gymmawy-backend
npx prisma generate
cd ..

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Start PostgreSQL in Replit"
echo "2. Run: npm run setup"
echo "3. Update environment variables with your Replit URL"
echo "4. Run: npm run dev"
echo ""
echo -e "${YELLOW}Don't forget to:${NC}"
echo "- Update CORS_ORIGIN with your actual Replit URL"
echo "- Update REACT_APP_API_URL with your actual Replit URL"
echo "- Set up your database connection"
