/**
 * Test Tabby Cron Job Functionality
 * This simulates creating pending payments and checking if cron picks them up
 */

import { getPrismaClient } from './src/config/db.js';

const prisma = getPrismaClient();

async function createTestPendingPayment() {
  console.log('🔄 Creating test PENDING payment...\n');

  try {
    // Create a test user if needed
    let testUser = await prisma.user.findFirst({
      where: { email: 'test@tabby.com' }
    });

    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          email: 'test@tabby.com',
          firstName: 'Test',
          lastName: 'User',
          password: 'test123',
          isActive: true,
          emailVerified: true
        }
      });
      console.log('✅ Created test user');
    }

    // Create a test pending payment
    const payment = await prisma.payment.create({
      data: {
        userId: testUser.id,
        amount: 100.00,
        currency: 'SAR',
        method: 'TABBY',
        status: 'PENDING',
        transactionId: `test-${Date.now()}`,
        paymentableType: 'PRODUCT',
        paymentableId: '00000000-0000-0000-0000-000000000000', // Dummy UUID
        metadata: {
          tabby_session_id: `session-${Date.now()}`,
          test_payment: true,
          created_for_cron_test: true
        }
      }
    });

    console.log('✅ Created test PENDING payment:');
    console.log(`   Payment ID: ${payment.id}`);
    console.log(`   Transaction ID: ${payment.transactionId}`);
    console.log(`   Status: ${payment.status}`);
    console.log(`   Created: ${payment.createdAt}`);
    console.log('\n📋 This payment will be checked by the cron job in the next 5 minutes.');
    console.log('   Watch server logs for: [TABBY_CRON] Checking PENDING payments...\n');

    return payment;

  } catch (error) {
    console.error('❌ Failed to create test payment:', error.message);
    throw error;
  }
}

async function checkPendingPayments() {
  console.log('🔍 Checking current PENDING Tabby payments...\n');

  try {
    const twoMinutesAgo = new Date();
    twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);

    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);

    const pendingPayments = await prisma.payment.findMany({
      where: {
        method: 'TABBY',
        status: 'PENDING',
        createdAt: {
          gte: thirtyMinutesAgo,
          lte: twoMinutesAgo
        }
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`📊 Found ${pendingPayments.length} PENDING payments (2-30 mins old)\n`);

    if (pendingPayments.length === 0) {
      console.log('ℹ️  No pending payments found. The cron job will have nothing to process.');
      console.log('   Run: node test-tabby-cron.js create   to create a test payment\n');
    } else {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      pendingPayments.forEach((payment, index) => {
        console.log(`\n${index + 1}. Payment: ${payment.paymentReference}`);
        console.log(`   Transaction ID: ${payment.transactionId}`);
        console.log(`   Amount: ${payment.amount} ${payment.currency}`);
        console.log(`   User: ${payment.user.firstName} ${payment.user.lastName} (${payment.user.email})`);
        console.log(`   Created: ${payment.createdAt.toISOString()}`);
        console.log(`   Age: ${Math.round((Date.now() - payment.createdAt.getTime()) / 60000)} minutes`);
      });
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

  } catch (error) {
    console.error('❌ Failed to check pending payments:', error.message);
    throw error;
  }
}

async function checkAuthorizedPayments() {
  console.log('🔍 Checking AUTHORIZED Tabby payments (not captured)...\n');

  try {
    const authorizedPayments = await prisma.payment.findMany({
      where: {
        method: 'TABBY',
        status: 'SUCCESS',
        metadata: {
          path: ['tabby_status'],
          equals: 'AUTHORIZED'
        },
        NOT: {
          metadata: {
            path: ['captured_at'],
            not: null
          }
        }
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    console.log(`📊 Found ${authorizedPayments.length} AUTHORIZED payments (not captured)\n`);

    if (authorizedPayments.length === 0) {
      console.log('ℹ️  No authorized payments waiting for capture.\n');
    } else {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      authorizedPayments.forEach((payment, index) => {
        console.log(`\n${index + 1}. Payment: ${payment.paymentReference}`);
        console.log(`   Transaction ID: ${payment.transactionId}`);
        console.log(`   Amount: ${payment.amount} ${payment.currency}`);
        console.log(`   User: ${payment.user.firstName} ${payment.user.lastName}`);
        console.log(`   Authorized: ${payment.processedAt?.toISOString() || 'N/A'}`);
        console.log(`   Age: ${Math.round((Date.now() - payment.createdAt.getTime()) / 60000)} minutes`);
      });
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

  } catch (error) {
    console.error('❌ Failed to check authorized payments:', error.message);
    throw error;
  }
}

async function cleanupTestPayments() {
  console.log('🧹 Cleaning up test payments...\n');

  try {
    const result = await prisma.payment.deleteMany({
      where: {
        metadata: {
          path: ['test_payment'],
          equals: true
        }
      }
    });

    console.log(`✅ Deleted ${result.count} test payment(s)\n`);

  } catch (error) {
    console.error('❌ Failed to cleanup:', error.message);
  }
}

// Main execution
async function main() {
  console.clear();
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║         Tabby Cron Job Test Utility                 ║');
  console.log('╚══════════════════════════════════════════════════════╝\n');

  const command = process.argv[2];

  try {
    switch (command) {
      case 'create':
        await createTestPendingPayment();
        break;

      case 'check-pending':
        await checkPendingPayments();
        break;

      case 'check-authorized':
        await checkAuthorizedPayments();
        break;

      case 'cleanup':
        await cleanupTestPayments();
        break;

      case 'status':
      default:
        await checkPendingPayments();
        console.log('\n');
        await checkAuthorizedPayments();
        console.log('\n📋 Available Commands:');
        console.log('   node test-tabby-cron.js create          - Create test PENDING payment');
        console.log('   node test-tabby-cron.js check-pending   - Check PENDING payments');
        console.log('   node test-tabby-cron.js check-authorized - Check AUTHORIZED payments');
        console.log('   node test-tabby-cron.js cleanup         - Remove test payments');
        console.log('   node test-tabby-cron.js status          - Show all (default)\n');
        break;
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

