import apiClient from './apiClient';

class AnalyticsService {
  async getMonthlyTrends(months = 12) {
    try {
      return await apiClient.get(`/admin/analytics/monthly-trends?months=${months}`);
    } catch (error) {
      throw new Error(`Monthly trends fetch error: ${error.message}`);
    }
  }

  async getAnalytics(period = '30d') {
    try {
      return await apiClient.get(`/admin/analytics?period=${period}`);
    } catch (error) {
      throw new Error(`Analytics fetch error: ${error.message}`);
    }
  }
}

export default new AnalyticsService();
