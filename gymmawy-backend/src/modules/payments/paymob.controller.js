import paymobService from '../../services/paymobService.js';
import { convertPrice as convertBackendPrice } from '../currency/currency.service.js';
import { getPrismaClient } from '../../config/db.js';
import { v4 as uuidv4 } from 'uuid';
import { generateUserFriendlyPaymentReference } from '../../utils/paymentReference.js';

const prisma = getPrismaClient();

/**
 * Create a payment intention using Paymob's Unified Intention API
 * POST /api/paymob/create-intention
 */
export const createIntention = async (req, res) => {
  try {
    const {
      amount,
      currency = 'SAR',
      paymentMethod = 'card',
      items = [],
      billingData,
      customer,
      extras = {},
      specialReference,
      orderId,
      subscriptionPlanId
    } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: { message: 'Amount is required and must be greater than 0' }
      });
    }

    // Allow USD/AED input then convert to SAR for Paymob
    let finalAmount = amount;
    let finalCurrency = currency;
    if (currency !== 'SAR') {
      if (currency === 'USD' || currency === 'AED') {
        try {
          finalAmount = await convertBackendPrice(amount, currency, 'SAR');
          finalCurrency = 'SAR';
        } catch (error) {
          console.error('Currency conversion failed, using fallback rates:', error);
          // Fallback to simple conversion rates if API fails
          const fallbackRates = {
            'USD': 3.75, // 1 USD = 3.75 SAR
            'AED': 1.02  // 1 AED = 1.02 SAR
          };
          finalAmount = Math.round(amount * fallbackRates[currency] * 100) / 100;
          finalCurrency = 'SAR';
        }
      } else {
        return res.status(400).json({
          error: { message: 'Paymob supports SAR only; allowed input currencies: USD, AED (auto-converted)' }
        });
      }
    }

    // Validate payment method
    if (paymentMethod !== 'card' && paymentMethod !== 'apple_pay') {
      return res.status(400).json({
        error: { message: 'Paymob only accepts card and apple_pay payment methods' }
      });
    }

    if (!billingData || !customer) {
      return res.status(400).json({
        error: { message: 'Billing data and customer information are required' }
      });
    }

    // Convert items amounts if currency was converted
    let finalItems = items;
    if (currency !== finalCurrency) {
      const conversionRate = finalAmount / amount;
      finalItems = items.map(item => ({
        ...item,
        amount: Math.round(item.amount * conversionRate * 100) / 100
      }));
    }

    // Validate payment data
    const validation = paymobService.validatePaymentData({
      amount: finalAmount,
      currency: finalCurrency,
      paymentMethod,
      items: finalItems,
      billingData,
      customer,
      extras
    });

    if (!validation.isValid) {
      return res.status(400).json({
        error: { message: 'Validation failed', details: validation.errors }
      });
    }

    // Generate user-friendly payment reference if not provided
    const finalSpecialReference = specialReference || await generateUserFriendlyPaymentReference();

    // Prepare webhook URLs
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Fix webhook URL construction - BASE_URL already includes /api
    const notificationUrl = baseUrl.includes('/api') 
      ? `${baseUrl}/paymob/webhook` 
      : `${baseUrl}/api/paymob/webhook`;
    const redirectionUrl = `${frontendUrl}/payment/success?payment_id=${finalSpecialReference}`;

    // Create payment intention
    const intentionResult = await paymobService.createIntention({
      amount: finalAmount,
      currency: finalCurrency,
      paymentMethod,
      items: finalItems,
      billingData,
      customer,
      extras: {
        ...extras,
        orderId: orderId || null,
        subscriptionPlanId: subscriptionPlanId || null,
        userId: req.user?.id || null
      },
      specialReference: finalSpecialReference,
      notificationUrl,
      redirectionUrl
    });

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        amount: finalAmount,
        currency: 'SAR', // Always use SAR for Paymob
        method: 'PAYMOB',
        status: 'PENDING',
        gatewayId: String(intentionResult.data.id), // Ensure gatewayId is stored as string
        transactionId: null, // Will be updated when webhook is received
        paymentReference: finalSpecialReference,
        paymentableId: billingData.orderId || billingData.subscriptionId || billingData.programmeId,
        paymentableType: billingData.orderId ? 'ORDER' : billingData.subscriptionId ? 'SUBSCRIPTION' : billingData.programmeId ? 'PROGRAMME' : 'ORDER',
        userId: req.user?.id || null,
        customerInfo: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: billingData.phoneNumber
        },
        metadata: {
          intentionId: intentionResult.data.id,
          clientSecret: intentionResult.data.client_secret,
          paymentMethod: paymentMethod,
          billingData: billingData,
          items: items,
          checkoutUrl: intentionResult.checkoutUrl,
          orderId: orderId || null,
          subscriptionPlanId: subscriptionPlanId || null,
          extras: extras
        }
      }
    });

    res.status(201).json({
      success: true,
      data: {
        intentionId: intentionResult.data.id,
        clientSecret: intentionResult.data.client_secret,
        checkoutUrl: intentionResult.checkoutUrl,
        paymentId: payment.id,
        specialReference: finalSpecialReference
      }
    });

  } catch (error) {
    console.error('Error creating Paymob intention:', error);
    res.status(500).json({
      error: { message: error.message || 'Failed to create payment intention' }
    });
  }
};

/**
 * Handle Paymob webhook callbacks
 * POST /api/paymob/webhook
 */
export const handleWebhook = async (req, res) => {
  try {
    const rawPayload = JSON.stringify(req.body);
    // Paymob sends HMAC in different header names, check both
    const hmacHeader = req.headers['x-paymob-hmac'] || req.headers['x-paymob-signature'] || req.headers['hmac'];

    console.log('🔔 Received Paymob webhook:', {
      timestamp: new Date().toISOString(),
      headers: {
        'content-type': req.headers['content-type'],
        'user-agent': req.headers['user-agent'],
        'x-paymob-hmac': hmacHeader ? 'present' : 'missing',
        'x-forwarded-for': req.headers['x-forwarded-for'],
        'x-real-ip': req.headers['x-real-ip']
      },
      body: req.body,
      payloadLength: rawPayload.length
    });

    // Process webhook with HMAC verification
    const webhookResult = paymobService.processWebhook(rawPayload, hmacHeader);
    
    if (!webhookResult.success) {
      console.error('Webhook processing failed:', webhookResult.error);
      return res.status(400).json({ error: { message: webhookResult.error } });
    }
    
    const webhookData = webhookResult.data;

    // Extract transaction details
    const {
      type,
      obj: {
        id: transactionId,
        amount_cents: amountCents,
        currency,
        success,
        is_3d_secure,
        pending,
        is_auth,
        is_capture,
        is_voided,
        is_refunded,
        is_standalone_payment,
        integration_id,
        profile_id,
        has_parent_transaction,
        order: orderData,
        created_at,
        data: transactionData,
        error_occured,
        is_live,
        other_endpoint_reference,
        refunded_amount_cents,
        captured_amount_cents,
        updated_at,
        is_settled,
        bill_balanced,
        is_bill,
        owner,
        parent_transaction,
        source_data: sourceData,
        card_tokens: cardTokens
      }
    } = webhookData;

    // Find the payment record using multiple lookup strategies
    let payment = null;
    
    console.log('🔍 Searching for payment with webhook data:', {
      orderData,
      transactionId,
      webhookType: type,
      searchStrategies: []
    });
    
    // Strategy 1: Look by gatewayId (intention ID)
    if (orderData?.id) {
      console.log('🔍 Strategy 1: Searching by gatewayId:', orderData.id);
      payment = await prisma.payment.findFirst({
        where: { gatewayId: String(orderData.id) } // Convert to string
      });
      if (payment) console.log('✅ Found payment by gatewayId:', payment.id);
    }
    
    // Strategy 2: Look by payment reference (special reference)
    if (!payment && orderData?.merchant_order_id) {
      console.log('🔍 Strategy 2: Searching by paymentReference:', orderData.merchant_order_id);
      payment = await prisma.payment.findFirst({
        where: { paymentReference: orderData.merchant_order_id }
      });
      if (payment) console.log('✅ Found payment by paymentReference:', payment.id);
    }
    
    // Strategy 3: Look by transaction ID (if this is an update)
    if (!payment && transactionId) {
      console.log('🔍 Strategy 3: Searching by transactionId:', transactionId);
      payment = await prisma.payment.findFirst({
        where: { transactionId: String(transactionId) } // Convert to string
      });
      if (payment) console.log('✅ Found payment by transactionId:', payment.id);
    }

    // Strategy 4: Look by any of the IDs in a broader search
    if (!payment) {
      console.log('🔍 Strategy 4: Broad search across all payment fields');
      const searchTerms = [
        orderData?.id,
        orderData?.merchant_order_id,
        transactionId,
        webhookData.obj?.other_endpoint_reference
      ].filter(Boolean);
      
      if (searchTerms.length > 0) {
        payment = await prisma.payment.findFirst({
          where: {
            OR: [
              { gatewayId: { in: searchTerms.map(term => String(term)) } }, // Convert all to strings
              { paymentReference: { in: searchTerms } },
              { transactionId: { in: searchTerms } }
            ]
          }
        });
        if (payment) console.log('✅ Found payment by broad search:', payment.id);
      }
    }

    if (!payment) {
      console.error('❌ Payment not found for webhook after all strategies:', {
        orderData,
        transactionId,
        webhookType: type,
        searchTerms: [
          orderData?.id,
          orderData?.merchant_order_id,
          transactionId,
          webhookData.obj?.other_endpoint_reference
        ].filter(Boolean)
      });
      
      // Log recent payments for debugging
      const recentPayments = await prisma.payment.findMany({
        where: { method: 'PAYMOB' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          gatewayId: true,
          paymentReference: true,
          transactionId: true,
          status: true,
          createdAt: true
        }
      });
      
      console.log('📋 Recent Paymob payments for debugging:', recentPayments);
      
      return res.status(404).json({ 
        error: { 
          message: 'Payment not found',
          debug: {
            searchedTerms: [
              orderData?.id,
              orderData?.merchant_order_id,
              transactionId,
              webhookData.obj?.other_endpoint_reference
            ].filter(Boolean),
            recentPayments: recentPayments
          }
        } 
      });
    }

    console.log('Found payment for webhook:', {
      paymentId: payment.id,
      currentStatus: payment.status,
      gatewayId: payment.gatewayId,
      transactionId: payment.transactionId
    });

    // Determine payment status based on webhook data
    let status = 'PENDING';
    let statusReason = '';
    
    if (success && !error_occured) {
      if (is_refunded) {
        status = 'REFUNDED';
        statusReason = 'Payment refunded';
      } else if (is_voided) {
        status = 'FAILED';
        statusReason = 'Payment voided';
      } else {
        status = 'SUCCESS';
        statusReason = 'Payment successful';
      }
    } else if (error_occured) {
      status = 'FAILED';
      statusReason = 'Payment failed with error';
    } else if (is_voided) {
      status = 'FAILED';
      statusReason = 'Payment voided';
    } else if (is_refunded) {
      status = 'REFUNDED';
      statusReason = 'Payment refunded';
    } else {
      status = 'PENDING';
      statusReason = 'Payment pending';
    }

    console.log('Updating payment status:', {
      paymentId: payment.id,
      oldStatus: payment.status,
      newStatus: status,
      reason: statusReason,
      success: success,
      errorOccurred: error_occured,
      isVoided: is_voided,
      isRefunded: is_refunded
    });

    // Update payment record with comprehensive data
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: status,
        transactionId: String(transactionId), // Convert to string
        processedAt: new Date(),
        metadata: {
          ...payment.metadata,
          webhookData: webhookData,
          transactionDetails: {
            amountCents: amountCents,
            success: success,
            is3DSecure: is_3d_secure,
            pending: pending,
            isAuth: is_auth,
            isCapture: is_capture,
            isVoided: is_voided,
            isRefunded: is_refunded,
            integrationId: integration_id,
            errorOccurred: error_occured,
            isLive: is_live,
            statusReason: statusReason,
            webhookReceivedAt: new Date().toISOString(),
            webhookType: type
          }
        }
      }
    });

    console.log('Payment updated successfully:', {
      paymentId: updatedPayment.id,
      newStatus: updatedPayment.status,
      transactionId: updatedPayment.transactionId,
      processedAt: updatedPayment.processedAt
    });

    // Update the related entity status based on paymentableType for successful payments
    if (status === 'SUCCESS' && payment.paymentableType && payment.paymentableId) {
      try {
        switch (payment.paymentableType) {
          case 'SUBSCRIPTION':
            await prisma.subscription.update({
              where: { id: payment.paymentableId },
              data: { status: 'PAID' }
            });
            console.log(`Subscription ${payment.paymentableId} status updated to PAID`);
            break;
            
          case 'PROGRAMME':
            // Automatically approve programme purchase for successful gateway payments
            try {
              const { approvePayment } = await import('../paymentApproval.service.js');
              const approvalResult = await approvePayment(updatedPayment.id, payment.userId);
              console.log(`✅ Programme purchase ${payment.paymentableId} automatically approved for gateway payment`);
            } catch (approvalError) {
              console.error(`❌ Failed to auto-approve programme purchase ${payment.paymentableId}:`, approvalError);
            }
            break;
            
          case 'ORDER':
        await prisma.order.update({
          where: { id: payment.paymentableId },
          data: { 
            status: 'PAID',
            paymentMethod: 'PAYMOB',
            paymentReference: String(transactionId), // Convert to string
            updatedAt: new Date()
          }
        });
            console.log(`Order ${payment.paymentableId} status updated to PAID`);
            
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

    // Legacy support: Handle old metadata-based order updates
    const paymentMetadata = payment.metadata || {};
    if (status === 'SUCCESS' && paymentMetadata.orderId && !payment.paymentableType) {
      try {
        await prisma.order.update({
          where: { id: paymentMetadata.orderId },
          data: {
            status: 'PAID',
            paymentMethod: 'PAYMOB',
            paymentReference: String(transactionId), // Convert to string
            updatedAt: new Date()
          }
        });
        console.log(`Legacy order ${paymentMetadata.orderId} status updated to PAID`);
        
        // Create OTO shipment for legacy paid orders
        try {
          const { createOTOShipment } = await import('../../modules/shipping/shipping.service.js');
          const shipmentResult = await createOTOShipment(paymentMetadata.orderId);
          console.log(`✅ OTO shipment created for legacy order ${paymentMetadata.orderId}:`, shipmentResult.shipmentId);
        } catch (error) {
          console.error(`❌ Failed to create OTO shipment for legacy order ${paymentMetadata.orderId}:`, error);
          // Don't fail the payment process if shipment creation fails
        }
      } catch (error) {
        console.error(`Failed to update legacy order status:`, error);
      }
    }

    console.log('✅ Webhook processed successfully for payment:', {
      paymentId: payment.id,
      status: status,
      transactionId: transactionId,
      webhookType: type,
      paymentableType: payment.paymentableType,
      paymentableId: payment.paymentableId
    });

    // Return comprehensive response
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed successfully',
      data: {
        paymentId: payment.id,
        status: status,
        transactionId: transactionId,
        webhookType: type,
        processedAt: new Date().toISOString(),
        paymentableType: payment.paymentableType,
        paymentableId: payment.paymentableId
      }
    });

  } catch (error) {
    console.error('Error processing Paymob webhook:', error);
    
    // Return detailed error response for debugging
    res.status(500).json({
      error: { 
        message: 'Failed to process webhook',
        details: error.message,
        timestamp: new Date().toISOString()
      }
    });
  }
};

/**
 * Get payment intention status
 * GET /api/paymob/intention/:intentionId/status
 */
export const getIntentionStatus = async (req, res) => {
  try {
    const { intentionId } = req.params;

    const payment = await prisma.payment.findFirst({
      where: { gatewayId: intentionId }
    });

    if (!payment) {
      return res.status(404).json({
        error: { message: 'Payment not found' }
      });
    }

    // Get latest status from Paymob API
    const statusResult = await paymobService.getIntentionStatus(intentionId);

    res.status(200).json({
      success: true,
      data: {
        local: payment,
        remote: statusResult.data
      }
    });

  } catch (error) {
    console.error('Error fetching intention status:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch intention status' }
    });
  }
};

/**
 * Refund a transaction
 * POST /api/paymob/refund
 */
export const refundTransaction = async (req, res) => {
  try {
    const { transactionId, amount } = req.body;

    if (!transactionId || !amount) {
      return res.status(400).json({
        error: { message: 'Transaction ID and amount are required' }
      });
    }

    const refundResult = await paymobService.refundTransaction(transactionId, amount);

    // Update payment status
    const payment = await prisma.payment.findFirst({
      where: { transactionId }
    });

    if (payment) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REFUNDED',
          processedAt: new Date(),
          metadata: {
            ...payment.metadata,
            refundDetails: {
              refundedAmount: amount,
              refundedAt: new Date(),
              refundTransactionId: refundResult.data.id
            }
          }
        }
      });
    }

    res.status(200).json({
      success: true,
      data: refundResult.data
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      error: { message: 'Failed to process refund' }
    });
  }
};

/**
 * Test webhook endpoint for debugging
 * POST /api/paymob/test-webhook
 */
export const testWebhook = async (req, res) => {
  try {
    const { paymentId, transactionId, orderId } = req.body;

    console.log('🧪 Testing webhook with data:', { paymentId, transactionId, orderId });

    // Find payment by any of the provided IDs
    let payment = null;
    const searchTerms = [paymentId, transactionId, orderId].filter(Boolean);

    if (searchTerms.length > 0) {
      payment = await prisma.payment.findFirst({
        where: {
          OR: [
            { id: { in: searchTerms } },
            { gatewayId: { in: searchTerms } },
            { paymentReference: { in: searchTerms } },
            { transactionId: { in: searchTerms } }
          ]
        }
      });
    }

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
        searchedTerms: searchTerms
      });
    }

    // Simulate webhook data
    const mockWebhookData = {
      type: 'TRANSACTION',
      obj: {
        id: transactionId || payment.transactionId || 'PAY-TEST-123',
        amount_cents: Math.round(payment.amount * 100),
        currency: payment.currency,
        success: true,
        error_occured: false,
        is_voided: false,
        is_refunded: false,
        order: {
          id: payment.gatewayId,
          merchant_order_id: payment.paymentReference
        }
      }
    };

    console.log('🧪 Simulating webhook with data:', mockWebhookData);

    // Process the webhook
    const webhookResult = paymobService.processWebhook(JSON.stringify(mockWebhookData), null);
    
    if (!webhookResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Webhook processing failed',
        details: webhookResult.error
      });
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        transactionId: mockWebhookData.obj.id,
        processedAt: new Date(),
        metadata: {
          ...payment.metadata,
          testWebhook: true,
          testWebhookAt: new Date().toISOString()
        }
      }
    });

    res.json({
      success: true,
      message: 'Test webhook processed successfully',
      payment: {
        id: updatedPayment.id,
        status: updatedPayment.status,
        transactionId: updatedPayment.transactionId,
        gatewayId: updatedPayment.gatewayId,
        paymentReference: updatedPayment.paymentReference
      }
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Test webhook failed',
      details: error.message
    });
  }
};

/**
 * Get webhook status and recent webhook logs
 * GET /api/paymob/webhook-status
 */
export const getWebhookStatus = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent Paymob payments with their status
    const recentPayments = await prisma.payment.findMany({
      where: { method: 'PAYMOB' },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      select: {
        id: true,
        gatewayId: true,
        paymentReference: true,
        transactionId: true,
        status: true,
        createdAt: true,
        processedAt: true,
        metadata: true
      }
    });

    // Count payments by status
    const statusCounts = await prisma.payment.groupBy({
      by: ['status'],
      where: { method: 'PAYMOB' },
      _count: { status: true }
    });

    // Get pending payments that might need attention
    const pendingPayments = await prisma.payment.findMany({
      where: { 
        method: 'PAYMOB',
        status: 'PENDING',
        createdAt: {
          lt: new Date(Date.now() - 30 * 60 * 1000) // Older than 30 minutes
        }
      },
      select: {
        id: true,
        gatewayId: true,
        paymentReference: true,
        status: true,
        createdAt: true,
        paymentableType: true,
        paymentableId: true
      }
    });

    res.json({
      success: true,
      data: {
        recentPayments,
        statusCounts,
        pendingPayments,
        webhookUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/api/paymob/webhook`,
        lastChecked: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching webhook status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch webhook status',
      details: error.message
    });
  }
};

/**
 * Get payment history for a user
 * GET /api/paymob/payments
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: { message: 'Authentication required' }
      });
    }

    const whereClause = { userId, method: 'PAYMOB' };
    if (status) {
      whereClause.status = status;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: parseInt(limit),
      select: {
        id: true,
        amount: true,
        currency: true,
        method: true,
        status: true,
        paymentReference: true,
        transactionId: true,
        createdAt: true,
        processedAt: true,
        customerInfo: true,
        metadata: true
      }
    });

    const total = await prisma.payment.count({
      where: whereClause
    });

    res.status(200).json({
      success: true,
      data: {
        payments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch payment history' }
    });
  }
};

/**
 * Public payment verification endpoint (no authentication required)
 * This is used when users are redirected from PayMob payment gateway
 */
export const verifyPaymentPublic = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { reference } = req.query;

    console.log('🔍 Paymob payment verification request:', {
      paymentId,
      reference,
      timestamp: new Date().toISOString()
    });

    // Find the payment in our database
    // Search by multiple criteria to handle different scenarios
    const payment = await prisma.payment.findFirst({
      where: {
        method: 'PAYMOB',
        OR: [
          { transactionId: paymentId }, // Search by payment ID (from webhook)
          { paymentReference: paymentId }, // Search by payment reference (from redirect URL)
          { gatewayId: paymentId }, // Search by gateway ID (intention ID)
          ...(reference ? [{ paymentReference: reference }] : []) // Search by reference parameter
        ]
      }
    });

    console.log('🔍 Payment search result:', {
      found: !!payment,
      paymentId: payment?.id,
      transactionId: payment?.transactionId,
      paymentReference: payment?.paymentReference,
      gatewayId: payment?.gatewayId,
      status: payment?.status
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
        message: `No PayMob payment found with ID: ${paymentId}`
      });
    }

    // If payment is still PENDING and we have the Paymob payment ID, 
    // we can infer the status from the URL parameters if available
    let finalStatus = payment.status;
    if (payment.status === 'PENDING' && paymentId.startsWith('PAY-')) {
      // This is likely a successful payment since Paymob redirected here
      // We'll mark it as SUCCESS but note that webhook hasn't been processed yet
      finalStatus = 'SUCCESS';
      console.log('🔍 Payment still PENDING, but Paymob redirected to success page. Marking as SUCCESS.');
    }

    // Get order reference (subscription number or programme purchase number)
    let orderReference = null;
    let orderType = null;
    
    if (payment.paymentableType === 'SUBSCRIPTION' && payment.paymentableId) {
      const subscription = await prisma.subscription.findUnique({
        where: { id: payment.paymentableId },
        select: { subscriptionNumber: true }
      });
      if (subscription) {
        orderReference = subscription.subscriptionNumber;
        orderType = 'Subscription';
      }
    } else if (payment.paymentableType === 'PROGRAMME' && payment.paymentableId) {
      const programmePurchase = await prisma.programmePurchase.findUnique({
        where: { id: payment.paymentableId },
        select: { purchaseNumber: true }
      });
      if (programmePurchase) {
        orderReference = programmePurchase.purchaseNumber;
        orderType = 'Programme';
      }
    } else if (payment.paymentableType === 'ORDER' && payment.paymentableId) {
      const order = await prisma.order.findUnique({
        where: { id: payment.paymentableId },
        select: { orderNumber: true }
      });
      if (order) {
        orderReference = order.orderNumber;
        orderType = 'Order';
      }
    }

    // Return the payment status
    res.json({
      success: true,
      payment: {
        payment_id: payment.transactionId || payment.paymentReference,
        status: finalStatus.toLowerCase(),
        amount: payment.amount,
        currency: payment.currency,
        created_at: payment.createdAt,
        updated_at: payment.processedAt || payment.updatedAt,
        provider: 'PayMob'
      },
      local_status: payment.status,
      webhook_processed: payment.status !== 'PENDING',
      local_metadata: payment.metadata,
      order_reference: orderReference,
      order_type: orderType
    });

  } catch (error) {
    console.error('Public PayMob payment verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Failed to verify payment'
    });
  }
};
