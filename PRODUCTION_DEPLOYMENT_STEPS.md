# Production Deployment Steps

## 🚀 **Step-by-Step Server Deployment Guide**

### **1. Set Up Environment Variables**

#### **Backend Environment (.env)**
```bash
cd gymmawy-backend
cp .env.example .env
```

Edit `.env` with your production values:
```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/gymmawy_db"

# JWT Configuration
JWT_SECRET="your-production-jwt-secret-key"
JWT_REFRESH_SECRET="your-production-jwt-refresh-secret-key"

# Server Configuration
PORT=3000
NODE_ENV="production"
FRONTEND_URL="https://gym.omarelnemr.xyz"

# CORS Configuration - Production domains
CORS_ORIGIN="https://gym.omarelnemr.xyz,https://www.gym.omarelnemr.xyz,http://localhost:3000,http://localhost:3001,http://localhost:5173"

# Cookie Configuration
COOKIE_SECRET="your-production-cookie-secret"

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
TABBY_SECRET_KEY="your-production-tabby-secret-key"
TABBY_PUBLIC_KEY="your-production-tabby-public-key"
TABBY_MERCHANT_CODE="your-production-merchant-code"

# Security Configuration
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging Configuration
LOG_LEVEL="info"
LOG_FILE_PATH="./logs"

# GeoIP Configuration (for location-based features)
MAXMIND_LICENSE_KEY="your-maxmind-license-key"
MAXMIND_ACCOUNT_ID="your-maxmind-account-id"

# Currency Configuration
DEFAULT_CURRENCY=USD
DEV_CURRENCY=USD
```

#### **Frontend Environment (.env)**
```bash
cd gymmawy-frontend
cp .env.example .env
```

Edit `.env` with your production values:
```env
# Production Environment Variables for Frontend
VITE_API_BASE_URL=https://gym.omarelnemr.xyz/api
VITE_STATIC_BASE_URL=https://gym.omarelnemr.xyz
VITE_ENABLE_DEBUG=false
VITE_ENABLE_ANALYTICS=true
```

### **2. Install Dependencies**

#### **Backend Dependencies**
```bash
cd gymmawy-backend
npm install
```

#### **Frontend Dependencies**
```bash
cd gymmawy-frontend
npm install
```

### **3. Database Setup**

#### **Run Database Migrations**
```bash
cd gymmawy-backend
npx prisma migrate deploy
npx prisma generate
```

#### **Verify Database Connection**
```bash
npx prisma db push
```

### **4. Build Frontend**

```bash
cd gymmawy-frontend
npm run build
```

### **5. Start Services**

#### **Option A: Using PM2 (Recommended)**
```bash
# Install PM2 globally
npm install -g pm2

# Start backend
cd gymmawy-backend
pm2 start src/server.js --name "gymmawy-backend" --env production

# Start frontend
cd gymmawy-frontend
pm2 start npm --name "gymmawy-frontend" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### **Option B: Using Systemd Services**
```bash
# Create backend service
sudo nano /etc/systemd/system/gymmawy-backend.service
```

```ini
[Unit]
Description=Gymmawy Backend API
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/gymmawy-backend
ExecStart=/usr/bin/node src/server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Create frontend service
sudo nano /etc/systemd/system/gymmawy-frontend.service
```

```ini
[Unit]
Description=Gymmawy Frontend
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/gymmawy-frontend
ExecStart=/usr/bin/npm start
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start services
sudo systemctl enable gymmawy-backend
sudo systemctl enable gymmawy-frontend
sudo systemctl start gymmawy-backend
sudo systemctl start gymmawy-frontend
```

### **6. Configure Reverse Proxy (Nginx)**

```bash
sudo nano /etc/nginx/sites-available/gymmawy
```

```nginx
server {
    listen 80;
    server_name gym.omarelnemr.xyz www.gym.omarelnemr.xyz;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gym.omarelnemr.xyz www.gym.omarelnemr.xyz;

    # SSL Configuration
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location /uploads/ {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/gymmawy /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### **7. Verify Deployment**

#### **Check Backend Health**
```bash
curl https://gym.omarelnemr.xyz/api/health
```

#### **Check Frontend**
```bash
curl https://gym.omarelnemr.xyz
```

#### **Test Currency Detection**
```bash
curl "https://gym.omarelnemr.xyz/api/currency/detect"
```

#### **Test Tabby Availability**
```bash
curl "https://gym.omarelnemr.xyz/api/tabby/availability?currency=AED"
```

### **8. Monitor Services**

#### **PM2 Monitoring**
```bash
pm2 status
pm2 logs gymmawy-backend
pm2 logs gymmawy-frontend
```

#### **Systemd Monitoring**
```bash
sudo systemctl status gymmawy-backend
sudo systemctl status gymmawy-frontend
sudo journalctl -u gymmawy-backend -f
sudo journalctl -u gymmawy-frontend -f
```

### **9. SSL Certificate Setup**

#### **Using Certbot (Let's Encrypt)**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d gym.omarelnemr.xyz -d www.gym.omarelnemr.xyz
```

### **10. Firewall Configuration**

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 🔧 **Quick Commands Summary**

```bash
# 1. Set up environment
cd gymmawy-backend && cp .env.example .env
cd gymmawy-frontend && cp .env.example .env

# 2. Install dependencies
cd gymmawy-backend && npm install
cd gymmawy-frontend && npm install

# 3. Database setup
cd gymmawy-backend && npx prisma migrate deploy && npx prisma generate

# 4. Build frontend
cd gymmawy-frontend && npm run build

# 5. Start services with PM2
cd gymmawy-backend && pm2 start src/server.js --name "gymmawy-backend"
cd gymmawy-frontend && pm2 start npm --name "gymmawy-frontend" -- start

# 6. Configure Nginx (see above)
# 7. Set up SSL certificate
# 8. Test deployment
```

## ✅ **Verification Checklist**

- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Database migrations run
- [ ] Frontend built
- [ ] Backend service running
- [ ] Frontend service running
- [ ] Nginx configured
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] Health checks passing
- [ ] Currency detection working
- [ ] Tabby integration working
- [ ] CORS configuration working

Your application should now be live at `https://gym.omarelnemr.xyz`! 🚀
