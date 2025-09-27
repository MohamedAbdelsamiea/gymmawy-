# Tabby Payment Gateway - QA Testing Documentation

## 🎯 Overview

This document provides comprehensive testing instructions for the Tabby payment gateway integration in the Gymmawy application. The integration follows Tabby's official testing guidelines and includes all required test scenarios.

## 🚀 Deployment Status

### ✅ Ready for Production
- **Backend**: Node.js/Express server with Tabby integration
- **Frontend**: React application with Tabby checkout flow
- **Database**: PostgreSQL with proper schema and migrations
- **Webhooks**: Configured for automatic payment capture
- **Testing**: All test scenarios implemented and verified

### 🔧 Environment Configuration
- **Saudi Arabia**: `CCSAU` merchant code for SAR currency
- **UAE**: `GUAE` merchant code for AED currency
- **Supported Currencies**: SAR (Saudi Riyal) and AED (UAE Dirham)
- **Test Mode**: Enabled with official Tabby test credentials
- **Webhook URL**: `https://yourdomain.com/api/tabby/webhook`

## 📋 Pre-Deployment Checklist

### 1. Environment Variables
```bash
# Production .env file
NODE_ENV=production
DATABASE_URL=postgresql://user:password@your-vps-ip:5432/gymmawy
TABBY_SECRET_KEY=sk_test_01983bfd-82bd-ef7b-3843-b3012b0c4abc
TABBY_PUBLIC_KEY=pk_test_01983bfd-82bd-ef7b-3843-b3010ce00361
TABBY_MERCHANT_CODE=CCSAU  # Default (Saudi Arabia), UAE (GUAE) handled dynamically
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=your-production-jwt-secret
```

### 2. Database Setup
```bash
# On your VPS
npx prisma migrate deploy
npx prisma db seed  # if you have seed data
```

### 3. Webhook Configuration
- **Tabby Dashboard** → **Webhooks**
- **URL**: `https://yourdomain.com/api/tabby/webhook`
- **Events**: `payment.authorized`, `payment.closed`
- **Test Mode**: `true` (for testing phase)

### 4. SSL Certificate
- **Required**: HTTPS for webhook security
- **Recommended**: Let's Encrypt or hosting provider SSL

## 🧪 Testing Scenarios

### Test Credentials
All test credentials follow Tabby's official guidelines:

#### Payment Success Flow
- **UAE**: `otp.success@tabby.ai` / `+971500000001` (AED currency)
- **KSA**: `otp.success@tabby.ai` / `+966500000001` (SAR currency)
- **Kuwait**: `otp.success@tabby.ai` / `+96590000001` (Not supported)
- **OTP**: `8888`

#### Background Pre-scoring Reject Flow
- **UAE**: `otp.success@tabby.ai` / `+971500000002` (AED currency)
- **KSA**: `otp.success@tabby.ai` / `+966500000002` (SAR currency)
- **Kuwait**: `otp.success@tabby.ai` / `+96590000002` (Not supported)

#### Payment Failure Flow
- **UAE**: `otp.rejected@tabby.ai` / `+971500000001` (AED currency)
- **KSA**: `otp.rejected@tabby.ai` / `+966500000001` (SAR currency)
- **Kuwait**: `otp.rejected@tabby.ai` / `+96590000001` (Not supported)
- **OTP**: `8888`

### Test Scenarios

#### 1. ✅ Payment Success
**Steps:**
1. Go to checkout page
2. Select "Pay in Installments" → "Tabby (Pay in 4)"
3. Click "Tabby Testing Panel"
4. Select "Payment Success" scenario and country
5. Click "Apply Test Credentials"
6. Fill in shipping details
7. Click "Place Order"
8. Complete payment on Tabby HPP using OTP: `8888`
9. Verify redirect to success page

**Expected Results:**
- ✅ Tabby payment method is available
- ✅ Tabby HPP opens successfully
- ✅ Success screen appears with redirect to success URL
- ✅ Payment status becomes `CLOSED` in Tabby dashboard
- ✅ Order is captured with amount in captures array
- ✅ Purchase record created in database with `PENDING` status
- ✅ Payment record created with `SUCCESS` status

#### 2. ❌ Background Pre-scoring Reject
**Steps:**
1. Go to checkout page
2. Select "Pay in Installments" → "Tabby (Pay in 4)"
3. Click "Tabby Testing Panel"
4. Select "Background Pre-scoring Reject" scenario and country
5. Click "Apply Test Credentials"
6. Fill in shipping details
7. Click "Place Order"

**Expected Results:**
- ✅ Tabby payment method is hidden/unavailable
- ✅ Error message: "Sorry, Tabby is unable to approve this purchase, please use an alternative payment method for your order."
- ✅ Arabic: "نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى."
- ✅ No payment record created

#### 3. 🚫 Payment Cancellation
**Steps:**
1. Apply success credentials
2. Complete checkout and go to Tabby HPP
3. Click "Back to Store" (Desktop) or cross button (Mobile)
4. Confirm cancellation

**Expected Results:**
- ✅ Redirect to cancel URL
- ✅ Cart is not emptied
- ✅ Message: "You aborted the payment. Please retry or choose another payment method."
- ✅ Arabic: "لقد ألغيت الدفعة. فضلاً حاول مجددًا أو اختر طريقة دفع أخرى."

#### 4. ❌ Payment Failure
**Steps:**
1. Apply failure credentials
2. Complete checkout and go to Tabby HPP
3. Use OTP: `8888`
4. Click "Back to store"

**Expected Results:**
- ✅ Rejection screen: "We can't approve this purchase"
- ✅ Redirect to failure URL
- ✅ Cart is not emptied
- ✅ Error message displayed
- ✅ Tabby still available for selection
- ✅ Payment status: `REJECTED`

#### 5. 🔄 Corner Case (Browser Tab Closure)
**Steps:**
1. Apply success credentials
2. Complete checkout and go to Tabby HPP
3. Use OTP: `8888`
4. See success screen with tick
5. Close browser tab before redirection

**Expected Results:**
- ✅ No redirection to success page
- ✅ Payment status changes to `AUTHORIZED`, then `CLOSED`
- ✅ Webhook triggers capture
- ✅ Order marked successful in system

## 🔧 Backend Testing

### Check Tabby Availability
```bash
# Check if Tabby is available for a specific currency
curl -X GET "https://yourdomain.com/api/tabby/availability?currency=SAR"
curl -X GET "https://yourdomain.com/api/tabby/availability?currency=AED"
curl -X GET "https://yourdomain.com/api/tabby/availability?currency=USD"
```

### Check Payment Status
```bash
curl -X GET "https://yourdomain.com/api/tabby/payment/{payment_id}/status" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### Check Payment Records
```bash
# Check recent payments in database
curl -X GET "https://yourdomain.com/api/payments" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

## 📊 Expected Database States

### Payment Success
- `status`: `SUCCESS`
- `method`: `TABBY`
- `metadata.test_scenario`: `payment_success`
- `metadata.tabby_status`: `CLOSED`

### Payment Failure
- `status`: `FAILED`
- `method`: `TABBY`
- `metadata.test_scenario`: `payment_failure`
- `metadata.tabby_status`: `REJECTED`

### Background Reject
- No payment record created (rejected before creation)

## 🐛 Troubleshooting

### Payment Not Found Error
- Check if payment record was created in database
- Verify transaction ID matches Tabby payment ID
- Check backend logs for payment creation errors

### Tabby API Errors
- Verify merchant code is correct (`CCSAU`)
- Check API credentials in .env file
- Ensure currency is SAR for Saudi merchant code

### Frontend Issues
- Check if test credentials are applied correctly
- Verify form fields are populated with test data
- Check browser console for JavaScript errors

### Webhook Issues
- Verify webhook URL is accessible from internet
- Check SSL certificate is valid
- Ensure webhook events are enabled in Tabby dashboard

## 📝 Test Checklist

### Core Functionality
- [ ] Payment Success flow works with all countries
- [ ] Background reject hides Tabby payment method
- [ ] Payment cancellation redirects properly
- [ ] Payment failure shows correct error messages
- [ ] Corner case handles browser tab closure
- [ ] All test credentials work as expected

### Database Integration
- [ ] Database records are created correctly
- [ ] Payment status updates properly
- [ ] Purchase records are created with correct status
- [ ] Metadata is stored correctly

### Webhook Handling
- [ ] Webhook handling works for all scenarios
- [ ] Automatic payment capture works
- [ ] Payment status updates via webhooks
- [ ] Error handling for webhook failures

### User Experience
- [ ] Error messages display in both English and Arabic
- [ ] Payment status API returns correct information
- [ ] Navigation buttons work correctly
- [ ] Loading states are handled properly

## 🎯 Success Criteria

All test scenarios must pass exactly as specified in the official Tabby testing guidelines. The integration should handle:

1. **Positive flows** with proper success handling
2. **Negative flows** with appropriate error messages
3. **Edge cases** like browser tab closure
4. **Multi-language support** for error messages
5. **Proper database state management** for all scenarios
6. **Automatic payment capture** via webhooks
7. **Proper purchase status management** (PENDING until admin approval)

## 📞 Support

If you encounter issues during testing:

1. **Check the backend logs** for detailed error information
2. **Verify all environment variables** are set correctly
3. **Ensure the database** is properly initialized
4. **Test with the provided credentials** exactly as specified
5. **Verify webhook configuration** in Tabby dashboard
6. **Check SSL certificate** is valid and accessible

## 🔒 Security Considerations

- **HTTPS Required**: All webhook endpoints must use HTTPS
- **API Key Security**: Keep Tabby API keys secure and never expose them
- **Database Security**: Use strong passwords and restrict database access
- **Environment Variables**: Never commit .env files to version control

## 📈 Performance Considerations

- **Webhook Timeout**: Set appropriate timeout for webhook processing
- **Database Indexing**: Ensure proper indexing for payment queries
- **Error Handling**: Implement proper retry logic for failed operations
- **Logging**: Set up comprehensive logging for debugging

## 🚀 Deployment Commands

### Backend Deployment
```bash
# Install dependencies
npm install

# Run database migrations
npx prisma migrate deploy

# Start with PM2
pm2 start src/server.js --name "gymmawy-backend"
pm2 save
pm2 startup
```

### Frontend Deployment
```bash
# Build for production
npm run build

# Serve with Nginx or Apache
# Configure reverse proxy to backend
```

## 📋 Final Verification

Before sending for QA approval:

1. **All test scenarios pass** as specified
2. **Webhook configuration** is correct
3. **SSL certificate** is valid
4. **Database migrations** are applied
5. **Environment variables** are set correctly
6. **Error handling** works for all edge cases
7. **Multi-language support** is functional
8. **Automatic payment capture** is working
9. **Purchase status management** is correct
10. **Documentation** is complete and accurate

---

**Note**: This integration follows Tabby's official testing guidelines exactly. All test credentials and scenarios are provided by Tabby for accurate testing results.
