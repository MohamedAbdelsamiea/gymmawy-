#!/bin/bash

# 🌐 Gymmawy Local Tunnel Setup Script
# This script starts your PERN stack with local tunnel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Starting Gymmawy with Local Tunnel...${NC}"

# Check if localtunnel is installed
if ! command -v lt &> /dev/null; then
    echo -e "${RED}❌ Local tunnel not found. Installing...${NC}"
    npm install -g localtunnel
fi

# Function to cleanup on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down services...${NC}"
    kill $BACKEND_PID $FRONTEND_PID $TUNNEL_PID 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend
echo -e "${YELLOW}🚀 Starting backend server...${NC}"
cd gymmawy-backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo -e "${YELLOW}⏳ Waiting for backend to start...${NC}"
sleep 5

# Start frontend
echo -e "${YELLOW}🚀 Starting frontend server...${NC}"
cd gymmawy-frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo -e "${YELLOW}⏳ Waiting for frontend to start...${NC}"
sleep 5

# Start tunnel for backend
echo -e "${YELLOW}🌐 Creating tunnel for backend (port 3000)...${NC}"
lt --port 3000 --subdomain gymmawy-api &
TUNNEL_PID=$!

# Wait for tunnel to establish
sleep 3

# Get tunnel URL
TUNNEL_URL="https://gymmawy-api.loca.lt"
echo -e "${GREEN}✅ Backend tunnel created: ${TUNNEL_URL}${NC}"

# Update frontend environment for tunnel
echo -e "${YELLOW}🔧 Updating frontend environment for tunnel...${NC}"
cat > gymmawy-frontend/.env << EOF
REACT_APP_API_URL=${TUNNEL_URL}/api
REACT_APP_ENVIRONMENT=development
GENERATE_SOURCEMAP=true
EOF

# Update backend CORS for tunnel
echo -e "${YELLOW}🔧 Updating backend CORS for tunnel...${NC}"
# We'll need to restart backend with new CORS settings
echo "Please update your backend .env file with:"
echo "CORS_ORIGIN=https://gymmawy-frontend.loca.lt,http://localhost:5173"

echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo -e "${BLUE}Your services are running:${NC}"
echo -e "  🔗 Backend API: ${TUNNEL_URL}"
echo -e "  🔗 Frontend: http://localhost:5173"
echo -e "  🔗 Admin Dashboard: http://localhost:5173/dashboard"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Create another tunnel for frontend: lt --port 5173 --subdomain gymmawy-frontend"
echo "2. Update CORS_ORIGIN in backend .env with the frontend tunnel URL"
echo "3. Restart backend: cd gymmawy-backend && npm run dev"
echo ""
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"

# Keep script running
wait
