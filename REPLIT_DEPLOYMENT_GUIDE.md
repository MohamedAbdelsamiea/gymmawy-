# 🚀 Deploy Gymmawy on Replit

This guide will help you deploy your Gymmawy PERN stack application on Replit.

## 📋 Prerequisites

- Replit account (free tier available)
- GitHub repository with your code

## 🚀 Quick Deployment

### Method 1: Import from GitHub

1. **Go to [Replit](https://replit.com)**
2. **Click "Create Repl"**
3. **Select "Import from GitHub"**
4. **Enter your repository URL**: `https://github.com/MohamedAbdelsamiea/gymmawy-`
5. **Click "Import from GitHub"**

### Method 2: Create New Repl

1. **Go to [Replit](https://replit.com)**
2. **Click "Create Repl"**
3. **Select "Node.js" template**
4. **Connect your GitHub repository**
5. **Clone your code**

## 🔧 Setup Process

### Step 1: Install Dependencies

```bash
# Run the setup script
./setup-replit.sh

# Or manually:
npm install
cd gymmawy-backend && npm install
cd ../gymmawy-frontend && npm install
```

### Step 2: Start PostgreSQL

1. **In Replit, click the "Packages" icon** (📦)
2. **Search for "postgresql"**
3. **Click "Install"**
4. **Start the PostgreSQL service**

### Step 3: Configure Database

1. **Copy the database connection string** from Replit
2. **Update `gymmawy-backend/.env`**:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/gymmawy
   ```

### Step 4: Setup Database Schema

```bash
# Generate Prisma client
cd gymmawy-backend
npx prisma generate

# Push schema to database
npx prisma db push

# Seed the database (optional)
npm run seed
```

### Step 5: Configure Environment Variables

**Backend (.env):**
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/gymmawy
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
PORT=3000
CORS_ORIGIN=https://your-repl-url.replit.dev
```

**Frontend (.env):**
```env
REACT_APP_API_URL=https://your-repl-url.replit.dev/api
REACT_APP_ENVIRONMENT=development
```

### Step 6: Start the Application

```bash
# Start both backend and frontend
npm run dev

# Or start individually:
# Backend only
cd gymmawy-backend && npm run dev

# Frontend only
cd gymmawy-frontend && npm run dev
```

## 🌐 Access Your Application

- **Frontend**: `https://your-repl-url.replit.dev`
- **Backend API**: `https://your-repl-url.replit.dev/api`
- **Admin Dashboard**: `https://your-repl-url.replit.dev/dashboard`

## 📊 Import Your Data

If you have existing data to import:

```bash
# Export data from your local database first
cd gymmawy-backend
npm run export-data

# Then import to Replit
npm run import-data
```

## 🔧 Replit Configuration

The following files are configured for Replit:

- **`.replit`** - Replit configuration
- **`replit.nix`** - Nix package configuration
- **`package.json`** - Root package configuration
- **`setup-replit.sh`** - Automated setup script

## 🆘 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Make sure PostgreSQL is running
   - Check DATABASE_URL in .env
   - Verify database credentials

2. **CORS Errors**
   - Update CORS_ORIGIN with your Replit URL
   - Check REACT_APP_API_URL in frontend .env

3. **Build Errors**
   - Run `npm run install:all`
   - Check Node.js version (18+)
   - Clear Replit cache and restart

4. **Port Issues**
   - Replit uses port 3000 by default
   - Make sure PORT=3000 in .env

### Getting Help

1. Check Replit console for errors
2. Verify environment variables
3. Test database connection
4. Check network connectivity

## 💰 Cost

- **Free tier**: Perfect for development and small production
- **Hacker plan**: $7/month for better performance
- **Database**: PostgreSQL included free

## 🔄 Updates

To update your Replit deployment:
1. Push changes to GitHub
2. Replit will automatically sync
3. Restart the application if needed

---

**Ready to deploy?** Follow the steps above and your Gymmawy app will be running on Replit! 🚀
