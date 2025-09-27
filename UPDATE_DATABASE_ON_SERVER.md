# Update Database on Server

## 🗄️ **Database Update Commands for Server**

### **1. Check Current Migration Status**
```bash
cd gymmawy-backend
npx prisma migrate status
```

### **2. Apply Pending Migrations**
```bash
cd gymmawy-backend
npx prisma migrate deploy
```

### **3. Generate Prisma Client**
```bash
cd gymmawy-backend
npx prisma generate
```

### **4. Sync Database Schema (if needed)**
```bash
cd gymmawy-backend
npx prisma db push
```

### **5. Verify Database Connection**
```bash
cd gymmawy-backend
npx prisma db pull
```

## 🔧 **Complete Database Update Script**

Create this script on your server:

```bash
#!/bin/bash
# update-database.sh

set -e

echo "🗄️ Updating database on server..."

# Navigate to backend directory
cd gymmawy-backend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create it first."
    exit 1
fi

# Check database connection
echo "🔍 Checking database connection..."
if npx prisma db push --accept-data-loss; then
    echo "✅ Database connection successful"
else
    echo "❌ Database connection failed. Check your DATABASE_URL in .env"
    exit 1
fi

# Check migration status
echo "📋 Checking migration status..."
npx prisma migrate status

# Apply migrations
echo "🚀 Applying database migrations..."
if npx prisma migrate deploy; then
    echo "✅ Migrations applied successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Verify schema
echo "✅ Database update completed successfully!"
echo "📊 Current migration status:"
npx prisma migrate status
```

## 🚀 **Quick Commands for Server**

### **Option 1: One-liner**
```bash
cd gymmawy-backend && npx prisma migrate deploy && npx prisma generate && npx prisma db push
```

### **Option 2: Step by step**
```bash
# 1. Navigate to backend
cd gymmawy-backend

# 2. Check status
npx prisma migrate status

# 3. Apply migrations
npx prisma migrate deploy

# 4. Generate client
npx prisma generate

# 5. Sync schema
npx prisma db push
```

## 🔍 **Troubleshooting**

### **If migrations fail:**
```bash
# Check for failed migrations
npx prisma migrate status

# Resolve failed migrations
npx prisma migrate resolve --applied <migration-name>

# Try again
npx prisma migrate deploy
```

### **If database is out of sync:**
```bash
# Force sync (be careful - this can cause data loss)
npx prisma db push --accept-data-loss

# Or reset and apply all migrations
npx prisma migrate reset
npx prisma migrate deploy
```

### **If Prisma client is outdated:**
```bash
# Regenerate client
npx prisma generate

# Restart your application
pm2 restart gymmawy-backend
```

## 📋 **Pre-deployment Checklist**

- [ ] Database connection working
- [ ] All migrations applied
- [ ] Prisma client generated
- [ ] Schema synced
- [ ] Application restarted

## 🎯 **After Database Update**

```bash
# Restart backend service
pm2 restart gymmawy-backend

# Check logs
pm2 logs gymmawy-backend

# Test API
curl http://localhost:3000/api/health
```

## ⚠️ **Important Notes**

1. **Backup your database** before running migrations in production
2. **Test migrations** on a staging environment first
3. **Monitor logs** during migration process
4. **Have a rollback plan** ready
5. **Restart services** after database updates

## 🔧 **Environment Variables Required**

Make sure your `.env` file has:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/gymmawy_db"
NODE_ENV="production"
```

Your database will be up to date and ready for production! 🚀
