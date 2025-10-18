#!/usr/bin/env node

/**
 * Script to setup Tabby webhooks for both UAE and KSA
 * Usage: node setup-tabby-webhooks.js [webhook-url]
 */

import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const WEBHOOK_URL = process.argv[2] || `${BASE_URL}/api/tabby/webhook`;

console.log('🔧 Setting up Tabby webhooks for both UAE and KSA...');
console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
console.log('');

async function setupWebhooks() {
  try {
    const response = await axios.post(`${BASE_URL}/api/tabby/webhook/setup`, {
      url: WEBHOOK_URL,
      is_test: process.env.NODE_ENV !== 'production',
      events: ['payment.*']
    });

    console.log('✅ Webhook setup completed!');
    console.log('');
    
    if (response.data.success) {
      response.data.results.forEach(result => {
        console.log(`🌍 ${result.country} (${result.currency})`);
        console.log(`   Merchant Code: ${result.merchant_code}`);
        
        if (result.error) {
          console.log(`   ❌ Error: ${result.error}`);
        } else if (result.webhook) {
          console.log(`   ✅ Webhook ID: ${result.webhook.id}`);
          console.log(`   📡 URL: ${result.webhook.url}`);
          console.log(`   🎯 Events: ${result.webhook.events?.join(', ') || 'payment.*'}`);
        }
        console.log('');
      });
    }

    // List existing webhooks
    console.log('📋 Checking existing webhooks...');
    const listResponse = await axios.get(`${BASE_URL}/api/tabby/webhooks`);
    
    if (listResponse.data.success) {
      listResponse.data.results.forEach(result => {
        console.log(`🌍 ${result.country} (${result.currency})`);
        console.log(`   Merchant Code: ${result.merchant_code}`);
        
        if (result.error) {
          console.log(`   ❌ Error: ${result.error}`);
        } else if (result.webhooks && result.webhooks.length > 0) {
          result.webhooks.forEach(webhook => {
            console.log(`   📡 Webhook ID: ${webhook.id}`);
            console.log(`   📡 URL: ${webhook.url}`);
            console.log(`   🎯 Events: ${webhook.events?.join(', ') || 'payment.*'}`);
            console.log(`   📅 Created: ${new Date(webhook.created_at).toLocaleString()}`);
          });
        } else {
          console.log(`   ℹ️  No webhooks found`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Failed to setup webhooks:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the setup
setupWebhooks();
