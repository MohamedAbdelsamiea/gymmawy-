#!/bin/bash

# 🔧 Gymmawy Environment Setup Script
# This script creates the necessary .env files for development and Railway deployment

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Setting up Gymmawy environment files...${NC}"

# Backend .env file
BACKEND_ENV_FILE="gymmawy-backend/.env"

if [ ! -f "$BACKEND_ENV_FILE" ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    
    cat > "$BACKEND_ENV_FILE" << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://gymmawy_user:password@localhost:5431/gymmawy?schema=public"

# Server Configuration
NODE_ENV="development"
PORT=3000
APP_URL="http://localhost:3000"

# JWT Configuration
JWT_ACCESS_SECRET="gymmawy-access-secret-2024-development"
JWT_REFRESH_SECRET="gymmawy-refresh-secret-2024-development"
ACCESS_TOKEN_TTL="15m"
REFRESH_TOKEN_TTL="30d"
JWT_ISSUER="gymmawy"

# CORS Configuration
CORS_ORIGIN="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# Email Configuration (Optional - for production)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@gymmawy.com"

# SMS Configuration (Optional - for production)
SMS_PROVIDER=""
SMS_API_KEY=""
SMS_SENDER_ID=""

# File Upload Configuration
MAX_FILE_SIZE="10485760"
UPLOAD_PATH="./uploads"

# Security
BCRYPT_ROUNDS="12"
SESSION_SECRET="gymmawy-session-secret-2024"

# Logging
LOG_LEVEL="info"
LOG_FILE="./logs/app.log"

# Redis Configuration (Optional - for caching)
REDIS_URL=""

# Payment Gateway Configuration (Optional - for production)
PAYMENT_GATEWAY_URL=""
PAYMENT_GATEWAY_KEY=""
PAYMENT_GATEWAY_SECRET=""

# Frontend URL (for production)
FRONTEND_URL="http://localhost:5173"

# External Service URLs
TRACKING_BASE_URL="https://tracking.gymmawy.com"
LABELS_BASE_URL="https://labels.gymmawy.com"

# Admin Configuration
ADMIN_EMAIL="admin@gymmawy.com"
ADMIN_PASSWORD="admin123"

# Development Tools
DEBUG="gymmawy:*"
NODE_OPTIONS="--max-old-space-size=4096"
EOF

    echo -e "${GREEN}✅ Backend .env file created!${NC}"
else
    echo -e "${YELLOW}⚠️  Backend .env file already exists, skipping...${NC}"
fi

# Frontend .env file
FRONTEND_ENV_FILE="gymmawy-frontend/.env"

if [ ! -f "$FRONTEND_ENV_FILE" ]; then
    echo -e "${YELLOW}Creating frontend .env file...${NC}"
    
    cat > "$FRONTEND_ENV_FILE" << 'EOF'
# Frontend Environment Variables
REACT_APP_API_URL="http://localhost:3000/api"
REACT_APP_ENVIRONMENT="development"
GENERATE_SOURCEMAP=true
EOF

    echo -e "${GREEN}✅ Frontend .env file created!${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend .env file already exists, skipping...${NC}"
fi

# Create .env.example files for documentation
echo -e "${YELLOW}Creating .env.example files...${NC}"

# Backend .env.example
cat > "gymmawy-backend/.env.example" << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://gymmawy_user:password@localhost:5431/gymmawy?schema=public"

# Server Configuration
NODE_ENV="development"
PORT=3000
APP_URL="http://localhost:3000"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
JWT_ISSUER="gymmawy"

# CORS Configuration
CORS_ORIGIN="http://localhost:5173"

# Rate Limiting
RATE_LIMIT_WINDOW_MS="900000"
RATE_LIMIT_MAX_REQUESTS="100"

# Email Configuration (Optional - for production)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="noreply@gymmawy.com"

# SMS Configuration (Optional - for production)
SMS_PROVIDER=""
SMS_API_KEY=""
SMS_SENDER_ID=""

# File Upload Configuration
MAX_FILE_SIZE="10485760"
UPLOAD_PATH="./uploads"

# Security
BCRYPT_ROUNDS="12"
SESSION_SECRET="your-session-secret-change-this"

# Logging
LOG_LEVEL="info"
LOG_FILE="./logs/app.log"

# Redis Configuration (Optional - for caching)
REDIS_URL=""

# Payment Gateway Configuration (Optional - for production)
PAYMENT_GATEWAY_URL=""
PAYMENT_GATEWAY_KEY=""
PAYMENT_GATEWAY_SECRET=""

# Frontend URL (for production)
FRONTEND_URL="http://localhost:5173"

# External Service URLs
TRACKING_BASE_URL="https://tracking.gymmawy.com"
LABELS_BASE_URL="https://labels.gymmawy.com"

# Admin Configuration
ADMIN_EMAIL="admin@gymmawy.com"
ADMIN_PASSWORD="admin123"

# Development Tools
DEBUG="gymmawy:*"
NODE_OPTIONS="--max-old-space-size=4096"
EOF

# Frontend .env.example
cat > "gymmawy-frontend/.env.example" << 'EOF'
# Frontend Environment Variables
REACT_APP_API_URL="http://localhost:3000/api"
REACT_APP_ENVIRONMENT="development"
GENERATE_SOURCEMAP=true
EOF

echo -e "${GREEN}✅ .env.example files created!${NC}"

# Create logs directory
mkdir -p gymmawy-backend/logs
mkdir -p gymmawy-backend/uploads

echo -e "${GREEN}✅ Logs and uploads directories created!${NC}"

echo ""
echo -e "${GREEN}🎉 Environment setup complete!${NC}"
echo ""
echo "Files created:"
echo "  📁 gymmawy-backend/.env"
echo "  📁 gymmawy-frontend/.env"
echo "  📁 gymmawy-backend/.env.example"
echo "  📁 gymmawy-frontend/.env.example"
echo "  📁 gymmawy-backend/logs/"
echo "  📁 gymmawy-backend/uploads/"
echo ""
echo -e "${YELLOW}⚠️  Remember to:${NC}"
echo "  1. Update JWT_SECRET for production"
echo "  2. Update database credentials if needed"
echo "  3. Configure email/SMS settings for production"
echo "  4. Never commit .env files to version control"
echo ""
echo -e "${BLUE}Ready to start development! 🚀${NC}"
