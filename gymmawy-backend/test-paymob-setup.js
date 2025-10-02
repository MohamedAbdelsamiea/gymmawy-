#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Setting up Paymob Test Environment...\n');

// Check if .env file exists
const envPath = '.env';
const envExamplePath = '.env.example';

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from example...');
  
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created from .env.example');
  } else {
    console.log('⚠️  .env.example not found, creating basic .env file...');
    
    const basicEnv = `# Database
DATABASE_URL="postgresql://username:password@localhost:5432/gymmawy"

# JWT
JWT_SECRET="your-jwt-secret-here"
JWT_EXPIRES_IN="7d"
COOKIE_SECRET="your-cookie-secret-here"

# Paymob Configuration (TEST CREDENTIALS)
PAYMOB_SECRET_KEY="sk_test_your_secret_key_here"
PAYMOB_PUBLIC_KEY="pk_test_your_public_key_here"
PAYMOB_INTEGRATION_ID_CARD="123456"
PAYMOB_INTEGRATION_ID_APPLE_PAY="789012"
PAYMOB_HMAC_SECRET="your_hmac_secret_here"

# Base URLs
BASE_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"
`;

    fs.writeFileSync(envPath, basicEnv);
    console.log('✅ Basic .env file created');
  }
} else {
  console.log('✅ .env file already exists');
}

// Check environment variables
console.log('\n🔍 Checking environment variables...');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'PAYMOB_SECRET_KEY',
    'PAYMOB_PUBLIC_KEY',
    'PAYMOB_INTEGRATION_ID_CARD',
    'PAYMOB_INTEGRATION_ID_APPLE_PAY',
    'PAYMOB_HMAC_SECRET'
  ];
  
  const missingVars = requiredVars.filter(varName => 
    !envContent.includes(`${varName}=`) || 
    envContent.includes(`${varName}="your_`) ||
    envContent.includes(`${varName}="sk_test_your_`)
  );
  
  if (missingVars.length > 0) {
    console.log('⚠️  Missing or placeholder environment variables:');
    missingVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
    console.log('\n📝 Please update these variables in your .env file with real Paymob credentials');
  } else {
    console.log('✅ All required environment variables are set');
  }
} catch (error) {
  console.log('❌ Error reading .env file:', error.message);
}

// Check if database migration is needed
console.log('\n🗄️  Checking database schema...');
try {
  // Try to generate Prisma client to check schema
  execSync('npx prisma generate', { stdio: 'pipe' });
  console.log('✅ Prisma client generated successfully');
  
  // Check if PAYMOB payment method exists in schema
  const schemaPath = 'prisma/schema.prisma';
  if (fs.existsSync(schemaPath)) {
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    if (schemaContent.includes('PAYMOB')) {
      console.log('✅ PAYMOB payment method found in schema');
    } else {
      console.log('⚠️  PAYMOB payment method not found in schema');
    }
  }
} catch (error) {
  console.log('⚠️  Error with Prisma:', error.message);
}

// Test script availability
console.log('\n🧪 Checking test scripts...');
const testScripts = [
  'test-paymob-integration.js'
];

testScripts.forEach(script => {
  if (fs.existsSync(script)) {
    console.log(`✅ ${script} found`);
  } else {
    console.log(`❌ ${script} not found`);
  }
});

console.log('\n🎯 Next Steps:');
console.log('1. Update your .env file with real Paymob test credentials');
console.log('2. Run database migration: npx prisma migrate dev --name add_paymob_payment_method');
console.log('3. Test backend: node test-paymob-integration.js');
console.log('4. Start your backend server: npm run dev');
console.log('5. Start your frontend server: npm run dev (in gymmawy-frontend)');
console.log('6. Visit: http://localhost:3000/test/paymob');

console.log('\n📚 Paymob Test Credentials:');
console.log('- Get your test credentials from: https://portal.paymob.com/');
console.log('- Test Secret Key: sk_test_...');
console.log('- Test Public Key: pk_test_...');
console.log('- Test Integration IDs: From your Paymob dashboard');

console.log('\n🔗 Useful Links:');
console.log('- Paymob API Docs: https://docs.paymob.com/');
console.log('- Test Credentials: https://docs.paymob.com/test-credentials');
console.log('- Webhook Testing: https://webhook.site/');

console.log('\n✅ Setup complete! Happy testing! 🎉');
