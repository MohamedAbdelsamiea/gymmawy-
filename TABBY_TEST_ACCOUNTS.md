# Tabby Test Accounts

## 👥 **Test Accounts for Tabby Team**

### **How to Create Test Accounts**

#### **Option 1: Automated Script**
```bash
cd gymmawy-backend
./create-tabby-test-accounts.sh
```

#### **Option 2: Manual Creation via API**
```bash
# Get admin token first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@gymmawy.com","password":"your-admin-password"}'

# Create test account
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "uae.test1@tabby.com",
    "password": "Test123!",
    "firstName": "UAE",
    "lastName": "Test1",
    "mobileNumber": "+971501234567",
    "role": "MEMBER"
  }'
```

## 🧪 **Test Account Credentials**

### **🇦🇪 UAE Test Accounts**
| Email | Password | Phone | Purpose |
|-------|----------|-------|---------|
| uae.test1@tabby.com | Test123! | +971501234567 | General UAE testing |
| uae.test2@tabby.com | Test123! | +971501234568 | AED currency testing |
| uae.test3@tabby.com | Test123! | +971501234569 | UAE address testing |

### **🇸🇦 Saudi Arabia Test Accounts**
| Email | Password | Phone | Purpose |
|-------|----------|-------|---------|
| sa.test1@tabby.com | Test123! | +966501234567 | General Saudi testing |
| sa.test2@tabby.com | Test123! | +966501234568 | SAR currency testing |
| sa.test3@tabby.com | Test123! | +966501234569 | Saudi address testing |

### **👥 Tabby Team Accounts**
| Email | Password | Phone | Purpose |
|-------|----------|-------|---------|
| tabby.team1@tabby.com | TabbyTest123! | +971501234570 | Tabby team testing |
| tabby.team2@tabby.com | TabbyTest123! | +971501234571 | Tabby team testing |
| tabby.dev@tabby.com | TabbyDev123! | +971501234572 | Development testing |

### **🧪 Test Scenario Accounts**
| Email | Password | Phone | Purpose |
|-------|----------|-------|---------|
| test.success@tabby.com | Test123! | +971501234573 | Success scenario testing |
| test.failure@tabby.com | Test123! | +971501234574 | Failure scenario testing |
| test.reject@tabby.com | Test123! | +971501234575 | Rejection scenario testing |

## 🔧 **Account Features**

### **Pre-configured Settings**
- ✅ **Email verified**: All accounts are pre-verified
- ✅ **Role**: MEMBER (standard user role)
- ✅ **Mobile numbers**: Country-specific (+971 for UAE, +966 for Saudi)
- ✅ **Passwords**: Strong passwords meeting requirements

### **Testing Capabilities**
- ✅ **Tabby payment testing**: All accounts can test Tabby payments
- ✅ **Currency detection**: UAE accounts get AED, Saudi accounts get SAR
- ✅ **Address testing**: Country-specific addresses
- ✅ **Phone validation**: Valid country codes

## 🚀 **Testing Workflow**

### **1. Login with Test Account**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"uae.test1@tabby.com","password":"Test123!"}'
```

### **2. Test Tabby Checkout**
```bash
curl -X POST http://localhost:3000/api/tabby/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "amount": 100,
    "currency": "AED",
    "description": "Test UAE payment",
    "paymentableId": "product-id",
    "paymentableType": "PRODUCT",
    "lang": "en",
    "buyer": {
      "phone": "+971501234567",
      "email": "uae.test1@tabby.com",
      "name": "UAE Test1"
    },
    "shipping_address": {
      "line1": "Dubai Mall",
      "city": "Dubai",
      "zip": "00000",
      "country": "AE"
    },
    "items": [{
      "title": "Test Product",
      "quantity": 1,
      "unit_price": "100.00"
    }]
  }'
```

### **3. Test Currency Detection**
```bash
curl -H "X-Forwarded-For: 41.238.0.0" \
  -H "Authorization: Bearer USER_TOKEN" \
  http://localhost:3000/api/currency/detect
```

## 📋 **Test Scenarios**

### **Success Scenario**
- Use: `test.success@tabby.com`
- Expected: Payment processes successfully
- Currency: AED (UAE) or SAR (Saudi)

### **Failure Scenario**
- Use: `test.failure@tabby.com`
- Expected: Payment fails with specific error
- Testing: Error handling and user feedback

### **Rejection Scenario**
- Use: `test.reject@tabby.com`
- Expected: Payment rejected by Tabby
- Testing: Rejection handling and alternatives

## 🔍 **Verification Commands**

### **Check Account Exists**
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  | jq '.users[] | select(.email == "uae.test1@tabby.com")'
```

### **Test Login**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"uae.test1@tabby.com","password":"Test123!"}' \
  | jq '.accessToken'
```

### **Test Tabby Availability**
```bash
curl "http://localhost:3000/api/tabby/availability?currency=AED"
```

## 🛡️ **Security Notes**

- **Test passwords**: Use strong passwords for security
- **Email domains**: Use @tabby.com for easy identification
- **Phone numbers**: Use valid country codes
- **Account isolation**: Test accounts are separate from production
- **Cleanup**: Remove test accounts after testing if needed

## 📝 **Account Management**

### **List All Test Accounts**
```bash
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  | jq '.users[] | select(.email | contains("tabby.com"))'
```

### **Delete Test Account**
```bash
curl -X DELETE http://localhost:3000/api/users/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## ✅ **Ready for Testing**

These test accounts are ready for Tabby team testing with:
- ✅ UAE and Saudi Arabia coverage
- ✅ Proper currency detection
- ✅ Valid phone numbers
- ✅ Pre-verified accounts
- ✅ Strong passwords
- ✅ Test scenario coverage

The Tabby team can now test payment flows, currency detection, and various scenarios using these accounts! 🚀
