# 🔧 Fix Database Permissions on Production Server

## **Problem**
The database user `gymuser` doesn't have superuser privileges, which are required for Prisma migrations.

## **Solution**

### **Step 1: Update Docker Compose (Already Done)**
The `docker-compose.yml` has been updated with:
- Removed invalid `POSTGRES_SUPERUSER` variable
- Added proper initialization script
- Created `init-db.sql` to grant superuser privileges

### **Step 2: Run These Commands on Your Production Server**

```bash
# SSH into your production server
ssh root@vmi2812636.contaboserver.net

# Navigate to backend directory
cd /opt/gymmawy/gymmawy-backend

# Stop the database container
docker-compose down

# Remove the old database volume (THIS WILL DELETE ALL DATA!)
# Only do this if you don't have important data, or if this is a fresh deployment
docker volume rm gymmawy-backend_db_data

# Start the database with new configuration
docker-compose up -d db

# Wait a moment for database to initialize
sleep 10

# Check if database is running
docker-compose ps

# Test database connection
docker-compose exec db psql -U gymuser -d gymmawy -c "SELECT current_user, session_user;"

# Run Prisma migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Generate Prisma client
npx prisma generate
```

### **Step 3: Alternative - Fix Existing Database (If You Have Important Data)**

If you have important data and don't want to recreate the database:

```bash
# SSH into your production server
ssh root@vmi2812636.contaboserver.net

# Navigate to backend directory
cd /opt/gymmawy/gymmawy-backend

# Connect to database and grant superuser privileges
docker-compose exec db psql -U postgres -d gymmawy -c "ALTER USER gymuser WITH SUPERUSER CREATEDB CREATEROLE;"

# Grant all privileges
docker-compose exec db psql -U postgres -d gymmawy -c "GRANT ALL PRIVILEGES ON DATABASE gymmawy TO gymuser;"
docker-compose exec db psql -U postgres -d gymmawy -c "GRANT ALL PRIVILEGES ON SCHEMA public TO gymuser;"
docker-compose exec db psql -U postgres -d gymmawy -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO gymuser;"
docker-compose exec db psql -U postgres -d gymmawy -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO gymuser;"

# Set default privileges for future objects
docker-compose exec db psql -U postgres -d gymmawy -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO gymuser;"
docker-compose exec db psql -U postgres -d gymmawy -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO gymuser;"

# Now run Prisma migrations
npx prisma migrate deploy

# Check migration status
npx prisma migrate status
```

### **Step 4: Start Backend Service**

```bash
# Make sure you're in the backend directory
cd /opt/gymmawy/gymmawy-backend

# Start the backend with PM2
pm2 start src/server.js --name "gymmawy-backend" --env production

# Check PM2 status
pm2 status

# Check logs
pm2 logs gymmawy-backend --lines 20
```

### **Step 5: Test the Fix**

```bash
# Test API endpoints
curl http://localhost:3000/api/currency/detect
curl http://localhost:3000/api/tabby/availability?currency=SAR

# Test from external URL
curl https://gym.omarelnemr.xyz/api/currency/detect
curl https://gym.omarelnemr.xyz/api/tabby/availability?currency=SAR
```

## **Expected Results**

After fixing the database permissions:

✅ **Database migrations will run successfully**  
✅ **Backend API will respond to requests**  
✅ **No more 502 Bad Gateway errors**  
✅ **Currency detection will work**  
✅ **Tabby availability API will work**  
✅ **User authentication will work**  

## **Verification Commands**

```bash
# Check database user privileges
docker-compose exec db psql -U gymuser -d gymmawy -c "SELECT rolname, rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname = 'gymuser';"

# Check Prisma migration status
npx prisma migrate status

# Check backend logs
pm2 logs gymmawy-backend --lines 10

# Test API health
curl -I https://gym.omarelnemr.xyz/api/currency/detect
```

## **Important Notes**

1. **Data Loss Warning**: The first solution will delete all existing data. Use the alternative solution if you have important data.

2. **Backup First**: If you have important data, backup your database before making changes:
   ```bash
   docker-compose exec db pg_dump -U gymuser gymmawy > backup.sql
   ```

3. **Environment Variables**: Make sure your `.env` file has the correct database URL:
   ```
   DATABASE_URL=postgresql://gymuser:strongpassword@localhost:5433/gymmawy?schema=public
   ```

4. **Docker Permissions**: Ensure the Docker containers can access the initialization script:
   ```bash
   chmod 644 init-db.sql
   ```

Choose the solution that fits your situation and run the commands accordingly.

