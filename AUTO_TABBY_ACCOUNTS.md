# Auto Tabby Test Accounts Creation

## 🚀 **Quick Command**
```bash
npm run create-tabby-accounts
```

## ⚡ **What it does automatically**
1. **Prompts for admin credentials** (only once)
2. **Creates all 10 official Tabby test accounts** automatically
3. **Shows all account credentials**
4. **Tests login for verification**

## 📋 **Official Tabby Test Accounts Created**

### **🎯 Payment Success Flow**
- **UAE**: `otp.success@tabby.ai` | `+971500000001`
- **KSA**: `otp.success@tabby.ai` | `+966500000001`
- **Kuwait**: `otp.success@tabby.ai` | `+96590000001`

### **❌ Background Pre-scoring Reject**
- **UAE**: `otp.success@tabby.ai` | `+971500000002`
- **KSA**: `otp.success@tabby.ai` | `+966500000002`
- **Kuwait**: `otp.success@tabby.ai` | `+96590000002`

### **💥 Payment Failure Flow**
- **UAE**: `otp.rejected@tabby.ai` | `+971500000001`
- **KSA**: `otp.rejected@tabby.ai` | `+966500000001`
- **Kuwait**: `otp.rejected@tabby.ai` | `+96590000001`

### **🆔 National ID Upload (Kuwait)**
- **Kuwait**: `id.success@tabby.ai` | `+96590000001`

## 🎯 **Example Output**
```bash
npm run create-tabby-accounts
```

```
👥 Creating official Tabby test accounts...

Enter admin email: admin@gymmawy.com
Enter admin password: ********

[INFO] Logging in as admin...
[SUCCESS] Admin login successful

📋 Official Tabby Test Accounts:
These are the official test credentials from Tabby documentation:

1. UAE Payment Success Flow
   Email: otp.success@tabby.ai
   Password: TabbyTest123!
   Name: UAE Success
   Phone: +971500000001
   Role: MEMBER

2. KSA Payment Success Flow
   Email: otp.success@tabby.ai
   Password: TabbyTest123!
   Name: Saudi Success
   Phone: +966500000001
   Role: MEMBER

... (shows all 10 accounts)

[INFO] Creating 10 official Tabby test accounts...

[INFO] Creating account for: otp.success@tabby.ai
[SUCCESS] Account created successfully: otp.success@tabby.ai (ID: 123...)

[INFO] Creating account for: otp.success@tabby.ai
[SUCCESS] Account created successfully: otp.success@tabby.ai (ID: 124...)

... (creates all accounts)

==========================================
[INFO] Tabby test account creation summary:
[SUCCESS] Successfully created: 10 accounts
==========================================

[INFO] Created Tabby Test Account Credentials:

1. UAE Payment Success Flow
   Email: otp.success@tabby.ai
   Password: TabbyTest123!
   Name: UAE Success
   Phone: +971500000001
   Role: MEMBER

2. KSA Payment Success Flow
   Email: otp.success@tabby.ai
   Password: TabbyTest123!
   Name: Saudi Success
   Phone: +966500000001
   Role: MEMBER

... (shows all created accounts)

[INFO] Testing login for first Tabby test account...
[SUCCESS] Login test successful for otp.success@tabby.ai

[SUCCESS] Tabby test account creation completed!
[INFO] These accounts are ready for Tabby payment testing.
[INFO] Use OTP: 8888 for testing payments.
```

## 🔧 **Environment Variables (Optional)**
You can set admin credentials as environment variables to avoid prompts:

```bash
export ADMIN_EMAIL="admin@gymmawy.com"
export ADMIN_PASSWORD="your_admin_password"
npm run create-tabby-accounts
```

## 🧪 **Testing Scenarios**

### **Success Flow**
- Use: `otp.success@tabby.ai` with success phone numbers
- OTP: `8888`
- Expected: Payment completes successfully

### **Reject Flow**
- Use: `otp.success@tabby.ai` with reject phone numbers
- Expected: Tabby payment method hidden

### **Failure Flow**
- Use: `otp.rejected@tabby.ai` with any phone number
- OTP: `8888`
- Expected: Payment rejected

## ✅ **Ready to Use**
- ✅ **No prompts** - creates accounts automatically
- ✅ **Official credentials** from Tabby documentation
- ✅ **All test scenarios** covered
- ✅ **UAE, KSA, Kuwait** support
- ✅ **Login verification** included

Run `npm run create-tabby-accounts` and enter your admin credentials once! 🚀
