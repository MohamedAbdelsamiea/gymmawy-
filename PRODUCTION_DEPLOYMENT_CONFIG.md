# Production Deployment Configuration

This document outlines the configuration changes made for production deployment to `https://gym.omarelnemr.xyz`.

## Frontend Configuration

### 1. Package.json Changes
- **File**: `gymmawy-frontend/package.json`
- **Change**: Updated start script to use port 8000
- **Before**: `"start": "vite preview --host 0.0.0.0 --port 3000"`
- **After**: `"start": "vite preview --host 0.0.0.0 --port 8000"`

### 2. Vite Configuration
- **File**: `gymmawy-frontend/vite.config.js`
- **Changes**:
  - Added production base URL: `https://gym.omarelnemr.xyz`
  - Added preview configuration for port 8000
  - Kept development proxy for local API

### 3. Environment Variables
- **Template**: Use `.env.example` as a template
- **Development**: Create `.env.development`:
  ```
  VITE_API_BASE_URL=http://localhost:3000/api
  VITE_ENABLE_DEBUG=true
  VITE_ENABLE_ANALYTICS=false
  ```
- **Production**: Create `.env.production`:
  ```
  VITE_API_BASE_URL=https://gym.omarelnemr.xyz/api
  VITE_ENABLE_DEBUG=false
  VITE_ENABLE_ANALYTICS=true
  ```

### 4. Service Updates
- **File**: `gymmawy-frontend/src/services/currencyService.js`
- **Change**: Updated to use config instead of hardcoded API URL

## Backend Configuration

### 1. Environment Variables
- **Template**: Use `.env.example` as a template
- **Production**: Create `.env.production`:
  ```
  BASE_URL=https://gym.omarelnemr.xyz/api
  CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://localhost:3001,https://gym.omarelnemr.xyz
  ```
- **Development**: Create `.env.development`:
  ```
  BASE_URL=http://localhost:4000
  CORS_ORIGIN=http://localhost:5173,http://localhost:3000,http://localhost:3001
  ```

### 2. CORS Configuration
- Added production domain `https://gym.omarelnemr.xyz` to allowed origins
- Maintained localhost origins for development

## Deployment Instructions

### Frontend Deployment
1. **Development**:
   ```bash
   cd gymmawy-frontend
   npm run dev  # Runs on port 5173 with local API
   ```

2. **Production**:
   ```bash
   cd gymmawy-frontend
   npm run build
   npm run start  # Runs on port 8000 with production API
   ```

### Backend Deployment
1. **Development**:
   ```bash
   cd gymmawy-backend
   cp .env.example .env.development
   # Edit .env.development with your values
   cp .env.development .env
   npm run dev
   ```

2. **Production**:
   ```bash
   cd gymmawy-backend
   cp .env.example .env.production
   # Edit .env.production with your production values
   cp .env.production .env
   npm start
   ```

## URL Structure

### Development
- Frontend: `http://localhost:5173` (dev) / `http://localhost:8000` (preview)
- Backend API: `http://localhost:3000/api`
- Backend Base: `http://localhost:4000`

### Production
- Frontend: `https://gym.omarelnemr.xyz:8000`
- Backend API: `https://gym.omarelnemr.xyz/api`
- Backend Base: `https://gym.omarelnemr.xyz/api`

## Environment Files
- **Templates**: `gymmawy-frontend/.env.example`, `gymmawy-backend/.env.example`
- **Note**: Actual `.env.*` files are gitignored for security
- **Setup**: Copy `.env.example` to `.env.development` or `.env.production` and fill in your values

## Testing
- ✅ Frontend builds successfully
- ✅ Frontend runs on port 8000 in production mode
- ✅ CORS configuration allows production domain
- ✅ API base URL configuration works for both environments
- ✅ Currency service uses config-based API URL

## Notes
- The frontend uses Vite's environment variable system (`VITE_*` prefix)
- The backend uses standard environment variables
- CORS is properly configured to allow the production domain
- Both development and production configurations are preserved
