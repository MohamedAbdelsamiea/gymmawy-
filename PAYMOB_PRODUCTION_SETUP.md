# Paymob Production Setup Guide

## ✅ **Current Configuration**

The Paymob service is now correctly configured to use production integration IDs:

### **Environment Variables Required:**

```bash
# Paymob Payment Gateway Configuration
PAYMOB_SECRET_KEY=your_paymob_secret_key
PAYMOB_PUBLIC_KEY=your_paymob_public_key
PAYMOB_MIGS_INTEGRATION_ID=14941          # Normal card payments
PAYMOB_APPLEPAY_INTEGRATION_ID=14942      # Apple Pay payments
PAYMOB_HMAC_SECRET=your_hmac_secret
```

### **Current Setup:**

- ✅ **Card Payments**: Uses `PAYMOB_MIGS_INTEGRATION_ID` (14941)
- ✅ **Apple Pay**: Uses `PAYMOB_APPLEPAY_INTEGRATION_ID` (14942)
- ✅ **HMAC Verification**: Enabled for webhook security
- ✅ **Production URLs**: Configured for live environment

## 🚀 **Deployment Checklist**

### **1. Server Environment Variables**

Make sure your production server has these environment variables set:

```bash
# Copy from your .env file to production (replace with your actual values)
PAYMOB_SECRET_KEY="your_paymob_secret_key_here"
PAYMOB_PUBLIC_KEY="your_paymob_public_key_here"
PAYMOB_MIGS_INTEGRATION_ID=your_migs_integration_id_here
PAYMOB_APPLEPAY_INTEGRATION_ID=your_apple_pay_integration_id_here
PAYMOB_HMAC_SECRET=your_hmac_secret_here
```

### **2. Webhook Configuration**

Ensure your webhook URL is configured in Paymob dashboard:
```
https://your-domain.com/api/paymob/webhook
```

### **3. Frontend Configuration**

The frontend checkout page now includes:
- ✅ **Credit/Debit Card** option (uses MIGS integration)
- ✅ **Apple Pay** option (uses Apple Pay integration)
- ✅ **Professional icons** and styling
- ✅ **Seamless integration** with existing checkout flow

### **4. Testing**

After deployment, test both payment methods:

1. **Card Payment**: Select "Credit/Debit Card" → Should open Paymob card form
2. **Apple Pay**: Select "Apple Pay" → Should open Apple Pay interface
3. **Webhook**: Verify payment status updates are received

## 🔧 **Service Configuration**

The `PaymobService` now:

```javascript
// Uses production integration IDs
this.integrationIdCard = process.env.PAYMOB_MIGS_INTEGRATION_ID;      // 14941
this.integrationIdApplePay = process.env.PAYMOB_APPLEPAY_INTEGRATION_ID; // 14942

// Provides detailed logging for debugging
console.log('- MIGS Integration ID (Card):', this.integrationIdCard ? '✓ Configured' : '✗ Missing');
console.log('- Apple Pay Integration ID:', this.integrationIdApplePay ? '✓ Configured' : '✗ Missing');
```

## 🎯 **Payment Flow**

1. **User selects payment method** in checkout
2. **Frontend calls backend** with payment data
3. **Backend creates Paymob intention** using correct integration ID
4. **Paymob checkout opens** in new window
5. **User completes payment** on Paymob
6. **Webhook updates payment status** in your database
7. **User redirected** back to your site

## ⚠️ **Important Notes**

- **Production Keys**: Replace test keys with production keys when going live
- **Webhook Security**: HMAC verification is enabled for security
- **Error Handling**: Comprehensive error handling and logging
- **Currency Support**: Currently configured for SAR (Saudi Riyal)

## 🔍 **Verification**

After deployment, check the server logs for:

```
Paymob Service initialized:
- MIGS Integration ID (Card): ✓ Configured
- Apple Pay Integration ID: ✓ Configured
- HMAC Secret: ✓ Configured
```

This confirms the service is using the correct production integration IDs.
