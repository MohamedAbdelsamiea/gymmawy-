import apiClient from './apiClient';

class SubscriptionService {
  async getPlans(language = 'en') {
    try {
      return await apiClient.get(`/subscriptions/plans?lang=${language}&t=${Date.now()}`);
    } catch (error) {
      throw new Error(`Subscription plans fetch error: ${error.message}`);
    }
  }

  async subscribe(subscriptionData) {
    try {
      return await apiClient.post('/subscriptions', subscriptionData);
    } catch (error) {
      throw new Error(`Subscription error: ${error.message}`);
    }
  }

  async getUserSubscriptions() {
    try {
      return await apiClient.get('/subscriptions');
    } catch (error) {
      throw new Error(`User subscriptions fetch error: ${error.message}`);
    }
  }

  async cancelSubscription(id) {
    try {
      return await apiClient.patch(`/subscriptions/${id}/cancel`);
    } catch (error) {
      throw new Error(`Subscription cancellation error: ${error.message}`);
    }
  }
}

export default new SubscriptionService();
