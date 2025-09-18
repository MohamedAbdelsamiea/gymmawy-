import { config } from '../config';
import authService from './authService';

const API_BASE_URL = config.API_BASE_URL;

class SubscriptionService {
  async getPlans(language = 'en') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/plans?lang=${language}&t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-cache',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Subscription plans fetch error: ${error.message}`);
    }
  }

  async subscribe(subscriptionData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });
      
      if (!response.ok) {
        throw new Error('Subscription failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Subscription error: ${error.message}`);
    }
  }

  async getUserSubscriptions() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user subscriptions');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`User subscriptions fetch error: ${error.message}`);
    }
  }

  async cancelSubscription(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/subscriptions/${id}/cancel`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Subscription cancellation failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Subscription cancellation error: ${error.message}`);
    }
  }
}

export default new SubscriptionService();
