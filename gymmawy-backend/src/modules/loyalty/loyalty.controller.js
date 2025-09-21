import * as service from "./loyalty.service.js";

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
 * Get loyalty statistics for user
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
 * Get available filter options
 */
export async function getFilterOptions(req, res, next) {
  try {
    const userId = req.user.id;
    const options = await service.getLoyaltyFilterOptions(userId);
    
    res.json({ 
      success: true,
      options 
    });
  } catch (error) {
    next(error);
  }
}
