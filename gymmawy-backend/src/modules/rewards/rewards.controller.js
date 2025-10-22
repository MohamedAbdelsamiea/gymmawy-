import * as service from './rewards.service.js';
import { z } from 'zod';
import { parseOrThrow } from '../../utils/validation.js';

// ============================================================================
// LOYALTY POINTS TRACKING & HISTORY
// ============================================================================

/**
 * Get recent loyalty transactions for dashboard preview
 */
export async function getRecentTransactions(req, res, next) {
  try {
    const userId = req.user.id;
    const transactions = await service.getRecentLoyaltyTransactions(userId);
    
    res.json({ 
      success: true,
      transactions 
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get paginated loyalty transactions for full history page
 */
export async function getTransactions(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await service.getLoyaltyTransactions(userId, req.query);
    
    res.json({ 
      success: true,
      ...result 
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get loyalty statistics
 */
export async function getStats(req, res, next) {
  try {
    const userId = req.user.id;
    const stats = await service.getLoyaltyStats(userId);
    
    res.json({ 
      success: true,
      stats 
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get filter options for loyalty transactions
 */
export async function getFilterOptions(req, res, next) {
  try {
    const userId = req.user.id;
    const filters = await service.getFilterOptions(userId);
    
    res.json({ 
      success: true,
      filters 
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get specific loyalty transaction by ID
 */
export async function getTransactionById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const transaction = await service.getLoyaltyTransactionById(userId, id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'Transaction not found'
      });
    }
    
    res.json({ 
      success: true,
      transaction 
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// REWARD REDEMPTION & VALIDATION
// ============================================================================

/**
 * Validate redemption request
 */
export async function validateRedemption(req, res) {
  try {
    const schema = z.object({
      itemId: z.string().uuid(),
      category: z.enum(['packages', 'products', 'programmes']),
      pointsRequired: z.number().int().positive()
    });
    
    const { itemId, category, pointsRequired } = parseOrThrow(schema, req.body);
    const userId = req.user.id;

    console.log('🔍 Validate redemption request:', {
      itemId,
      category,
      pointsRequired,
      userId
    });

    const validation = await service.validateRedemption(userId, itemId, category, pointsRequired);
    
    res.json({
      success: validation.valid,
      ...validation
    });

  } catch (error) {
    console.error('❌ Validation error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Process redemption
 */
export async function processRedemption(req, res) {
  try {
    const schema = z.object({
      itemId: z.string().uuid(),
      category: z.enum(['packages', 'products', 'programmes']),
      pointsRequired: z.number().int().positive()
    });
    
    const { itemId, category, pointsRequired } = parseOrThrow(schema, req.body);
    const userId = req.user.id;

    console.log('🎁 Process redemption request:', {
      itemId,
      category,
      pointsRequired,
      userId
    });

    const result = await service.processRedemption(userId, itemId, category, pointsRequired);
    
    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Redemption processing error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Get redemption history
 */
export async function getRedemptionHistory(req, res, next) {
  try {
    const userId = req.user.id;
    const result = await service.getRedemptionHistory(userId, req.query);
    
    res.json({ 
      success: true,
      ...result 
    });
  } catch (error) {
    next(error);
  }
}

// ============================================================================
// AVAILABLE REWARDS
// ============================================================================

/**
 * Get available rewards for redemption
 */
export async function getAvailableRewards(req, res, next) {
  try {
    const { category = 'all' } = req.query;
    const rewards = await service.getAvailableRewards(category);
    
    res.json({ 
      success: true,
      rewards 
    });
  } catch (error) {
    next(error);
  }
}