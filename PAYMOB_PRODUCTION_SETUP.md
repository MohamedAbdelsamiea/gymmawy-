# Paymob Production Setup Guide

This guide will help you deploy the Paymob integration to production with proper configuration.

## **🚀 Production Deployment Checklist**

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
https://yourdomain.com/api/paymob/webhook
```

### **3. Database Migration**

Run the database migration to add the PAYMOB payment method:

```bash
cd gymmawy-backend
npx prisma db push
```

### **4. Production Environment Setup**

Update your production environment file:

```bash
# .env.production
PAYMOB_SECRET_KEY="your_production_secret_key"
PAYMOB_PUBLIC_KEY="your_production_public_key"
PAYMOB_MIGS_INTEGRATION_ID=your_production_migs_id
PAYMOB_APPLEPAY_INTEGRATION_ID=your_production_apple_pay_id
PAYMOB_HMAC_SECRET=your_production_hmac_secret
```

### **5. SSL Certificate**

Ensure your production server has a valid SSL certificate for webhook processing.

### **6. Testing**

After deployment, test the integration:

1. **Test Payment Creation**: Try creating a payment intention
2. **Test Webhook**: Verify webhook processing works
3. **Test Success Flow**: Complete a test payment
4. **Test Error Handling**: Verify error scenarios work

### **7. Monitoring**

Set up monitoring for:
- Webhook endpoint availability
- Payment processing success rates
- Error logs and alerts

## **🔧 Troubleshooting**

### Common Issues:

1. **Webhook Not Receiving**: Check SSL certificate and URL accessibility
2. **HMAC Verification Fails**: Verify HMAC secret matches Paymob dashboard
3. **Integration ID Errors**: Ensure correct integration IDs are configured
4. **Payment Status Not Updating**: Check webhook processing logs

### Debug Commands:

```bash
# Check webhook endpoint
curl -X POST https://yourdomain.com/api/paymob/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'

# Check environment variables
node -e "console.log(process.env.PAYMOB_SECRET_KEY ? 'Secret Key: Configured' : 'Secret Key: Missing')"
```

## **📞 Support**

For Paymob-specific issues, contact Paymob support:
- Email: support@paymob.com
- Documentation: https://docs.paymob.com/

For integration issues, check the logs and error messages in your application.
