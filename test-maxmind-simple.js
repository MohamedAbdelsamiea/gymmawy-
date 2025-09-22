#!/usr/bin/env node

/**
 * Simple MaxMind Test for Production Server
 * Run this on your production server to quickly test MaxMind
 */

import { WebServiceClient } from '@maxmind/geoip2-node';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🧪 Simple MaxMind Test\n');

// Check credentials
const accountId = process.env.MAXMIND_ACCOUNT_ID;
const licenseKey = process.env.MAXMIND_LICENSE_KEY;

console.log('📋 Credentials Check:');
console.log('Account ID:', accountId ? `${accountId.substring(0, 4)}...` : '❌ Missing');
console.log('License Key:', licenseKey ? `${licenseKey.substring(0, 8)}...` : '❌ Missing');

if (!accountId || !licenseKey) {
  console.log('\n❌ MaxMind credentials are missing!');
  console.log('Please check your .env file');
  process.exit(1);
}

// Test MaxMind connection
console.log('\n🌐 Testing MaxMind Connection...');

const client = new WebServiceClient(
  accountId,
  licenseKey,
  { host: 'geolite.info' }
);

async function testIP(ip, description) {
  try {
    console.log(`\n🔍 Testing ${description} (${ip})...`);
    const response = await client.country(ip);
    const countryCode = response.country?.isoCode;
    const countryName = response.country?.names?.en;
    
    console.log(`✅ Success: ${countryName} (${countryCode})`);
    return true;
  } catch (error) {
    console.log(`❌ Failed: ${error.message || 'Unknown error'}`);
    console.log(`   Error type: ${error.constructor.name}`);
    if (error.code) console.log(`   Error code: ${error.code}`);
    return false;
  }
}

// Run tests
async function runTests() {
  const tests = [
    { ip: '8.8.8.8', desc: 'Google DNS (US)' },
    { ip: '41.238.0.0', desc: 'Egypt IP' }
  ];
  
  let successCount = 0;
  
  for (const test of tests) {
    const success = await testIP(test.ip, test.desc);
    if (success) successCount++;
  }
  
  console.log(`\n📊 Results: ${successCount}/${tests.length} tests passed`);
  
  if (successCount === 0) {
    console.log('\n💡 Recommendations:');
    console.log('1. Check your MaxMind account status');
    console.log('2. Verify your credentials are correct');
    console.log('3. Check network connectivity');
    console.log('4. Consider using DEV_CURRENCY=EGP as fallback');
  } else {
    console.log('\n✅ MaxMind is working! The issue might be elsewhere.');
  }
}

runTests().catch(console.error);
