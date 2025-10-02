# Paymob Integration Testing Guide

This guide will walk you through testing the Paymob integration from setup to production.

## 🚀 Quick Start Testing

### 1. **Setup Test Environment**

```bash
cd gymmawy-backend
node test-paymob-setup.js
```

This script will:
- ✅ Check/create .env file
- ✅ Verify required environment variables
- ✅ Check database schema
- ✅ Validate test scripts

### 2. **Backend Testing**

```bash
# Run comprehensive backend test
node test-paymob-integration.js

# Start backend server
npm run dev
```

### 3. **Frontend Testing**

```bash
cd gymmawy-frontend
npm run dev
```

Then visit: `http://localhost:3000/test/paymob`

## 🧪 Testing Methods

### **Method 1: Backend API Testing**

#### Test with cURL

```bash
# Test creating a payment intention
curl -X POST http://localhost:3001/api/paymob/create-intention \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "amount": 10.00,
    "currency": "SAR",
    "paymentMethod": "card",
    "items": [
      {
        "name": "Test Product",
        "amount": 10.00,
        "description": "Test product",
        "quantity": 1
      }
    ],
    "billingData": {
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com",
      "phoneNumber": "+966500000000",
      "street": "Test Street",
      "building": "Test Building",
      "city": "Riyadh",
      "country": "KSA"
    },
    "customer": {
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com"
    }
  }'
```

#### Test with Postman

1. Import the Paymob API collection (available in Paymob docs)
2. Set up environment variables
3. Test each endpoint individually

### **Method 2: Frontend Component Testing**

#### Test Page: `/test/paymob`

This page includes:
- ✅ Payment form with validation
- ✅ Provider selection (Paymob/Tabby)
- ✅ Real-time payment testing
- ✅ Error handling demonstration
- ✅ Console logging for debugging

#### Test Features:
1. **Payment Data Validation**
2. **Intention Creation**
3. **Checkout Window Opening**
4. **Payment Status Checking**
5. **Payment History**

### **Method 3: Webhook Testing**

#### Using Webhook.site

1. Go to [webhook.site](https://webhook.site)
2. Copy the unique URL
3. Set it as your webhook URL in Paymob dashboard
4. Update your .env file:
   ```env
   PAYMOB_WEBHOOK_URL="https://webhook.site/your-unique-url"
   ```

#### Using ngrok (Local Testing)

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3001

# Use the ngrok URL in Paymob dashboard
```

## 🔧 Configuration Testing

### **Environment Variables Test**

Create a test script to verify all required variables:

```javascript
// test-env.js
const requiredEnvVars = [
  'PAYMOB_SECRET_KEY',
  'PAYMOB_PUBLIC_KEY', 
  'PAYMOB_INTEGRATION_ID_CARD',
  'PAYMOB_INTEGRATION_ID_APPLE_PAY',
  'PAYMOB_HMAC_SECRET'
];

console.log('🔍 Testing Environment Variables...');

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: Missing`);
  } else if (value.includes('your_') || value.includes('sk_test_your_')) {
    console.log(`⚠️  ${varName}: Placeholder value`);
  } else {
    console.log(`✅ ${varName}: Set`);
  }
});
```

### **Database Schema Test**

```bash
# Check if migration is applied
npx prisma db push --preview-feature

# Verify PaymentIntention table exists
npx prisma studio
```

## 🎯 Test Scenarios

### **Scenario 1: Successful Payment Flow**

1. **Create Intention** → Should return intention ID and checkout URL
2. **Open Checkout** → Should open Paymob payment page
3. **Complete Payment** → Should process successfully
4. **Webhook Received** → Should update payment status
5. **Database Updated** → Should save transaction details

### **Scenario 2: Failed Payment Flow**

1. **Create Intention** → Should work normally
2. **Open Checkout** → Should open payment page
3. **Cancel/Fail Payment** → Should handle gracefully
4. **Webhook Received** → Should update status to failed
5. **Error Handling** → Should show appropriate error message

### **Scenario 3: Webhook Security Test**

1. **Valid HMAC** → Should process webhook
2. **Invalid HMAC** → Should reject webhook
3. **Missing HMAC** → Should handle appropriately

### **Scenario 4: Data Validation Test**

1. **Valid Data** → Should create intention
2. **Invalid Amount** → Should return validation error
3. **Missing Fields** → Should return validation error
4. **Malformed Data** → Should handle gracefully

## 🐛 Debugging Tips

### **Backend Debugging**

```javascript
// Add to your controller for debugging
console.log('🔍 Request data:', JSON.stringify(req.body, null, 2));
console.log('🔍 Environment check:', {
  secretKey: !!process.env.PAYMOB_SECRET_KEY,
  publicKey: !!process.env.PAYMOB_PUBLIC_KEY,
  integrationId: process.env.PAYMOB_INTEGRATION_ID_CARD
});
```

### **Frontend Debugging**

```javascript
// Add to your service for debugging
console.log('🔍 Payment data:', paymentData);
console.log('🔍 API response:', response.data);
console.log('🔍 Error details:', error.response?.data);
```

### **Database Debugging**

```bash
# Check PaymentIntention records
npx prisma studio

# Or query directly
psql -d gymmawy -c "SELECT * FROM PaymentIntention ORDER BY created_at DESC LIMIT 10;"
```

## 📊 Test Data Examples

### **Valid Test Payment Data**

```json
{
  "amount": 10.00,
  "currency": "SAR",
  "paymentMethod": "card",
  "items": [
    {
      "name": "Test Product",
      "amount": 10.00,
      "description": "A test product for Paymob integration",
      "quantity": 1
    }
  ],
  "billingData": {
    "firstName": "Ahmed",
    "lastName": "Al-Rashid",
    "email": "ahmed@example.com",
    "phoneNumber": "+966501234567",
    "street": "King Fahd Road",
    "building": "Tower A",
    "apartment": "101",
    "floor": "1",
    "city": "Riyadh",
    "state": "Riyadh",
    "country": "KSA",
    "postalCode": "12345"
  },
  "customer": {
    "firstName": "Ahmed",
    "lastName": "Al-Rashid",
    "email": "ahmed@example.com",
    "extras": {
      "userId": "user_123",
      "test": true
    }
  },
  "extras": {
    "source": "web",
    "test": true,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

### **Test Credit Cards (Paymob Test Environment)**

```
Card Number: 4987 6543 2109 8765
Expiry: 12/25
CVV: 123
Name: Test User

Card Number: 4111 1111 1111 1111
Expiry: 12/25
CVV: 123
Name: Test User
```

## 🚨 Common Issues & Solutions

### **Issue 1: "Integration ID not configured"**

**Solution:**
```env
# Make sure these are set in .env
PAYMOB_INTEGRATION_ID_CARD="your_card_integration_id"
PAYMOB_INTEGRATION_ID_APPLE_PAY="your_apple_pay_integration_id"
```

### **Issue 2: "HMAC verification failed"**

**Solution:**
```env
# Set the correct HMAC secret from Paymob dashboard
PAYMOB_HMAC_SECRET="your_hmac_secret_from_dashboard"
```

### **Issue 3: "Payment window blocked"**

**Solution:**
- Disable popup blockers
- Use HTTPS in production
- Check browser console for errors

### **Issue 4: "Database connection failed"**

**Solution:**
```bash
# Check database connection
npx prisma db push

# Reset database if needed
npx prisma migrate reset
```

## 📈 Performance Testing

### **Load Testing with Artillery**

```bash
# Install Artillery
npm install -g artillery

# Create test script: load-test.yml
```

```yaml
# load-test.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 5
scenarios:
  - name: "Create Payment Intention"
    weight: 100
    flow:
      - post:
          url: "/api/paymob/create-intention"
          headers:
            Authorization: "Bearer YOUR_JWT_TOKEN"
          json:
            amount: 10.00
            currency: "SAR"
            paymentMethod: "card"
            # ... rest of payment data
```

```bash
# Run load test
artillery run load-test.yml
```

## ✅ Testing Checklist

### **Pre-Testing Setup**
- [ ] Environment variables configured
- [ ] Database migration applied
- [ ] Paymob test credentials obtained
- [ ] Webhook URL configured
- [ ] Frontend and backend servers running

### **Backend Testing**
- [ ] Service initialization
- [ ] Payment data validation
- [ ] Intention creation
- [ ] Webhook handling
- [ ] HMAC verification
- [ ] Database operations
- [ ] Error handling

### **Frontend Testing**
- [ ] Component rendering
- [ ] Payment form validation
- [ ] Provider selection
- [ ] Checkout window opening
- [ ] Payment result handling
- [ ] Error display
- [ ] Responsive design

### **Integration Testing**
- [ ] End-to-end payment flow
- [ ] Webhook processing
- [ ] Database updates
- [ ] Email notifications
- [ ] Order creation
- [ ] Subscription activation

### **Security Testing**
- [ ] HMAC verification
- [ ] Input validation
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting

### **Production Readiness**
- [ ] Live credentials configured
- [ ] SSL certificates installed
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Backup procedures in place

## 🎉 Success Criteria

Your Paymob integration is working correctly when:

1. ✅ **Backend Test Passes**: `node test-paymob-integration.js` shows all green checkmarks
2. ✅ **Frontend Test Works**: `/test/paymob` page loads and processes payments
3. ✅ **Webhooks Process**: Paymob webhooks are received and processed correctly
4. ✅ **Database Updates**: Payment records are saved and updated properly
5. ✅ **Error Handling**: Graceful handling of all error scenarios
6. ✅ **Security**: HMAC verification and input validation working

Happy testing! 🚀
