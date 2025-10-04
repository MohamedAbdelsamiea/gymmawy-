import paymentService from './payment.service.js';
import { getPrismaClient } from '../../config/db.js';

const prisma = getPrismaClient();

/**
 * Unified payment controller that supports multiple payment providers
 */

/**
 * Get available payment providers
 * GET /api/payments/providers
 */
export const getPaymentProviders = async (req, res) => {
  try {
    const providers = paymentService.getAvailableProviders();
    
    res.status(200).json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Error fetching payment providers:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch payment providers' }
    });
  }
};

/**
 * Create a payment with the specified provider
 * POST /api/payments/create
 */
export const createPayment = async (req, res) => {
  try {
    const {
      provider = 'paymob',
      amount,
      currency = 'SAR',
      paymentMethod = 'card',
      items = [],
      billingData,
      customer,
      extras = {},
      orderId,
      subscriptionPlanId
    } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: { message: 'Amount is required and must be greater than 0' }
      });
    }

    // Validate currency and payment method for Paymob
    if (provider === 'paymob') {
      if (currency !== 'SAR') {
        return res.status(400).json({
          error: { message: 'Paymob only accepts SAR currency' }
        });
      }
      if (paymentMethod !== 'card' && paymentMethod !== 'apple_pay') {
        return res.status(400).json({
          error: { message: 'Paymob only accepts card and apple_pay payment methods' }
        });
      }
    }

    if (!billingData || !customer) {
      return res.status(400).json({
        error: { message: 'Billing data and customer information are required' }
      });
    }

    // Prepare payment data
    const paymentData = {
      amount,
      currency,
      paymentMethod,
      items,
      billingData,
      customer,
      extras: {
        ...extras,
        userId: req.user?.id || null,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      },
      orderId,
      subscriptionPlanId,
      userId: req.user?.id || null
    };

    // Create payment using the specified provider
    const result = await paymentService.createPayment(paymentData, provider);

    res.status(201).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error creating payment:', error);
    res.status(500).json({
      error: { message: error.message || 'Failed to create payment' }
    });
  }
};

/**
 * Get payment status
 * GET /api/payments/:paymentId/status
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { provider = 'paymob' } = req.query;

    const result = await paymentService.getPaymentStatus(paymentId, provider);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error fetching payment status:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch payment status' }
    });
  }
};

/**
 * Process refund
 * POST /api/payments/refund
 */
export const processRefund = async (req, res) => {
  try {
    const { transactionId, amount, provider = 'paymob' } = req.body;

    if (!transactionId || !amount) {
      return res.status(400).json({
        error: { message: 'Transaction ID and amount are required' }
      });
    }

    const result = await paymentService.processRefund(transactionId, amount, provider);

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      error: { message: 'Failed to process refund' }
    });
  }
};

/**
 * Get payment history
 * GET /api/payments/history
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, provider } = req.query;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: { message: 'Authentication required' }
      });
    }

    const filters = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      provider
    };

    const result = await paymentService.getPaymentHistory(userId, filters);

    res.status(200).json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch payment history' }
    });
  }
};

/**
 * Handle webhook from any payment provider
 * POST /api/payments/webhook/:provider
 */
export const handleWebhook = async (req, res) => {
  try {
    const { provider } = req.params;

    switch (provider.toLowerCase()) {
      case 'paymob':
        // Import and use Paymob webhook handler
        const { handleWebhook: paymobWebhook } = await import('./paymob.controller.js');
        return paymobWebhook(req, res);
      
      case 'tabby':
        // Import and use Tabby webhook handler
        const { handleWebhook: tabbyWebhook } = await import('./tabby.controller.js');
        return tabbyWebhook(req, res);
      
      default:
        return res.status(400).json({
          error: { message: `Unsupported payment provider: ${provider}` }
        });
    }

  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({
      error: { message: 'Failed to process webhook' }
    });
  }
};

/**
 * Get payment statistics
 * GET /api/payments/stats
 */
export const getPaymentStats = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: { message: 'Authentication required' }
      });
    }

    // Get payment statistics
    const [
      totalPayments,
      successfulPayments,
      failedPayments,
      totalAmount,
      monthlyStats
    ] = await Promise.all([
      prisma.payment.count({
        where: { userId }
      }),
      prisma.payment.count({
        where: { userId, status: 'SUCCESS' }
      }),
      prisma.payment.count({
        where: { userId, status: 'FAILED' }
      }),
      prisma.payment.aggregate({
        where: { userId, status: 'SUCCESS' },
        _sum: { amount: true }
      }),
      prisma.payment.groupBy({
        by: ['createdAt'],
        where: { userId },
        _count: { id: true },
        _sum: { amount: true },
        orderBy: { createdAt: 'desc' },
        take: 12
      })
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalPayments,
        successfulPayments,
        failedPayments,
        successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
        totalAmount: totalAmount._sum.amount || 0,
        monthlyStats: monthlyStats.map(stat => ({
          month: stat.createdAt,
          count: stat._count.id,
          amount: stat._sum.amount || 0
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching payment stats:', error);
    res.status(500).json({
      error: { message: 'Failed to fetch payment statistics' }
    });
  }
};
