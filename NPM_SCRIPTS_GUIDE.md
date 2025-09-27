# NPM Scripts Guide

## 🚀 **Available NPM Scripts**

### **Development & Production**
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

### **Admin & User Management**
```bash
# Create admin account
npm run create-admin

# Create Tabby test accounts
npm run create-tabby-accounts
```

### **Testing**
```bash
# Run Jest tests
npm test

# Test Tabby integration
npm run test:tabby
```

## 👥 **Create Tabby Test Accounts**

### **Quick Command**
```bash
npm run create-tabby-accounts
```

### **What it does:**
1. Prompts for admin credentials
2. Creates 12 test accounts for Tabby team
3. Displays all account credentials
4. Tests login for verification

### **Test Accounts Created:**

#### **🇦🇪 UAE Test Accounts**
- uae.test1@tabby.com | Test123! | +971501234567
- uae.test2@tabby.com | Test123! | +971501234568
- uae.test3@tabby.com | Test123! | +971501234569

#### **🇸🇦 Saudi Arabia Test Accounts**
- sa.test1@tabby.com | Test123! | +966501234567
- sa.test2@tabby.com | Test123! | +966501234568
- sa.test3@tabby.com | Test123! | +966501234569

#### **👥 Tabby Team Accounts**
- tabby.team1@tabby.com | TabbyTest123! | +971501234570
- tabby.team2@tabby.com | TabbyTest123! | +971501234571
- tabby.dev@tabby.com | TabbyDev123! | +971501234572

#### **🧪 Test Scenario Accounts**
- test.success@tabby.com | Test123! | +971501234573
- test.failure@tabby.com | Test123! | +971501234574
- test.reject@tabby.com | Test123! | +971501234575

## 🔧 **Usage Examples**

### **Create Test Accounts**
```bash
cd gymmawy-backend
npm run create-tabby-accounts
```

**Output:**
```
👥 Creating test accounts for Tabby team testing...

Enter admin email: admin@gymmawy.com
Enter admin password: ********

[INFO] Logging in as admin...
[SUCCESS] Admin login successful
[INFO] Creating 12 test accounts...

[INFO] Creating account for: uae.test1@tabby.com
[SUCCESS] Account created successfully: uae.test1@tabby.com (ID: 123...)

...

==========================================
[INFO] Account creation summary:
[SUCCESS] Successfully created: 12 accounts
==========================================

🇦🇪 UAE Test Accounts:
  Email: uae.test1@tabby.com | Password: Test123! | Phone: +971501234567
  ...

[SUCCESS] Test account creation completed!
```

### **Start Development Server**
```bash
npm run dev
```

### **Start Production Server**
```bash
npm start
```

### **Create Admin Account**
```bash
npm run create-admin
```

## 📋 **Script Details**

### **create-tabby-accounts.js**
- **Purpose**: Create test accounts for Tabby team testing
- **Input**: Admin email and password
- **Output**: 12 test accounts with credentials
- **Features**:
  - Interactive prompts
  - Error handling
  - Login verification
  - Colored output
  - Summary report

### **create-admin.js**
- **Purpose**: Create admin account
- **Input**: Admin details
- **Output**: Admin user account

### **test-tabby-integration.js**
- **Purpose**: Test Tabby payment integration
- **Input**: Test scenarios
- **Output**: Test results

## 🛡️ **Security Notes**

- **Admin credentials**: Required for account creation
- **Test passwords**: Strong passwords for security
- **Email domains**: @tabby.com for identification
- **Phone numbers**: Valid country codes
- **Account isolation**: Separate from production

## 🔍 **Troubleshooting**

### **Script fails to run**
```bash
# Check if Node.js is installed
node --version

# Check if dependencies are installed
npm install

# Check if server is running
curl http://localhost:3000/api/health
```

### **Admin login fails**
- Verify admin credentials
- Check if admin account exists
- Ensure server is running
- Check database connection

### **Account creation fails**
- Check admin permissions
- Verify email uniqueness
- Check mobile number format
- Review error messages

## ✅ **Ready to Use**

The npm scripts are now ready for:
- ✅ Creating Tabby test accounts
- ✅ Managing admin accounts
- ✅ Testing Tabby integration
- ✅ Development and production deployment

Run `npm run create-tabby-accounts` to create test accounts for the Tabby team! 🚀
