/**
 * Tabby Cron Service
 * Handles scheduled tasks for Tabby payment processing
 */
import cron from 'node-cron';
import { getPrismaClient } from '../config/db.js';
import tabbyService from './tabbyService.js';

const prisma = getPrismaClient();

/**
 * Process AUTHORIZED payments that need to be captured
 * This handles cases where webhooks might have failed
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
            amount: payment.amount,
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
  
  // Run initial processing
  processAuthorizedPayments().catch(console.error);
  
  // Schedule every 15 minutes to process AUTHORIZED payments
  cron.schedule('*/15 * * * *', async () => {
    console.log('[TABBY_CRON] Running scheduled AUTHORIZED payment processing...');
    try {
      await processAuthorizedPayments();
    } catch (error) {
      console.error('[TABBY_CRON] Scheduled processing failed:', error);
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
    console.log('[TABBY_CRON] Tabby cron service initialized');
  }
}

// Auto-initialize when imported
initializeTabbyCronService();
