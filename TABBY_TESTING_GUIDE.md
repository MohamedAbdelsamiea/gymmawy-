# Tabby Payment Gateway Testing Guide

This guide follows the official Tabby testing guidelines exactly as specified in their documentation.

## 🧪 Testing Credentials

### Payment Success Flow
- **UAE**: `otp.success@tabby.ai` / `+971500000001`
- **KSA**: `otp.success@tabby.ai` / `+966500000001`  
- **Kuwait**: `otp.success@tabby.ai` / `+96590000001`
- **OTP**: `8888`

### Background Pre-scoring Reject Flow
- **UAE**: `otp.success@tabby.ai` / `+971500000002`
- **KSA**: `otp.success@tabby.ai` / `+966500000002`
- **Kuwait**: `otp.success@tabby.ai` / `+96590000002`

### Payment Failure Flow
- **UAE**: `otp.rejected@tabby.ai` / `+971500000001`
- **KSA**: `otp.rejected@tabby.ai` / `+966500000001`
- **Kuwait**: `otp.rejected@tabby.ai` / `+96590000001`
- **OTP**: `8888`

## 🚀 How to Test

### 1. Access the Testing Panel
1. Go to the checkout page
2. Select "Pay in Installments" → "Tabby (Pay in 4)"
3. Click the "Tabby Testing Panel" button
4. Select your test scenario and country
5. Click "Apply Test Credentials"

### 2. Test Scenarios

#### ✅ Payment Success
**Steps:**
1. Apply success credentials (any country)
2. Fill in shipping details
3. Select Tabby as payment method
4. Click "Place Order"
5. Complete payment on Tabby HPP using OTP: 8888
6. Verify redirect to success page

**Expected Results:**
- Tabby payment method is available
- Tabby HPP opens successfully
- Success screen appears with redirect to success URL
- Payment status becomes CLOSED
- Order is captured with amount in captures array

#### ❌ Background Pre-scoring Reject
**Steps:**
1. Apply reject credentials (any country)
2. Fill in shipping details
3. Select Tabby as payment method
4. Click "Place Order"

**Expected Results:**
- Tabby payment method is hidden/unavailable
- Error message: "Sorry, Tabby is unable to approve this purchase, please use an alternative payment method for your order."
- Arabic: "نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى."

#### 🚫 Payment Cancellation
**Steps:**
1. Apply success credentials
2. Complete checkout and go to Tabby HPP
3. Click "Back to Store" (Desktop) or cross button (Mobile)
4. Confirm cancellation

**Expected Results:**
- Redirect to cancel URL
- Cart is not emptied
- Message: "You aborted the payment. Please retry or choose another payment method."
- Arabic: "لقد ألغيت الدفعة. فضلاً حاول مجددًا أو اختر طريقة دفع أخرى."

#### ❌ Payment Failure
**Steps:**
1. Apply failure credentials
2. Complete checkout and go to Tabby HPP
3. Use OTP: 8888
4. Click "Back to store"

**Expected Results:**
- Rejection screen: "We can't approve this purchase"
- Redirect to failure URL
- Cart is not emptied
- Error message displayed
- Tabby still available for selection
- Payment status: REJECTED

#### 🔄 Corner Case (Browser Tab Closure)
**Steps:**
1. Apply success credentials
2. Complete checkout and go to Tabby HPP
3. Use OTP: 8888
4. See success screen with tick
5. Close browser tab before redirection

**Expected Results:**
- No redirection to success page
- Payment status changes to AUTHORIZED, then CLOSED
- Webhook triggers capture
- Order marked successful in system

## 🔧 Backend Testing

### Check Payment Status
```bash
curl -X GET "http://localhost:3000/api/tabby/payment/{payment_id}/status" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

### Check Payment Records
```bash
# Check recent payments in database
curl -X GET "http://localhost:3000/api/payments" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

## 📊 Expected Database States

### Payment Success
- `status`: `COMPLETED`
- `method`: `TABBY`
- `metadata.test_scenario`: `payment_success`
- `metadata.tabby_status`: `CLOSED`

### Payment Failure
- `status`: `REJECTED`
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
- Verify merchant code is correct (CCSAU)
- Check API credentials in .env file
- Ensure currency is SAR for Saudi merchant code

### Frontend Issues
- Check if test credentials are applied correctly
- Verify form fields are populated with test data
- Check browser console for JavaScript errors

## 📝 Test Checklist

- [ ] Payment Success flow works with all countries
- [ ] Background reject hides Tabby payment method
- [ ] Payment cancellation redirects properly
- [ ] Payment failure shows correct error messages
- [ ] Corner case handles browser tab closure
- [ ] All test credentials work as expected
- [ ] Database records are created correctly
- [ ] Webhook handling works for all scenarios
- [ ] Error messages display in both English and Arabic
- [ ] Payment status API returns correct information

## 🎯 Success Criteria

All test scenarios must pass exactly as specified in the official Tabby testing guidelines. The integration should handle:

1. **Positive flows** with proper success handling
2. **Negative flows** with appropriate error messages
3. **Edge cases** like browser tab closure
4. **Multi-language support** for error messages
5. **Proper database state management** for all scenarios

## 📞 Support

If you encounter issues during testing:
1. Check the backend logs for detailed error information
2. Verify all environment variables are set correctly
3. Ensure the database is properly initialized
4. Test with the provided credentials exactly as specified

Remember: Always use the exact test credentials provided by Tabby for accurate testing results.
