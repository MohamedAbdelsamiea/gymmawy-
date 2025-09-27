# Tabby Integration Example - Adding to Existing Checkout

This example shows how to integrate Tabby payment into your existing checkout flow.

## 🛒 Current Checkout Flow Integration

Your existing checkout page (`src/pages/Checkout/index.jsx`) already has a payment method selection. Here's how to add Tabby:

### 1. Add Tabby Payment Method Option

In your checkout page, add Tabby as a payment method option:

```jsx
// In your payment method selection section
const paymentMethods = [
  { id: 'card', name: 'Credit Card', icon: <CreditCard /> },
  { id: 'insta_pay', name: 'InstaPay', icon: <CreditCard /> },
  { id: 'vodafone_cash', name: 'Vodafone Cash', icon: <CreditCard /> },
  { id: 'tabby', name: 'Tabby (Pay in Installments)', icon: <CreditCard /> }, // Add this line
];
```

### 2. Import Tabby Components

Add these imports to your checkout page:

```jsx
import TabbyCheckout from '../../components/payment/TabbyCheckout';
import tabbyService from '../../services/tabbyService';
```

### 3. Add Tabby Payment Handler

Add this function to handle Tabby payments:

```jsx
const handleTabbyPayment = async () => {
  try {
    setLoading(true);
    
    // Prepare order data for Tabby
    const orderData = {
      id: `order-${Date.now()}`,
      amount: finalPrice.amount,
      currency: finalPrice.currency,
      description: `Payment for ${type === 'cart' ? 'cart items' : type}`,
      user: {
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        email: user?.email || '',
        mobileNumber: user?.mobileNumber || ''
      },
      items: getOrderItems(),
      shippingAddress: {
        address: shippingForm.address || '',
        city: shippingForm.city || 'Cairo',
        country: 'EG',
        postalCode: shippingForm.postalCode || '00000'
      }
    };

    // Create Tabby checkout session
    const result = await tabbyService.createCheckoutSession(
      tabbyService.createCheckoutData(orderData, type)
    );

    // Redirect to Tabby checkout
    if (result.checkout_session?.checkout_url) {
      window.location.href = result.checkout_session.checkout_url;
    }

  } catch (error) {
    console.error('Tabby payment failed:', error);
    showError('Payment initialization failed. Please try again.');
  } finally {
    setLoading(false);
  }
};
```

### 4. Update Payment Method Handler

Modify your existing payment method handler:

```jsx
const handlePayment = async () => {
  switch (selectedPaymentMethod) {
    case 'card':
      await handleCardPayment();
      break;
    case 'insta_pay':
      await handleInstaPayPayment();
      break;
    case 'vodafone_cash':
      await handleVodafoneCashPayment();
      break;
    case 'tabby': // Add this case
      await handleTabbyPayment();
      break;
    default:
      showError('Please select a payment method');
  }
};
```

### 5. Helper Function for Order Items

Add this helper function to format order items:

```jsx
const getOrderItems = () => {
  if (type === 'cart') {
    return cartItems.map(item => ({
      title: item.name,
      quantity: item.quantity,
      price: item.price,
      category: 'product'
    }));
  } else if (type === 'product') {
    return [{
      title: product.name,
      quantity: product.quantity || 1,
      price: product.price,
      category: 'product'
    }];
  } else {
    // For subscriptions/programmes
    return [{
      title: plan?.name || 'Subscription/Programme',
      quantity: 1,
      price: finalPrice.amount,
      category: type === 'subscription' ? 'subscription' : 'programme'
    }];
  }
};
```

## 🔄 Complete Integration Example

Here's a complete example of how your checkout payment section might look:

```jsx
const CheckoutPaymentSection = () => {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [showTabbyCheckout, setShowTabbyCheckout] = useState(false);

  const paymentMethods = [
    { id: 'card', name: 'Credit Card', icon: <CreditCard /> },
    { id: 'insta_pay', name: 'InstaPay', icon: <CreditCard /> },
    { id: 'vodafone_cash', name: 'Vodafone Cash', icon: <CreditCard /> },
    { id: 'tabby', name: 'Tabby (Pay in Installments)', icon: <CreditCard /> },
  ];

  const handlePaymentMethodChange = (method) => {
    setSelectedPaymentMethod(method);
    if (method === 'tabby') {
      setShowTabbyCheckout(true);
    } else {
      setShowTabbyCheckout(false);
    }
  };

  return (
    <div className="payment-section">
      <h3>Payment Method</h3>
      
      <div className="payment-methods">
        {paymentMethods.map((method) => (
          <label key={method.id} className="payment-method-option">
            <input
              type="radio"
              name="paymentMethod"
              value={method.id}
              checked={selectedPaymentMethod === method.id}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
            />
            <div className="payment-method-content">
              {method.icon}
              <span>{method.name}</span>
            </div>
          </label>
        ))}
      </div>

      {showTabbyCheckout && (
        <div className="tabby-checkout-container">
          <TabbyCheckout
            orderData={{
              id: `order-${Date.now()}`,
              amount: finalPrice.amount,
              currency: finalPrice.currency,
              description: `Payment for ${type}`,
              user: user,
              items: getOrderItems(),
              shippingAddress: shippingForm
            }}
            orderType={type}
            onSuccess={(result) => {
              showSuccess('Payment completed successfully!');
              navigate('/payment/success');
            }}
            onError={(error) => {
              showError(`Payment failed: ${error.message}`);
            }}
            onCancel={() => {
              setShowTabbyCheckout(false);
              setSelectedPaymentMethod('');
            }}
          />
        </div>
      )}

      {selectedPaymentMethod && selectedPaymentMethod !== 'tabby' && (
        <button 
          className="payment-button"
          onClick={handlePayment}
          disabled={loading}
        >
          {loading ? 'Processing...' : `Pay ${finalPrice.currencySymbol} ${finalPrice.amount}`}
        </button>
      )}
    </div>
  );
};
```

## 🎯 Quick Integration Steps

1. **Add Tabby option** to your payment method selection
2. **Import Tabby components** in your checkout page
3. **Add Tabby payment handler** function
4. **Update payment method logic** to include Tabby
5. **Test the integration** with the provided test credentials

## 🧪 Testing Your Integration

1. **Start your servers:**
   ```bash
   # Backend
   cd gymmawy-backend && npm run dev
   
   # Frontend
   cd gymmawy-frontend && npm run dev
   ```

2. **Add Tabby credentials** to your `.env` file:
   ```bash
   TABBY_SECRET_KEY="sk_test_01983bfd-82bd-ef7b-3843-b3012b0c4abc"
   TABBY_PUBLIC_KEY="pk_test_01983bfd-82bd-ef7b-3843-b3010ce00361"
   TABBY_MERCHANT_CODE="test-merchant-code"
   FRONTEND_URL="http://localhost:3000"
   ```

3. **Test the payment flow:**
   - Go to your checkout page
   - Select "Tabby (Pay in Installments)"
   - Complete the payment flow
   - Verify redirect to success/failure pages

## 🔧 Backend Integration

Your backend is already set up with all the necessary endpoints:

- `POST /api/tabby/checkout` - Create payment session
- `GET /api/tabby/payment/:id/status` - Check payment status
- `POST /api/tabby/webhook` - Handle payment events

## 🎉 You're Ready!

Your Tabby integration is complete and ready to use. The integration supports:

- ✅ Installment payments
- ✅ Secure checkout sessions
- ✅ Real-time payment status updates
- ✅ Webhook handling
- ✅ Error handling and user feedback
- ✅ Mobile-responsive design

Happy coding! 🚀
