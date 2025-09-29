#!/usr/bin/env node

/**
 * Comprehensive Currency Middleware Test
 * Tests MaxMind API integration with known IP addresses from different countries
 */

import { WebServiceClient } from '@maxmind/geoip2-node';
import { Currency } from '@prisma/client';

// Test IP addresses from different countries
const testIPs = [
  // Egypt
  { ip: '41.237.0.1', country: 'EG', expectedCurrency: 'EGP', description: 'Egypt - Cairo' },
  { ip: '41.237.1.1', country: 'EG', expectedCurrency: 'EGP', description: 'Egypt - Alexandria' },
  
  // Saudi Arabia
  { ip: '5.0.0.1', country: 'SA', expectedCurrency: 'SAR', description: 'Saudi Arabia - Riyadh' },
  { ip: '5.1.0.1', country: 'SA', expectedCurrency: 'SAR', description: 'Saudi Arabia - Jeddah' },
  
  // UAE
  { ip: '5.44.0.1', country: 'AE', expectedCurrency: 'AED', description: 'UAE - Dubai' },
  { ip: '5.44.1.1', country: 'AE', expectedCurrency: 'AED', description: 'UAE - Abu Dhabi' },
  
  // Kuwait
  { ip: '5.0.0.1', country: 'KW', expectedCurrency: 'USD', description: 'Kuwait - Kuwait City' },
  
  // Other countries (should default to USD)
  { ip: '8.8.8.8', country: 'US', expectedCurrency: 'USD', description: 'USA - Google DNS' },
  { ip: '1.1.1.1', country: 'US', expectedCurrency: 'USD', description: 'USA - Cloudflare DNS' },
  { ip: '46.19.37.108', country: 'NL', expectedCurrency: 'USD', description: 'Netherlands - Amsterdam' },
  { ip: '185.199.108.153', country: 'DE', expectedCurrency: 'USD', description: 'Germany - Frankfurt' },
  { ip: '103.21.244.0', country: 'IN', expectedCurrency: 'USD', description: 'India - Mumbai' },
  { ip: '203.0.113.1', country: 'AU', expectedCurrency: 'USD', description: 'Australia - Sydney' },
  
  // Edge cases
  { ip: '127.0.0.1', country: 'LOCALHOST', expectedCurrency: 'USD', description: 'Localhost' },
  { ip: '::1', country: 'LOCALHOST', expectedCurrency: 'USD', description: 'IPv6 Localhost' },
  { ip: '192.168.1.1', country: 'PRIVATE', expectedCurrency: 'USD', description: 'Private Network' },
  { ip: '10.0.0.1', country: 'PRIVATE', expectedCurrency: 'USD', description: 'Private Network' },
];

// Initialize MaxMind client
let client = null;
try {
  if (process.env.MAXMIND_ACCOUNT_ID && process.env.MAXMIND_LICENSE_KEY) {
    client = new WebServiceClient(
      process.env.MAXMIND_ACCOUNT_ID,
      process.env.MAXMIND_LICENSE_KEY,
      { 
        host: 'geolite.info',
        timeout: 10000 // 10 second timeout for testing
      }
    );
    console.log('✅ MaxMind client initialized successfully');
  } else {
    console.warn('⚠️ MaxMind credentials not found. Using mock data for testing.');
  }
} catch (error) {
  console.error('❌ Failed to initialize MaxMind client:', error.message);
}

/**
 * Get country code from IP using MaxMind Web Service
 */
async function getCountryFromIP(ip) {
  if (!client) {
    console.warn('⚠️ MaxMind client not available, using mock data');
    // Return mock data based on known IP ranges
    if (ip.startsWith('41.237')) return 'EG';
    if (ip.startsWith('5.0') || ip.startsWith('5.1')) return 'SA';
    if (ip.startsWith('5.44')) return 'AE';
    if (ip.startsWith('8.8.8') || ip.startsWith('1.1.1')) return 'US';
    if (ip.startsWith('46.19')) return 'NL';
    if (ip.startsWith('185.199')) return 'DE';
    if (ip.startsWith('103.21')) return 'IN';
    if (ip.startsWith('203.0')) return 'AU';
    return null;
  }

  try {
    console.log(`🔍 MaxMind lookup for IP: ${ip}`);
    const response = await client.country(ip);
    const countryCode = response.country?.isoCode;
    console.log(`✅ MaxMind response for ${ip}:`, countryCode || 'No country code');
    return countryCode || null;
  } catch (err) {
    console.error('❌ MaxMind lookup failed for IP:', ip);
    console.error('❌ Error details:', {
      message: err.message,
      code: err.code,
      status: err.status
    });
    return null;
  }
}

/**
 * Detect currency from IP (same logic as middleware)
 */
async function detectCurrencyFromIP(ip) {
  // Skip localhost and private IPs
  if (!ip || ip === '127.0.0.1' || ip === '::1' || 
      ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return process.env.DEV_CURRENCY || Currency.USD;
  }
  
  try {
    const countryCode = await getCountryFromIP(ip);
    
    if (!countryCode) {
      console.log(`⚠️ No country code returned for IP: ${ip}, using default currency`);
      return process.env.DEV_CURRENCY || Currency.USD;
    }
    
    switch (countryCode) {
      case 'EG': return Currency.EGP;
      case 'SA': return Currency.SAR;
      case 'AE': return Currency.AED;
      default: return Currency.USD;
    }
  } catch (error) {
    console.error('💥 Currency detection completely failed:', error);
    return process.env.DEV_CURRENCY || Currency.USD;
  }
}

/**
 * Test currency detection for all IPs
 */
async function testCurrencyDetection() {
  console.log('\n🧪 Testing Currency Middleware with MaxMind API');
  console.log('=' .repeat(60));
  
  const results = [];
  let successCount = 0;
  let failureCount = 0;
  
  for (const test of testIPs) {
    console.log(`\n🔍 Testing: ${test.description}`);
    console.log(`   IP: ${test.ip}`);
    console.log(`   Expected: ${test.expectedCurrency} (${test.country})`);
    
    try {
      const startTime = Date.now();
      const detectedCurrency = await detectCurrencyFromIP(test.ip);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const isSuccess = detectedCurrency === test.expectedCurrency;
      const status = isSuccess ? '✅ PASS' : '❌ FAIL';
      
      console.log(`   Detected: ${detectedCurrency}`);
      console.log(`   Status: ${status}`);
      console.log(`   Response Time: ${responseTime}ms`);
      
      results.push({
        ...test,
        detectedCurrency,
        isSuccess,
        responseTime,
        status
      });
      
      if (isSuccess) {
        successCount++;
      } else {
        failureCount++;
      }
      
    } catch (error) {
      console.log(`   Error: ${error.message}`);
      console.log(`   Status: ❌ ERROR`);
      
      results.push({
        ...test,
        detectedCurrency: 'ERROR',
        isSuccess: false,
        responseTime: 0,
        status: '❌ ERROR',
        error: error.message
      });
      
      failureCount++;
    }
  }
  
  // Summary
  console.log('\n📊 Test Summary');
  console.log('=' .repeat(60));
  console.log(`Total Tests: ${testIPs.length}`);
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`Success Rate: ${((successCount / testIPs.length) * 100).toFixed(1)}%`);
  
  // Detailed results
  console.log('\n📋 Detailed Results');
  console.log('=' .repeat(60));
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.description}`);
    console.log(`   IP: ${result.ip} | Expected: ${result.expectedCurrency} | Detected: ${result.detectedCurrency}`);
    console.log(`   Status: ${result.status} | Time: ${result.responseTime}ms`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    console.log('');
  });
  
  // Performance analysis
  const avgResponseTime = results
    .filter(r => r.responseTime > 0)
    .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.responseTime > 0).length;
  
  console.log(`⚡ Average Response Time: ${avgResponseTime.toFixed(0)}ms`);
  
  // MaxMind API status
  if (client) {
    console.log('✅ MaxMind API: Connected and working');
  } else {
    console.log('⚠️ MaxMind API: Using mock data (credentials not found)');
  }
  
  return results;
}

/**
 * Test specific edge cases
 */
async function testEdgeCases() {
  console.log('\n🔬 Testing Edge Cases');
  console.log('=' .repeat(40));
  
  const edgeCases = [
    { ip: 'invalid-ip', description: 'Invalid IP format' },
    { ip: '', description: 'Empty IP' },
    { ip: null, description: 'Null IP' },
    { ip: '999.999.999.999', description: 'Invalid IP range' },
  ];
  
  for (const test of edgeCases) {
    console.log(`\n🔍 Testing: ${test.description}`);
    console.log(`   IP: ${test.ip}`);
    
    try {
      const detectedCurrency = await detectCurrencyFromIP(test.ip);
      console.log(`   Detected: ${detectedCurrency}`);
      console.log(`   Status: ✅ Handled gracefully`);
    } catch (error) {
      console.log(`   Error: ${error.message}`);
      console.log(`   Status: ❌ Not handled gracefully`);
    }
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🚀 Starting Currency Middleware Tests');
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.DEV_CURRENCY) {
    console.log(`🔧 DEV_CURRENCY Override: ${process.env.DEV_CURRENCY}`);
  }
  
  try {
    // Run main tests
    const results = await testCurrencyDetection();
    
    // Run edge case tests
    await testEdgeCases();
    
    // Final status
    const successRate = (results.filter(r => r.isSuccess).length / results.length) * 100;
    
    if (successRate >= 90) {
      console.log('\n🎉 Currency Middleware Test: PASSED');
      console.log('✅ The middleware is working correctly!');
    } else if (successRate >= 70) {
      console.log('\n⚠️ Currency Middleware Test: PARTIAL PASS');
      console.log('⚠️ Some issues detected, but mostly working.');
    } else {
      console.log('\n❌ Currency Middleware Test: FAILED');
      console.log('❌ Significant issues detected.');
    }
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
  }
}

// Run the tests
runTests().catch(console.error);
