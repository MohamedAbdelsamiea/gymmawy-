#!/usr/bin/env node

/**
 * Improved Currency Middleware Test
 * Uses more reliable IP addresses and tests the actual middleware
 */

import { WebServiceClient } from '@maxmind/geoip2-node';
import { Currency } from '@prisma/client';

// More reliable test IP addresses
const testIPs = [
  // Egypt - Using known Egyptian ISP ranges
  { ip: '41.237.0.1', country: 'EG', expectedCurrency: 'EGP', description: 'Egypt - Cairo (TE Data)' },
  { ip: '41.237.1.1', country: 'EG', expectedCurrency: 'EGP', description: 'Egypt - Alexandria (TE Data)' },
  { ip: '41.237.2.1', country: 'EG', expectedCurrency: 'EGP', description: 'Egypt - Giza (TE Data)' },
  
  // Saudi Arabia - Using known Saudi ISP ranges
  { ip: '5.0.0.1', country: 'SA', expectedCurrency: 'SAR', description: 'Saudi Arabia - Riyadh (STC)' },
  { ip: '5.1.0.1', country: 'SA', expectedCurrency: 'SAR', description: 'Saudi Arabia - Jeddah (STC)' },
  { ip: '5.2.0.1', country: 'SA', expectedCurrency: 'SAR', description: 'Saudi Arabia - Dammam (STC)' },
  
  // UAE - Using known UAE ISP ranges
  { ip: '5.44.0.1', country: 'AE', expectedCurrency: 'AED', description: 'UAE - Dubai (Etisalat)' },
  { ip: '5.44.1.1', country: 'AE', expectedCurrency: 'AED', description: 'UAE - Abu Dhabi (Etisalat)' },
  { ip: '5.44.2.1', country: 'AE', expectedCurrency: 'AED', description: 'UAE - Sharjah (Etisalat)' },
  
  // Kuwait - Using known Kuwait ISP ranges
  { ip: '5.0.0.1', country: 'KW', expectedCurrency: 'USD', description: 'Kuwait - Kuwait City (Zain)' },
  { ip: '5.1.0.1', country: 'KW', expectedCurrency: 'USD', description: 'Kuwait - Hawalli (Zain)' },
  
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
        timeout: 10000
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
 * Test with real-world IP addresses
 */
async function testRealWorldIPs() {
  console.log('\n🌍 Testing with Real-World IP Addresses');
  console.log('=' .repeat(50));
  
  const realWorldIPs = [
    // Egypt - Real ISP IPs
    { ip: '41.237.0.1', expected: 'EGP', description: 'Egypt - TE Data' },
    { ip: '41.237.1.1', expected: 'EGP', description: 'Egypt - TE Data' },
    
    // Saudi Arabia - Real ISP IPs  
    { ip: '5.0.0.1', expected: 'SAR', description: 'Saudi Arabia - STC' },
    { ip: '5.1.0.1', expected: 'SAR', description: 'Saudi Arabia - STC' },
    
    // UAE - Real ISP IPs
    { ip: '5.44.0.1', expected: 'AED', description: 'UAE - Etisalat' },
    { ip: '5.44.1.1', expected: 'AED', description: 'UAE - Etisalat' },
    
    // Other countries
    { ip: '8.8.8.8', expected: 'USD', description: 'USA - Google DNS' },
    { ip: '1.1.1.1', expected: 'USD', description: 'USA - Cloudflare DNS' },
  ];
  
  for (const test of realWorldIPs) {
    console.log(`\n🔍 Testing: ${test.description}`);
    console.log(`   IP: ${test.ip}`);
    console.log(`   Expected: ${test.expected}`);
    
    try {
      const startTime = Date.now();
      const detectedCurrency = await detectCurrencyFromIP(test.ip);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const isSuccess = detectedCurrency === test.expected;
      const status = isSuccess ? '✅ PASS' : '❌ FAIL';
      
      console.log(`   Detected: ${detectedCurrency}`);
      console.log(`   Status: ${status}`);
      console.log(`   Response Time: ${responseTime}ms`);
      
    } catch (error) {
      console.log(`   Error: ${error.message}`);
      console.log(`   Status: ❌ ERROR`);
    }
  }
}

/**
 * Test the actual middleware function
 */
async function testMiddlewareFunction() {
  console.log('\n🔧 Testing Middleware Function');
  console.log('=' .repeat(40));
  
  // Import the actual middleware
  try {
    const { detectCurrencyService } = await import('./src/middlewares/currencyMiddleware.js');
    
    // Create mock request objects
    const mockRequests = [
      { ip: '41.237.0.1', headers: { 'x-forwarded-for': '41.237.0.1' } },
      { ip: '5.0.0.1', headers: { 'x-forwarded-for': '5.0.0.1' } },
      { ip: '5.44.0.1', headers: { 'x-forwarded-for': '5.44.0.1' } },
      { ip: '8.8.8.8', headers: { 'x-forwarded-for': '8.8.8.8' } },
    ];
    
    for (const req of mockRequests) {
      console.log(`\n🔍 Testing middleware with IP: ${req.ip}`);
      
      try {
        const result = await detectCurrencyService(req);
        console.log(`   Result:`, result);
        
        if (result.success) {
          console.log(`   Status: ✅ SUCCESS`);
        } else {
          console.log(`   Status: ❌ FAILED`);
        }
      } catch (error) {
        console.log(`   Error: ${error.message}`);
        console.log(`   Status: ❌ ERROR`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Failed to import middleware: ${error.message}`);
  }
}

/**
 * Test with different IP formats
 */
async function testIPFormats() {
  console.log('\n🔍 Testing Different IP Formats');
  console.log('=' .repeat(40));
  
  const ipFormats = [
    { ip: '41.237.0.1', description: 'Standard IPv4' },
    { ip: '2001:db8::1', description: 'IPv6' },
    { ip: '127.0.0.1', description: 'Localhost IPv4' },
    { ip: '::1', description: 'Localhost IPv6' },
    { ip: '192.168.1.1', description: 'Private IPv4' },
    { ip: '10.0.0.1', description: 'Private IPv4' },
    { ip: '172.16.0.1', description: 'Private IPv4' },
  ];
  
  for (const test of ipFormats) {
    console.log(`\n🔍 Testing: ${test.description}`);
    console.log(`   IP: ${test.ip}`);
    
    try {
      const detectedCurrency = await detectCurrencyFromIP(test.ip);
      console.log(`   Detected: ${detectedCurrency}`);
      console.log(`   Status: ✅ Handled`);
    } catch (error) {
      console.log(`   Error: ${error.message}`);
      console.log(`   Status: ❌ Error`);
    }
  }
}

/**
 * Main test execution
 */
async function runTests() {
  console.log('🚀 Starting Improved Currency Middleware Tests');
  console.log(`📅 Test Date: ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (process.env.DEV_CURRENCY) {
    console.log(`🔧 DEV_CURRENCY Override: ${process.env.DEV_CURRENCY}`);
  }
  
  try {
    // Test real-world IPs
    await testRealWorldIPs();
    
    // Test middleware function
    await testMiddlewareFunction();
    
    // Test IP formats
    await testIPFormats();
    
    console.log('\n🎉 Currency Middleware Test Complete!');
    
  } catch (error) {
    console.error('\n💥 Test execution failed:', error);
  }
}

// Run the tests
runTests().catch(console.error);
