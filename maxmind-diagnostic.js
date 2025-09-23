#!/usr/bin/env node

/**
 * MaxMind Diagnostic Script
 * Run this on your production server to diagnose MaxMind issues
 */

import { WebServiceClient } from '@maxmind/geoip2-node';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🔍 MaxMind Diagnostic Tool\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('MAXMIND_ACCOUNT_ID:', process.env.MAXMIND_ACCOUNT_ID ? '✅ Set' : '❌ Not set');
console.log('MAXMIND_LICENSE_KEY:', process.env.MAXMIND_LICENSE_KEY ? '✅ Set' : '❌ Not set');
console.log('NODE_ENV:', process.env.NODE_ENV || 'Not set');
console.log('DEV_CURRENCY:', process.env.DEV_CURRENCY || 'Not set');

// Check if credentials are valid format
const accountId = process.env.MAXMIND_ACCOUNT_ID;
const licenseKey = process.env.MAXMIND_LICENSE_KEY;

if (!accountId || !licenseKey) {
  console.log('\n❌ MaxMind credentials are missing!');
  console.log('Please set MAXMIND_ACCOUNT_ID and MAXMIND_LICENSE_KEY in your .env file');
  process.exit(1);
}

// Check credential format
if (accountId.length < 6 || licenseKey.length < 20) {
  console.log('\n⚠️  MaxMind credentials appear to be invalid format');
  console.log('Account ID should be at least 6 characters');
  console.log('License Key should be at least 20 characters');
}

console.log('\n🌐 Testing MaxMind Connection...');

// Initialize MaxMind client
const client = new WebServiceClient(
  accountId,
  licenseKey,
  { host: 'geolite.info' }
);

// Test with different IPs
const testIPs = [
  { ip: '8.8.8.8', description: 'Google DNS (US)' },
  { ip: '41.238.0.0', description: 'Egypt IP' },
  { ip: '127.0.0.1', description: 'Localhost' }
];

async function testMaxMindConnection() {
  for (const test of testIPs) {
    try {
      console.log(`\n🔍 Testing IP: ${test.ip} (${test.description})`);
      
      if (test.ip === '127.0.0.1') {
        console.log('⏭️  Skipping localhost (expected to fail)');
        continue;
      }
      
      const response = await client.country(test.ip);
      const countryCode = response.country?.isoCode;
      const countryName = response.country?.names?.en;
      
      console.log(`✅ Success! Country: ${countryName} (${countryCode})`);
      
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      
      // Provide specific error guidance
      if (error.message.includes('Invalid license key')) {
        console.log('💡 This usually means your license key is invalid or expired');
      } else if (error.message.includes('Account ID')) {
        console.log('💡 This usually means your account ID is invalid');
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        console.log('💡 This might be a network connectivity issue');
      } else if (error.message.includes('undefined')) {
        console.log('💡 This suggests the MaxMind service is not responding properly');
      }
    }
  }
}

// Test currency detection logic
console.log('\n💰 Testing Currency Detection Logic...');

function detectCurrencyFromIP(ip) {
  if (!ip || ip === '127.0.0.1' || ip === '::1') {
    return process.env.DEV_CURRENCY || 'USD';
  }
  
  // This would normally call MaxMind, but we'll simulate the logic
  return 'USD'; // Default fallback
}

testIPs.forEach(test => {
  const currency = detectCurrencyFromIP(test.ip);
  console.log(`IP: ${test.ip} → Currency: ${currency}`);
});

// Run the actual MaxMind tests
testMaxMindConnection().catch(error => {
  console.log('\n💥 Diagnostic failed:', error.message);
  process.exit(1);
});

console.log('\n📝 Recommendations:');
console.log('1. Ensure MAXMIND_ACCOUNT_ID and MAXMIND_LICENSE_KEY are correctly set');
console.log('2. Check that your MaxMind account is active and has credits');
console.log('3. Verify network connectivity to geolite.info');
console.log('4. Consider setting DEV_CURRENCY for development/testing');
console.log('5. Check if your server has firewall restrictions');

