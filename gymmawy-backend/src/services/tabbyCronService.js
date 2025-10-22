/**
 * Tabby Cron Service
 * Handles scheduled tasks for Tabby payment processing
 */
import cron from 'node-cron';
import { getPrismaClient } from '../config/db.js';
import tabbyService from './tabbyService.js';

const prisma = getPrismaClient();

/**
 * Register webhook with Tabby on server startup
 * This ensures we receive payment status updates
 */
async function registerWebhook() {
  try {
    console.log('[TABBY_WEBHOOK] Registering webhook with Tabby...');
    
    // Use existing BASE_URL from .env which points to the backend API
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000/api';
    const webhookUrl = `${baseUrl}/tabby/webhook`;
    
    // Check if webhook already exists
    try {
      const existingWebhooks = await tabbyService.getWebhooks();
      
      // Check if our webhook URL is already registered
      const webhookExists = existingWebhooks.some(webhook => 
        webhook.url === webhookUrl
      );
      
      if (webhookExists) {
        console.log('[TABBY_WEBHOOK] Webhook already registered:', webhookUrl);
        return;
      }
    } catch (error) {
      console.log('[TABBY_WEBHOOK] Could not check existing webhooks:', error.message);
      // Continue to try registering anyway
    }
    
    // Register new webhook
    const webhookData = {
      url: webhookUrl,
      is_test: process.env.NODE_ENV !== 'production',
      events: [
        'payment.authorized',
        'payment.closed',
        'payment.rejected',
        'payment.updated'
      ]
    };
    
    const webhook = await tabbyService.createWebhook(webhookData);
    console.log('[TABBY_WEBHOOK] Webhook registered successfully:', webhook.id);
    console.log('[TABBY_WEBHOOK] Webhook URL:', webhookUrl);
    
  } catch (error) {
    // Don't fail server startup if webhook registration fails
    // The cron job will handle payment verification as fallback
    console.error('[TABBY_WEBHOOK] Failed to register webhook:', error.message);
    console.log('[TABBY_WEBHOOK] Cron job will handle payment verification as fallback');
  }
}

/**
 * Process PENDING payments and check their status with Tabby
 * This catches payments that were authorized but we missed the redirect/webhook
 */
async function checkPendingPayments() {
  try {
    console.log('[TABBY_CRON] Checking PENDING payments...');
    
    // Find payments that are still PENDING/CREATED (older than 2 minutes)
    const twoMinutesAgo = new Date();
    twoMinutesAgo.setMinutes(twoMinutesAgo.getMinutes() - 2);
    
    const thirtyMinutesAgo = new Date();
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30);
    
    const pendingPayments = await prisma.payment.findMany({
      where: {
        method: 'TABBY',
        status: 'PENDING',
        createdAt: {
          gte: thirtyMinutesAgo, // Don't check payments older than 30 mins (they're expired)
          lte: twoMinutesAgo // Only check payments older than 2 mins
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 20 // Process max 20 at a time
    });

    console.log(`[TABBY_CRON] Found ${pendingPayments.length} PENDING payments to check`);

    for (const payment of pendingPayments) {
      try {
        console.log(`[TABBY_CRON] Checking status for payment ${payment.transactionId}...`);
        
        // Retrieve payment status from Tabby
        const tabbyPayment = await tabbyService.getPayment(payment.transactionId);
        
        console.log(`[TABBY_CRON] Payment ${payment.transactionId} status: ${tabbyPayment.status}`);
        
        if (tabbyPayment.status === 'AUTHORIZED') {
          // Payment was authorized! Update our database
          console.log(`[TABBY_CRON] Payment ${payment.transactionId} is AUTHORIZED (missed redirect/webhook)`);
          
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCESS',
              processedAt: new Date(),
              metadata: {
                ...payment.metadata,
                tabby_status: 'AUTHORIZED',
                authorized_at: new Date().toISOString(),
                found_by_cron: true
              }
            }
          });
          
          // Try to capture it
          try {
            const captureResult = await tabbyService.capturePayment(payment.transactionId, {
              amount: payment.amount.toString(), // Convert Decimal to string as required by Tabby API
              reference_id: `cron-capture-${payment.paymentReference}`
            });
            
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                metadata: {
                  ...payment.metadata,
                  tabby_status: 'CLOSED',
                  captured_at: new Date().toISOString(),
                  capture_id: captureResult.id,
                  cron_captured: true
                }
              }
            });
            
            console.log(`[TABBY_CRON] Successfully captured payment ${payment.transactionId}`);
          } catch (error) {
            console.error(`[TABBY_CRON] Failed to capture payment ${payment.transactionId}:`, error.message);
          }
          
        } else if (tabbyPayment.status === 'REJECTED' || tabbyPayment.status === 'EXPIRED') {
          // Payment failed or expired
          console.log(`[TABBY_CRON] Payment ${payment.transactionId} is ${tabbyPayment.status}`);
          
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              metadata: {
                ...payment.metadata,
                tabby_status: tabbyPayment.status,
                final_status_at: new Date().toISOString(),
                found_by_cron: true
              }
            }
          });
        }
        // else: still in CREATED/NEW status, check again next time
        
      } catch (error) {
        console.error(`[TABBY_CRON] Error checking payment ${payment.transactionId}:`, error.message);
      }
    }
    
    console.log('[TABBY_CRON] Finished checking PENDING payments');
    
  } catch (error) {
    console.error('[TABBY_CRON] Error in checkPendingPayments:', error);
  }
}

/**
 * Process AUTHORIZED payments that need to be captured
 * This handles cases where capture might have failed
 */
async function processAuthorizedPayments() {
  try {
    console.log('[TABBY_CRON] Processing AUTHORIZED payments...');
    
    // Find payments that are AUTHORIZED but not captured
    const authorizedPayments = await prisma.payment.findMany({
      where: {
        method: 'TABBY',
        status: 'SUCCESS', // Our internal status for AUTHORIZED
        metadata: {
          path: ['tabby_status'],
          equals: 'AUTHORIZED'
        },
        // Not yet captured
        NOT: {
          metadata: {
            path: ['captured_at'],
            not: null
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      take: 10 // Process max 10 at a time
    });

    console.log(`[TABBY_CRON] Found ${authorizedPayments.length} AUTHORIZED payments to process`);

    for (const payment of authorizedPayments) {
      try {
        console.log(`[TABBY_CRON] Processing payment ${payment.transactionId}...`);
        
        // Check payment status with Tabby API
        const paymentStatus = await tabbyService.getPaymentStatus(payment.transactionId);
        
        if (paymentStatus.status === 'AUTHORIZED') {
          // Payment is still AUTHORIZED, attempt to capture
          console.log(`[TABBY_CRON] Capturing payment ${payment.transactionId}...`);
          
          const captureResult = await tabbyService.capturePayment(payment.transactionId, {
            amount: payment.amount.toString(), // Convert Decimal to string as required by Tabby API
            reference_id: `cron-capture-${payment.paymentReference}`
          });
          
          // Update payment status
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              metadata: {
                ...payment.metadata,
                tabby_status: 'CLOSED',
                captured_at: new Date().toISOString(),
                capture_id: captureResult.id,
                cron_captured: true
              }
            }
          });
          
          console.log(`[TABBY_CRON] Successfully captured payment ${payment.transactionId}`);
          
        } else if (paymentStatus.status === 'CLOSED') {
          // Payment was already captured, update our records
          console.log(`[TABBY_CRON] Payment ${payment.transactionId} already captured, updating status...`);
          
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              metadata: {
                ...payment.metadata,
                tabby_status: 'CLOSED',
                captured_at: new Date().toISOString(),
                status_updated_by_cron: true
              }
            }
          });
          
        } else if (paymentStatus.status === 'REJECTED' || paymentStatus.status === 'EXPIRED') {
          // Payment was rejected or expired, update our records
          console.log(`[TABBY_CRON] Payment ${payment.transactionId} was ${paymentStatus.status}, updating status...`);
          
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              metadata: {
                ...payment.metadata,
                tabby_status: paymentStatus.status,
                status_updated_by_cron: true,
                final_status_at: new Date().toISOString()
              }
            }
          });
        }
        
      } catch (error) {
        console.error(`[TABBY_CRON] Error processing payment ${payment.transactionId}:`, error.message);
        
        // Update error count in metadata
        const errorCount = (payment.metadata?.cron_error_count || 0) + 1;
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            metadata: {
              ...payment.metadata,
              cron_error_count: errorCount,
              last_cron_error: error.message,
              last_cron_error_at: new Date().toISOString()
            }
          }
        });
        
        // If too many errors, mark as failed
        if (errorCount >= 5) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              metadata: {
                ...payment.metadata,
                cron_failed: true,
                cron_failed_at: new Date().toISOString()
              }
            }
          });
        }
      }
    }
    
    console.log('[TABBY_CRON] Finished processing AUTHORIZED payments');
    
  } catch (error) {
    console.error('[TABBY_CRON] Error in processAuthorizedPayments:', error);
  }
}

/**
 * Clean up old failed payments
 */
async function cleanupFailedPayments() {
  try {
    console.log('[TABBY_CRON] Cleaning up old failed payments...');
    
    // Find payments that failed more than 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const oldFailedPayments = await prisma.payment.findMany({
      where: {
        method: 'TABBY',
        status: 'FAILED',
        createdAt: {
          lt: sevenDaysAgo
        }
      }
    });
    
    console.log(`[TABBY_CRON] Found ${oldFailedPayments.length} old failed payments to clean up`);
    
    // Archive or delete old failed payments (implement based on your needs)
    // For now, just log them
    for (const payment of oldFailedPayments) {
      console.log(`[TABBY_CRON] Old failed payment: ${payment.transactionId} (${payment.createdAt})`);
    }
    
  } catch (error) {
    console.error('[TABBY_CRON] Error in cleanupFailedPayments:', error);
  }
}

/**
 * Initialize Tabby cron service
 */
export function initializeTabbyCronService() {
  if (process.env.NODE_ENV === 'development') {
    console.log('[TABBY_CRON] Initializing Tabby cron service...');
  }
  
  // Register webhook with Tabby
  // Do this first to ensure we receive webhook notifications ASAP
  registerWebhook().catch(console.error);
  
  // Run initial processing
  checkPendingPayments().catch(console.error);
  processAuthorizedPayments().catch(console.error);
  
  // Schedule every 5 minutes to check PENDING payments (for missed redirects/webhooks)
  // Tabby recommends checking every couple of minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('[TABBY_CRON] Running scheduled PENDING payment check...');
    try {
      await checkPendingPayments();
    } catch (error) {
      console.error('[TABBY_CRON] PENDING payment check failed:', error);
    }
  });
  
  // Schedule every 15 minutes to process AUTHORIZED payments (for capture)
  cron.schedule('*/15 * * * *', async () => {
    console.log('[TABBY_CRON] Running scheduled AUTHORIZED payment processing...');
    try {
      await processAuthorizedPayments();
    } catch (error) {
      console.error('[TABBY_CRON] AUTHORIZED payment processing failed:', error);
    }
  });
  
  // Schedule daily cleanup at 2 AM
  cron.schedule('0 2 * * *', async () => {
    console.log('[TABBY_CRON] Running daily cleanup...');
    try {
      await cleanupFailedPayments();
    } catch (error) {
      console.error('[TABBY_CRON] Daily cleanup failed:', error);
    }
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[TABBY_CRON] Tabby cron service initialized:');
    console.log('[TABBY_CRON] - PENDING payment check: every 5 minutes');
    console.log('[TABBY_CRON] - AUTHORIZED payment capture: every 15 minutes');
    console.log('[TABBY_CRON] - Daily cleanup: 2 AM');
  }
}

// Note: Service is initialized explicitly in express.js
// This prevents double initialization and multiple webhook registrations
