#!/bin/bash
# Stripe Subscription API Test Commands
# Make this file executable: chmod +x test-api.sh

BASE_URL="http://localhost:3000/v1"
ACCESS_TOKEN="YOUR_ACCESS_TOKEN_HERE"

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Stripe Subscription API - CURL Test Commands       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

function print_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

function check_token() {
    if [ "$ACCESS_TOKEN" == "YOUR_ACCESS_TOKEN_HERE" ]; then
        echo -e "${RED}❌ ERROR: Please set your ACCESS_TOKEN in this script${NC}"
        echo ""
        echo "To get an access token:"
        echo "1. Send magic link:"
        echo "   curl -X POST $BASE_URL/auth/send-magic-link \\"
        echo "     -H 'Content-Type: application/json' \\"
        echo "     -d '{\"email\":\"your@email.com\"}'"
        echo ""
        echo "2. Check your email for the token or get it from the database"
        echo "3. Verify the token to get access token:"
        echo "   curl -X POST $BASE_URL/auth/verify-magic-link \\"
        echo "     -H 'Content-Type: application/json' \\"
        echo "     -d '{\"token\":\"TOKEN_FROM_EMAIL\"}'"
        echo ""
        exit 1
    fi
}

# ============================================
# 1. Get Subscription Status
# ============================================
function test_subscription_status() {
    print_section "1. Get Subscription Status"
    
    echo -e "${GREEN}Command:${NC}"
    echo "curl -X GET $BASE_URL/subscriptions/status \\"
    echo "  -H 'Authorization: Bearer \$ACCESS_TOKEN'"
    echo ""
    
    response=$(curl -s -X GET "$BASE_URL/subscriptions/status" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    echo -e "${GREEN}Response:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
}

# ============================================
# 2. Create Checkout Session
# ============================================
function test_create_checkout() {
    print_section "2. Create Checkout Session"
    
    echo -e "${GREEN}Command:${NC}"
    echo "curl -X POST $BASE_URL/subscriptions/create-checkout-session \\"
    echo "  -H 'Authorization: Bearer \$ACCESS_TOKEN' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"successUrl\":\"http://localhost:3000/success\",\"cancelUrl\":\"http://localhost:3000/cancel\"}'"
    echo ""
    
    response=$(curl -s -X POST "$BASE_URL/subscriptions/create-checkout-session" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"successUrl":"http://localhost:3000/success","cancelUrl":"http://localhost:3000/cancel"}')
    
    echo -e "${GREEN}Response:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    # Extract URL if available
    checkout_url=$(echo "$response" | jq -r '.url' 2>/dev/null)
    if [ "$checkout_url" != "null" ] && [ ! -z "$checkout_url" ]; then
        echo ""
        echo -e "${YELLOW}Open this URL to complete payment:${NC}"
        echo "$checkout_url"
        echo ""
        echo -e "${YELLOW}Test card:${NC} 4242 4242 4242 4242"
    fi
}

# ============================================
# 3. Create Portal Session
# ============================================
function test_create_portal() {
    print_section "3. Create Customer Portal Session"
    
    echo -e "${GREEN}Command:${NC}"
    echo "curl -X POST $BASE_URL/subscriptions/create-portal-session \\"
    echo "  -H 'Authorization: Bearer \$ACCESS_TOKEN' \\"
    echo "  -H 'Content-Type: application/json' \\"
    echo "  -d '{\"returnUrl\":\"http://localhost:3000/account\"}'"
    echo ""
    
    response=$(curl -s -X POST "$BASE_URL/subscriptions/create-portal-session" \
        -H "Authorization: Bearer $ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"returnUrl":"http://localhost:3000/account"}')
    
    echo -e "${GREEN}Response:${NC}"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    
    # Extract URL if available
    portal_url=$(echo "$response" | jq -r '.url' 2>/dev/null)
    if [ "$portal_url" != "null" ] && [ ! -z "$portal_url" ]; then
        echo ""
        echo -e "${YELLOW}Open this URL to manage subscription:${NC}"
        echo "$portal_url"
    fi
}

# ============================================
# 4. Test Protected Endpoint
# ============================================
function test_protected_endpoint() {
    print_section "4. Test Protected Endpoint (Portfolio)"
    
    echo -e "${GREEN}Command:${NC}"
    echo "curl -X POST $BASE_URL/portfolio/dashboard \\"
    echo "  -H 'Authorization: Bearer \$ACCESS_TOKEN'"
    echo ""
    
    response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" -X POST "$BASE_URL/portfolio/dashboard" \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    # Split response and status
    http_status=$(echo "$response" | grep "HTTP_STATUS" | cut -d: -f2)
    response_body=$(echo "$response" | sed '/HTTP_STATUS/d')
    
    if [ "$http_status" == "402" ]; then
        echo -e "${YELLOW}⚠️  Payment Required (402) - Subscription needed${NC}"
        echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
    elif [ "$http_status" == "200" ]; then
        echo -e "${GREEN}✅ Access granted - User has active subscription${NC}"
        echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
    else
        echo -e "${RED}HTTP Status: $http_status${NC}"
        echo "$response_body" | jq '.' 2>/dev/null || echo "$response_body"
    fi
}

# ============================================
# Admin: Mark User as Payment Exempt
# ============================================
function test_payment_exempt() {
    print_section "5. Admin: Mark User as Payment Exempt"
    
    echo -e "${YELLOW}Note: Requires admin access token and user ID${NC}"
    echo ""
    echo -e "${GREEN}Command to mark exempt:${NC}"
    echo "curl -X POST $BASE_URL/users/{userId}/payment-exempt \\"
    echo "  -H 'Authorization: Bearer \$ADMIN_ACCESS_TOKEN'"
    echo ""
    echo -e "${GREEN}Command to remove exempt:${NC}"
    echo "curl -X DELETE $BASE_URL/users/{userId}/payment-exempt \\"
    echo "  -H 'Authorization: Bearer \$ADMIN_ACCESS_TOKEN'"
}

# ============================================
# Main Menu
# ============================================
function show_menu() {
    echo ""
    echo "Select a test to run:"
    echo "  1) Get Subscription Status"
    echo "  2) Create Checkout Session"
    echo "  3) Create Portal Session"
    echo "  4) Test Protected Endpoint"
    echo "  5) Show Admin Commands"
    echo "  6) Run All Tests"
    echo "  q) Quit"
    echo ""
    read -p "Enter choice: " choice
    
    case $choice in
        1) test_subscription_status ;;
        2) test_create_checkout ;;
        3) test_create_portal ;;
        4) test_protected_endpoint ;;
        5) test_payment_exempt ;;
        6) 
            test_subscription_status
            test_protected_endpoint
            test_create_checkout
            test_create_portal
            test_payment_exempt
            ;;
        q|Q) echo "Goodbye!"; exit 0 ;;
        *) echo "Invalid choice"; ;;
    esac
    
    show_menu
}

# ============================================
# Start Script
# ============================================
check_token
show_menu
