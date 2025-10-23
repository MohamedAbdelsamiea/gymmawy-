#!/usr/bin/env node

/**
 * Create Test Account for QA Testing
 * This script directly creates a user in the database without email verification
 * Run with: node create-test-account.js
 */

import { getPrismaClient } from './src/config/db.js';
import { hashPassword } from './src/utils/password.js';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

// Test account credentials
const TEST_ACCOUNT = {
  email: 'qa_tester@gymmawy.fit',
  password: 'Test123!',
  firstName: 'QA',
  lastName: 'Tester',
  mobileNumber: '+971501234567',
  role: 'MEMBER'
};

async function main() {
  console.log(`${colors.cyan}👥 Creating QA test account...${colors.reset}\n`);
  
  const prisma = getPrismaClient();
  
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: TEST_ACCOUNT.email }
    });
    
    if (existingUser) {
      log.warning(`User with email ${TEST_ACCOUNT.email} already exists`);
      console.log(`   User ID: ${existingUser.id}`);
      console.log(`   Name: ${existingUser.firstName} ${existingUser.lastName}`);
      console.log(`   Role: ${existingUser.role}`);
      console.log(`   Created: ${existingUser.createdAt}`);
      return;
    }
    
    // Hash the password
    const passwordHash = await hashPassword(TEST_ACCOUNT.password);
    
    // Create the user directly in the database
    const user = await prisma.user.create({
      data: {
        email: TEST_ACCOUNT.email,
        passwordHash: passwordHash,
        firstName: TEST_ACCOUNT.firstName,
        lastName: TEST_ACCOUNT.lastName,
        mobileNumber: TEST_ACCOUNT.mobileNumber,
        role: TEST_ACCOUNT.role
      }
    });
    
    log.success('QA test account created successfully!');
    console.log('==========================================');
    console.log('📋 Created QA Test Account Credentials:');
    console.log('');
    console.log(`   Email: ${TEST_ACCOUNT.email}`);
    console.log(`   Password: ${TEST_ACCOUNT.password}`);
    console.log(`   Name: ${TEST_ACCOUNT.firstName} ${TEST_ACCOUNT.lastName}`);
    console.log(`   Phone: ${TEST_ACCOUNT.mobileNumber}`);
    console.log(`   Role: ${TEST_ACCOUNT.role}`);
    console.log(`   User ID: ${user.id}`);
    console.log('==========================================\n');
    
  } catch (error) {
    log.error(`Failed to create test account: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the main function
main().catch((error) => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
