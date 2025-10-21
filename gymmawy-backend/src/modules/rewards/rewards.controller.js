import * as rewardsService from './rewards.service.js';
import { getPrismaClient } from '../../config/db.js';

const prisma = getPrismaClient();

/**
 * Validate redemption request
 */
export async function validateRedemption(req, res) {
  try {
    const { itemId, category, pointsRequired } = req.body;
    const userId = req.user.id;

    console.log('🔍 Validate redemption request:', {
      itemId,
      category,
      pointsRequired,
      userId,
      body: req.body
    });

    if (!itemId || !category || !pointsRequired) {
      console.log('❌ Missing required fields:', { itemId, category, pointsRequired });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: itemId, category, pointsRequired'
      });
    }

    const validation = await rewardsService.validateRedemption(userId, itemId, category, pointsRequired);

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
    const { itemId, category, shippingDetails } = req.body;
    const userId = req.user.id;

    if (!itemId || !category) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: itemId, category'
      });
    }

    // Basic shipping details validation
    if (!shippingDetails || !shippingDetails.building || !shippingDetails.street || !shippingDetails.city) {
      return res.status(400).json({
        success: false,
        error: 'Missing required shipping information: building, street, city'
      });
    }

    const result = await rewardsService.processRedemption(userId, itemId, category, shippingDetails);

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
