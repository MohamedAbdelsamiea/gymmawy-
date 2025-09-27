#!/usr/bin/env node

/**
 * Create Test Accounts for Tabby Team Testing
 * Run with: npm run create-tabby-accounts
 */

import axios from 'axios';
import readline from 'readline';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`)
};

// Configuration
const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Single test account
const TEST_ACCOUNT = {
  email: 'qa_tester@gymmawy.com',
  password: 'test1234',
  firstName: 'QA',
  lastName: 'Tester',
  mobileNumber: '+971501234567',
  role: 'MEMBER',
  description: 'QA Tester Account'
};

// Custom sample accounts (for reference)
const CUSTOM_SAMPLE_ACCOUNTS = [
  {
    email: 'custom.test1@example.com',
    password: 'Test123!',
    firstName: 'Custom',
    lastName: 'Test1',
    mobileNumber: '+971501234567',
    role: 'MEMBER',
    description: 'Custom Test Account 1'
  },
  {
    email: 'custom.test2@example.com',
    password: 'Test123!',
    firstName: 'Custom',
    lastName: 'Test2',
    mobileNumber: '+966501234567',
    role: 'MEMBER',
    description: 'Custom Test Account 2'
  }
];

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt user for input
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

// Function to prompt for account details
async function promptForAccountDetails(accountNumber) {
  console.log(`\n${colors.cyan}📝 Account ${accountNumber} Details:${colors.reset}`);
  
  const email = await prompt('Email: ');
  const password = await prompt('Password: ');
  const firstName = await prompt('First Name: ');
  const lastName = await prompt('Last Name: ');
  const mobileNumber = await prompt('Mobile Number (with country code, e.g., +971501234567): ');
  const role = await prompt('Role (MEMBER/ADMIN) [default: MEMBER]: ') || 'MEMBER';
  
  return {
    email: email.trim(),
    password: password.trim(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    mobileNumber: mobileNumber.trim(),
    role: role.trim().toUpperCase() || 'MEMBER'
  };
}

// Function to validate account details
function validateAccountDetails(account) {
  const errors = [];
  
  if (!account.email || !account.email.includes('@')) {
    errors.push('Valid email is required');
  }
  
  if (!account.password || account.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }
  
  if (!account.firstName || account.firstName.length < 1) {
    errors.push('First name is required');
  }
  
  if (!account.lastName || account.lastName.length < 1) {
    errors.push('Last name is required');
  }
  
  if (!account.mobileNumber || !account.mobileNumber.startsWith('+')) {
    errors.push('Valid mobile number with country code is required (e.g., +971501234567)');
  }
  
  if (!['MEMBER', 'ADMIN'].includes(account.role)) {
    errors.push('Role must be MEMBER or ADMIN');
  }
  
  return errors;
}

// Function to create a test account
async function createTestAccount(accountData, adminToken) {
  const { email } = accountData;
  
  log.info(`Creating account for: ${email}`);
  
  try {
    const response = await axios.post(`${BASE_URL}/users`, accountData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (response.data.user) {
      const userId = response.data.user.id;
      log.success(`Account created successfully: ${email} (ID: ${userId})`);
      return { success: true, userId };
    } else {
      log.warning(`Failed to create account for ${email}: No user data returned`);
      return { success: false, error: 'No user data returned' };
    }
  } catch (error) {
    const errorMessage = error.response?.data?.error?.message || 
                        error.response?.data?.message || 
                        error.message || 'Unknown error';
    log.warning(`Failed to create account for ${email}: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

// Function to test login
async function testLogin(email, password) {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password
    });
    
    if (response.data.accessToken) {
      log.success(`Login test successful for ${email}`);
      return true;
    } else {
      log.warning(`Login test failed for ${email}: No access token`);
      return false;
    }
  } catch (error) {
    log.warning(`Login test failed for ${email}: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

// Main function
async function main() {
  console.log(`${colors.cyan}👥 Creating QA test account...${colors.reset}\n`);
  
  // Get admin credentials from environment or prompt
  const adminEmail = process.env.ADMIN_EMAIL || await prompt('Enter admin email: ');
  const adminPassword = process.env.ADMIN_PASSWORD || await prompt('Enter admin password: ');
  
  if (!adminEmail || !adminPassword) {
    log.error('Admin email and password are required');
    rl.close();
    process.exit(1);
  }
  
  // Login as admin
  log.info('Logging in as admin...');
  try {
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: adminEmail,
      password: adminPassword
    });
    
    if (!loginResponse.data.accessToken) {
      log.error('Failed to get admin access token');
      rl.close();
      process.exit(1);
    }
    
    const adminToken = loginResponse.data.accessToken;
    log.success('Admin login successful');
    
    // Show the test account details
    console.log(`\n${colors.yellow}📋 QA Test Account:${colors.reset}`);
    console.log(`${colors.cyan}Creating single test account:${colors.reset}\n`);
    
    console.log(`1. ${TEST_ACCOUNT.description}`);
    console.log(`   Email: ${TEST_ACCOUNT.email}`);
    console.log(`   Password: ${TEST_ACCOUNT.password}`);
    console.log(`   Name: ${TEST_ACCOUNT.firstName} ${TEST_ACCOUNT.lastName}`);
    console.log(`   Phone: ${TEST_ACCOUNT.mobileNumber}`);
    console.log(`   Role: ${TEST_ACCOUNT.role}`);
    console.log('');
    
    // Create the test account
    log.info('Creating QA test account...\n');
    
    const result = await createTestAccount(TEST_ACCOUNT, adminToken);
    
    // Summary
    console.log('==========================================');
    if (result.success) {
      log.success('QA test account created successfully!');
      console.log('==========================================\n');
      
      // Display created account credentials
      log.info('Created QA Test Account Credentials:');
      console.log('');
      console.log(`1. ${TEST_ACCOUNT.description}`);
      console.log(`   Email: ${TEST_ACCOUNT.email}`);
      console.log(`   Password: ${TEST_ACCOUNT.password}`);
      console.log(`   Name: ${TEST_ACCOUNT.firstName} ${TEST_ACCOUNT.lastName}`);
      console.log(`   Phone: ${TEST_ACCOUNT.mobileNumber}`);
      console.log(`   Role: ${TEST_ACCOUNT.role}`);
      console.log('');
      
      // Test login
      log.info('Testing login for QA test account...');
      await testLogin(TEST_ACCOUNT.email, TEST_ACCOUNT.password);
    } else {
      log.warning('Failed to create QA test account');
      console.log('==========================================\n');
    }
    
    console.log('');
    log.success('QA test account creation completed!');
    
  } catch (error) {
    log.error(`Admin login failed: ${error.response?.data?.message || error.message}`);
    rl.close();
    process.exit(1);
  }
  
  rl.close();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n');
  log.warning('Process interrupted by user');
  rl.close();
  process.exit(0);
});

// Run the main function
main().catch((error) => {
  log.error(`Unexpected error: ${error.message}`);
  rl.close();
  process.exit(1);
});
