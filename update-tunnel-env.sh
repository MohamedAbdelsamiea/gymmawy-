#!/bin/bash

# 🔧 Tunnel Environment Update Script
# Updates environment variables for tunnel URLs

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default tunnel URLs
BACKEND_URL="https://gymmawy-api.loca.lt"
FRONTEND_URL="https://gymmawy-frontend.loca.lt"

# Allow custom URLs
if [ $# -eq 2 ]; then
    BACKEND_URL=$1
    FRONTEND_URL=$2
fi

echo -e "${BLUE}🔧 Updating environment variables for tunnel...${NC}"

# Update backend CORS
echo -e "${YELLOW}Updating backend CORS...${NC}"
if [ -f "gymmawy-backend/.env" ]; then
    # Update or add CORS_ORIGIN
    if grep -q "CORS_ORIGIN" gymmawy-backend/.env; then
        sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=${FRONTEND_URL},http://localhost:5173|" gymmawy-backend/.env
    else
        echo "CORS_ORIGIN=${FRONTEND_URL},http://localhost:5173" >> gymmawy-backend/.env
    fi
    echo -e "${GREEN}✅ Backend CORS updated${NC}"
else
    echo -e "${YELLOW}⚠️  Backend .env not found. Please run setup-env.sh first${NC}"
fi

# Update frontend API URL
echo -e "${YELLOW}Updating frontend API URL...${NC}"
if [ -f "gymmawy-frontend/.env" ]; then
    # Update or add REACT_APP_API_URL
    if grep -q "REACT_APP_API_URL" gymmawy-frontend/.env; then
        sed -i "s|REACT_APP_API_URL=.*|REACT_APP_API_URL=${BACKEND_URL}/api|" gymmawy-frontend/.env
    else
        echo "REACT_APP_API_URL=${BACKEND_URL}/api" >> gymmawy-frontend/.env
    fi
    echo -e "${GREEN}✅ Frontend API URL updated${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend .env not found. Please run setup-env.sh first${NC}"
fi

echo -e "${GREEN}🎉 Environment updated!${NC}"
echo ""
echo -e "${BLUE}Updated URLs:${NC}"
echo -e "  🔗 Backend API: ${BACKEND_URL}"
echo -e "  🔗 Frontend: ${FRONTEND_URL}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Restart your backend: cd gymmawy-backend && npm run dev"
echo "2. Restart your frontend: cd gymmawy-frontend && npm run dev"
echo "3. Your app will be accessible via the tunnel URLs"
