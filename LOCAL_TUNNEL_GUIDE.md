# 🌐 Local Tunnel Guide for Gymmawy

This guide will help you expose your local Gymmawy application to the internet using local tunnel.

## 📋 Prerequisites

- Node.js installed
- Local tunnel installed (`npm install -g localtunnel`)
- Your Gymmawy app running locally

## 🚀 Quick Start

### Method 1: Automated Setup (Recommended)

1. **Start your services**:
   ```bash
   # Terminal 1 - Backend
   cd gymmawy-backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd gymmawy-frontend
   npm run dev
   ```

2. **Run the tunnel setup**:
   ```bash
   ./start-tunnel.sh
   ```

### Method 2: Manual Setup

1. **Start your services** (same as above)

2. **Create backend tunnel**:
   ```bash
   ./tunnel-backend.sh
   ```

3. **Create frontend tunnel**:
   ```bash
   ./tunnel-frontend.sh
   ```

4. **Update environment variables**:
   ```bash
   ./update-tunnel-env.sh
   ```

## 🔧 Individual Tunnel Commands

### Backend Tunnel
```bash
# Create tunnel for backend (port 3000)
lt --port 3000 --subdomain gymmawy-api

# Or use the script
./tunnel-backend.sh
```

### Frontend Tunnel
```bash
# Create tunnel for frontend (port 5173)
lt --port 5173 --subdomain gymmawy-frontend

# Or use the script
./tunnel-frontend.sh
```

## 🌐 Expected URLs

After setup, your app will be available at:
- **Backend API**: `https://gymmawy-api.loca.lt`
- **Frontend**: `https://gymmawy-frontend.loca.lt`
- **Admin Dashboard**: `https://gymmawy-frontend.loca.lt/dashboard`

## 🔧 Environment Configuration

The scripts will automatically update your environment variables:

**Backend (.env):**
```env
CORS_ORIGIN=https://gymmawy-frontend.loca.lt,http://localhost:5173
```

**Frontend (.env):**
```env
REACT_APP_API_URL=https://gymmawy-api.loca.lt/api
```

## 📝 Step-by-Step Instructions

### Step 1: Install Local Tunnel
```bash
npm install -g localtunnel
```

### Step 2: Start Your Services
```bash
# Backend
cd gymmawy-backend
npm run dev

# Frontend (new terminal)
cd gymmawy-frontend
npm run dev
```

### Step 3: Create Tunnels
```bash
# Backend tunnel (new terminal)
lt --port 3000 --subdomain gymmawy-api

# Frontend tunnel (new terminal)
lt --port 5173 --subdomain gymmawy-frontend
```

### Step 4: Update Environment
```bash
./update-tunnel-env.sh
```

### Step 5: Restart Services
```bash
# Restart backend
cd gymmawy-backend
npm run dev

# Restart frontend
cd gymmawy-frontend
npm run dev
```

## 🆘 Troubleshooting

### Common Issues

1. **"Subdomain already in use"**
   - Choose a different subdomain: `lt --port 3000 --subdomain gymmawy-api-2`
   - Or use random subdomain: `lt --port 3000`

2. **CORS errors**
   - Make sure CORS_ORIGIN includes your frontend tunnel URL
   - Restart backend after updating environment

3. **API not accessible**
   - Check if backend is running on port 3000
   - Verify tunnel is active
   - Test locally first: `curl http://localhost:3000/health`

4. **Frontend not loading**
   - Check if frontend is running on port 5173
   - Verify REACT_APP_API_URL is correct
   - Clear browser cache

### Debug Commands

```bash
# Test backend locally
curl http://localhost:3000/health

# Test frontend locally
curl http://localhost:5173

# Test tunnel
curl https://gymmawy-api.loca.lt/health
```

## 💡 Tips

1. **Keep terminals open** - Tunnels close when terminal closes
2. **Use screen/tmux** - For persistent tunnels
3. **Check tunnel status** - Local tunnel shows status in terminal
4. **Custom subdomains** - Use meaningful names for easier access
5. **HTTPS** - Local tunnel provides HTTPS automatically

## 🔄 Restarting Tunnels

If tunnels disconnect:
1. Stop the tunnel (Ctrl+C)
2. Restart: `lt --port 3000 --subdomain gymmawy-api`
3. Update environment if needed: `./update-tunnel-env.sh`

## 📱 Mobile Testing

Your app will be accessible on mobile devices:
- Use the tunnel URLs on your phone
- Test responsive design
- Test touch interactions

---

**Ready to go live?** Follow the steps above and your Gymmawy app will be accessible worldwide! 🌍
