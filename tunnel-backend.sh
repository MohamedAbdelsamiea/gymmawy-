#!/bin/bash

# 🌐 Backend Tunnel Script
# Creates a tunnel for the backend API

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Creating tunnel for backend API...${NC}"

# Check if backend is running
if ! curl -s http://localhost:3000/health > /dev/null; then
    echo -e "${YELLOW}⚠️  Backend not running. Please start it first:${NC}"
    echo "cd gymmawy-backend && npm run dev"
    exit 1
fi

# Create tunnel
echo -e "${YELLOW}Creating tunnel for port 3000...${NC}"
lt --port 3000 --subdomain gymmawy-api

echo -e "${GREEN}✅ Backend tunnel created!${NC}"
echo -e "🔗 Your backend API is now available at: https://gymmawy-api.loca.lt"
