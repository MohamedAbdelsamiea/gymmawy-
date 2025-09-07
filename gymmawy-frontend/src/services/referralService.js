import apiClient from './apiClient';

class ReferralService {
  constructor() {
    this.baseURL = '/referral';
  }

  // Generate referral code
  async generateReferralCode() {
    try {
      const response = await apiClient.post(`${this.baseURL}/generate`);
      return response;
    } catch (error) {
      console.error('Error generating referral code:', error);
      throw error;
    }
  }

  // Use referral code
  async useReferralCode(code, orderInfo = {}) {
    try {
      const response = await apiClient.post(`${this.baseURL}/use`, {
        code,
        ...orderInfo
      });
      return response;
    } catch (error) {
      console.error('Error using referral code:', error);
      throw error;
    }
  }

  // Get user's referral codes
  async getMyReferralCodes() {
    try {
      const response = await apiClient.get(`${this.baseURL}/my-codes`);
      return response;
    } catch (error) {
      console.error('Error fetching referral codes:', error);
      throw error;
    }
  }

  // Get referral analytics
  async getReferralAnalytics() {
    try {
      const response = await apiClient.get(`${this.baseURL}/analytics`);
      return response;
    } catch (error) {
      console.error('Error fetching referral analytics:', error);
      throw error;
    }
  }

  // Get referral rewards
  async getReferralRewards() {
    try {
      const response = await apiClient.get(`${this.baseURL}/rewards`);
      return response;
    } catch (error) {
      console.error('Error fetching referral rewards:', error);
      throw error;
    }
  }

  // Validate referral code
  async validateReferralCode(code) {
    try {
      const response = await apiClient.get(`${this.baseURL}/validate/${code}`);
      return response;
    } catch (error) {
      console.error('Error validating referral code:', error);
      throw error;
    }
  }

  // Get referral configuration
  async getReferralConfig() {
    try {
      const response = await apiClient.get(`${this.baseURL}/config`);
      return response;
    } catch (error) {
      console.error('Error fetching referral config:', error);
      throw error;
    }
  }
}

export default new ReferralService();