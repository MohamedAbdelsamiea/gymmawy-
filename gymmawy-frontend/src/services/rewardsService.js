import apiClient from './apiClient';

class RewardsService {
  /**
   * Get all rewards items grouped by category
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Rewards grouped by category
   */
  async getRewards(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/rewards${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Rewards fetch error: ${error.message}`);
    }
  }

  /**
   * Get rewards by specific category
   * @param {string} category - Category type (packages, products, programmes)
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Rewards for the category
   */
  async getRewardsByCategory(category, filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/rewards/${category}${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Rewards fetch error for ${category}: ${error.message}`);
    }
  }

  /**
   * Get packages that can be redeemed with Gymmawy Points
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Package rewards
   */
  async getPackageRewards(filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        hasLoyaltyPoints: 'true'
      }).toString();
      const endpoint = `/subscriptions${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Package rewards fetch error: ${error.message}`);
    }
  }

  /**
   * Get products that can be redeemed with Gymmawy Points
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Product rewards
   */
  async getProductRewards(filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        hasLoyaltyPoints: 'true'
      }).toString();
      const endpoint = `/products${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Product rewards fetch error: ${error.message}`);
    }
  }

  /**
   * Get programmes that can be redeemed with Gymmawy Points
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} Programme rewards
   */
  async getProgrammeRewards(filters = {}) {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        hasLoyaltyPoints: 'true'
      }).toString();
      const endpoint = `/programmes${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Programme rewards fetch error: ${error.message}`);
    }
  }

  /**
   * Validate if user can redeem a reward
   * @param {string} rewardId - The ID of the reward to redeem
   * @param {string} category - The category of the reward (packages, products, programmes)
   * @param {number} pointsRequired - Points required for redemption
   * @returns {Promise<Object>} Validation result
   */
  async validateRedemption(rewardId, category, pointsRequired) {
    try {
      return await apiClient.post('/rewards/validate', {
        rewardId,
        category,
        pointsRequired
      });
    } catch (error) {
      throw new Error(`Redemption validation error: ${error.message}`);
    }
  }

  /**
   * Redeem a reward item
   * @param {string} rewardId - The ID of the reward to redeem
   * @param {string} category - The category of the reward (packages, products, programmes)
   * @param {Object} shippingAddress - User's shipping address
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Redemption result
   */
  async redeemReward(rewardId, category, shippingAddress, options = {}) {
    try {
      return await apiClient.post('/rewards/redeem', {
        rewardId,
        category,
        shippingAddress,
        ...options
      });
    } catch (error) {
      throw new Error(`Reward redemption error: ${error.message}`);
    }
  }

  /**
   * Get user's redemption history
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} User's redemption history
   */
  async getRedemptionHistory(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/rewards/history${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Redemption history fetch error: ${error.message}`);
    }
  }

  /**
   * Get user's Gymmawy Points balance
   * @returns {Promise<Object>} User's points balance
   */
  async getLoyaltyPoints() {
    try {
      return await apiClient.get('/user/loyalty-points');
    } catch (error) {
      throw new Error(`Gymmawy Points fetch error: ${error.message}`);
    }
  }
}

const rewardsService = new RewardsService();
export default rewardsService;
