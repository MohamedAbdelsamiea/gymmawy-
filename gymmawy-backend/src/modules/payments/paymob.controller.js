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
    const baseUrl = process.env.BASE_URL || 'http://localhost:3001';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const notificationUrl = `${baseUrl}/api/paymob/webhook`;
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
        gatewayId: intentionResult.data.id,
        transactionId: null, // Will be updated when webhook is received
        paymentReference: finalSpecialReference,
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

    console.log('Received Paymob webhook:', {
      headers: req.headers,
      body: req.body,
      hmacHeader: hmacHeader
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
    
    // Strategy 1: Look by gatewayId (intention ID)
    if (orderData?.id) {
      payment = await prisma.payment.findFirst({
        where: { gatewayId: orderData.id }
      });
    }
    
    // Strategy 2: Look by payment reference (special reference)
    if (!payment && orderData?.merchant_order_id) {
      payment = await prisma.payment.findFirst({
        where: { paymentReference: orderData.merchant_order_id }
      });
    }
    
    // Strategy 3: Look by transaction ID (if this is an update)
    if (!payment && transactionId) {
      payment = await prisma.payment.findFirst({
        where: { transactionId: transactionId }
      });
    }

    if (!payment) {
      console.error('Payment not found for webhook:', {
        orderData,
        transactionId,
        webhookType: type
      });
      return res.status(404).json({ error: { message: 'Payment not found' } });
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
        transactionId: transactionId,
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
            await prisma.programmePurchase.update({
              where: { id: payment.paymentableId },
              data: { status: 'PAID' }
            });
            console.log(`Programme purchase ${payment.paymentableId} status updated to PAID`);
            break;
            
          case 'ORDER':
            await prisma.order.update({
              where: { id: payment.paymentableId },
              data: { 
                status: 'PAID',
                paymentMethod: 'PAYMOB',
                paymentReference: transactionId,
                updatedAt: new Date()
              }
            });
            console.log(`Order ${payment.paymentableId} status updated to PAID`);
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
            paymentReference: transactionId,
            updatedAt: new Date()
          }
        });
        console.log(`Legacy order ${paymentMetadata.orderId} status updated to PAID`);
      } catch (error) {
        console.error(`Failed to update legacy order status:`, error);
      }
    }

    console.log('Webhook processed successfully for payment:', {
      paymentId: payment.id,
      status: status,
      transactionId: transactionId,
      webhookType: type
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
        processedAt: new Date().toISOString()
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

    // Find the payment in our database
    // Search by either payment ID (transactionId) OR payment reference
    const payment = await prisma.payment.findFirst({
      where: {
        method: 'PAYMOB',
        OR: [
          { transactionId: paymentId }, // Search by payment ID
          ...(reference ? [{ paymentReference: reference }] : []) // Search by payment reference
        ]
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found',
        message: `No PayMob payment found with ID: ${paymentId}`
      });
    }

    // Return the payment status
    res.json({
      success: true,
      payment: {
        payment_id: payment.transactionId || payment.paymentReference,
        status: payment.status.toLowerCase(),
        amount: payment.amount,
        currency: payment.currency,
        created_at: payment.createdAt,
        updated_at: payment.processedAt || payment.updatedAt,
        provider: 'PayMob'
      },
      local_status: payment.status,
      local_metadata: payment.metadata
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
