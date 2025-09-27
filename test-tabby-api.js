#!/usr/bin/env node

/**
 * Test Tabby API Endpoints
 * This script tests the Tabby integration by making actual API calls
 */

import axios from 'axios';

const BACKEND_URL = 'http://localhost:3000';

// You'll need to get a real JWT token from your auth system
// For now, we'll test the webhook endpoint which doesn't require auth
console.log('🧪 Testing Tabby API Endpoints...\n');

async function testWebhookEndpoint() {
  try {
    console.log('1. Testing Tabby webhook endpoint...');
    
    const webhookData = {
      event: 'payment.created',
      payment: {
        id: 'test-payment-123',
        status: 'NEW',
        amount: '100.00',
        currency: 'EGP'
      }
    };

    const response = await axios.post(`${BACKEND_URL}/api/tabby/webhook`, webhookData);
    
    if (response.status === 200) {
      console.log('✅ Webhook endpoint working');
      console.log('   Response:', response.data);
    }
    
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('✅ Webhook endpoint exists (validation error expected)');
    } else {
      console.log('❌ Webhook test failed:', error.message);
    }
  }
}

async function testHealthEndpoint() {
  try {
    console.log('\n2. Testing backend health...');
    
    const response = await axios.get(`${BACKEND_URL}/health`);
    
    if (response.status === 200) {
      console.log('✅ Backend is healthy');
      console.log('   Status:', response.data.status);
    }
    
  } catch (error) {
    console.log('❌ Health check failed:', error.message);
  }
}

async function testTabbyServiceDirectly() {
  try {
    console.log('\n3. Testing Tabby service directly...');
    
    // Import the Tabby service
    const tabbyService = await import('./gymmawy-backend/src/services/tabbyService.js');
    
    console.log('✅ Tabby service imported successfully');
    console.log('   Available methods:', Object.keys(tabbyService.default).filter(key => typeof tabbyService.default[key] === 'function'));
    
  } catch (error) {
    console.log('❌ Tabby service import failed:', error.message);
  }
}

async function runTests() {
  console.log('=' .repeat(50));
  console.log('TABBY API ENDPOINT TESTS');
  console.log('=' .repeat(50));
  
  await testHealthEndpoint();
  await testTabbyServiceDirectly();
  await testWebhookEndpoint();
  
  console.log('\n' + '=' .repeat(50));
  console.log('TEST SUMMARY');
  console.log('=' .repeat(50));
  console.log('✅ API endpoint tests completed');
  console.log('\nNext steps:');
  console.log('1. Test the checkout flow through the frontend UI');
  console.log('2. Create a test payment to see the complete flow');
  console.log('3. Check the payment result pages');
}

runTests().catch(console.error);
