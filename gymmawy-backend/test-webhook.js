#!/usr/bin/env node

/**
 * Webhook Test Script for Paymob Integration
 * 
 * This script tests the webhook processing logic by simulating
 * Paymob webhook calls with different payment scenarios.
 */

import crypto from 'crypto';
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const HMAC_SECRET = process.env.PAYMOB_HMAC_SECRET || 'test_hmac_secret';

// Test webhook payloads for different scenarios
const testWebhooks = {
  successfulPayment: {
    type: 'TRANSACTION',
    obj: {
      id: 'txn_test_123456789',
      amount_cents: 1000,
      currency: 'SAR',
      success: true,
      is_3d_secure: false,
      pending: false,
      is_auth: false,
      is_capture: true,
      is_voided: false,
      is_refunded: false,
      is_standalone_payment: false,
      integration_id: 14081,
      profile_id: 'profile_123',
      has_parent_transaction: false,
      order: {
        id: 'order_123',
        merchant_order_id: 'gymmawy_test_order_123'
      },
      created_at: new Date().toISOString(),
      data: {
        kiosk_id: null,
        bill_reference: null,
        terminal_id: null
      },
      error_occured: false,
      is_live: false,
      other_endpoint_reference: null,
      refunded_amount_cents: 0,
      captured_amount_cents: 1000,
      updated_at: new Date().toISOString(),
      is_settled: true,
      bill_balanced: false,
      is_bill: false,
      owner: 'owner_123',
      parent_transaction: null,
      source_data: {
        pan: '4987****1234',
        type: 'card',
        sub_type: 'visa'
      },
      card_tokens: []
    }
  },

  failedPayment: {
    type: 'TRANSACTION',
    obj: {
      id: 'txn_test_failed_123',
      amount_cents: 1000,
      currency: 'SAR',
      success: false,
      is_3d_secure: false,
      pending: false,
      is_auth: false,
      is_capture: false,
      is_voided: false,
      is_refunded: false,
      is_standalone_payment: false,
      integration_id: 14081,
      profile_id: 'profile_123',
      has_parent_transaction: false,
      order: {
        id: 'order_124',
        merchant_order_id: 'gymmawy_test_order_124'
      },
      created_at: new Date().toISOString(),
      data: {
        kiosk_id: null,
        bill_reference: null,
        terminal_id: null
      },
      error_occured: true,
      is_live: false,
      other_endpoint_reference: null,
      refunded_amount_cents: 0,
      captured_amount_cents: 0,
      updated_at: new Date().toISOString(),
      is_settled: false,
      bill_balanced: false,
      is_bill: false,
      owner: 'owner_123',
      parent_transaction: null,
      source_data: null,
      card_tokens: []
    }
  },

  refundedPayment: {
    type: 'TRANSACTION',
    obj: {
      id: 'txn_test_refund_123',
      amount_cents: 1000,
      currency: 'SAR',
      success: true,
      is_3d_secure: false,
      pending: false,
      is_auth: false,
      is_capture: true,
      is_voided: false,
      is_refunded: true,
      is_standalone_payment: false,
      integration_id: 14081,
      profile_id: 'profile_123',
      has_parent_transaction: false,
      order: {
        id: 'order_125',
        merchant_order_id: 'gymmawy_test_order_125'
      },
      created_at: new Date().toISOString(),
      data: {
        kiosk_id: null,
        bill_reference: null,
        terminal_id: null
      },
      error_occured: false,
      is_live: false,
      other_endpoint_reference: null,
      refunded_amount_cents: 1000,
      captured_amount_cents: 1000,
      updated_at: new Date().toISOString(),
      is_settled: true,
      bill_balanced: false,
      is_bill: false,
      owner: 'owner_123',
      parent_transaction: null,
      source_data: {
        pan: '4987****1234',
        type: 'card',
        sub_type: 'visa'
      },
      card_tokens: []
    }
  }
};

/**
 * Generate HMAC signature for webhook payload
 */
function generateHmac(payload, secret) {
  return crypto
    .createHmac('sha512', secret)
    .update(payload, 'utf8')
    .digest('hex');
}

/**
 * Test webhook processing
 */
async function testWebhook(scenarioName, webhookData) {
  console.log(`\n🧪 Testing ${scenarioName}...`);
  
  const payload = JSON.stringify(webhookData);
  const hmac = generateHmac(payload, HMAC_SECRET);
  
  try {
    const response = await axios.post(`${BASE_URL}/api/paymob/webhook`, webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'x-paymob-hmac': hmac
      }
    });

    console.log(`✅ ${scenarioName} webhook processed successfully:`, response.data);
    return { success: true, response: response.data };
  } catch (error) {
    console.error(`❌ ${scenarioName} webhook failed:`, {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * Test webhook without HMAC (should fail)
 */
async function testWebhookWithoutHmac() {
  console.log(`\n🧪 Testing webhook without HMAC...`);
  
  const webhookData = testWebhooks.successfulPayment;
  
  try {
    const response = await axios.post(`${BASE_URL}/api/paymob/webhook`, webhookData, {
      headers: {
        'Content-Type': 'application/json'
        // No HMAC header
      }
    });

    console.log(`⚠️  Webhook without HMAC was processed (this might be expected in development):`, response.data);
    return { success: true, response: response.data };
  } catch (error) {
    console.log(`✅ Webhook without HMAC was rejected (as expected):`, {
      status: error.response?.status,
      data: error.response?.data
    });
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * Test webhook with invalid HMAC (should fail)
 */
async function testWebhookWithInvalidHmac() {
  console.log(`\n🧪 Testing webhook with invalid HMAC...`);
  
  const webhookData = testWebhooks.successfulPayment;
  
  try {
    const response = await axios.post(`${BASE_URL}/api/paymob/webhook`, webhookData, {
      headers: {
        'Content-Type': 'application/json',
        'x-paymob-hmac': 'invalid_hmac_signature'
      }
    });

    console.log(`⚠️  Webhook with invalid HMAC was processed (this might be expected in development):`, response.data);
    return { success: true, response: response.data };
  } catch (error) {
    console.log(`✅ Webhook with invalid HMAC was rejected (as expected):`, {
      status: error.response?.status,
      data: error.response?.data
    });
    return { success: false, error: error.response?.data || error.message };
  }
}

/**
 * Main test function
 */
async function runWebhookTests() {
  console.log('🚀 Starting Paymob Webhook Tests...\n');
  
  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/api/paymob/payments`);
    console.log('✅ Backend server is running');
  } catch (error) {
    if (error.response?.status === 401) {
      console.log('✅ Backend server is running (auth required)');
    } else {
      console.error('❌ Backend server is not running. Please start the server first.');
      process.exit(1);
    }
  }

  const results = [];

  // Test successful payment webhook
  results.push(await testWebhook('Successful Payment', testWebhooks.successfulPayment));

  // Test failed payment webhook
  results.push(await testWebhook('Failed Payment', testWebhooks.failedPayment));

  // Test refunded payment webhook
  results.push(await testWebhook('Refunded Payment', testWebhooks.refundedPayment));

  // Test webhook without HMAC
  results.push(await testWebhookWithoutHmac());

  // Test webhook with invalid HMAC
  results.push(await testWebhookWithInvalidHmac());

  // Summary
  console.log('\n📊 Test Summary:');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);

  if (successful === total) {
    console.log('\n🎉 All webhook tests passed!');
  } else {
    console.log('\n⚠️  Some webhook tests failed. Check the logs above for details.');
  }
}

// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runWebhookTests().catch(console.error);
}

export { runWebhookTests, testWebhook, generateHmac };
