# 🚀 Gymmawy Railway Deployment Guide

This guide will help you deploy your Gymmawy PERN stack application to Railway with all your existing data.

## 📋 Prerequisites

- GitHub account and repository
- Railway account (free tier available)
- Local database with data you want to migrate

## 🚀 Quick Deployment

### Option 1: Automated Script (Recommended)

```bash
# Run the deployment script
./deploy-to-railway.sh
```

This script will:
- Export your current database data
- Commit everything to git
- Push to GitHub
- Provide next steps for Railway

### Option 2: Manual Steps

1. **Export your data:**
   ```bash
   cd gymmawy-backend
   npm run export-data
   cd ..
   ```

2. **Commit and push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy: Prepare for Railway deployment"
   git push origin main
   ```

3. **Deploy to Railway:**
   - Go to [Railway Dashboard](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Connect your GitHub repository
   - Railway will automatically detect the configuration files

4. **Import your data:**
   - After deployment, go to your backend service
   - Use Railway's terminal feature
   - Run: `npm run import-data`

## 📊 What Gets Migrated

Your data export includes:
- **Users** (7 records)
- **Programmes** (7 records) 
- **Programme Purchases** (8 records)
- **Subscriptions** (13 records)
- **Payments** (20 records)
- **Orders** (2 records)
- **Leads** (4 records)
- **Categories** (5 records)
- **Products** (5 records)
- **Coupons** (7 records)
- **Referrals** (6 records)
- And all other related data...

## 🔧 Services Created

The Railway configuration creates:

1. **PostgreSQL Database**
   - Managed database with automatic backups
   - Auto-generated secure connection string

2. **Backend API** (`gymmawy-backend`)
   - Node.js/Express API
   - Auto-connects to database
   - Runs migrations on startup

3. **Frontend** (`gymmawy-frontend`)
   - React static site
   - Auto-connects to backend API
   - Optimized for production

## 🌐 URLs After Deployment

- **Frontend**: `https://gymmawy-frontend-production.up.railway.app`
- **Backend API**: `https://gymmawy-backend-production.up.railway.app`
- **Database**: Internal connection only

## 🔒 Environment Variables

All sensitive data is automatically configured:
- `DATABASE_URL` - Auto-connected to PostgreSQL
- `JWT_SECRET` - Auto-generated secure secret
- `CORS_ORIGIN` - Auto-points to frontend
- `REACT_APP_API_URL` - Auto-points to backend

## 📝 Railway Configuration

### Backend Service (`gymmawy-backend/railway.json`)
```json
{
  "deploy": {
    "startCommand": "npm run migrate-to-railway && npm start",
    "healthcheckPath": "/api/health"
  }
}
```

### Frontend Service (`gymmawy-frontend/railway.json`)
```json
{
  "deploy": {
    "startCommand": "npm run build && npx serve -s build -l 3000",
    "healthcheckPath": "/"
  }
}
```

## 📝 Post-Deployment Checklist

- [ ] Verify all services are running
- [ ] Check database connection
- [ ] Import your data (`npm run import-data`)
- [ ] Test user authentication
- [ ] Verify admin dashboard
- [ ] Test payment functionality
- [ ] Check file uploads
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring

## 🆘 Troubleshooting

### Common Issues

1. **Build fails**: Check Node.js version compatibility
2. **Database connection fails**: Verify `DATABASE_URL` is set
3. **Import fails**: Check foreign key constraints
4. **Frontend can't reach backend**: Verify CORS settings

### Getting Help

1. Check Railway deployment logs
2. Verify environment variables
3. Test database connectivity
4. Check the migration scripts

## 💰 Cost

- **Free tier**: Perfect for development and small production
- **Hobby plan**: $5/month for better performance
- **Database**: Included in free tier (1GB storage)

## 🔄 Updates

To update your deployment:
1. Make changes locally
2. Run `./deploy-to-railway.sh`
3. Railway automatically redeploys

---

**Ready to deploy?** Run `./deploy-to-railway.sh` and follow the prompts! 🚀
