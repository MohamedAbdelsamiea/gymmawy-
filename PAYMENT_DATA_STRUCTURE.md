# 💳 Payment Data Structure Guide

## 📊 Overview
This document explains the payment data structure, field purposes, and best practices for tracking payments across different gateways (Paymob, Tabby).

## 🗂️ Payment Model Fields

### **Core Payment Fields**

| Field | Type | Purpose | Example | Required |
|-------|------|---------|---------|----------|
| `id` | UUID | Internal database ID | `550e8400-e29b-41d4-a716-446655440000` | ✅ |
| `paymentReference` | String | **User-friendly reference for support** | `PAY-1736000000000-ABC123DEF` | ✅ |
| `transactionId` | String | **Gateway transaction ID for reconciliation** | `12345678` (Paymob), `pay_xxxxx` (Tabby) | ✅ |
| `gatewayId` | String | Gateway's internal reference | `int_12345` (Paymob intention), `session_xyz` (Tabby) | ✅ |
| `amount` | Decimal | Payment amount | `54.00` | ✅ |
| `currency` | Enum | Payment currency | `SAR`, `AED`, `EGP`, `USD` | ✅ |
| `method` | Enum | Payment method | `PAYMOB`, `TABBY`, `CARD`, `INSTA_PAY` | ✅ |
| `status` | Enum | Payment status | `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED` | ✅ |

### **Customer & Context Fields**

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `userId` | UUID | Customer who made payment | `user_12345` |
| `customerInfo` | JSON | **Structured customer data** | `{firstName: "John", lastName: "Doe", email: "john@example.com", phone: "+966501234567"}` |
| `paymentableId` | UUID | What was purchased | `subscription_123`, `programme_456` |
| `paymentableType` | Enum | Type of purchase | `SUBSCRIPTION`, `PROGRAMME`, `PRODUCT` |

### **Technical & Tracking Fields**

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `metadata` | JSON | **Technical/payment-specific data** | `{intentionId: "12345", webhookData: {...}, billingData: {...}}` |
| `gatewayId` | String | Gateway's internal ID for tracking | `int_12345` (Paymob), `session_xyz` (Tabby) |
| `paymentProofUrl` | String | Proof of payment (manual methods) | `https://storage.example.com/proof.jpg` |
| `processedAt` | DateTime | When payment was processed | `2024-01-04T15:30:00Z` |
| `createdAt` | DateTime | Payment record creation | `2024-01-04T15:00:00Z` |
| `updatedAt` | DateTime | Last update | `2024-01-04T15:30:00Z` |

## 🎯 Field Purposes & Usage

### **1. `paymentReference` - User-Friendly Reference**
```javascript
// Format: PAY-{timestamp}-{random}
// Example: PAY-1736000000000-ABC123DEF

// Purpose: User-facing reference for support
// Usage: 
// - Display on payment result pages
// - Customer support tickets
// - User order history
// - Support team reference
```

**✅ Benefits:**
- Easy to read and communicate
- Timestamp embedded for quick identification
- Unique across all payments
- Professional appearance

### **2. `transactionId` - Gateway Transaction ID**
```javascript
// Paymob: "12345678" (from webhook)
// Tabby: "pay_xxxxx" (from Tabby API)

// Purpose: Gateway's actual transaction ID
// Usage:
// - Webhook processing
// - Gateway API calls
// - Financial reconciliation
// - Dispute resolution
```

**✅ Benefits:**
- Direct link to gateway records
- Essential for financial reconciliation
- Required for refunds/disputes
- Audit trail compliance

### **3. `gatewayId` - Gateway Internal Reference**
```javascript
// Paymob: Intention ID before payment completion
// Tabby: Session ID during checkout

// Purpose: Gateway's internal tracking
// Usage:
// - Webhook correlation
// - Payment status updates
// - Session management
// - Debugging gateway issues
```

**✅ Benefits:**
- Links pre-payment and post-payment states
- Essential for webhook processing
- Helps track payment lifecycle
- Debugging gateway integration

### **4. `customerInfo` vs `metadata` - Clear Separation**

#### **`customerInfo` (Structured Customer Data):**
```javascript
{
  firstName: "John",
  lastName: "Doe", 
  email: "john@example.com",
  phone: "+966501234567"
}

// Purpose: Customer identification and contact
// Usage:
// - Customer service
// - Support tickets
// - Notification sending
// - Customer communication
```

#### **`metadata` (Technical/Payment Data):**
```javascript
{
  // Gateway-specific data
  intentionId: "12345",
  clientSecret: "secret_xyz",
  checkoutUrl: "https://...",
  
  // Payment method details
  paymentMethod: "card",
  billingData: {...},
  
  // Order context
  orderId: "order_123",
  subscriptionPlanId: "plan_456",
  
  // Technical tracking
  webhookData: {...},
  transactionDetails: {...}
}

// Purpose: Technical data for processing and debugging
// Usage:
// - Webhook processing
// - Payment reconciliation
// - Debugging issues
// - Technical analysis
```

## 🔄 Payment Lifecycle Tracking

### **1. Payment Creation (Paymob)**
```javascript
// Initial creation
{
  paymentReference: "PAY-1736000000000-ABC123DEF", // User-friendly
  gatewayId: "int_12345", // Paymob intention ID
  transactionId: null, // Will be set by webhook
  status: "PENDING",
  customerInfo: { firstName: "John", ... },
  metadata: { intentionId: "12345", ... }
}
```

### **2. Webhook Processing (Paymob)**
```javascript
// After webhook received
{
  paymentReference: "PAY-1736000000000-ABC123DEF", // Unchanged
  gatewayId: "int_12345", // Unchanged
  transactionId: "12345678", // Set from webhook
  status: "SUCCESS", // Updated from webhook
  metadata: {
    ...previous,
    webhookData: {...}, // Added webhook details
    transactionDetails: {...} // Added transaction info
  }
}
```

### **3. Payment Creation (Tabby)**
```javascript
// Tabby checkout creation
{
  paymentReference: "PAY-1736000000000-XYZ789GHI", // User-friendly
  gatewayId: "session_abc123", // Tabby session ID
  transactionId: "pay_xxxxx", // Tabby payment ID
  status: "PENDING",
  customerInfo: { firstName: "Jane", ... },
  metadata: { 
    tabby_session_id: "session_abc123",
    checkoutUrl: "https://...",
    ...
  }
}
```

## 🎨 Frontend Display

### **Payment Result Pages**
```javascript
// Display user-friendly reference prominently
<div className="payment-reference">
  <h3>Order Reference</h3>
  <span className="reference-number">
    PAY-1736000000000-ABC123DEF
  </span>
  <p>Use this reference when contacting support</p>
</div>
```

### **Admin Dashboard**
```javascript
// Show all tracking IDs for admin
<div className="admin-payment-details">
  <div>User Reference: PAY-1736000000000-ABC123DEF</div>
  <div>Gateway Transaction: 12345678</div>
  <div>Gateway ID: int_12345</div>
  <div>Status: SUCCESS</div>
</div>
```

## 🔍 Support & Debugging

### **Customer Support Workflow**
1. **Customer provides:** `PAY-1736000000000-ABC123DEF`
2. **Support finds payment** using `paymentReference`
3. **Support accesses** `transactionId` for gateway queries
4. **Support uses** `gatewayId` for webhook correlation
5. **Support reviews** `metadata` for technical details

### **Financial Reconciliation**
1. **Daily reconciliation** using `transactionId`
2. **Gateway API calls** with `gatewayId`
3. **Status verification** across all tracking fields
4. **Audit trail** using `metadata` and timestamps

## ✅ Best Practices

### **1. Always Use User-Friendly References**
- ✅ `PAY-1736000000000-ABC123DEF` (User-facing)
- ❌ `gymmawy_1234567890_abc12345` (Internal format)
- ❌ `payment_1736000000000_abc123` (Generic format)

### **2. Store All Gateway Tracking IDs**
- ✅ `transactionId` for actual gateway transaction
- ✅ `gatewayId` for gateway internal reference
- ✅ `metadata` for technical correlation data

### **3. Separate Customer vs Technical Data**
- ✅ `customerInfo` for customer identification
- ✅ `metadata` for technical/payment processing data

### **4. Consistent Field Usage**
- ✅ All payment methods use same reference format
- ✅ All gateways store tracking IDs consistently
- ✅ All payments have complete customer info

## 🚀 Implementation Status

### **✅ Completed**
- User-friendly payment reference format (`PAY-xxxx-xxxx`)
- Paymob integration with proper field mapping
- Tabby integration with proper field mapping
- Payment service standardization
- Frontend display of user-friendly references

### **✅ Field Mapping**
- `paymentReference` → User-facing reference
- `transactionId` → Gateway transaction ID
- `gatewayId` → Gateway internal reference
- `customerInfo` → Structured customer data
- `metadata` → Technical/payment data

### **✅ Benefits Achieved**
- Professional user experience
- Complete payment tracking
- Easy support resolution
- Financial reconciliation ready
- Audit trail compliance

## 📞 Support Integration

When customers contact support with `PAY-1736000000000-ABC123DEF`:

1. **Quick Lookup** - Find payment instantly
2. **Gateway Access** - Use `transactionId` for gateway queries
3. **Full Context** - Access `customerInfo` and `metadata`
4. **Resolution** - Complete payment history available

This structure provides complete payment tracking while maintaining an excellent user experience! 🎉
