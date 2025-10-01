/**
 * Test Tabby Webhook Endpoint
 * Run this to simulate Tabby sending webhook notifications
 */

import axios from 'axios';

const BACKEND_URL = process.env.BASE_URL || 'http://localhost:3000/api';

// Test webhook payloads
const testWebhooks = {
  authorized: {
    event: 'payment.authorized',
    payment: {
      id: 'test-payment-123',
      status: 'AUTHORIZED',
      amount: '100.00',
      currency: 'SAR',
      created_at: new Date().toISOString()
    }
  },
  closed: {
    event: 'payment.closed',
    payment: {
      id: 'test-payment-123',
      status: 'CLOSED',
      amount: '100.00',
      currency: 'SAR',
      created_at: new Date().toISOString()
    }
  },
  rejected: {
    event: 'payment.rejected',
    payment: {
      id: 'test-payment-456',
      status: 'REJECTED',
      amount: '100.00',
      currency: 'SAR',
      rejection_reason: 'Insufficient funds',
      created_at: new Date().toISOString()
    }
  }
};

async function testWebhookEndpoint() {
  console.log('🧪 Testing Tabby Webhook Endpoint\n');
  console.log(`📍 Webhook URL: ${BACKEND_URL}/tabby/webhook\n`);

  for (const [testName, payload] of Object.entries(testWebhooks)) {
    try {
      console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📤 Testing: ${testName.toUpperCase()}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log('Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post(
        `${BACKEND_URL}/tabby/webhook`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Tabby-Signature': 'test-signature' // In dev mode, signature is not strictly validated
          }
        }
      );

      console.log(`✅ Status: ${response.status}`);
      console.log(`✅ Response:`, response.data);

    } catch (error) {
      console.error(`❌ ${testName} test failed:`);
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Error:`, error.response.data);
      } else {
        console.error(`   Error:`, error.message);
      }
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Webhook endpoint tests completed!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

async function testWebhookRegistration() {
  console.log('\n🧪 Testing Webhook Registration\n');

  try {
    const response = await axios.post(
      `${BACKEND_URL}/tabby/webhook/setup`,
      {
        url: `${BACKEND_URL}/tabby/webhook`,
        is_test: true,
        events: ['payment.authorized', 'payment.closed', 'payment.rejected']
      },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Webhook registration successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.error('❌ Webhook registration failed:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Error:`, error.response.data);
    } else {
      console.error(`   Error:`, error.message);
    }
  }
}

// Run tests
async function runTests() {
  console.clear();
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         Tabby Webhook & Cron Tests                  ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  // Wait a moment for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  await testWebhookEndpoint();
  
  console.log('\n⏳ Waiting 2 seconds...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Note: Webhook registration requires authentication in production
  // await testWebhookRegistration();

  console.log('\n📋 Next Steps:');
  console.log('   1. Check your server logs for webhook processing');
  console.log('   2. Check database for payment updates');
  console.log('   3. Wait 5 minutes to see cron job run');
  console.log('   4. Check logs for: [TABBY_CRON] Running scheduled PENDING payment check...');
}

runTests().catch(console.error);

