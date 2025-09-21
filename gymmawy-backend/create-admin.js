#!/usr/bin/env node

// Simple admin creation script
// Run with: node create-admin.js

import { PrismaClient } from '@prisma/client';
import { hashPassword } from './src/utils/password.js';
import readline from 'readline';

const prisma = new PrismaClient();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask questions
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createAdmin() {
  console.log('🔐 Admin User Creation Script');
  console.log('=============================\n');

  try {
    // Get email from user
    let email;
    while (!email || !email.includes('@')) {
      email = await askQuestion('Enter admin email: ');
      if (!email || !email.includes('@')) {
        console.log('❌ Please enter a valid email address\n');
      }
    }

    // Get password from user
    let password;
    while (!password || password.length < 6) {
      password = await askQuestion('Enter admin password (min 6 characters): ');
      if (!password || password.length < 6) {
        console.log('❌ Password must be at least 6 characters long\n');
      }
    }

    // Get first name
    const firstName = await askQuestion('Enter first name (optional): ') || 'Admin';

    // Get last name
    const lastName = await askQuestion('Enter last name (optional): ') || 'User';

    // Get mobile number
    let mobileNumber;
    while (!mobileNumber) {
      mobileNumber = await askQuestion('Enter mobile number: ');
      if (!mobileNumber) {
        console.log('❌ Mobile number is required\n');
      }
    }

    // Get country
    const country = await askQuestion('Enter country (optional): ') || 'Egypt';

    // Get city
    const city = await askQuestion('Enter city (optional): ') || 'Cairo';

    console.log('\n🔄 Creating admin user...');

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create or update admin user
    const adminUser = await prisma.user.upsert({
      where: { email: email },
      update: {
        passwordHash: passwordHash,
        firstName: firstName,
        lastName: lastName,
        mobileNumber: mobileNumber,
        country: country,
        city: city,
        role: 'ADMIN'
      },
      create: {
        email: email,
        passwordHash: passwordHash,
        role: 'ADMIN',
        firstName: firstName,
        lastName: lastName,
        mobileNumber: mobileNumber,
        country: country,
        city: city
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`👤 Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`📱 Mobile: ${adminUser.mobileNumber}`);
    console.log(`🌍 Location: ${adminUser.city}, ${adminUser.country}`);
    console.log(`🔑 Role: ${adminUser.role}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    process.exit(1);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Run the script
createAdmin();
