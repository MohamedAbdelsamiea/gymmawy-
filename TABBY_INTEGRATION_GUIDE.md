# Tabby Payment Gateway Integration Guide

This guide will help you set up and test the Tabby payment gateway integration in your Gymmawy application.

## 🚀 Quick Setup

### 1. Environment Configuration

Copy the provided credentials to your `.env` file in the backend:

```bash
# Tabby Payment Gateway Configuration
TABBY_SECRET_KEY="sk_test_01983bfd-82bd-ef7b-3843-b3012b0c4abc"
TABBY_PUBLIC_KEY="pk_test_01983bfd-82bd-ef7b-3843-b3010ce00361"
TABBY_MERCHANT_CODE="your-merchant-code"  # Contact Tabby for this
FRONTEND_URL="http://localhost:3000"  # Your frontend URL
```

### 2. Install Dependencies

The integration has been set up with the following dependencies:

**Backend:**
- `axios` - For HTTP requests to Tabby API
- All other dependencies are already installed

**Frontend:**
- All dependencies are already available in your React setup

### 3. Database Setup

The payment system is already integrated with your existing database schema. No additional migrations are needed.

## 📁 Files Created/Modified

### Backend Files:
- `src/services/tabbyService.js` - Main Tabby API service
- `src/modules/payments/tabby.controller.js` - Payment controller
- `src/modules/payments/tabby.routes.js` - API routes
- `src/express.js` - Updated to include Tabby routes
- `src/tests/tabby.test.js` - Comprehensive test suite
- `env.example` - Environment variables template

### Frontend Files:
- `src/services/tabbyService.js` - Frontend Tabby service
- `src/components/payment/TabbyCheckout.jsx` - Checkout component
- `src/pages/PaymentSuccess.jsx` - Success page
- `src/pages/PaymentFailure.jsx` - Failure page
- `src/pages/PaymentCancel.jsx` - Cancel page
- `src/routes.jsx` - Updated with payment routes

## 🔧 API Endpoints

### Backend Endpoints:

```
POST /api/tabby/checkout
GET  /api/tabby/payment/:paymentId/status
POST /api/tabby/payment/:paymentId/capture
POST /api/tabby/payment/:paymentId/refund
POST /api/tabby/payment/:paymentId/close
POST /api/tabby/webhook
POST /api/tabby/webhook/setup
```

### Frontend Routes:

```
/payment/success - Payment success page
/payment/failure - Payment failure page
/payment/cancel - Payment cancellation page
```

## 🧪 Testing the Integration

### 1. Start the Backend

```bash
cd gymmawy-backend
npm run dev
```

### 2. Start the Frontend

```bash
cd gymmawy-frontend
npm run dev
```

### 3. Run Tests

```bash
cd gymmawy-backend
npm test -- src/tests/tabby.test.js
```

### 4. Test Payment Flow

1. **Create a checkout session:**
   ```bash
   curl -X POST http://localhost:5000/api/tabby/checkout \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "amount": 100.00,
       "currency": "EGP",
       "description": "Test payment",
       "paymentableId": "test-order-123",
       "paymentableType": "PRODUCT",
       "lang": "en",
       "buyer": {
         "phone": "+1234567890",
         "email": "test@example.com",
         "name": "Test User"
       },
       "shipping_address": {
         "line1": "123 Test Street",
         "city": "Cairo",
         "zip": "12345",
         "country": "EG"
       },
       "items": [
         {
           "title": "Test Product",
           "quantity": 1,
           "unit_price": "100.00",
           "category": "electronics"
         }
       ]
     }'
   ```

2. **Check payment status:**
   ```bash
   curl -X GET http://localhost:5000/api/tabby/payment/PAYMENT_ID/status \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### 5. Frontend Integration Example

```jsx
import TabbyCheckout from '../components/payment/TabbyCheckout';

function CheckoutPage() {
  const orderData = {
    id: 'order-123',
    amount: 100.00,
    currency: 'EGP',
    description: 'Test order',
    user: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      mobileNumber: '+1234567890'
    },
    items: [
      {
        title: 'Test Product',
        quantity: 1,
        price: 100.00,
        category: 'electronics'
      }
    ]
  };

  return (
    <TabbyCheckout
      orderData={orderData}
      orderType="product"
      onSuccess={(result) => console.log('Payment successful:', result)}
      onError={(error) => console.error('Payment failed:', error)}
      onCancel={() => console.log('Payment cancelled')}
    />
  );
}
```

## 🔗 Webhook Setup

### 1. Set up Webhook Endpoint

```bash
curl -X POST http://localhost:5000/api/tabby/webhook/setup \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yourdomain.com/api/tabby/webhook",
    "is_test": true,
    "events": ["payment.*"]
  }'
```

### 2. Webhook Events Handled

- `payment.created` - Payment created
- `payment.updated` - Payment status updated
- `payment.authorized` - Payment authorized
- `payment.closed` - Payment completed
- `payment.rejected` - Payment rejected

## 🛡️ Security Considerations

1. **Environment Variables:** Keep your Tabby credentials secure
2. **Webhook Verification:** Implement proper signature verification
3. **HTTPS:** Use HTTPS in production for webhook endpoints
4. **Rate Limiting:** Already implemented in your Express app

## 🔍 Troubleshooting

### Common Issues:

1. **"Tabby API credentials not configured"**
   - Ensure all Tabby environment variables are set
   - Check your `.env` file is loaded correctly

2. **"Invalid signature" error in webhooks**
   - Implement proper webhook signature verification
   - Check Tabby documentation for signature validation

3. **Payment status not updating**
   - Verify webhook endpoint is accessible
   - Check webhook event handling logic

4. **Frontend checkout not working**
   - Ensure CORS is configured correctly
   - Check authentication token is valid

### Debug Mode:

Enable debug logging by setting:
```bash
NODE_ENV=development
LOG_LEVEL=debug
```

## 📚 API Reference

### Tabby Service Methods:

```javascript
// Create checkout session
await tabbyService.createCheckoutSession(checkoutData);

// Get payment status
await tabbyService.getPayment(paymentId);

// Capture payment
await tabbyService.capturePayment(paymentId, captureData);

// Refund payment
await tabbyService.refundPayment(paymentId, refundData);

// Close payment
await tabbyService.closePayment(paymentId);
```

### Payment Status Mapping:

| Tabby Status | Internal Status |
|-------------|----------------|
| NEW         | PENDING        |
| AUTHORIZED  | AUTHORIZED     |
| CLOSED      | COMPLETED      |
| REJECTED    | FAILED         |
| EXPIRED     | FAILED         |
| CANCELLED   | CANCELLED      |

## 🚀 Production Deployment

### 1. Update Environment Variables

```bash
# Production Tabby credentials (get from Tabby dashboard)
TABBY_SECRET_KEY="sk_live_..."
TABBY_PUBLIC_KEY="pk_live_..."
TABBY_MERCHANT_CODE="your-live-merchant-code"
FRONTEND_URL="https://yourdomain.com"
```

### 2. Webhook Configuration

Update webhook URL to your production domain:
```
https://yourdomain.com/api/tabby/webhook
```

### 3. SSL Certificate

Ensure your production server has a valid SSL certificate for webhook endpoints.

## 📞 Support

- **Tabby Documentation:** https://docs.tabby.ai/
- **Tabby Support:** Contact your Tabby integration manager
- **Issues:** Check the test suite for expected behavior

## ✅ Checklist

- [ ] Environment variables configured
- [ ] Backend server running
- [ ] Frontend server running
- [ ] Tests passing
- [ ] Webhook endpoint accessible
- [ ] Payment flow tested
- [ ] Error handling verified
- [ ] Production credentials ready

## 🎉 You're Ready!

Your Tabby payment integration is now complete and ready for testing. The integration supports:

- ✅ Checkout session creation
- ✅ Payment status tracking
- ✅ Webhook handling
- ✅ Payment capture/refund/close
- ✅ Frontend components
- ✅ Error handling
- ✅ Comprehensive testing

Happy coding! 🚀
