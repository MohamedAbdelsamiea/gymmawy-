#!/bin/bash

# 🌐 Frontend Tunnel Script
# Creates a tunnel for the frontend

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Creating tunnel for frontend...${NC}"

# Check if frontend is running
if ! curl -s http://localhost:5173 > /dev/null; then
    echo -e "${YELLOW}⚠️  Frontend not running. Please start it first:${NC}"
    echo "cd gymmawy-frontend && npm run dev"
    exit 1
fi

# Create tunnel
echo -e "${YELLOW}Creating tunnel for port 5173...${NC}"
lt --port 5173 --subdomain gymmawy-frontend

echo -e "${GREEN}✅ Frontend tunnel created!${NC}"
echo -e "🔗 Your frontend is now available at: https://gymmawy-frontend.loca.lt"
