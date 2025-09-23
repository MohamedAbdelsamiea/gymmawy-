#!/usr/bin/env node

/**
 * Quick MaxMind Fix Script
 * This script helps temporarily disable MaxMind and set a default currency
 */

import fs from 'fs';
import path from 'path';

console.log('🔧 Quick MaxMind Fix Tool\n');

// Find .env file
const envPath = path.join(process.cwd(), '.env');

if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found in current directory');
  console.log('Please run this script from your backend directory');
  process.exit(1);
}

console.log('📁 Found .env file:', envPath);

// Read current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Check current MaxMind configuration
const hasMaxMindAccount = envContent.includes('MAXMIND_ACCOUNT_ID=');
const hasMaxMindKey = envContent.includes('MAXMIND_LICENSE_KEY=');
const hasDevCurrency = envContent.includes('DEV_CURRENCY=');

console.log('\n📋 Current Configuration:');
console.log('MAXMIND_ACCOUNT_ID:', hasMaxMindAccount ? '✅ Set' : '❌ Not set');
console.log('MAXMIND_LICENSE_KEY:', hasMaxMindKey ? '✅ Set' : '❌ Not set');
console.log('DEV_CURRENCY:', hasDevCurrency ? '✅ Set' : '❌ Not set');

if (hasDevCurrency) {
  const devCurrencyMatch = envContent.match(/DEV_CURRENCY=(.*)/);
  if (devCurrencyMatch) {
    console.log('Current DEV_CURRENCY value:', devCurrencyMatch[1]);
  }
}

console.log('\n🛠️  Available Fixes:');

// Option 1: Set DEV_CURRENCY to EGP (recommended for Egypt)
if (!hasDevCurrency || !envContent.includes('DEV_CURRENCY=EGP')) {
  console.log('1. Set DEV_CURRENCY=EGP (recommended for Egypt)');
}

// Option 2: Comment out MaxMind credentials
if (hasMaxMindAccount || hasMaxMindKey) {
  console.log('2. Comment out MaxMind credentials to disable geolocation');
}

// Option 3: Set DEV_CURRENCY to USD
if (!hasDevCurrency || !envContent.includes('DEV_CURRENCY=USD')) {
  console.log('3. Set DEV_CURRENCY=USD (fallback option)');
}

console.log('\n💡 Recommended Fix: Set DEV_CURRENCY=EGP');
console.log('This will bypass MaxMind and use EGP as the default currency');

// Apply the recommended fix
if (!envContent.includes('DEV_CURRENCY=EGP')) {
  // Remove any existing DEV_CURRENCY line
  envContent = envContent.replace(/DEV_CURRENCY=.*\n?/, '');
  
  // Add DEV_CURRENCY=EGP
  envContent += '\n# Temporary fix: Use EGP as default currency\nDEV_CURRENCY=EGP\n';
  
  // Write back to file
  fs.writeFileSync(envPath, envContent);
  
  console.log('\n✅ Applied fix: Set DEV_CURRENCY=EGP');
  console.log('🔄 Please restart your PM2 processes:');
  console.log('   pm2 restart all');
} else {
  console.log('\n✅ DEV_CURRENCY=EGP is already set');
}

console.log('\n📝 Next Steps:');
console.log('1. Restart your PM2 processes: pm2 restart all');
console.log('2. Check logs: pm2 logs');
console.log('3. Test the application');
console.log('4. Fix MaxMind credentials later when you have time');

console.log('\n🔍 To diagnose MaxMind issues later:');
console.log('1. Copy maxmind-diagnostic.js to your server');
console.log('2. Run: node maxmind-diagnostic.js');
console.log('3. Check your MaxMind account status');

