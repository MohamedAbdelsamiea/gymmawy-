# Paymob Unified Intention API Integration

This document describes the complete integration of Paymob's Unified Intention API into the Gymmawy application, supporting both Apple Pay and regular card payments.

## 🚀 Features

- **Unified Intention API**: Create payment intentions with a single API call
- **Multiple Payment Methods**: Support for both Apple Pay and regular cards
- **Webhook Handling**: Secure webhook processing with HMAC verification
- **Database Integration**: Complete payment tracking and history
- **Frontend Components**: Ready-to-use React components for payment UI
- **Security**: HMAC signature verification and secure data handling
- **Error Handling**: Comprehensive error handling and validation
- **Testing**: Complete test suite and debugging tools

## 📋 Prerequisites

Before implementing the Paymob integration, ensure you have:

1. **Paymob Account**: Active Paymob merchant account
2. **API Credentials**: Secret key, public key, and integration IDs
3. **Webhook URL**: Secure endpoint for payment callbacks
4. **Database**: PostgreSQL database with Prisma migrations applied

## 🔧 Backend Setup

### 1. Environment Configuration

Add the following variables to your `.env` file:

```env
# Paymob Configuration
PAYMOB_SECRET_KEY="sk_test_your_secret_key_here"
PAYMOB_PUBLIC_KEY="pk_test_your_public_key_here"
PAYMOB_INTEGRATION_ID_CARD="123456"
PAYMOB_INTEGRATION_ID_APPLE_PAY="789012"
PAYMOB_HMAC_SECRET="your_hmac_secret_here"

# Base URLs
BASE_URL="https://your-api-domain.com"
FRONTEND_URL="https://your-frontend-domain.com"
```

### 2. Database Migration

Run the database migration to create the PaymentIntention table:

```bash
cd gymmawy-backend
npx prisma migrate dev --name add_paymob_payment_intention
```

### 3. API Endpoints

The integration provides the following endpoints:

#### Create Payment Intention
```http
POST /api/paymob/create-intention
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "amount": 10.00,
  "currency": "SAR",
  "paymentMethod": "card",
  "items": [
    {
      "name": "Product Name",
      "amount": 10.00,
      "description": "Product description",
      "quantity": 1
    }
  ],
  "billingData": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "phoneNumber": "+966500000000",
    "street": "Street Name",
    "building": "Building Name",
    "city": "Riyadh",
    "country": "KSA"
  },
  "customer": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "orderId": "optional_order_id",
  "subscriptionPlanId": "optional_subscription_plan_id"
}
```

#### Webhook Handler
```http
POST /api/paymob/webhook
X-Paymob-HMAC: <hmac_signature>
Content-Type: application/json

{
  "type": "TRANSACTION",
  "obj": {
    "id": "transaction_id",
    "amount_cents": 1000,
    "currency": "SAR",
  "success": true,
    // ... other transaction data
  }
}
```

#### Get Payment Status
```http
GET /api/paymob/intention/:intentionId/status
Authorization: Bearer <jwt_token>
```

#### Refund Transaction
```http
POST /api/paymob/refund
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "transactionId": "transaction_id",
  "amount": 5.00
}
```

#### Get Payment History
```http
GET /api/paymob/payments?page=1&limit=10&status=success
Authorization: Bearer <jwt_token>
```

## 🎨 Frontend Integration

### 1. Paymob Checkout Component

```jsx
import PaymobCheckout from './components/payment/PaymobCheckout.jsx';

function CheckoutPage() {
  const handlePaymentSuccess = (result) => {
    console.log('Payment successful:', result);
    // Handle successful payment
  };

  const handlePaymentError = (error) => {
    console.error('Payment failed:', error);
    // Handle payment error
  };

  return (
    <PaymobCheckout
      amount={10.00}
      currency="SAR"
      items={[
        {
          name: "Product Name",
          amount: 10.00,
          description: "Product description",
          quantity: 1
        }
      ]}
      onSuccess={handlePaymentSuccess}
      onError={handlePaymentError}
    />
  );
}
```

### 2. Payment Result Component

```jsx
import PaymobPaymentResult from './components/payment/PaymobPaymentResult.jsx';

// Add to your router
<Route path="/payment/result" element={<PaymobPaymentResult />} />
```

### 3. Service Usage

```javascript
import paymobService from './services/paymobService.js';

// Create and process payment
const paymentData = {
  amount: 10.00,
  currency: 'SAR',
  paymentMethod: 'card',
  // ... other payment data
};

const result = await paymobService.createAndPay(paymentData);
```

## 🔐 Security Features

### HMAC Verification

The integration includes HMAC signature verification for webhook security:

```javascript
const isValid = paymobService.verifyHmac(receivedHmac, payload);
```

### Data Validation

All payment data is validated before processing:

```javascript
const validation = paymobService.validatePaymentData(paymentData);
if (!validation.isValid) {
  throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
}
```

## 🧪 Testing

### Backend Testing

Run the comprehensive test suite:

```bash
cd gymmawy-backend
node test-paymob-integration.js
```

### Frontend Testing

Use the built-in test component:

```jsx
import PaymobTest from './components/payment/PaymobTest.jsx';

// Add to your test routes
<Route path="/test/paymob" element={<PaymobTest />} />
```

### Test Credentials

Use Paymob's test credentials for development:

- **Test Secret Key**: `sk_test_...`
- **Test Public Key**: `pk_test_...`
- **Test Integration IDs**: Use your test integration IDs from Paymob dashboard

## 📊 Database Schema

The integration uses your existing `Payment` model with the addition of `PAYMOB` to the `PaymentMethod` enum:

```prisma
enum PaymentMethod {
  INSTA_PAY
  VODAFONE_CASH
  TABBY
  TAMARA
  CARD
  PAYMOB  // Added for Paymob integration
}

model Payment {
  id               String           @id @default(uuid())
  amount           Decimal          @db.Decimal(10, 2)
  status           PaymentStatus    @default(PENDING)
  method           PaymentMethod    // Can be 'PAYMOB'
  gatewayId        String?          // Stores Paymob intention ID
  transactionId    String?          // Stores Paymob transaction ID
  paymentReference String           @unique
  customerInfo     Json?            // Customer details
  metadata         Json?            // Additional payment data
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  processedAt      DateTime?
  user             User?            @relation(fields: [userId], references: [id])
}
```

## 🔄 Payment Flow

1. **Create Intention**: Client calls `/api/paymob/create-intention`
2. **Open Checkout**: Frontend opens Paymob checkout URL
3. **User Payment**: User completes payment on Paymob
4. **Webhook**: Paymob sends webhook to `/api/paymob/webhook`
5. **Update Status**: Backend updates payment status and related records
6. **Redirect**: User is redirected to success/failure page

## 🚨 Error Handling

The integration includes comprehensive error handling:

- **Validation Errors**: Data validation before API calls
- **API Errors**: Paymob API error handling
- **Network Errors**: Timeout and connection error handling
- **Webhook Errors**: Invalid HMAC and parsing error handling
- **Database Errors**: Transaction rollback and error logging

## 📝 Logging

All payment operations are logged for debugging:

```javascript
console.log('Creating Paymob intention with payload:', payload);
console.log('Paymob intention created successfully:', response.data.id);
console.log('Webhook processed successfully for intention:', paymentIntention.id);
```

## 🔧 Configuration

### Paymob Dashboard Setup

1. **Integration IDs**: Configure separate integration IDs for:
   - Regular card payments
   - Apple Pay payments

2. **Webhook URLs**: Set up webhook URLs for:
   - Transaction processed callback
   - Redirection callback

3. **HMAC Secret**: Configure HMAC secret for webhook verification

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PAYMOB_SECRET_KEY` | Paymob API secret key | `sk_test_...` |
| `PAYMOB_PUBLIC_KEY` | Paymob API public key | `pk_test_...` |
| `PAYMOB_INTEGRATION_ID_CARD` | Card payment integration ID | `123456` |
| `PAYMOB_INTEGRATION_ID_APPLE_PAY` | Apple Pay integration ID | `789012` |
| `PAYMOB_HMAC_SECRET` | HMAC verification secret | `your_secret` |
| `BASE_URL` | Backend base URL | `https://api.example.com` |
| `FRONTEND_URL` | Frontend base URL | `https://app.example.com` |

## 🚀 Deployment

### Production Checklist

- [ ] Set live Paymob credentials
- [ ] Configure production webhook URLs
- [ ] Set up SSL certificates
- [ ] Configure rate limiting
- [ ] Set up monitoring and alerts
- [ ] Test with real payment methods
- [ ] Configure backup webhook endpoints

### Security Considerations

- Use HTTPS for all webhook endpoints
- Implement rate limiting on payment endpoints
- Validate all webhook data
- Use HMAC verification for webhooks
- Log all payment operations
- Implement proper error handling
- Use environment variables for secrets

## 📞 Support

For issues with the Paymob integration:

1. Check the test logs for detailed error information
2. Verify your Paymob credentials and configuration
3. Ensure webhook URLs are accessible from Paymob
4. Check database connectivity and migrations
5. Review Paymob API documentation for latest updates

## 📚 Additional Resources

- [Paymob API Documentation](https://docs.paymob.com/)
- [Paymob Test Credentials](https://docs.paymob.com/test-credentials)
- [HMAC Verification Guide](https://docs.paymob.com/hmac)
- [Webhook Configuration](https://docs.paymob.com/webhooks)

---

**Note**: This integration is designed for the KSA (Saudi Arabia) region. For other regions, update the base URL and currency codes accordingly.
