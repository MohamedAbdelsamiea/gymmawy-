import * as rewardsService from './rewards.service.js';
import { getPrismaClient } from '../../config/db.js';

const prisma = getPrismaClient();

/**
 * Validate redemption request
 */
export async function validateRedemption(req, res) {
  try {
    const { rewardId, category, pointsRequired } = req.body;
    const userId = req.user.id;

    console.log('🔍 Validate redemption request:', {
      rewardId,
      category,
      pointsRequired,
      userId,
      body: req.body
    });

    if (!rewardId || !category || !pointsRequired) {
      console.log('❌ Missing required fields:', { rewardId, category, pointsRequired });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: rewardId, category, pointsRequired'
      });
    }

    const validation = await rewardsService.validateRedemption(userId, rewardId, category, pointsRequired);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }

    res.json({
      success: true,
      data: {
        valid: true,
        userPoints: validation.userPoints,
        pointsRequired: pointsRequired,
        canRedeem: validation.userPoints >= pointsRequired
      }
    });
  } catch (error) {
    console.error('Validate redemption error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Process redemption
 */
export async function processRedemption(req, res) {
  try {
    const { rewardId, category, shippingAddress } = req.body;
    const userId = req.user.id;
    const language = req.headers['accept-language'] || 'en';

    if (!rewardId || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: rewardId, category'
      });
    }

    // Basic shipping address validation
    if (!shippingAddress || !shippingAddress.firstName || !shippingAddress.lastName || !shippingAddress.phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required shipping information: firstName, lastName, phone'
      });
    }

    const result = await rewardsService.processRedemption(userId, rewardId, category, shippingAddress, language);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      data: {
        order: result.data.order,
        loyaltyTransaction: result.data.loyaltyTransaction,
        remainingPoints: result.data.remainingPoints,
        message: 'Reward redeemed successfully!'
      }
    });
  } catch (error) {
    console.error('Process redemption error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}

/**
 * Get redemption history
 */
export async function getRedemptionHistory(req, res) {
  try {
    const userId = req.user.id;
    const query = {
      page: req.query.page || 1,
      limit: req.query.limit || 10,
      category: req.query.category
    };

    const result = await rewardsService.getRedemptionHistory(userId, query);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get redemption history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
