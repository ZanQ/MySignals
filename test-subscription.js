// Test script for Stripe subscription integration
// Run with: node test-subscription.js

const axios = require('axios');

const BASE_URL = 'http://localhost:8888/v1';
let accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2OTU0NTlmODkwMTBmMGFjNjMzN2VhNzAiLCJpYXQiOjE3Njc4MzE1MjIsImV4cCI6MTc2NzgzMzMyMiwidHlwZSI6ImFjY2VzcyJ9.pMjCODqtTlNr8KJKkBTB1bdNr9XuUee04xqn8NYt5V8'; // You'll need to get this from login

/**
 * Helper function to make authenticated requests
 */
async function apiCall(method, endpoint, data = null) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
    throw error;
  }
}

/**
 * Test 1: Get subscription status
 */
async function testGetSubscriptionStatus() {
  console.log('\n🧪 Test 1: Get Subscription Status');
  console.log('=====================================');

  try {
    const status = await apiCall('GET', '/subscriptions/status');
    console.log('✅ Subscription Status:', JSON.stringify(status, null, 2));

    if (status.isPaymentExempt) {
      console.log('ℹ️  User is payment exempt - has unlimited access');
    } else if (status.subscriptionStatus === 'trial') {
      console.log('ℹ️  User is in trial period');
      console.log(`   Trial ends: ${new Date(status.trialEndDate).toLocaleDateString()}`);
    } else if (status.hasAccess) {
      console.log('ℹ️  User has active subscription');
    } else {
      console.log('⚠️  User needs to subscribe');
    }
  } catch (error) {
    console.error('❌ Test failed');
  }
}

/**
 * Test 2: Create checkout session
 */
async function testCreateCheckoutSession() {
  console.log('\n🧪 Test 2: Create Checkout Session');
  console.log('=====================================');

  try {
    const session = await apiCall('POST', '/subscriptions/create-checkout-session', {
      successUrl: 'http://localhost:3000/success',
      cancelUrl: 'http://localhost:3000/cancel',
    });

    console.log('✅ Checkout Session Created!');
    console.log(`   Session ID: ${session.sessionId}`);
    console.log(`   Checkout URL: ${session.url}`);
    console.log('\nℹ️  Open this URL in your browser to complete payment:');
    console.log(`   ${session.url}`);
    console.log('\n   Use test card: 4242 4242 4242 4242');
    console.log('   Expiry: Any future date');
    console.log('   CVC: Any 3 digits');
  } catch (error) {
    console.error('❌ Test failed');
    if (error.response?.status === 400) {
      console.log('ℹ️  This might be because user is payment exempt');
    }
  }
}

/**
 * Test 3: Try accessing protected endpoint
 */
async function testProtectedEndpoint() {
  console.log('\n🧪 Test 3: Access Protected Endpoint (Portfolio)');
  console.log('===================================================');

  try {
    const portfolio = await apiCall('POST', '/portfolio/dashboard');
    console.log('✅ Access granted! User has active subscription');
    console.log('   Portfolio data received');
  } catch (error) {
    if (error.response?.status === 402) {
      console.log('⚠️  Access denied - Payment Required (402)');
      console.log('   This is expected if user has no active subscription');
    } else {
      console.error('❌ Test failed with unexpected error');
    }
  }
}

/**
 * Test 4: Create portal session (for managing subscription)
 */
async function testCreatePortalSession() {
  console.log('\n🧪 Test 4: Create Customer Portal Session');
  console.log('===========================================');

  try {
    const portal = await apiCall('POST', '/subscriptions/create-portal-session', {
      returnUrl: 'http://localhost:3000/account',
    });

    console.log('✅ Portal Session Created!');
    console.log(`   Portal URL: ${portal.url}`);
    console.log('\nℹ️  Open this URL to manage subscription:');
    console.log(`   ${portal.url}`);
  } catch (error) {
    console.error('❌ Test failed');
    if (error.response?.status === 400) {
      console.log('ℹ️  User might not have a subscription yet');
    }
  }
}

/**
 * Main test runner
 */
async function runTests() {
  console.log('╔════════════════════════════════════════════════════╗');
  console.log('║   Stripe Subscription Integration Test Suite      ║');
  console.log('╚════════════════════════════════════════════════════╝');

  // Check if access token is set
  if (!accessToken) {
    console.error('\n❌ ERROR: Access token not set!');
    console.log('\nTo get an access token:');
    console.log('1. Create/login a user via /v1/auth/magic-link');
    console.log('2. Set the token in this script:');
    console.log('   accessToken = "your-token-here";\n');
    console.log('Example:');
    console.log('  curl -X POST http://localhost:3000/v1/auth/send-magic-link \\');
    console.log('    -H "Content-Type: application/json" \\');
    console.log('    -d \'{"email":"test@example.com"}\'\n');
    return;
  }

  // Run all tests
  await testGetSubscriptionStatus();
  await testProtectedEndpoint();
  await testCreateCheckoutSession();
  await testCreatePortalSession();

  console.log('\n✨ All tests completed!\n');
}

// Run the tests
runTests().catch(console.error);
