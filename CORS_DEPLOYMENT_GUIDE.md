# CORS Deployment Guide for Gymmawy

This guide ensures your application has no CORS issues when deployed to production.

## 🚀 Quick Setup

Run the setup script to create all necessary environment files:

```bash
./setup-production-cors.sh
```

## 📋 CORS Configuration Summary

### Backend CORS Settings
- **Production domains**: `https://gym.omarelnemr.xyz`, `https://www.gym.omarelnemr.xyz`
- **Development domains**: `http://localhost:3000`, `http://localhost:3001`, `http://localhost:5173`
- **Credentials**: Enabled (for authentication cookies)
- **Methods**: GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Headers**: Origin, X-Requested-With, Content-Type, Accept, Authorization, X-API-Key

### Frontend Configuration
- **Production API**: `https://gym.omarelnemr.xyz/api`
- **Development API**: `http://localhost:3000/api`
- **Static files**: Same domain as API

## 🔧 Environment Files

### Backend Production (.env.production)
```env
CORS_ORIGIN="https://gym.omarelnemr.xyz,https://www.gym.omarelnemr.xyz,http://localhost:3000,http://localhost:3001,http://localhost:5173"
NODE_ENV="production"
PORT=3000
```

### Frontend Production (.env.production)
```env
VITE_API_BASE_URL=https://gym.omarelnemr.xyz/api
VITE_STATIC_BASE_URL=https://gym.omarelnemr.xyz
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

## 🚀 Deployment Steps

### 1. Backend Deployment
```bash
cd gymmawy-backend
cp .env.production .env
# Update database credentials, JWT secrets, etc.
npm install
npm start
```

### 2. Frontend Deployment
```bash
cd gymmawy-frontend
cp .env.production .env
npm install
npm run build
npm run start
```

## 🛡️ Security Features

### Enhanced CORS Protection
- **Subdomain support**: Automatically allows subdomains of production domain
- **Origin validation**: Strict validation with logging of blocked origins
- **Credential support**: Proper handling of authentication cookies
- **Preflight handling**: Comprehensive OPTIONS request support

### Static File CORS
- **Upload middleware**: CORS headers for file uploads and serving
- **Image serving**: Proper CORS for product images and user uploads
- **Cross-origin policies**: Configured for secure resource sharing

## 🔍 Testing CORS

### Local Testing
```bash
# Test with curl
curl -H "Origin: https://gym.omarelnemr.xyz" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS \
     http://localhost:3000/api/users/me
```

### Production Testing
```bash
# Test production CORS
curl -H "Origin: https://gym.omarelnemr.xyz" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Authorization" \
     -X OPTIONS \
     https://gym.omarelnemr.xyz/api/users/me
```

## 🐛 Troubleshooting

### Common CORS Issues

1. **"Not allowed by CORS" error**
   - Check if your domain is in `CORS_ORIGIN`
   - Verify the origin header matches exactly
   - Check server logs for blocked origins

2. **Credentials not working**
   - Ensure `credentials: true` is set
   - Check that `Access-Control-Allow-Credentials: true` header is present
   - Verify frontend is sending credentials

3. **Preflight requests failing**
   - Check OPTIONS method is allowed
   - Verify all required headers are in `allowedHeaders`
   - Ensure `optionsSuccessStatus: 200` is set

### Debug Mode
Enable CORS debugging by setting:
```env
DEBUG=cors
```

## 📝 Notes

- **Environment variables**: All `.env.*` files are gitignored for security
- **Subdomain support**: Automatically handles `www.gym.omarelnemr.xyz`
- **Legacy browser support**: `optionsSuccessStatus: 200` for older browsers
- **Logging**: CORS violations are logged for monitoring

## ✅ Verification Checklist

- [ ] Environment files created with correct domains
- [ ] Backend CORS configuration updated
- [ ] Frontend API URLs configured
- [ ] Static file CORS headers set
- [ ] Credentials enabled for authentication
- [ ] Preflight requests handled
- [ ] Production domains tested
- [ ] Development domains still work

Your application is now ready for production deployment without CORS issues! 🎉
