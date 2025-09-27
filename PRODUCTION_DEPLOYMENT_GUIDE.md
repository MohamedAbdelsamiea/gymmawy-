# 🚀 Production Deployment Guide - Tabby Integration

## 📋 **Deployment Strategy**

You're deploying the current integration to production while keeping the testing server running for additional validation. This is the optimal approach for Tabby QA testing.

## 🎯 **Current Status**

### ✅ **Ready for Production**
- Complete Tabby integration (SAR + AED support)
- All core test scenarios implemented
- Webhook handling with automatic capture
- Location-based payment availability
- Comprehensive error handling
- Multi-language support (EN/AR)

### 🔄 **Testing Strategy**
- **Production**: Send to Tabby for official QA (3-5 days)
- **Local Testing**: Keep running for additional validation
- **Parallel Development**: Fix any issues found during QA

## 📦 **Deployment Steps**

### **1. Environment Setup**

Create production `.env` file:
```bash
# Production Environment
NODE_ENV=production
DATABASE_URL=postgresql://user:password@your-vps-ip:5432/gymmawy
PORT=3000

# Tabby Configuration (SAME KEYS FOR BOTH COUNTRIES)
TABBY_SECRET_KEY=sk_test_01983bfd-82bd-ef7b-3843-b3012b0c4abc
TABBY_PUBLIC_KEY=pk_test_01983bfd-82bd-ef7b-3843-b3010ce00361
TABBY_MERCHANT_CODE=CCSAU  # Default (Saudi Arabia), UAE (GUAE) handled dynamically

# Frontend URL (YOUR PRODUCTION DOMAIN)
FRONTEND_URL=https://yourdomain.com

# JWT & Security
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
COOKIE_SECRET=your-production-cookie-secret

# CORS (UPDATE WITH YOUR DOMAIN)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Database
BCRYPT_ROUNDS=12
```

### **2. Database Setup**

```bash
# On your VPS
cd /path/to/your/gymmawy-backend

# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Optional: Seed database if needed
npx prisma db seed
```

### **3. Process Management**

```bash
# Install PM2 globally
npm install -g pm2

# Start backend
pm2 start src/server.js --name "gymmawy-backend" --env production

# Start frontend (if serving from same server)
cd ../gymmawy-frontend
npm run build
pm2 start "npm start" --name "gymmawy-frontend"

# Save PM2 configuration
pm2 save
pm2 startup
```

### **4. Nginx Configuration**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    # SSL Certificate (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3001;  # Frontend port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;  # Backend port
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### **5. SSL Certificate**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 🔧 **Tabby Dashboard Configuration**

### **Webhook Setup**
1. Go to [Tabby Merchant Dashboard](https://merchant.tabby.ai)
2. Navigate to **Webhooks**
3. Add new webhook:
   - **URL**: `https://yourdomain.com/api/tabby/webhook`
   - **Events**: `payment.authorized`, `payment.closed`
   - **Test Mode**: `true` (for testing phase)

### **Merchant Codes**
- **Saudi Arabia**: `CCSAU` (already configured)
- **UAE**: `GUAE` (handled automatically based on currency)

## 📧 **Email to Tabby QA Team**

```
Subject: Tabby Integration Ready for QA Testing - Gymmawy Platform

Dear Tabby QA Team,

Our Tabby payment gateway integration is now ready for QA testing.

Integration Details:
- Platform: Gymmawy (Fitness & Community Platform)
- URL: https://yourdomain.com
- Supported Countries: Saudi Arabia (SAR) and UAE (AED)
- Merchant Codes: CCSAU (SAR), GUAE (AED)
- Webhook URL: https://yourdomain.com/api/tabby/webhook

Test Credentials:
- Success: otp.success@tabby.ai / +966500000001 (SAR) or +971500000001 (AED)
- Reject: otp.success@tabby.ai / +966500000002 (SAR) or +971500000002 (AED)
- Failure: otp.rejected@tabby.ai / +966500000001 (SAR) or +971500000001 (AED)
- OTP: 8888

Features Implemented:
✅ Payment Success Flow
✅ Background Pre-scoring Reject
✅ Payment Failure Handling
✅ Payment Cancellation
✅ Corner Case (Browser Tab Closure)
✅ Automatic Payment Capture
✅ Multi-language Support (English/Arabic)
✅ Location-based Availability (SAR/AED only)
✅ Webhook Integration

The integration follows Tabby's official testing guidelines and is ready for your QA process.

Please let me know if you need any additional information or encounter any issues during testing.

Best regards,
[Your Name]
[Your Contact Information]
```

## 🔍 **Post-Deployment Verification**

### **1. Basic Health Checks**
```bash
# Check if backend is running
curl https://yourdomain.com/api/tabby/availability?currency=SAR

# Check if frontend loads
curl -I https://yourdomain.com

# Check webhook endpoint
curl -X POST https://yourdomain.com/api/tabby/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

### **2. Tabby Integration Tests**
```bash
# Test availability for both currencies
curl https://yourdomain.com/api/tabby/availability?currency=SAR
curl https://yourdomain.com/api/tabby/availability?currency=AED
curl https://yourdomain.com/api/tabby/availability?currency=USD
```

### **3. Frontend Tests**
- Visit checkout page
- Verify Tabby option appears for SAR/AED currencies
- Verify Tabby option is hidden for other currencies
- Test payment flow with test credentials

## 🚨 **Monitoring & Troubleshooting**

### **Logs**
```bash
# Backend logs
pm2 logs gymmawy-backend

# Frontend logs
pm2 logs gymmawy-frontend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### **Common Issues**
1. **Webhook not receiving**: Check SSL certificate and firewall
2. **Payment not capturing**: Verify webhook events are enabled
3. **Currency issues**: Check environment variables
4. **Database errors**: Verify database connection and migrations

## 📊 **Success Criteria**

- ✅ Production deployment successful
- ✅ SSL certificate valid
- ✅ Webhook URL accessible
- ✅ Tabby availability API working
- ✅ Frontend loads correctly
- ✅ Payment option shows for SAR/AED only
- ✅ Email sent to Tabby QA team

## 🔄 **Parallel Testing Strategy**

While Tabby conducts their QA testing:

1. **Keep local testing server running** for additional validation
2. **Monitor production logs** for any issues
3. **Test edge cases** on local server
4. **Prepare fixes** for any issues Tabby might find
5. **Document any improvements** needed

## 📞 **Support Contacts**

- **Tabby Support**: [Your Tabby contact]
- **Server Admin**: [Your contact]
- **Development Team**: [Your contact]

---

**Status**: ✅ **Ready for Production Deployment**
**Next Step**: Deploy to VPS and send to Tabby QA team
