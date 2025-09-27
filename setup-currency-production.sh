#!/bin/bash

# Currency Middleware Production Setup Script
# This script ensures the currency middleware works perfectly in production

echo "💰 Setting up currency middleware for production..."

# Check if MaxMind credentials are set
echo "🔍 Checking MaxMind configuration..."

if [ -z "$MAXMIND_ACCOUNT_ID" ] || [ -z "$MAXMIND_LICENSE_KEY" ]; then
    echo "⚠️  MaxMind credentials not found in environment"
    echo "📝 Add these to your .env.production file:"
    echo "MAXMIND_ACCOUNT_ID=your_account_id"
    echo "MAXMIND_LICENSE_KEY=your_license_key"
    echo ""
    echo "💡 You can get free MaxMind credentials at: https://www.maxmind.com/en/geolite2/signup"
    echo "💡 Or set DEV_CURRENCY for development/testing"
else
    echo "✅ MaxMind credentials found"
fi

# Test MaxMind connection
echo "🌐 Testing MaxMind connection..."
cd gymmawy-backend
node maxmind-diagnostic.js

# Check currency middleware configuration
echo "🔧 Checking currency middleware configuration..."

# Verify the middleware is properly configured
if grep -q "currencyDetectionMiddleware" src/express.js; then
    echo "✅ Currency middleware is configured in express.js"
else
    echo "⚠️  Currency middleware not found in express.js"
    echo "💡 Make sure to import and use currencyDetectionMiddleware"
fi

# Check route configurations
echo "📋 Checking route configurations..."

routes=(
    "src/modules/products/product.routes.js"
    "src/modules/programmes/programme.routes.js"
    "src/modules/subscriptions/subscription.routes.js"
    "src/modules/orders/order.routes.js"
    "src/modules/currency/currency.routes.js"
)

for route in "${routes[@]}"; do
    if [ -f "$route" ] && grep -q "currencyDetectionMiddleware" "$route"; then
        echo "✅ Currency middleware configured in $(basename $route)"
    else
        echo "⚠️  Currency middleware missing in $(basename $route)"
    fi
done

# Test currency detection
echo "🧪 Testing currency detection..."

# Test with different IPs
test_ips=(
    "41.238.0.0"    # Egypt
    "8.8.8.8"       # US
    "185.199.108.153" # Saudi Arabia
)

for ip in "${test_ips[@]}"; do
    echo "Testing IP: $ip"
    response=$(curl -s -H "X-Forwarded-For: $ip" http://localhost:3000/api/currency/detect)
    if [ $? -eq 0 ]; then
        echo "✅ Response: $response"
    else
        echo "❌ Failed to test IP: $ip"
    fi
done

# Production recommendations
echo ""
echo "🚀 Production Recommendations:"
echo "1. Set up MaxMind GeoLite2 account for accurate IP geolocation"
echo "2. Configure DEV_CURRENCY for development/testing"
echo "3. Set DEFAULT_CURRENCY for fallback scenarios"
echo "4. Monitor currency detection logs in production"
echo "5. Consider implementing user preference storage"
echo "6. Test with real production IPs"
echo "7. Set up monitoring for currency detection failures"
echo ""
echo "📝 Environment Variables for Production:"
echo "MAXMIND_ACCOUNT_ID=your_account_id"
echo "MAXMIND_LICENSE_KEY=your_license_key"
echo "DEFAULT_CURRENCY=USD"
echo "DEV_CURRENCY=USD  # For development override"
echo ""
echo "🔧 For development without MaxMind:"
echo "DEV_CURRENCY=EGP  # or SAR, AED, USD"
echo ""
echo "✨ Currency middleware setup complete!"
