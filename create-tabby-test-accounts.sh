#!/bin/bash

# Create Test Accounts for Tabby Team Testing
# This script creates test user accounts for Tabby payment testing

set -e

echo "👥 Creating test accounts for Tabby team testing..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || ! grep -q "gymmawy-backend" package.json; then
    print_error "Please run this script from the gymmawy-backend directory"
    exit 1
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create it first."
    exit 1
fi

# Get admin token (you'll need to provide this)
print_status "You need an admin token to create test accounts."
print_status "Please login as admin and get your access token."
echo ""
read -p "Enter your admin access token: " ADMIN_TOKEN

if [ -z "$ADMIN_TOKEN" ]; then
    print_error "Admin token is required"
    exit 1
fi

# Base URL for API
BASE_URL="http://localhost:3000/api"

# Test accounts data
declare -a TEST_ACCOUNTS=(
    # UAE Test Accounts
    '{"email":"uae.test1@tabby.com","password":"Test123!","firstName":"UAE","lastName":"Test1","mobileNumber":"+971501234567","role":"MEMBER"}'
    '{"email":"uae.test2@tabby.com","password":"Test123!","firstName":"UAE","lastName":"Test2","mobileNumber":"+971501234568","role":"MEMBER"}'
    '{"email":"uae.test3@tabby.com","password":"Test123!","firstName":"UAE","lastName":"Test3","mobileNumber":"+971501234569","role":"MEMBER"}'
    
    # Saudi Arabia Test Accounts
    '{"email":"sa.test1@tabby.com","password":"Test123!","firstName":"Saudi","lastName":"Test1","mobileNumber":"+966501234567","role":"MEMBER"}'
    '{"email":"sa.test2@tabby.com","password":"Test123!","firstName":"Saudi","lastName":"Test2","mobileNumber":"+966501234568","role":"MEMBER"}'
    '{"email":"sa.test3@tabby.com","password":"Test123!","firstName":"Saudi","lastName":"Test3","mobileNumber":"+966501234569","role":"MEMBER"}'
    
    # Tabby Team Accounts
    '{"email":"tabby.team1@tabby.com","password":"TabbyTest123!","firstName":"Tabby","lastName":"Team1","mobileNumber":"+971501234570","role":"MEMBER"}'
    '{"email":"tabby.team2@tabby.com","password":"TabbyTest123!","firstName":"Tabby","lastName":"Team2","mobileNumber":"+971501234571","role":"MEMBER"}'
    '{"email":"tabby.dev@tabby.com","password":"TabbyDev123!","firstName":"Tabby","lastName":"Developer","mobileNumber":"+971501234572","role":"MEMBER"}'
    
    # Test Scenarios
    '{"email":"test.success@tabby.com","password":"Test123!","firstName":"Success","lastName":"Test","mobileNumber":"+971501234573","role":"MEMBER"}'
    '{"email":"test.failure@tabby.com","password":"Test123!","firstName":"Failure","lastName":"Test","mobileNumber":"+971501234574","role":"MEMBER"}'
    '{"email":"test.reject@tabby.com","password":"Test123!","firstName":"Reject","lastName":"Test","mobileNumber":"+971501234575","role":"MEMBER"}'
)

# Function to create a test account
create_test_account() {
    local account_data="$1"
    local email=$(echo "$account_data" | jq -r '.email')
    
    print_status "Creating account for: $email"
    
    # Create the account
    response=$(curl -s -X POST "$BASE_URL/users" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $ADMIN_TOKEN" \
        -d "$account_data")
    
    # Check if successful
    if echo "$response" | jq -e '.user' > /dev/null 2>&1; then
        local user_id=$(echo "$response" | jq -r '.user.id')
        print_success "Account created successfully: $email (ID: $user_id)"
        return 0
    else
        local error=$(echo "$response" | jq -r '.error.message // .message // "Unknown error"')
        print_warning "Failed to create account for $email: $error"
        return 1
    fi
}

# Create all test accounts
print_status "Creating ${#TEST_ACCOUNTS[@]} test accounts..."

success_count=0
failed_count=0

for account in "${TEST_ACCOUNTS[@]}"; do
    if create_test_account "$account"; then
        ((success_count++))
    else
        ((failed_count++))
    fi
    echo ""
done

# Summary
echo "=========================================="
print_status "Account creation summary:"
print_success "Successfully created: $success_count accounts"
if [ $failed_count -gt 0 ]; then
    print_warning "Failed to create: $failed_count accounts"
fi
echo "=========================================="

# Display test account credentials
echo ""
print_status "Test Account Credentials for Tabby Team:"
echo ""
echo "🇦🇪 UAE Test Accounts:"
echo "  Email: uae.test1@tabby.com | Password: Test123! | Phone: +971501234567"
echo "  Email: uae.test2@tabby.com | Password: Test123! | Phone: +971501234568"
echo "  Email: uae.test3@tabby.com | Password: Test123! | Phone: +971501234569"
echo ""
echo "🇸🇦 Saudi Arabia Test Accounts:"
echo "  Email: sa.test1@tabby.com | Password: Test123! | Phone: +966501234567"
echo "  Email: sa.test2@tabby.com | Password: Test123! | Phone: +966501234568"
echo "  Email: sa.test3@tabby.com | Password: Test123! | Phone: +966501234569"
echo ""
echo "👥 Tabby Team Accounts:"
echo "  Email: tabby.team1@tabby.com | Password: TabbyTest123! | Phone: +971501234570"
echo "  Email: tabby.team2@tabby.com | Password: TabbyTest123! | Phone: +971501234571"
echo "  Email: tabby.dev@tabby.com | Password: TabbyDev123! | Phone: +971501234572"
echo ""
echo "🧪 Test Scenario Accounts:"
echo "  Email: test.success@tabby.com | Password: Test123! | Phone: +971501234573"
echo "  Email: test.failure@tabby.com | Password: Test123! | Phone: +971501234574"
echo "  Email: test.reject@tabby.com | Password: Test123! | Phone: +971501234575"
echo ""

# Test login for one account
print_status "Testing login for one account..."
login_response=$(curl -s -X POST "$BASE_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"uae.test1@tabby.com","password":"Test123!"}')

if echo "$login_response" | jq -e '.accessToken' > /dev/null 2>&1; then
    print_success "Login test successful for uae.test1@tabby.com"
else
    print_warning "Login test failed for uae.test1@tabby.com"
fi

echo ""
print_success "Test account creation completed!"
print_status "These accounts are ready for Tabby payment testing."
