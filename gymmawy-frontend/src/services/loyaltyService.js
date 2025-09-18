import apiClient from './apiClient';

class LoyaltyService {
  /**
   * Get recent loyalty transactions for dashboard preview
   */
  async getRecentTransactions() {
    try {
      const response = await apiClient.get('/loyalty/recent');
      return response.data;
    } catch (error) {
      console.error('Error fetching recent loyalty transactions:', error);
      throw error;
    }
  }

  /**
   * Get paginated loyalty transactions for full history page
   */
  async getTransactions(params = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append('page', params.page);
      if (params.pageSize) queryParams.append('pageSize', params.pageSize);
      if (params.type) queryParams.append('type', params.type);
      if (params.source) queryParams.append('source', params.source);
      if (params.startDate) queryParams.append('startDate', params.startDate);
      if (params.endDate) queryParams.append('endDate', params.endDate);
      if (params.cursor) queryParams.append('cursor', params.cursor);

      const response = await apiClient.get(`/loyalty?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching loyalty transactions:', error);
      throw error;
    }
  }

  /**
   * Get loyalty statistics for user
   */
  async getStats() {
    try {
      const response = await apiClient.get('/loyalty/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching loyalty stats:', error);
      throw error;
    }
  }

  /**
   * Get available filter options
   */
  async getFilterOptions() {
    try {
      const response = await apiClient.get('/loyalty/filters');
      return response.data;
    } catch (error) {
      console.error('Error fetching loyalty filter options:', error);
      throw error;
    }
  }

  /**
   * Format transaction for display
   */
  formatTransaction(transaction) {
    const isEarned = transaction.points > 0;
    const action = isEarned ? 'Earned' : 'Redeemed';
    const pointsDisplay = isEarned ? `+${transaction.points}` : `${transaction.points}`;
    
    return {
      ...transaction,
      action,
      pointsDisplay,
      isEarned,
      formattedDate: new Date(transaction.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      sourceDisplay: this.getSourceDisplay(transaction.source),
      typeDisplay: this.getTypeDisplay(transaction.type)
    };
  }

  /**
   * Get human-readable source display
   */
  getSourceDisplay(source) {
    const sourceMap = {
      'ORDER_ITEM': 'Order',
      'PROGRAMME_PURCHASE': 'Programme',
      'SUBSCRIPTION': 'Subscription',
      'REFERRAL': 'Referral',
      'ADMIN': 'Admin',
      'PROMOTION': 'Promotion'
    };
    return sourceMap[source] || source;
  }

  /**
   * Get human-readable type display
   */
  getTypeDisplay(type) {
    const typeMap = {
      'EARNED': 'Earned',
      'REDEEMED': 'Redeemed',
      'ADJUSTED': 'Adjusted',
      'EXPIRED': 'Expired'
    };
    return typeMap[type] || type;
  }

  /**
   * Get color class for transaction type
   */
  getTransactionColorClass(transaction) {
    if (transaction.points > 0) {
      return 'text-green-600 bg-green-50';
    } else if (transaction.points < 0) {
      return 'text-red-600 bg-red-50';
    } else {
      return 'text-gray-600 bg-gray-50';
    }
  }

  /**
   * Get icon for transaction source
   */
  getSourceIcon(source) {
    const iconMap = {
      'ORDER_ITEM': 'shopping-bag',
      'PROGRAMME_PURCHASE': 'book-open',
      'SUBSCRIPTION': 'credit-card',
      'REFERRAL': 'users',
      'ADMIN': 'settings',
      'PROMOTION': 'gift'
    };
    return iconMap[source] || 'circle';
  }
}

export default new LoyaltyService();
