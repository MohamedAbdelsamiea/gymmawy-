# Custom Account Creation Script

## 🚀 **Interactive Account Creation**

The script now asks you for each account's details instead of using predefined accounts.

### **Quick Command**
```bash
npm run create-tabby-accounts
```

## 📝 **What the Script Asks**

### **1. Admin Credentials**
- Admin email
- Admin password

### **2. Account Count**
- How many accounts to create (1-50)

### **3. Sample Accounts (Optional)**
- Shows example accounts for reference

### **4. For Each Account:**
- **Email**: Full email address
- **Password**: Account password
- **First Name**: User's first name
- **Last Name**: User's last name
- **Mobile Number**: Phone with country code (e.g., +971501234567)
- **Role**: MEMBER or ADMIN (default: MEMBER)

## 🎯 **Example Usage**

```bash
npm run create-tabby-accounts
```

**Output:**
```
👥 Creating custom test accounts...

Enter admin email: admin@gymmawy.com
Enter admin password: ********

[INFO] Logging in as admin...
[SUCCESS] Admin login successful

How many accounts do you want to create? 3

Do you want to see sample accounts first? (y/n): y

📋 Sample Account Examples:

1. uae.test1@tabby.com
   Password: Test123!
   Name: UAE Test1
   Phone: +971501234567
   Role: MEMBER

2. sa.test1@tabby.com
   Password: Test123!
   Name: Saudi Test1
   Phone: +966501234567
   Role: MEMBER

3. tabby.team1@tabby.com
   Password: TabbyTest123!
   Name: Tabby Team1
   Phone: +971501234570
   Role: MEMBER

[INFO] Creating 3 custom account(s)...

📝 Account 1 Details:
Email: john.doe@example.com
Password: MyPassword123!
First Name: John
Last Name: Doe
Mobile Number (with country code, e.g., +971501234567): +971501234567
Role (MEMBER/ADMIN) [default: MEMBER]: MEMBER

[INFO] Creating account for: john.doe@example.com
[SUCCESS] Account created successfully: john.doe@example.com (ID: 123...)

Continue creating next account? (y/n): y

📝 Account 2 Details:
Email: jane.smith@example.com
Password: SecurePass456!
First Name: Jane
Last Name: Smith
Mobile Number (with country code, e.g., +971501234567): +966501234568
Role (MEMBER/ADMIN) [default: MEMBER]: MEMBER

[INFO] Creating account for: jane.smith@example.com
[SUCCESS] Account created successfully: jane.smith@example.com (ID: 124...)

Continue creating next account? (y/n): y

📝 Account 3 Details:
Email: admin.test@example.com
Password: AdminPass789!
First Name: Admin
Last Name: Test
Mobile Number (with country code, e.g., +971501234567): +971501234569
Role (MEMBER/ADMIN) [default: MEMBER]: ADMIN

[INFO] Creating account for: admin.test@example.com
[SUCCESS] Account created successfully: admin.test@example.com (ID: 125...)

==========================================
[INFO] Account creation summary:
[SUCCESS] Successfully created: 3 accounts
==========================================

[INFO] Created Account Credentials:

1. john.doe@example.com
   Password: MyPassword123!
   Name: John Doe
   Phone: +971501234567
   Role: MEMBER

2. jane.smith@example.com
   Password: SecurePass456!
   Name: Jane Smith
   Phone: +966501234568
   Role: MEMBER

3. admin.test@example.com
   Password: AdminPass789!
   Name: Admin Test
   Phone: +971501234569
   Role: ADMIN

[INFO] Testing login for first account...
[SUCCESS] Login test successful for john.doe@example.com

[SUCCESS] Account creation completed!
[INFO] These accounts are ready for testing.
```

## ✅ **Validation Features**

### **Email Validation**
- Must contain @ symbol
- Must be a valid email format

### **Password Validation**
- Minimum 6 characters
- No other restrictions (you can set your own rules)

### **Name Validation**
- First name required
- Last name required

### **Mobile Number Validation**
- Must start with + (country code)
- Example: +971501234567

### **Role Validation**
- Must be MEMBER or ADMIN
- Defaults to MEMBER if empty

## 🔧 **Features**

### **Interactive Prompts**
- Step-by-step account creation
- Validation with error messages
- Option to continue or stop

### **Sample Accounts**
- Shows example accounts for reference
- Helps with format and structure

### **Flexible Creation**
- Create 1-50 accounts
- Stop anytime during creation
- Custom details for each account

### **Error Handling**
- Validates all inputs
- Shows specific error messages
- Allows retry on validation errors

### **Summary Report**
- Shows all created accounts
- Displays credentials clearly
- Tests login for verification

## 🛡️ **Security Notes**

- **Admin credentials**: Required for account creation
- **Strong passwords**: Recommended for security
- **Valid phone numbers**: Country code required
- **Role assignment**: Choose appropriate roles

## 🎯 **Use Cases**

### **Tabby Team Testing**
- Create UAE test accounts (+971)
- Create Saudi test accounts (+966)
- Test different scenarios

### **Development Testing**
- Create admin accounts
- Create member accounts
- Test various user types

### **Custom Scenarios**
- Specific email domains
- Custom names and details
- Different phone numbers
- Various roles

## 📋 **Tips**

1. **Use descriptive emails**: e.g., `uae.test1@tabby.com`
2. **Strong passwords**: Use secure passwords for testing
3. **Valid phone numbers**: Include country code
4. **Clear names**: Use descriptive first/last names
5. **Appropriate roles**: Choose MEMBER or ADMIN as needed

The script is now fully interactive and lets you create custom accounts with your own details! 🚀
