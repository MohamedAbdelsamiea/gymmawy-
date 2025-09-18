import { config } from '../config';
import authService from './authService';

const API_BASE_URL = config.API_BASE_URL;

class AnalyticsService {
  async getMonthlyTrends(months = 12) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics/monthly-trends?months=${months}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch monthly trends');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Monthly trends fetch error: ${error.message}`);
    }
  }

  async getAnalytics(period = '30d') {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/analytics?period=${period}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Analytics fetch error: ${error.message}`);
    }
  }
}

export default new AnalyticsService();
