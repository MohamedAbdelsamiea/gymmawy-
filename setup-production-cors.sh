#!/bin/bash

# Production CORS Setup Script for Gymmawy
# This script helps set up proper CORS configuration for production deployment

echo "🚀 Setting up production CORS configuration..."

# Backend CORS setup
echo "📝 Creating backend production environment file..."
cat > gymmawy-backend/.env.production << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/gymmawy_db"

# JWT Configuration
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-key"

# Server Configuration
PORT=3000
NODE_ENV="production"
FRONTEND_URL="https://gym.omarelnemr.xyz"

# CORS Configuration - Production domains
CORS_ORIGIN="https://gym.omarelnemr.xyz,https://www.gym.omarelnemr.xyz,http://localhost:3000,http://localhost:3001,http://localhost:5173"

# Cookie Configuration
COOKIE_SECRET="your-cookie-secret"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Redis Configuration (for caching and rate limiting)
REDIS_URL="redis://localhost:6379"

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"

# Tabby Payment Gateway Configuration
TABBY_SECRET_KEY="sk_test_01983bfd-82bd-ef7b-3843-b3012b0c4abc"
TABBY_PUBLIC_KEY="pk_test_01983bfd-82bd-ef7b-3843-b3010ce00361"
TABBY_MERCHANT_CODE="your-merchant-code"

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL="info"
LOG_FILE_PATH="./logs"

# GeoIP Configuration (for location-based features)
MAXMIND_LICENSE_KEY=""
MAXMIND_ACCOUNT_ID=""
EOF

# Frontend production environment setup
echo "📝 Creating frontend production environment file..."
cat > gymmawy-frontend/.env.production << 'EOF'
# Production Environment Variables for Frontend
VITE_API_BASE_URL=https://gym.omarelnemr.xyz/api
VITE_STATIC_BASE_URL=https://gym.omarelnemr.xyz
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
EOF

# Frontend development environment setup
echo "📝 Creating frontend development environment file..."
cat > gymmawy-frontend/.env.development << 'EOF'
# Development Environment Variables for Frontend
VITE_API_BASE_URL=http://localhost:3000/api
VITE_STATIC_BASE_URL=http://localhost:3000
VITE_ENABLE_DEBUG=true
VITE_ENABLE_ANALYTICS=false
EOF

# Backend development environment setup
echo "📝 Creating backend development environment file..."
cat > gymmawy-backend/.env.development << 'EOF'
# Development Environment Variables for Backend
DATABASE_URL="postgresql://username:password@localhost:5432/gymmawy_db"
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-jwt-refresh-secret-key"
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5173"
CORS_ORIGIN="http://localhost:3000,http://localhost:3001,http://localhost:5173,https://gym.omarelnemr.xyz"
COOKIE_SECRET="your-cookie-secret"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
REDIS_URL="redis://localhost:6379"
MAX_FILE_SIZE=10485760
UPLOAD_PATH="./uploads"
TABBY_SECRET_KEY="sk_test_01983bfd-82bd-ef7b-3843-b3012b0c4abc"
TABBY_PUBLIC_KEY="pk_test_01983bfd-82bd-ef7b-3843-b3010ce00361"
TABBY_MERCHANT_CODE="your-merchant-code"
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL="debug"
LOG_FILE_PATH="./logs"
MAXMIND_LICENSE_KEY=""
MAXMIND_ACCOUNT_ID=""
EOF

echo "✅ Environment files created successfully!"
echo ""
echo "🔧 Next steps:"
echo "1. Update the database credentials in the .env files"
echo "2. Update JWT secrets with secure random strings"
echo "3. Update email configuration"
echo "4. Update payment gateway credentials"
echo ""
echo "🚀 For production deployment:"
echo "   Backend: cp gymmawy-backend/.env.production gymmawy-backend/.env"
echo "   Frontend: cp gymmawy-frontend/.env.production gymmawy-frontend/.env"
echo ""
echo "🛠️  For development:"
echo "   Backend: cp gymmawy-backend/.env.development gymmawy-backend/.env"
echo "   Frontend: cp gymmawy-frontend/.env.development gymmawy-frontend/.env"
echo ""
echo "📋 CORS Configuration Summary:"
echo "   Production domains: https://gym.omarelnemr.xyz, https://www.gym.omarelnemr.xyz"
echo "   Development domains: http://localhost:3000, http://localhost:3001, http://localhost:5173"
echo "   Credentials: enabled"
echo "   Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS"
echo ""
echo "✨ CORS setup complete! Your application is ready for production deployment."
