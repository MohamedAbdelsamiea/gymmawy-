# 🧪 Tabby Integration Testing Guide

## Overview
This guide will help you test the Tabby webhook and cron job implementation.

---

## 📋 Prerequisites

1. **Environment Variables Set:**
   ```bash
   BASE_URL=https://gym.omarelnemr.xyz/api
   FRONTEND_URL=https://gym.omarelnemr.xyz
   NODE_ENV=development  # or production
   ```

2. **Backend Server Running:**
   ```bash
   npm run dev
   ```

---

## ✅ Test 1: Server Startup & Webhook Registration

### What to Check:
When you start the server, look for these logs:

```
✅ Expected Logs:
[TABBY_WEBHOOK] Registering webhook with Tabby...
[TABBY_WEBHOOK] Webhook registered successfully: <webhook-id>
[TABBY_WEBHOOK] Webhook URL: https://gym.omarelnemr.xyz/api/tabby/webhook

[TABBY_CRON] Initializing Tabby cron service...
[TABBY_CRON] - PENDING payment check: every 5 minutes
[TABBY_CRON] - AUTHORIZED payment capture: every 15 minutes
```

### If Webhook Already Exists:
```
[TABBY_WEBHOOK] Webhook already registered: https://gym.omarelnemr.xyz/api/tabby/webhook
```

### Commands:
```bash
# Start server
npm run dev

# In another terminal, check logs
tail -f logs/requests.log
```

---

## ✅ Test 2: Webhook Endpoint

### Test with Simulated Webhooks:
```bash
node test-tabby-webhook.js
```

### What It Tests:
- ✓ Webhook endpoint responds to POST requests
- ✓ Handles `payment.authorized` event
- ✓ Handles `payment.closed` event
- ✓ Handles `payment.rejected` event
- ✓ Updates payment status in database
- ✓ Auto-captures authorized payments

### Expected Output:
```
✅ Testing: AUTHORIZED
✅ Status: 200
✅ Response: { received: true }

✅ Testing: CLOSED
✅ Status: 200
✅ Response: { received: true }

✅ Testing: REJECTED
✅ Status: 200
✅ Response: { received: true }
```

---

## ✅ Test 3: Cron Job - PENDING Payment Check

### Step 1: Check Current Status
```bash
node test-tabby-cron.js status
```

### Step 2: Create Test Payment
```bash
node test-tabby-cron.js create
```

This creates a PENDING payment that's 3 minutes old (cron checks payments 2-30 mins old).

### Step 3: Wait for Cron (5 minutes)
Watch server logs for:
```
[TABBY_CRON] Running scheduled PENDING payment check...
[TABBY_CRON] Found 1 PENDING payments to check
[TABBY_CRON] Checking status for payment test-xxx...
[TABBY_CRON] Payment test-xxx status: AUTHORIZED (or REJECTED/EXPIRED)
```

### Step 4: Verify Payment Updated
```bash
node test-tabby-cron.js check-pending
```

### Cleanup Test Data:
```bash
node test-tabby-cron.js cleanup
```

---

## ✅ Test 4: Cron Job - AUTHORIZED Payment Capture

### Check AUTHORIZED Payments:
```bash
node test-tabby-cron.js check-authorized
```

### Wait for Cron (15 minutes)
The cron will automatically capture any AUTHORIZED payments.

Watch logs for:
```
[TABBY_CRON] Running scheduled AUTHORIZED payment processing...
[TABBY_CRON] Found X AUTHORIZED payments to process
[TABBY_CRON] Capturing payment xxx...
[TABBY_CRON] Successfully captured payment xxx
```

---

## ✅ Test 5: End-to-End Payment Flow

### Scenario: User Completes Payment

1. **User initiates checkout** → Creates payment with status `PENDING`
2. **User completes payment on Tabby** → One of three things happens:
   
   **Option A: Normal redirect (best case)**
   - User redirected to `/payment/success`
   - Frontend calls backend to verify
   - Backend updates payment to `SUCCESS`
   
   **Option B: Webhook arrives first (good)**
   - Tabby sends webhook `payment.authorized`
   - Backend updates payment to `SUCCESS`
   - Backend auto-captures payment
   - User redirected to `/payment/success` (sees already updated status)
   
   **Option C: Network issue / browser closed (cron catches it)**
   - No redirect, no webhook received
   - Payment stays `PENDING` for 2+ minutes
   - Cron job checks payment status with Tabby API
   - Finds it's `AUTHORIZED` → updates and captures
   - User can check order status later and see it succeeded

---

## 🧪 Test with Real Tabby Test Credentials

### Use Tabby's Test Phone Numbers:

**UAE (Accepted):**
```
Phone: +971500000001
Status: Will be AUTHORIZED
```

**Saudi Arabia (Accepted):**
```
Phone: +966500000001
Status: Will be AUTHORIZED
```

**Rejected:**
```
Phone: +971500000002
Status: Will be REJECTED
```

### Steps:
1. Go to checkout on your site
2. Select Tabby payment
3. Use test phone number
4. Complete payment flow
5. Check logs and database

---

## 🔍 Monitoring & Debugging

### Check Server Logs:
```bash
# Watch all logs
tail -f logs/requests.log

# Filter for Tabby
grep -i tabby logs/requests.log

# Filter for cron
grep -i TABBY_CRON logs/requests.log

# Filter for webhooks
grep -i TABBY_WEBHOOK logs/requests.log
```

### Check Database Payments:
```bash
# Using Prisma Studio
npx prisma studio

# Or direct query
node -e "
import { getPrismaClient } from './src/config/db.js';
const prisma = getPrismaClient();
prisma.payment.findMany({
  where: { method: 'TABBY' },
  orderBy: { createdAt: 'desc' },
  take: 10
}).then(console.log);
"
```

---

## ✅ Success Checklist

- [ ] Webhook auto-registers on server start
- [ ] Webhook endpoint responds with 200
- [ ] Webhook handles `payment.authorized` event
- [ ] PENDING payments checked every 5 minutes
- [ ] AUTHORIZED payments captured every 15 minutes
- [ ] Payment status updates correctly in database
- [ ] User redirects work correctly
- [ ] Logs show cron jobs running

---

## 🐛 Troubleshooting

### Webhook Not Registering?
- Check `BASE_URL` in .env is correct and publicly accessible
- Check Tabby credentials (TABBY_SECRET_KEY, TABBY_PUBLIC_KEY)
- Check network/firewall allows outbound HTTPS to api.tabby.ai

### Cron Not Running?
- Check server logs for initialization messages
- Server must stay running (cron jobs don't run if server stops)
- Wait full interval (5 or 15 minutes) before expecting first run

### Payments Stuck in PENDING?
- Check if webhook URL is publicly accessible
- Check if cron jobs are running (look for logs every 5 mins)
- Manually check payment status: `node test-tabby-cron.js check-pending`

### Webhook Returns 401 Unauthorized?
- Webhook signature verification is lenient in development
- Check `NODE_ENV` in .env
- Check logs for signature validation errors

---

## 📞 Next Steps

1. Start server: `npm run dev`
2. Run webhook test: `node test-tabby-webhook.js`
3. Create test payment: `node test-tabby-cron.js create`
4. Wait 5 minutes and check logs
5. Test real payment with Tabby test credentials

---

**Questions?** Check the logs first, they're very verbose and will tell you exactly what's happening!

