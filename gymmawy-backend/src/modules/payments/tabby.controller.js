import { z } from 'zod';
import tabbyService from '../../services/tabbyService.js';
import { getPrismaClient } from '../../config/db.js';
import { parseOrThrow } from '../../utils/validation.js';
import { getFrontendUrl } from '../../utils/urls.js';
import paymentService from './payment.service.js';
import * as subscriptionService from '../subscriptions/subscription.service.js';
import * as programmeService from '../programmes/programme.service.js';
import { activateSubscription } from '../subscriptions/subscription.service.js';
import { approveProgrammePurchase } from '../programmes/programme.service.js';
import { activateOrder } from '../orders/order.service.js';
import { sendProgrammeDeliveryEmail } from '../programmes/programmeEmail.service.js';
import { TABBY_TEST_CREDENTIALS, TABBY_TEST_SCENARIOS } from '../../config/tabbyTesting.js';
import { buildTabbyHistory } from './tabbyHistoryService.js';

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
      paymentableType: z.enum(['PROGRAMME', 'SUBSCRIPTION', 'ORDER']),
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
      }).optional(),
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

    // Build buyer_history and order_history from actual user data
    console.log('🔍 Building buyer and order history for Tabby...');
    const { buyer_history, order_history } = await buildTabbyHistory(userId);

    // Create order data for Tabby
    const orderData = {
      amount: checkoutData.amount,
      currency: currency, // Dynamic currency support
      description: checkoutData.description || 'Payment for order',
      buyer,
      buyer_history, // Real buyer history from database
      order: {
        reference_id: checkoutData.paymentableId,
        tax_amount: '0.00',
        shipping_amount: '0.00',
        discount_amount: '0.00',
        updated_at: new Date().toISOString(),
        items: checkoutData.items
      },
      order_history, // Real order history from database
      // Only include shipping_address if provided (for physical items)
      ...(checkoutData.shipping_address ? {
        shipping_address: {
          city: checkoutData.shipping_address.city || (currency === 'AED' ? 'Dubai' : 'Riyadh'),
          address: checkoutData.shipping_address.line1 || 'N/A',
          zip: checkoutData.shipping_address.zip || '00000'
        }
      } : {}),
      items: checkoutData.items,
      meta: {
        order_id: checkoutData.paymentableId,
        customer: {
          id: user.id,
          email: user.email
        }
      }
    };

    // Debug: Log order data
    console.log('🔍 Order data for Tabby:', JSON.stringify(orderData, null, 2));

    // Create payment object for Tabby
    const payment = tabbyService.createPaymentObject(orderData);
    
    // Debug: Log the final payment object being sent to Tabby API
    console.log('🔍 FINAL PAYMENT OBJECT FOR TABBY API:');
    console.log('📦 Payment Object:', JSON.stringify(payment, null, 2));
    console.log('📱 Buyer Phone:', payment.buyer?.phone);
    console.log('💰 Currency:', payment.currency);
    console.log('🌍 Shipping Country:', payment.shipping_address?.country || 'No shipping address');
    console.log('🏙️ Shipping City:', payment.shipping_address?.city || 'No shipping address');
    console.log('📧 Buyer Email:', payment.buyer?.email);
    console.log('👤 Buyer Name:', payment.buyer?.name);
    console.log('🏠 Shipping Address:', payment.shipping_address);
    console.log('📦 Order Items:', payment.items);
    console.log('💵 Amount:', payment.amount);

    // Create merchant URLs with a temporary ID - we'll update them after getting the real session ID
    const baseUrl = getFrontendUrl();
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
      
      // Debug: Log the full response structure
      console.log('🔍 Backend - Full Tabby response structure:', JSON.stringify(checkoutSession, null, 2));
      console.log('🔍 Backend - Available keys in checkoutSession:', Object.keys(checkoutSession || {}));
      console.log('🔍 Backend - Available keys in configuration:', Object.keys(checkoutSession?.configuration || {}));
      console.log('🔍 Backend - Available products:', checkoutSession?.configuration?.available_products);
      console.log('🔍 Backend - Installments:', checkoutSession?.configuration?.available_products?.installments);

      // Handle background pre-scoring results
      if (checkoutSession.status === 'rejected') {
        console.log('❌ TABBY REJECTION - Background pre-scoring failed');
        console.log('📦 Rejected Session Data:', JSON.stringify(checkoutSession, null, 2));
        console.log('🔧 Configuration:', checkoutSession.configuration);
        console.log('❌ Rejection Reason:', checkoutSession.configuration?.products?.installments?.rejection_reason);
        console.log('📱 Buyer Phone Sent:', payment.buyer?.phone);
        console.log('💰 Currency Sent:', payment.currency);
        console.log('🌍 Country Sent:', payment.shipping_address?.country || 'No shipping address');
        console.log('🏙️ City Sent:', payment.shipping_address?.city || 'No shipping address');
        
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
          tabby_rejection_reason: checkoutSession.configuration?.products?.installments?.rejection_reason,
          test_scenario: scenario,
          test_country: country
        });
      }

      if (checkoutSession.status === 'created') {
        console.log('✅ Tabby background pre-scoring passed - payment method available');
      }

      // Now create merchant URLs with the actual payment ID (not session ID)
      // Tabby redirects with payment_id, so we must use checkoutSession.payment.id
      updatedMerchantUrls = tabbyService.createMerchantUrls(baseUrl, checkoutSession.payment.id);
      console.log('🔍 Updated merchant URLs with payment ID:', updatedMerchantUrls);
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
    console.log('Tabby webhook received:', JSON.stringify(webhookData, null, 2));

    // Tabby may send different webhook structures
    // Check for event field or derive event from payment status
    let eventType = webhookData.event;
    
    // If no event field, derive from payment data
    if (!eventType && webhookData.id && webhookData.status) {
      // This is a direct payment object, derive event from status
      console.log('[TABBY] Webhook is payment object, deriving event from status:', webhookData.status);
      
      switch (webhookData.status?.toUpperCase()) {
        case 'CREATED':
          eventType = 'payment.created';
          break;
        case 'AUTHORIZED':
          eventType = 'payment.authorized';
          break;
        case 'CLOSED':
          eventType = 'payment.closed';
          break;
        case 'REJECTED':
          eventType = 'payment.rejected';
          break;
        case 'EXPIRED':
          eventType = 'payment.expired';
          break;
        default:
          eventType = 'payment.updated';
      }
      
      // Wrap payment in expected structure
      webhookData.event = eventType;
      if (!webhookData.payment) {
        webhookData.payment = { ...webhookData };
      }
    }

    console.log('[TABBY] Processing webhook event:', eventType);

    // Handle different webhook events
    switch (eventType) {
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
      case 'payment.expired':
        await handlePaymentRejected(webhookData);
        break;
      default:
        console.log(`[TABBY] Unhandled webhook event: ${eventType}`);
        console.log('[TABBY] Full webhook data:', JSON.stringify(webhookData, null, 2));
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

    // Update the related entity status based on paymentableType for successful payments
    if (payment.paymentableType && payment.paymentableId) {
      try {
        switch (payment.paymentableType) {
          case 'SUBSCRIPTION':
            await prisma.subscription.update({
              where: { id: payment.paymentableId },
              data: { status: 'PAID' }
            });
            console.log(`Subscription ${payment.paymentableId} status updated to PAID`);
            
            // Award loyalty points for subscription
            try {
              const { awardLoyaltyPointsForSubscription } = await import('../../utils/loyaltyPoints.js');
              const loyaltyResult = await awardLoyaltyPointsForSubscription(payment.paymentableId);
              if (loyaltyResult.success) {
                console.log(`✅ Loyalty points awarded for subscription ${payment.paymentableId}: ${loyaltyResult.loyaltyPoints} points`);
              }
            } catch (loyaltyError) {
              console.error(`❌ Failed to award loyalty points for subscription ${payment.paymentableId}:`, loyaltyError);
            }
            break;
            
          case 'PROGRAMME':
            await prisma.programmePurchase.update({
              where: { id: payment.paymentableId },
              data: { status: 'COMPLETE' }
            });
            console.log(`Programme purchase ${payment.paymentableId} status updated to COMPLETE`);
            
            // Award loyalty points for programme purchase
            try {
              const { awardLoyaltyPointsForProgramme } = await import('../../utils/loyaltyPoints.js');
              const loyaltyResult = await awardLoyaltyPointsForProgramme(payment.paymentableId);
              if (loyaltyResult.success) {
                console.log(`✅ Loyalty points awarded for programme purchase ${payment.paymentableId}: ${loyaltyResult.loyaltyPoints} points`);
              }
            } catch (loyaltyError) {
              console.error(`❌ Failed to award loyalty points for programme purchase ${payment.paymentableId}:`, loyaltyError);
            }
            break;
            
          case 'ORDER':
            await prisma.order.update({
              where: { id: payment.paymentableId },
              data: { 
                status: 'PAID',
                paymentMethod: 'TABBY',
                paymentReference: payment.transactionId,
                updatedAt: new Date()
              }
            });
            console.log(`Order ${payment.paymentableId} status updated to PAID`);
            
            // Award loyalty points for order
            try {
              const { awardLoyaltyPointsForOrder } = await import('../../utils/loyaltyPoints.js');
              const loyaltyResult = await awardLoyaltyPointsForOrder(payment.paymentableId);
              if (loyaltyResult.success) {
                console.log(`✅ Loyalty points awarded for order ${payment.paymentableId}: ${loyaltyResult.loyaltyPoints} points`);
              }
            } catch (loyaltyError) {
              console.error(`❌ Failed to award loyalty points for order ${payment.paymentableId}:`, loyaltyError);
            }
            
            // Create OTO shipment for paid orders
            try {
              const { createOTOShipment } = await import('../../modules/shipping/shipping.service.js');
              const shipmentResult = await createOTOShipment(payment.paymentableId);
              
              if (shipmentResult.success) {
                console.log(`✅ OTO shipment created for order ${payment.paymentableId}:`, shipmentResult.shipmentId);
              } else if (shipmentResult.reason === 'NOT_ENOUGH_CREDIT') {
                console.log(`⚠️ Not enough OTO credit for order ${payment.paymentableId}. Required: ${shipmentResult.requiredAmount} SAR, Available: ${shipmentResult.currentBalance} SAR`);
              } else {
                console.error(`❌ Failed to create OTO shipment for order ${payment.paymentableId}:`, shipmentResult.message);
              }
            } catch (error) {
              console.error(`❌ Failed to create OTO shipment for order ${payment.paymentableId}:`, error);
              // Don't fail the payment process if shipment creation fails
            }
            break;
            
          default:
            console.log(`Unknown paymentableType: ${payment.paymentableType}`);
        }
      } catch (error) {
        console.error(`Failed to update ${payment.paymentableType} status to PAID:`, error);
      }
    }

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
        amount: payment.amount.toString(), // Convert Decimal to string as required by Tabby API
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
 * Manual capture of AUTHORIZED payment
 */
export async function manualCapturePayment(req, res, next) {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    // Find the payment
    const payment = await prisma.payment.findFirst({
      where: {
        transactionId: paymentId,
        userId: userId
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }

    // Check if payment is AUTHORIZED
    if (payment.metadata?.tabby_status !== 'AUTHORIZED') {
      return res.status(400).json({
        success: false,
        error: 'Payment is not in AUTHORIZED status',
        current_status: payment.metadata?.tabby_status
      });
    }

    // Attempt to capture the payment
    const captureResult = await tabbyService.capturePayment(paymentId, {
      amount: payment.amount.toString(), // Convert Decimal to string as required by Tabby API
      reference_id: `manual-capture-${payment.paymentReference}`
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
          manual_capture: true
        }
      }
    });

    res.json({
      success: true,
      message: 'Payment captured successfully',
      capture_id: captureResult.id
    });

  } catch (error) {
    console.error('Manual capture error:', error);
    next(error);
  }
}

/**
 * Get payment status from Tabby API
 */
export async function getTabbyPaymentStatus(req, res, next) {
  try {
    const { paymentId } = req.params;
    const userId = req.user.id;

    // Find the payment in our database
    // Search by either payment ID (transactionId) OR session ID (in metadata)
    const payment = await prisma.payment.findFirst({
      where: {
        userId: userId,
        method: 'TABBY',
        OR: [
          { transactionId: paymentId }, // Search by payment ID
          { 
            metadata: {
              path: ['tabby_session_id'],
              equals: paymentId
            }
          } // Search by session ID
        ]
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
        message: `No Tabby payment found with ID: ${paymentId}`
      });
    }

    // Get status from Tabby API using the actual payment ID (transactionId)
    // Even if the user passed a session ID, we use the real payment ID for the API call
    const tabbyPaymentId = payment.transactionId;
    const tabbyStatus = await tabbyService.getPayment(tabbyPaymentId);

    res.json({
      success: true,
      payment: {
        payment_id: tabbyStatus.id,
        session_id: payment.metadata?.tabby_session_id,
        status: tabbyStatus.status,
        amount: tabbyStatus.amount,
        currency: tabbyStatus.currency,
        created_at: tabbyStatus.created_at,
        updated_at: tabbyStatus.updated_at,
        captures: tabbyStatus.captures || []
      },
      local_status: payment.status,
      local_metadata: payment.metadata
    });

  } catch (error) {
    console.error('Get payment status error:', error);
    next(error);
  }
}

/**
 * Public payment verification endpoint (no authentication required)
 * This is used when users are redirected from payment gateways
 */
export async function verifyPaymentPublic(req, res, next) {
  try {
    const { paymentId } = req.params;
    const { reference } = req.query;

    // Find the payment in our database
    // Search by either payment ID (transactionId) OR session ID (in metadata) OR payment reference
    const payment = await prisma.payment.findFirst({
      where: {
        method: 'TABBY',
        OR: [
          { transactionId: paymentId }, // Search by payment ID
          { 
            metadata: {
              path: ['tabby_session_id'],
              equals: paymentId
            }
          }, // Search by session ID
          ...(reference ? [{ paymentReference: reference }] : []) // Search by payment reference
        ]
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
        message: `No Tabby payment found with ID: ${paymentId}`
      });
    }

    // Get status from Tabby API using the actual payment ID (transactionId)
    const tabbyPaymentId = payment.transactionId;
    let tabbyStatus = null;
    
    try {
      tabbyStatus = await tabbyService.getPayment(tabbyPaymentId);
    } catch (error) {
      console.error('Failed to fetch Tabby payment status:', error);
      // Return local status if Tabby API is unavailable
      return res.json({
        success: true,
        payment: {
          payment_id: payment.transactionId,
          session_id: payment.metadata?.tabby_session_id,
          status: payment.status.toLowerCase(),
          amount: payment.amount,
          currency: payment.currency,
          created_at: payment.createdAt,
          updated_at: payment.processedAt || payment.updatedAt,
          captures: []
        },
        local_status: payment.status,
        local_metadata: payment.metadata,
        api_unavailable: true
      });
    }

    res.json({
      success: true,
      payment: {
        payment_id: tabbyStatus.id,
        session_id: payment.metadata?.tabby_session_id,
        status: tabbyStatus.status,
        amount: tabbyStatus.amount,
        currency: tabbyStatus.currency,
        created_at: tabbyStatus.created_at,
        updated_at: tabbyStatus.updated_at,
        captures: tabbyStatus.captures || []
      },
      local_status: payment.status,
      local_metadata: payment.metadata
    });

  } catch (error) {
    console.error('Public payment verification error:', error);
    next(error);
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

    // Update the related entity status based on paymentableType for successful payments
    if (payment.paymentableType && payment.paymentableId) {
      try {
        switch (payment.paymentableType) {
          case 'SUBSCRIPTION':
            await prisma.subscription.update({
              where: { id: payment.paymentableId },
              data: { status: 'PAID' }
            });
            console.log(`Subscription ${payment.paymentableId} status updated to PAID`);
            
            // Award loyalty points for subscription
            try {
              const { awardLoyaltyPointsForSubscription } = await import('../../utils/loyaltyPoints.js');
              const loyaltyResult = await awardLoyaltyPointsForSubscription(payment.paymentableId);
              if (loyaltyResult.success) {
                console.log(`✅ Loyalty points awarded for subscription ${payment.paymentableId}: ${loyaltyResult.loyaltyPoints} points`);
              }
            } catch (loyaltyError) {
              console.error(`❌ Failed to award loyalty points for subscription ${payment.paymentableId}:`, loyaltyError);
            }
            break;
            
          case 'PROGRAMME':
            await prisma.programmePurchase.update({
              where: { id: payment.paymentableId },
              data: { status: 'COMPLETE' }
            });
            console.log(`Programme purchase ${payment.paymentableId} status updated to COMPLETE`);
            
            // Award loyalty points for programme purchase
            try {
              const { awardLoyaltyPointsForProgramme } = await import('../../utils/loyaltyPoints.js');
              const loyaltyResult = await awardLoyaltyPointsForProgramme(payment.paymentableId);
              if (loyaltyResult.success) {
                console.log(`✅ Loyalty points awarded for programme purchase ${payment.paymentableId}: ${loyaltyResult.loyaltyPoints} points`);
              }
            } catch (loyaltyError) {
              console.error(`❌ Failed to award loyalty points for programme purchase ${payment.paymentableId}:`, loyaltyError);
            }
            break;
            
          case 'ORDER':
            await prisma.order.update({
              where: { id: payment.paymentableId },
              data: { 
                status: 'PAID',
                paymentMethod: 'TABBY',
                paymentReference: payment.transactionId,
                updatedAt: new Date()
              }
            });
            console.log(`Order ${payment.paymentableId} status updated to PAID`);
            
            // Award loyalty points for order
            try {
              const { awardLoyaltyPointsForOrder } = await import('../../utils/loyaltyPoints.js');
              const loyaltyResult = await awardLoyaltyPointsForOrder(payment.paymentableId);
              if (loyaltyResult.success) {
                console.log(`✅ Loyalty points awarded for order ${payment.paymentableId}: ${loyaltyResult.loyaltyPoints} points`);
              }
            } catch (loyaltyError) {
              console.error(`❌ Failed to award loyalty points for order ${payment.paymentableId}:`, loyaltyError);
            }
            
            // Create OTO shipment for paid orders
            try {
              const { createOTOShipment } = await import('../../modules/shipping/shipping.service.js');
              const shipmentResult = await createOTOShipment(payment.paymentableId);
              
              if (shipmentResult.success) {
                console.log(`✅ OTO shipment created for order ${payment.paymentableId}:`, shipmentResult.shipmentId);
              } else if (shipmentResult.reason === 'NOT_ENOUGH_CREDIT') {
                console.log(`⚠️ Not enough OTO credit for order ${payment.paymentableId}. Required: ${shipmentResult.requiredAmount} SAR, Available: ${shipmentResult.currentBalance} SAR`);
              } else {
                console.error(`❌ Failed to create OTO shipment for order ${payment.paymentableId}:`, shipmentResult.message);
              }
            } catch (error) {
              console.error(`❌ Failed to create OTO shipment for order ${payment.paymentableId}:`, error);
              // Don't fail the payment process if shipment creation fails
            }
            break;
            
          default:
            console.log(`Unknown paymentableType: ${payment.paymentableType}`);
        }
      } catch (error) {
        console.error(`Failed to update ${payment.paymentableType} status to PAID:`, error);
      }
    }

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
    
    // Auto-approve subscription and award Gymmawy Coins for successful payment
    try {
      console.log(`🎁 Auto-approving subscription ${subscription.id} and awarding Gymmawy Coins`);
      await activateSubscription(subscription.id);
      console.log(`✅ Subscription ${subscription.id} auto-approved and Gymmawy Coins awarded`);
    } catch (error) {
      console.error(`❌ Failed to auto-approve subscription ${subscription.id}:`, error.message);
      // Don't fail the webhook if auto-approval fails - admin can approve manually
    }
    
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
    
    // Auto-approve programme purchase and award Gymmawy Coins for successful payment
    try {
      console.log(`🎁 Auto-approving programme purchase ${programmePurchase.id} and awarding Gymmawy Coins`);
      await approveProgrammePurchase(programmePurchase.id);
      console.log(`✅ Programme purchase ${programmePurchase.id} auto-approved and Gymmawy Coins awarded`);
      
      // Send programme delivery email
      try {
        console.log(`📧 Sending programme delivery email for purchase ${programmePurchase.id}`);
        const emailResult = await sendProgrammeDeliveryEmail(programmePurchase.id);
        if (emailResult.success) {
          console.log(`✅ Programme delivery email sent successfully`);
        } else {
          console.warn(`⚠️ Failed to send programme delivery email: ${emailResult.message}`);
        }
      } catch (emailError) {
        console.error(`❌ Error sending programme delivery email:`, emailError.message);
        // Don't fail the approval if email sending fails
      }
    } catch (error) {
      console.error(`❌ Failed to auto-approve programme purchase ${programmePurchase.id}:`, error.message);
      // Don't fail the webhook if auto-approval fails - admin can approve manually
    }
    
    console.log(`Programme purchase ${programmePurchase.id} set to PENDING status - awaiting admin approval`);
    
  } else if (paymentableType === 'ORDER') {
    // For orders, we need to activate them and award Gymmawy Coins
    try {
      console.log(`🎁 Auto-activating order ${paymentableId} and awarding Gymmawy Coins`);
      await activateOrder(paymentableId, 'system'); // Use 'system' as adminId for automated approval
      console.log(`✅ Order ${paymentableId} auto-activated and Gymmawy Coins awarded`);
    } catch (error) {
      console.error(`❌ Failed to auto-activate order ${paymentableId}:`, error.message);
      // Don't fail the webhook if auto-activation fails - admin can approve manually
    }
    
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
 * Setup Tabby webhook for both UAE and KSA
 */
export async function setupTabbyWebhook(req, res, next) {
  try {
    const schema = z.object({
      url: z.string().url(),
      is_test: z.boolean().default(true),
      events: z.array(z.string()).default(['payment.*'])
    });

    const webhookData = parseOrThrow(schema, req.body);
    const results = [];

    // Setup webhook for Saudi Arabia (SAR)
    try {
      console.log('Setting up webhook for Saudi Arabia (SAR)...');
      const sarWebhook = await tabbyService.createWebhook(webhookData, 'SAR');
      results.push({
        country: 'Saudi Arabia',
        currency: 'SAR',
        merchant_code: tabbyService.getMerchantCode('SAR'),
        webhook: sarWebhook
      });
      console.log('✅ SAR webhook created successfully');
    } catch (error) {
      console.error('❌ Failed to create SAR webhook:', error.message);
      results.push({
        country: 'Saudi Arabia',
        currency: 'SAR',
        merchant_code: tabbyService.getMerchantCode('SAR'),
        error: error.message
      });
    }

    // Setup webhook for UAE (AED)
    try {
      console.log('Setting up webhook for UAE (AED)...');
      const aedWebhook = await tabbyService.createWebhook(webhookData, 'AED');
      results.push({
        country: 'UAE',
        currency: 'AED',
        merchant_code: tabbyService.getMerchantCode('AED'),
        webhook: aedWebhook
      });
      console.log('✅ AED webhook created successfully');
    } catch (error) {
      console.error('❌ Failed to create AED webhook:', error.message);
      results.push({
        country: 'UAE',
        currency: 'AED',
        merchant_code: tabbyService.getMerchantCode('AED'),
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Webhook setup completed for both countries',
      results
    });

  } catch (error) {
    console.error('Tabby webhook setup error:', error);
    next(error);
  }
}

/**
 * List all webhooks for both UAE and KSA
 */
export async function listTabbyWebhooks(req, res, next) {
  try {
    const results = [];

    // Get webhooks for Saudi Arabia (SAR)
    try {
      console.log('Fetching webhooks for Saudi Arabia (SAR)...');
      const sarWebhooks = await tabbyService.getWebhooks('SAR');
      results.push({
        country: 'Saudi Arabia',
        currency: 'SAR',
        merchant_code: tabbyService.getMerchantCode('SAR'),
        webhooks: sarWebhooks
      });
      console.log('✅ SAR webhooks fetched successfully');
    } catch (error) {
      console.error('❌ Failed to fetch SAR webhooks:', error.message);
      results.push({
        country: 'Saudi Arabia',
        currency: 'SAR',
        merchant_code: tabbyService.getMerchantCode('SAR'),
        error: error.message
      });
    }

    // Get webhooks for UAE (AED)
    try {
      console.log('Fetching webhooks for UAE (AED)...');
      const aedWebhooks = await tabbyService.getWebhooks('AED');
      results.push({
        country: 'UAE',
        currency: 'AED',
        merchant_code: tabbyService.getMerchantCode('AED'),
        webhooks: aedWebhooks
      });
      console.log('✅ AED webhooks fetched successfully');
    } catch (error) {
      console.error('❌ Failed to fetch AED webhooks:', error.message);
      results.push({
        country: 'UAE',
        currency: 'AED',
        merchant_code: tabbyService.getMerchantCode('AED'),
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Webhook status retrieved for both countries',
      results
    });

  } catch (error) {
    console.error('Tabby webhook listing error:', error);
    next(error);
  }
}

/**
 * Perform Tabby pre-scoring check
 */
export async function performPrescoring(req, res, next) {
  try {
    const { orderData, type } = req.body;
    
    console.log('🔍 PRESCORING ENDPOINT - Received request:', { orderData, type });
    
    // Create payment object for Tabby
    const payment = tabbyService.createPaymentObject(orderData);
    
    // Debug: Log the payment object being sent to Tabby API
    console.log('🔍 PRESCORING ENDPOINT - Payment object:', JSON.stringify(payment, null, 2));
    console.log('📱 Buyer Phone:', payment.buyer?.phone);
    console.log('💰 Currency:', payment.currency);
    console.log('🌍 Shipping Country:', payment.shipping_address?.country || 'No shipping address');
    console.log('🏙️ Shipping City:', payment.shipping_address?.city || 'No shipping address');
    
    // Create merchant URLs with a temporary ID
    const baseUrl = getFrontendUrl();
    const tempId = `prescore-${Date.now()}`;
    const merchant_urls = tabbyService.createMerchantUrls(baseUrl, tempId);
    
    // Create checkout data for pre-scoring
    const checkoutData = {
      payment,
      merchant_urls,
      lang: 'en'
    };
    
    console.log('🔍 PRESCORING ENDPOINT - Checkout data:', JSON.stringify(checkoutData, null, 2));
    
    // Call Tabby API for pre-scoring
    const checkoutSession = await tabbyService.createCheckoutSession(checkoutData);
    
    console.log('🔍 PRESCORING ENDPOINT - Tabby response:', JSON.stringify(checkoutSession, null, 2));
    console.log('✅ Session Status:', checkoutSession.status);
    console.log('🔧 Configuration:', checkoutSession.configuration);
    console.log('❌ Rejection Reason:', checkoutSession.configuration?.products?.installments?.rejection_reason);
    
    // Return the pre-scoring result
    res.json({
      success: true,
      status: checkoutSession.status,
      configuration: checkoutSession.configuration,
      rejection_reason: checkoutSession.configuration?.products?.installments?.rejection_reason,
      session_id: checkoutSession.id
    });
    
  } catch (error) {
    console.error('❌ PRESCORING ENDPOINT - Error:', error);
    console.log('📦 Error Response:', error.response?.data);
    console.log('📦 Error Status:', error.response?.status);
    
    // Handle 400 errors as rejection
    if (error.response?.status === 400) {
      console.log('❌ PRESCORING ENDPOINT - Tabby rejected with 400 error');
      return res.json({
        success: false,
        status: 'rejected',
        rejection_reason: 'not_available',
        error: error.message,
        errorDetails: error.response.data
      });
    }
    
    // For other errors, return error
    res.status(500).json({
      success: false,
      error: 'Pre-scoring failed',
      message: error.message
    });
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
