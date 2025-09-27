import { z } from 'zod';
import tabbyService from '../../services/tabbyService.js';
import { getPrismaClient } from '../../config/db.js';
import { parseOrThrow } from '../../utils/validation.js';
import * as paymentService from './payment.service.js';
import * as subscriptionService from '../subscriptions/subscription.service.js';
import * as programmeService from '../programmes/programme.service.js';
import { TABBY_TEST_CREDENTIALS, TABBY_TEST_SCENARIOS } from '../../config/tabbyTesting.js';

const prisma = getPrismaClient();

/**
 * Check if Tabby is available for the given currency/country
 * @param {string} currency - The currency code
 * @returns {boolean} - Whether Tabby is available
 */
function isTabbyAvailable(currency) {
  return ['SAR', 'AED'].includes(currency);
}

/**
 * Detect test scenario based on buyer credentials
 */
function detectTestScenario(buyer) {
  const { email, phone } = buyer;
  
  // Check for background reject scenario
  for (const country of Object.keys(TABBY_TEST_CREDENTIALS.REJECT)) {
    const rejectCreds = TABBY_TEST_CREDENTIALS.REJECT[country];
    if (email === rejectCreds.email && phone === rejectCreds.phone) {
      return { scenario: TABBY_TEST_SCENARIOS.BACKGROUND_REJECT, country };
    }
  }
  
  // Check for payment failure scenario
  for (const country of Object.keys(TABBY_TEST_CREDENTIALS.FAILURE)) {
    const failureCreds = TABBY_TEST_CREDENTIALS.FAILURE[country];
    if (email === failureCreds.email && phone === failureCreds.phone) {
      return { scenario: TABBY_TEST_SCENARIOS.PAYMENT_FAILURE, country };
    }
  }
  
  // Check for success/corner case scenario
  for (const country of Object.keys(TABBY_TEST_CREDENTIALS.SUCCESS)) {
    const successCreds = TABBY_TEST_CREDENTIALS.SUCCESS[country];
    if (email === successCreds.email && phone === successCreds.phone) {
      return { scenario: TABBY_TEST_SCENARIOS.PAYMENT_SUCCESS, country };
    }
  }
  
  // Check for national ID upload scenario
  for (const country of Object.keys(TABBY_TEST_CREDENTIALS.NATIONAL_ID_UPLOAD)) {
    const idCreds = TABBY_TEST_CREDENTIALS.NATIONAL_ID_UPLOAD[country];
    if (email === idCreds.email && phone === idCreds.phone) {
      return { scenario: TABBY_TEST_SCENARIOS.NATIONAL_ID_UPLOAD, country };
    }
  }
  
  return { scenario: null, country: null };
}

/**
 * Create Tabby checkout session
 */
export async function createTabbyCheckout(req, res, next) {
  try {
    const schema = z.object({
      amount: z.number().positive(),
      currency: z.enum(['EGP', 'SAR', 'AED', 'USD']),
      description: z.string().optional(),
      paymentableId: z.string().uuid(),
      paymentableType: z.enum(['PRODUCT', 'PLAN', 'PROGRAMME', 'MEDICAL', 'SUBSCRIPTION']),
      lang: z.enum(['ar', 'en']).default('en'),
      buyer: z.object({
        phone: z.string(),
        email: z.string().email(),
        name: z.string(),
        dob: z.string().optional()
      }),
      shipping_address: z.object({
        line1: z.string(),
        line2: z.string().optional(),
        city: z.string(),
        state: z.string().optional(),
        zip: z.string(),
        country: z.string()
      }),
      items: z.array(z.object({
        title: z.string(),
        description: z.string().optional(),
        quantity: z.number().positive(),
        unit_price: z.string(),
        discount_amount: z.string().optional(),
        reference_id: z.string().optional(),
        image_url: z.string().url().optional(),
        product_url: z.string().url().optional(),
        category: z.string().optional()
      })),
      metadata: z.object({}).optional()
    });

    const checkoutData = parseOrThrow(schema, req.body);
    const userId = req.user.id;

    // Get user data for buyer information
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        mobileNumber: true,
        birthDate: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prepare buyer data
    let phone = checkoutData.buyer.phone || user.mobileNumber;
    
    // Format phone number for Tabby (preserve existing country codes)
    if (phone) {
      // If phone already has + prefix, keep it as is
      if (phone.startsWith('+')) {
        // Phone is already properly formatted
      } else {
        // Remove any non-digit characters
        phone = phone.replace(/\D/g, '');
        
        // If it starts with 0, remove it and add country code
        if (phone.startsWith('0')) {
          phone = phone.substring(1);
        }
        
        // Add country code if not present (assuming Egypt for now)
        if (!phone.startsWith('20')) {
          phone = '20' + phone;
        }
        
        // Add + prefix
        phone = '+' + phone;
      }
    }
    
    const buyer = {
      phone: phone,
      email: checkoutData.buyer.email || user.email,
      name: checkoutData.buyer.name || `${user.firstName} ${user.lastName}`,
      dob: checkoutData.buyer.dob || user.birthDate?.toISOString().split('T')[0]
    };

    // Debug: Log buyer data
    console.log('🔍 Buyer data for Tabby:', buyer);

    // Detect test scenario
    const { scenario, country } = detectTestScenario(buyer);
    
    if (scenario) {
      console.log(`🧪 Tabby Test Scenario Detected: ${scenario} (${country})`);
    }

    // Handle background reject scenario
    if (scenario === TABBY_TEST_SCENARIOS.BACKGROUND_REJECT) {
      const isArabic = checkoutData.lang === 'ar';
      const errorMessage = isArabic 
        ? 'نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى.'
        : 'Sorry, Tabby is unable to approve this purchase, please use an alternative payment method for your order.';
      
      return res.status(400).json({
        success: false,
        error: 'Tabby payment not available',
        message: errorMessage,
        test_scenario: scenario,
        test_country: country
      });
    }

    // Determine currency and validate support
    const currency = checkoutData.currency || 'SAR'; // Default to SAR
    const isSupportedCurrency = ['SAR', 'AED'].includes(currency);
    
    if (!isSupportedCurrency) {
      return res.status(400).json({
        success: false,
        error: 'Currency not supported',
        message: 'Tabby is only available for SAR (Saudi Arabia) and AED (UAE) currencies.'
      });
    }

    // Create order data for Tabby
    const orderData = {
      amount: checkoutData.amount,
      currency: currency, // Dynamic currency support
      description: checkoutData.description || 'Payment for order',
      buyer,
      buyer_history: {
        registered_since: user.createdAt?.toISOString() || new Date().toISOString(),
        loyalty_level: user.loyaltyPoints || 0,
        wishlist_count: 0,
        is_social_networks_connected: false,
        is_phone_number_verified: true,
        is_email_verified: true
      },
      order: {
        reference_id: checkoutData.paymentableId,
        tax_amount: '0.00',
        shipping_amount: '0.00',
        discount_amount: '0.00',
        updated_at: new Date().toISOString(),
        items: checkoutData.items
      },
      order_history: [],
      shipping_address: {
        city: checkoutData.shipping_address?.city || (currency === 'AED' ? 'Dubai' : 'Riyadh'),
        address: checkoutData.shipping_address?.line1 || 'N/A',
        zip: checkoutData.shipping_address?.zip || '00000'
      },
      items: checkoutData.items,
      meta: {
        order_id: checkoutData.paymentableId,
        customer: {
          id: user.id,
          email: user.email
        }
      },
      attachment: {}
    };

    // Debug: Log order data
    console.log('🔍 Order data for Tabby:', JSON.stringify(orderData, null, 2));

    // Create payment object for Tabby
    const payment = tabbyService.createPaymentObject(orderData);

    // Create merchant URLs with a temporary ID - we'll update them after getting the real session ID
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const tempId = `temp-${Date.now()}`;
    const merchant_urls = tabbyService.createMerchantUrls(baseUrl, tempId);

    // Create checkout session with retry logic
    let checkoutSession;
    let updatedMerchantUrls;
    try {
      checkoutSession = await tabbyService.createCheckoutSession({
        payment,
        lang: checkoutData.lang,
        merchant_urls
      });
      
      // Debug: Log the checkout session response
      console.log('🔍 Backend - Tabby checkout session response:', {
        id: checkoutSession.id,
        status: checkoutSession.status,
        configuration: checkoutSession.configuration,
        checkout_url: checkoutSession.configuration?.available_products?.installments?.[0]?.web_url
      });

      // Handle background pre-scoring results
      if (checkoutSession.status === 'rejected') {
        console.log('❌ Tabby background pre-scoring failed - payment method not available');
        const isArabic = checkoutData.lang === 'ar';
        const errorMessage = isArabic 
          ? 'نأسف، تابي غير قادرة على الموافقة على هذه العملية. الرجاء استخدام طريقة دفع أخرى.'
          : 'Sorry, Tabby is unable to approve this purchase, please use an alternative payment method for your order.';
        
        return res.status(400).json({
          success: false,
          error: 'Tabby payment not available',
          message: errorMessage,
          reason: 'Background pre-scoring failed',
          tabby_status: checkoutSession.status,
          test_scenario: scenario,
          test_country: country
        });
      }

      if (checkoutSession.status === 'created') {
        console.log('✅ Tabby background pre-scoring passed - payment method available');
      }

      // Now create merchant URLs with the actual session ID
      updatedMerchantUrls = tabbyService.createMerchantUrls(baseUrl, checkoutSession.id);
      console.log('🔍 Updated merchant URLs with session ID:', updatedMerchantUrls);
    } catch (error) {
      console.error('🔍 Backend - Tabby API completely unavailable:', error.message);
      
      // Return a user-friendly error response
      return res.status(503).json({
        success: false,
        error: 'Payment service temporarily unavailable',
        message: 'We are experiencing connectivity issues with our payment provider. Please try again in a few minutes.',
        details: 'Tabby API is currently unreachable. This is a temporary network issue.'
      });
    }

    // Create payment record in database
    console.log('🔍 Creating payment record with data:', {
      userId,
      amount: checkoutData.amount,
      currency: checkoutData.currency,
      method: 'TABBY',
      transactionId: checkoutSession.payment?.id,
      paymentableId: checkoutData.paymentableId,
      paymentableType: checkoutData.paymentableType
    });

    const paymentRecord = await paymentService.createPayment({
      userId,
      amount: checkoutData.amount,
      currency: checkoutData.currency,
      method: 'TABBY',
      transactionId: checkoutSession.payment?.id,
      paymentableId: checkoutData.paymentableId,
      paymentableType: checkoutData.paymentableType,
        metadata: {
          ...checkoutData.metadata,
          tabby_session_id: checkoutSession.id,
          tabby_payment_id: checkoutSession.payment?.id,
          checkout_url: checkoutSession.configuration?.available_products?.installments?.[0]?.web_url,
          success_url: updatedMerchantUrls.success,
          cancel_url: updatedMerchantUrls.cancel,
          failure_url: updatedMerchantUrls.failure,
          test_scenario: scenario,
          test_country: country,
          is_test_payment: !!scenario
        }
    });

    console.log('✅ Payment record created:', {
      id: paymentRecord.id,
      paymentReference: paymentRecord.paymentReference,
      transactionId: paymentRecord.transactionId,
      status: paymentRecord.status
    });

    res.status(201).json({
      success: true,
      checkout_session: {
        id: checkoutSession.id,
        payment_id: checkoutSession.payment?.id,
        status: checkoutSession.status,
        checkout_url: checkoutSession.configuration?.available_products?.installments?.[0]?.web_url,
        expires_at: checkoutSession.expires_at
      },
      payment: paymentRecord
    });

  } catch (error) {
    console.error('Tabby checkout creation error:', error);
    next(error);
  }
}

/**
 * Handle Tabby webhook
 */
export async function handleTabbyWebhook(req, res, next) {
  try {
    const signature = req.headers['x-tabby-signature'] || req.headers['x-signature'];
    const payload = JSON.stringify(req.body);

    // Verify webhook signature (implement based on Tabby documentation)
    const isValid = tabbyService.verifyWebhookSignature(payload, signature);
    
    if (!isValid) {
      console.error('Invalid Tabby webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const webhookData = req.body;
    console.log('Tabby webhook received:', webhookData);

    // Handle different webhook events
    switch (webhookData.event) {
      case 'payment.created':
        await handlePaymentCreated(webhookData);
        break;
      case 'payment.updated':
        await handlePaymentUpdated(webhookData);
        break;
      case 'payment.authorized':
        await handlePaymentAuthorized(webhookData);
        break;
      case 'payment.closed':
        await handlePaymentClosed(webhookData);
        break;
      case 'payment.rejected':
        await handlePaymentRejected(webhookData);
        break;
      default:
        console.log(`Unhandled Tabby webhook event: ${webhookData.event}`);
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Tabby webhook handling error:', error);
    next(error);
  }
}

/**
 * Handle payment created webhook
 */
async function handlePaymentCreated(webhookData) {
  console.log('Payment created:', webhookData.payment.id);
  // Payment is created, no action needed
}

/**
 * Handle payment updated webhook
 */
async function handlePaymentUpdated(webhookData) {
  const paymentId = webhookData.payment.id;
  const status = webhookData.payment.status;
  
  console.log(`Payment ${paymentId} updated to status: ${status}`);
  
  // Find payment in database by transaction ID
  const payment = await prisma.payment.findFirst({
    where: { transactionId: paymentId }
  });

  if (payment) {
    const mappedStatus = tabbyService.mapPaymentStatus(status);
    await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: mappedStatus,
        metadata: {
          ...payment.metadata,
          tabby_status: status,
          updated_at: new Date().toISOString()
        }
      }
    });
  }
}

/**
 * Handle payment authorized webhook
 */
async function handlePaymentAuthorized(webhookData) {
  const paymentId = webhookData.payment.id;
  
  console.log(`Payment ${paymentId} authorized`);
  
  // Find payment in database
  const payment = await prisma.payment.findFirst({
    where: { transactionId: paymentId }
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: 'SUCCESS',
        processedAt: new Date(),
        metadata: {
          ...payment.metadata,
          tabby_status: 'AUTHORIZED',
          authorized_at: new Date().toISOString()
        }
      }
    });

    // Create the actual purchase record based on payment type
    try {
      await createPurchaseRecord(payment);
      console.log(`Purchase record created for authorized payment ${payment.paymentReference}`);
    } catch (error) {
      console.error(`Failed to create purchase record for authorized payment ${payment.paymentReference}:`, error);
      // Don't fail the webhook if purchase creation fails - we can retry later
    }

    // Automatically capture the payment
    try {
      console.log(`Auto-capturing payment ${paymentId}...`);
      const captureResult = await tabbyService.capturePayment(paymentId, {
        amount: payment.amount,
        reference_id: `auto-capture-${payment.paymentReference}`
      });
      
      console.log(`Payment ${paymentId} auto-captured successfully:`, captureResult.id);
      
      // Update payment status to reflect capture
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          metadata: {
            ...payment.metadata,
            tabby_status: 'CLOSED',
            captured_at: new Date().toISOString(),
            capture_id: captureResult.id
          }
        }
      });
      
    } catch (error) {
      console.error(`Failed to auto-capture payment ${paymentId}:`, error);
      // Don't fail the webhook if capture fails - we can retry later
    }

    // Trigger any post-authorization logic (send confirmation emails, etc.)
    console.log(`Payment ${payment.paymentReference} has been authorized`);
  }
}

/**
 * Handle payment closed webhook
 */
async function handlePaymentClosed(webhookData) {
  const paymentId = webhookData.payment.id;
  
  console.log(`Payment ${paymentId} closed`);
  
  // Find payment in database
  const payment = await prisma.payment.findFirst({
    where: { transactionId: paymentId }
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: 'SUCCESS',
        processedAt: new Date(),
        metadata: {
          ...payment.metadata,
          tabby_status: 'CLOSED',
          closed_at: new Date().toISOString()
        }
      }
    });

    // Create the actual purchase record based on payment type
    try {
      await createPurchaseRecord(payment);
      console.log(`Purchase record created for payment ${payment.paymentReference}`);
    } catch (error) {
      console.error(`Failed to create purchase record for payment ${payment.paymentReference}:`, error);
      // Don't fail the webhook if purchase creation fails - we can retry later
    }

    // Trigger any post-completion logic
    console.log(`Payment ${payment.paymentReference} has been completed`);
  }
}

/**
 * Create purchase record based on payment type
 * Note: Payment is COMPLETED but purchase remains PENDING until admin approval
 */
async function createPurchaseRecord(payment) {
  const { paymentableType, paymentableId, userId, amount, currency } = payment;
  
  console.log(`Creating purchase record for ${paymentableType} ${paymentableId} for user ${userId}`);
  
  if (paymentableType === 'SUBSCRIPTION') {
    // Create subscription purchase - will be PENDING until admin approval
    const subscriptionData = {
      planId: paymentableId,
      paymentMethod: 'TABBY',
      transactionId: payment.transactionId,
      currency: currency,
      isMedical: false, // Default to normal subscription
      subscriptionPeriodDays: 30, // Default period
      giftPeriodDays: 0,
      planName: payment.metadata?.planName || 'Subscription Plan',
      planDescription: payment.metadata?.planDescription || 'Tabby Payment Subscription'
    };
    
    const subscription = await subscriptionService.createSubscriptionWithPayment(userId, subscriptionData);
    console.log(`Subscription created (PENDING approval): ${subscription.id}`);
    
  } else if (paymentableType === 'PROGRAMME') {
    // Create programme purchase - will be PENDING until admin approval
    const programmeData = {
      paymentMethod: 'TABBY',
      transactionId: payment.transactionId,
      currency: currency,
      amount: amount
    };
    
    const programmePurchase = await programmeService.purchaseProgrammeWithPayment(userId, paymentableId, programmeData);
    console.log(`Programme purchase created (PENDING approval): ${programmePurchase.id}`);
    
    // Update the purchase status to PENDING explicitly
    await prisma.programmePurchase.update({
      where: { id: programmePurchase.id },
      data: { 
        status: 'PENDING',
        metadata: {
          ...programmePurchase.metadata,
          payment_completed: true,
          payment_method: 'TABBY',
          payment_transaction_id: payment.transactionId,
          requires_admin_approval: true,
          created_at: new Date().toISOString()
        }
      }
    });
    
    console.log(`Programme purchase ${programmePurchase.id} set to PENDING status - awaiting admin approval`);
    
  } else {
    console.warn(`Unknown paymentable type: ${paymentableType}. No purchase record created.`);
  }
}

/**
 * Handle payment rejected webhook
 */
async function handlePaymentRejected(webhookData) {
  const paymentId = webhookData.payment.id;
  
  console.log(`Payment ${paymentId} rejected`);
  
  // Find payment in database
  const payment = await prisma.payment.findFirst({
    where: { transactionId: paymentId }
  });

  if (payment) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: 'FAILED',
        metadata: {
          ...payment.metadata,
          tabby_status: 'REJECTED',
          rejected_at: new Date().toISOString(),
          rejection_reason: webhookData.payment.rejection_reason
        }
      }
    });

    console.log(`Payment ${payment.paymentReference} has been rejected`);
  }
}

/**
 * Get Tabby payment status
 */
export async function getTabbyPaymentStatus(req, res, next) {
  try {
    const { paymentId } = req.params;

    console.log(`🔍 Getting payment status for Tabby payment ID: ${paymentId}`);

    // First, try to find payment by Tabby transaction ID (payment ID)
    let payment = await prisma.payment.findFirst({
      where: { transactionId: paymentId }
    });

    console.log(`🔍 Search by transactionId (${paymentId}):`, payment ? 'Found' : 'Not found');

    // If not found, try to find by session ID in metadata
    if (!payment) {
      payment = await prisma.payment.findFirst({
        where: { 
          metadata: {
            path: ['tabby_session_id'],
            equals: paymentId
          }
        }
      });
      console.log(`🔍 Search by sessionId in metadata (${paymentId}):`, payment ? 'Found' : 'Not found');
    }

    // If still not found, try to find by payment reference
    if (!payment) {
      payment = await prisma.payment.findFirst({
        where: { paymentReference: paymentId }
      });
      console.log(`🔍 Search by paymentReference (${paymentId}):`, payment ? 'Found' : 'Not found');
    }

    // Debug: List all payments in database
    const allPayments = await prisma.payment.findMany({
      select: {
        id: true,
        paymentReference: true,
        transactionId: true,
        method: true,
        status: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    console.log('🔍 Recent payments in database:', allPayments);

    if (!payment) {
      console.log(`❌ Payment not found in database for Tabby payment ID: ${paymentId}`);
      return res.status(404).json({ 
        error: 'Payment not found',
        message: 'Payment record not found in database. This might be a new payment that hasn\'t been processed yet.',
        paymentId: paymentId
      });
    }

    console.log(`✅ Payment found: ${payment.id}, status: ${payment.status}`);

    // Return the payment status from our database
    res.json({
      payment_id: paymentId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      created_at: payment.createdAt,
      updated_at: payment.updatedAt,
      metadata: payment.metadata
    });

  } catch (error) {
    console.error('Tabby payment status error:', error);
    next(error);
  }
}

/**
 * Capture Tabby payment
 */
export async function captureTabbyPayment(req, res, next) {
  try {
    const { paymentId } = req.params;
    const schema = z.object({
      amount: z.string().optional(),
      tax_amount: z.string().optional(),
      shipping_amount: z.string().optional(),
      discount_amount: z.string().optional(),
      updated_at: z.string().optional()
    });

    const captureData = parseOrThrow(schema, req.body);

    // Capture payment via Tabby
    const result = await tabbyService.capturePayment(paymentId, captureData);

    // Update local payment status
    const payment = await prisma.payment.findFirst({
      where: { transactionId: paymentId }
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'COMPLETED',
          processedAt: new Date(),
          metadata: {
            ...payment.metadata,
            tabby_status: result.status,
            captured_at: new Date().toISOString(),
            capture_amount: captureData.amount
          }
        }
      });
    }

    res.json({
      success: true,
      payment: result
    });

  } catch (error) {
    console.error('Tabby payment capture error:', error);
    next(error);
  }
}

/**
 * Refund Tabby payment
 */
export async function refundTabbyPayment(req, res, next) {
  try {
    const { paymentId } = req.params;
    const schema = z.object({
      amount: z.string(),
      reason: z.string().optional(),
      comment: z.string().optional()
    });

    const refundData = parseOrThrow(schema, req.body);

    // Refund payment via Tabby
    const result = await tabbyService.refundPayment(paymentId, refundData);

    // Update local payment status
    const payment = await prisma.payment.findFirst({
      where: { transactionId: paymentId }
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'REFUNDED',
          metadata: {
            ...payment.metadata,
            tabby_status: result.status,
            refunded_at: new Date().toISOString(),
            refund_amount: refundData.amount,
            refund_reason: refundData.reason
          }
        }
      });
    }

    res.json({
      success: true,
      payment: result
    });

  } catch (error) {
    console.error('Tabby payment refund error:', error);
    next(error);
  }
}

/**
 * Close Tabby payment
 */
export async function closeTabbyPayment(req, res, next) {
  try {
    const { paymentId } = req.params;

    // Close payment via Tabby
    const result = await tabbyService.closePayment(paymentId);

    // Update local payment status
    const payment = await prisma.payment.findFirst({
      where: { transactionId: paymentId }
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          status: 'COMPLETED',
          processedAt: new Date(),
          metadata: {
            ...payment.metadata,
            tabby_status: result.status,
            closed_at: new Date().toISOString()
          }
        }
      });
    }

    res.json({
      success: true,
      payment: result
    });

  } catch (error) {
    console.error('Tabby payment close error:', error);
    next(error);
  }
}

/**
 * Setup Tabby webhook
 */
export async function setupTabbyWebhook(req, res, next) {
  try {
    const schema = z.object({
      url: z.string().url(),
      is_test: z.boolean().default(true),
      events: z.array(z.string()).default(['payment.*'])
    });

    const webhookData = parseOrThrow(schema, req.body);

    const webhook = await tabbyService.createWebhook(webhookData);

    res.json({
      success: true,
      webhook
    });

  } catch (error) {
    console.error('Tabby webhook setup error:', error);
    next(error);
  }
}

/**
 * Check if Tabby is available for the given currency
 */
export async function checkTabbyAvailability(req, res, next) {
  try {
    const { currency } = req.query;
    
    if (!currency) {
      return res.status(400).json({ 
        error: 'Currency parameter is required',
        message: 'Please provide a currency code (e.g., SAR, AED)'
      });
    }

    const isAvailable = isTabbyAvailable(currency);
    const merchantCode = isAvailable ? (currency === 'SAR' ? 'CCSAU' : 'GUAE') : null;
    
    res.json({
      available: isAvailable,
      currency: currency,
      merchant_code: merchantCode,
      supported_countries: ['Saudi Arabia (SAR)', 'UAE (AED)'],
      message: isAvailable 
        ? `Tabby is available for ${currency} payments`
        : `Tabby is not available for ${currency}. Only SAR and AED are supported.`
    });
  } catch (error) {
    console.error('Tabby availability check error:', error);
    next(error);
  }
}
