# Official Tabby Test Accounts

## 🚀 **Quick Command**
```bash
npm run create-tabby-accounts
```

## 📋 **Official Tabby Test Credentials**

These are the **official test credentials** from Tabby's documentation for testing different payment scenarios.

### **🎯 Payment Success Flow**

#### **UAE Success Test**
- **Email**: `otp.success@tabby.ai`
- **Password**: `TabbyTest123!`
- **Name**: UAE Success
- **Phone**: `+971500000001`
- **Description**: UAE Payment Success Flow

#### **KSA Success Test**
- **Email**: `otp.success@tabby.ai`
- **Password**: `TabbyTest123!`
- **Name**: Saudi Success
- **Phone**: `+966500000001`
- **Description**: KSA Payment Success Flow

#### **Kuwait Success Test**
- **Email**: `otp.success@tabby.ai`
- **Password**: `TabbyTest123!`
- **Name**: Kuwait Success
- **Phone**: `+96590000001`
- **Description**: Kuwait Payment Success Flow

### **❌ Background Pre-scoring Reject Flow**

#### **UAE Reject Test**
- **Email**: `otp.success@tabby.ai`
- **Password**: `TabbyTest123!`
- **Name**: UAE Reject
- **Phone**: `+971500000002`
- **Description**: UAE Background Pre-scoring Reject

#### **KSA Reject Test**
- **Email**: `otp.success@tabby.ai`
- **Password**: `TabbyTest123!`
- **Name**: Saudi Reject
- **Phone**: `+966500000002`
- **Description**: KSA Background Pre-scoring Reject

#### **Kuwait Reject Test**
- **Email**: `otp.success@tabby.ai`
- **Password**: `TabbyTest123!`
- **Name**: Kuwait Reject
- **Phone**: `+96590000002`
- **Description**: Kuwait Background Pre-scoring Reject

### **💥 Payment Failure Flow**

#### **UAE Failure Test**
- **Email**: `otp.rejected@tabby.ai`
- **Password**: `TabbyTest123!`
- **Name**: UAE Failure
- **Phone**: `+971500000001`
- **Description**: UAE Payment Failure Flow

#### **KSA Failure Test**
- **Email**: `otp.rejected@tabby.ai`
- **Password**: `TabbyTest123!`
- **Name**: Saudi Failure
- **Phone**: `+966500000001`
- **Description**: KSA Payment Failure Flow

#### **Kuwait Failure Test**
- **Email**: `otp.rejected@tabby.ai`
- **Password**: `TabbyTest123!`
- **Name**: Kuwait Failure
- **Phone**: `+96590000001`
- **Description**: Kuwait Payment Failure Flow

### **🆔 National ID Upload Test (Kuwait Only)**

#### **Kuwait ID Upload Test**
- **Email**: `id.success@tabby.ai`
- **Password**: `TabbyTest123!`
- **Name**: Kuwait IDUpload
- **Phone**: `+96590000001`
- **Description**: Kuwait National ID Upload Test

## 🧪 **Testing Scenarios**

### **1. Payment Success**
- Use: `otp.success@tabby.ai` with success phone numbers
- Expected: Payment completes successfully
- OTP: `8888`

### **2. Background Pre-scoring Reject**
- Use: `otp.success@tabby.ai` with reject phone numbers
- Expected: Tabby payment method hidden/unavailable

### **3. Payment Failure**
- Use: `otp.rejected@tabby.ai` with any phone number
- Expected: Payment rejected with failure message

### **4. Payment Cancellation**
- Use: `otp.success@tabby.ai` with success phone numbers
- Expected: User can cancel payment and return to store

### **5. Corner Case**
- Use: `otp.success@tabby.ai` with success phone numbers
- Expected: Payment succeeds even if browser tab is closed

### **6. National ID Upload**
- Use: `id.success@tabby.ai` with Kuwait phone number
- Expected: ID upload form appears (Kuwait only)

## 🎯 **Usage Instructions**

### **Step 1: Run the Script**
```bash
npm run create-tabby-accounts
```

### **Step 2: Choose Tabby Test Accounts**
```
Do you want to create official Tabby test accounts? (y/n): y
```

### **Step 3: Confirm Creation**
```
Do you want to create these Tabby test accounts? (y/n): y
```

### **Step 4: Test Payments**
- Use the created accounts to test Tabby payments
- Use OTP: `8888` for all test scenarios
- Follow the testing guidelines above

## 📱 **Phone Number Patterns**

### **Success Flow**
- UAE: `+971500000001`
- KSA: `+966500000001`
- Kuwait: `+96590000001`

### **Reject Flow**
- UAE: `+971500000002`
- KSA: `+966500000002`
- Kuwait: `+96590000002`

### **Failure Flow**
- Any country: `+971500000001` (with `otp.rejected@tabby.ai`)

## 🔐 **OTP for Testing**
- **All test scenarios**: Use OTP `8888`
- **Real payments**: Use actual OTP from SMS

## ✅ **Expected Results**

### **Success Flow**
- ✅ Tabby payment method available
- ✅ Payment completes successfully
- ✅ Order status: CAPTURED/CLOSED
- ✅ Redirect to success page

### **Reject Flow**
- ❌ Tabby payment method hidden
- ❌ Message: "Sorry, Tabby is unable to approve this purchase"

### **Failure Flow**
- ❌ Payment rejected
- ❌ Message: "We can't approve this purchase"
- ❌ Order status: REJECTED

## 🚀 **Ready for Testing**

These official Tabby test accounts are now ready for:
- ✅ Payment success testing
- ✅ Payment failure testing
- ✅ Background pre-scoring testing
- ✅ National ID upload testing
- ✅ Payment cancellation testing
- ✅ Corner case testing

Run `npm run create-tabby-accounts` and choose "y" for Tabby test accounts! 🎯
