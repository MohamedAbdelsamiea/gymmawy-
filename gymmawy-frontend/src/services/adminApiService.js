import apiClient from './apiClient';

class AdminApiService {
  // Generic API call method using the new API client
  async apiCall(endpoint, options = {}) {
    try {
      const method = options.method || 'GET';
      let data;
      
      if (method === 'GET') {
        data = await apiClient.get(endpoint, options);
      } else if (method === 'POST') {
        // Handle FormData specially - don't parse it as JSON
        if (options.body instanceof FormData) {
          data = await apiClient.request(endpoint, { ...options, method: 'POST' });
        } else {
          const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
          data = await apiClient.post(endpoint, body, options);
        }
      } else if (method === 'PUT') {
        const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
        data = await apiClient.put(endpoint, body, options);
      } else if (method === 'PATCH') {
        const body = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : {};
        data = await apiClient.patch(endpoint, body, options);
      } else if (method === 'DELETE') {
        data = await apiClient.delete(endpoint, options);
      }
      
      return data;
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // ==================== USERS ====================
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  async getUserById(id) {
    return this.apiCall(`/admin/users/${id}`);
  }

  async createUser(userData) {
    return this.apiCall('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(id, userData) {
    return this.apiCall(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData)
    });
  }

  async deleteUser(id) {
    return this.apiCall(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== PRODUCTS ====================
  async getProducts(params = {}) {
    // Mock data since GET /products endpoint doesn't exist yet
    return { products: [] };
  }

  async getProductById(id) {
    return this.apiCall(`/products/${id}`);
  }

  async createProduct(productData) {
    return this.apiCall('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  }

  async updateProduct(id, productData) {
    return this.apiCall(`/products/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productData)
    });
  }

  async deleteProduct(id) {
    return this.apiCall(`/products/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== CATEGORIES ====================
  async getCategories() {
    // Mock data since GET /categories endpoint doesn't exist yet
    return { categories: [] };
  }

  async getCategoryById(id) {
    return this.apiCall(`/categories/${id}`);
  }

  async createCategory(categoryData) {
    return this.apiCall('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  }

  async updateCategory(id, categoryData) {
    return this.apiCall(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(categoryData)
    });
  }

  async deleteCategory(id) {
    return this.apiCall(`/categories/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== ORDERS ====================
  async getOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/orders${queryString ? `?${queryString}` : ''}`);
  }

  async getOrderById(id) {
    return this.apiCall(`/orders/${id}`);
  }

  async updateOrderStatus(id, status) {
    return this.apiCall(`/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async exportOrders(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/orders/export${queryString ? `?${queryString}` : ''}`);
  }

  // ==================== SUBSCRIPTIONS ====================
  async getSubscriptions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/subscriptions${queryString ? `?${queryString}` : ''}`);
  }

  async getSubscriptionById(id) {
    return this.apiCall(`/subscriptions/${id}`);
  }

  async updateSubscription(id, subscriptionData) {
    return this.apiCall(`/admin/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(subscriptionData)
    });
  }

  // ==================== SUBSCRIPTION PLANS ====================
  async getSubscriptionPlans(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/subscription-plans${queryString ? `?${queryString}` : ''}`);
  }

  async getSubscriptionPlanById(id) {
    return this.apiCall(`/admin/subscription-plans/${id}`);
  }

  async createSubscriptionPlan(planData) {
    return this.apiCall('/admin/subscription-plans', {
      method: 'POST',
      body: JSON.stringify(planData)
    });
  }

  async updateSubscriptionPlan(id, planData) {
    return this.apiCall(`/admin/subscription-plans/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(planData)
    });
  }

  async deleteSubscriptionPlan(id) {
    return this.apiCall(`/admin/subscription-plans/${id}`, {
      method: 'DELETE'
    });
  }

  async updateSubscriptionPlanBenefitOrder(id, benefits) {
    return this.apiCall(`/admin/subscription-plans/${id}/benefits/order`, {
      method: 'PATCH',
      body: JSON.stringify({ benefits })
    });
  }

  // ==================== BENEFITS ====================
  async getBenefits() {
    return this.apiCall('/admin/benefits');
  }

  async createBenefit(benefitData) {
    return this.apiCall('/admin/benefits', {
      method: 'POST',
      body: JSON.stringify(benefitData)
    });
  }

  async updateBenefit(id, benefitData) {
    return this.apiCall(`/admin/benefits/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(benefitData)
    });
  }

  async deleteBenefit(id) {
    return this.apiCall(`/admin/benefits/${id}`, {
      method: 'DELETE'
    });
  }

  async cancelSubscription(id) {
    return this.apiCall(`/admin/subscriptions/${id}/cancel`, {
      method: 'PATCH'
    });
  }

  async exportSubscriptions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/subscriptions/export${queryString ? `?${queryString}` : ''}`);
  }

  // ==================== PAYMENTS ====================
  async getPayments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/payments${queryString ? `?${queryString}` : ''}`);
  }

  async getPaymentById(id) {
    return this.apiCall(`/payments/${id}`);
  }

  async verifyPayment(id) {
    return this.apiCall(`/payments/${id}/verify`);
  }

  async exportPayments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/payments/export${queryString ? `?${queryString}` : ''}`);
  }

  // ==================== LEADS ====================
  async getLeads(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/leads${queryString ? `?${queryString}` : ''}`);
  }

  async getLeadById(id) {
    return this.apiCall(`/admin/leads/${id}`);
  }

  async updateLeadStatus(id, status) {
    return this.apiCall(`/admin/leads/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  }

  async deleteLead(id) {
    return this.apiCall(`/admin/leads/${id}`, {
      method: 'DELETE'
    });
  }

  async exportLeads(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/leads/export${queryString ? `?${queryString}` : ''}`);
  }

  async getLeadsStats() {
    return this.apiCall('/admin/leads/stats');
  }

  // ==================== COUPONS ====================
  async getCoupons() {
    return this.apiCall('/coupons');
  }

  async getCouponsStats() {
    return this.apiCall('/coupons/stats');
  }

  async getCouponById(id) {
    return this.apiCall(`/coupons/${id}`);
  }

  async createCoupon(couponData) {
    return this.apiCall('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(couponData)
    });
  }

  async updateCoupon(id, couponData) {
    return this.apiCall(`/admin/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(couponData)
    });
  }

  async deleteCoupon(id) {
    return this.apiCall(`/admin/coupons/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== CMS ====================
  async getTransformations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/api/cms/transformations${queryString ? `?${queryString}` : ''}`);
  }

  async getTransformationById(id) {
    return this.apiCall(`/api/cms/transformations/${id}`);
  }

  async createTransformation(transformationData) {
    return this.apiCall('/api/cms/transformations', {
      method: 'POST',
      body: JSON.stringify(transformationData)
    });
  }

  async updateTransformation(id, transformationData) {
    return this.apiCall(`/api/cms/transformations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transformationData)
    });
  }

  async deleteTransformation(id) {
    return this.apiCall(`/api/cms/transformations/${id}`, {
      method: 'DELETE'
    });
  }

  async getVideos(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/api/cms/videos${queryString ? `?${queryString}` : ''}`);
  }

  async getVideoById(id) {
    return this.apiCall(`/api/cms/videos/${id}`);
  }

  async createVideo(videoData) {
    return this.apiCall('/api/cms/videos', {
      method: 'POST',
      body: JSON.stringify(videoData)
    });
  }

  async updateVideo(id, videoData) {
    return this.apiCall(`/api/cms/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(videoData)
    });
  }

  async deleteVideo(id) {
    return this.apiCall(`/api/cms/videos/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== SHIPPING ====================
  async trackShipment(trackingNumber) {
    return this.apiCall(`/shipping/track/${trackingNumber}`);
  }

  async generateShippingLabel(orderId, labelData) {
    return this.apiCall('/shipping/label', {
      method: 'POST',
      body: JSON.stringify({ orderId, ...labelData })
    });
  }

  async getShippingInfo(orderId) {
    return this.apiCall(`/shipping/order/${orderId}`);
  }


  // ==================== SYSTEM HEALTH ====================
  async getSystemHealth() {
    return this.apiCall('/health');
  }

  // ==================== DASHBOARD ANALYTICS ====================
  async getDashboardStats() {
    return this.apiCall('/admin/dashboard');
  }

  async getOrdersByStatus() {
    return this.apiCall('/admin/orders/grouped-by-status');
  }

  async getSubscriptionsByPlan() {
    return this.apiCall('/admin/subscriptions/grouped-by-plan');
  }

  async getSubscriptionStats() {
    return this.apiCall('/admin/subscriptions/stats');
  }

  // ==================== DASHBOARD ANALYTICS ====================
  async getTrendData() {
    return this.apiCall('/admin/analytics/trends');
  }

  async getMonthlyTrends(months = 12) {
    return this.apiCall(`/admin/analytics/monthly-trends?months=${months}`);
  }

  async getTopSellingData(type = 'programmes', limit = 10) {
    return this.apiCall(`/admin/analytics/top-selling?type=${type}&limit=${limit}`);
  }

  async getRecentActivity() {
    return this.apiCall('/admin/analytics/recent-activity');
  }

  // ==================== PROGRAMMES ====================
  async getProgrammes(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/programmes${queryString ? `?${queryString}` : ''}`);
  }

  async getProgrammeById(id) {
    return this.apiCall(`/admin/programmes/${id}`);
  }

  async createProgramme(programmeData) {
    return this.apiCall('/admin/programmes', {
      method: 'POST',
      body: JSON.stringify(programmeData)
    });
  }

  async updateProgramme(id, programmeData) {
    return this.apiCall(`/admin/programmes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(programmeData)
    });
  }

  async deleteProgramme(id) {
    return this.apiCall(`/admin/programmes/${id}`, {
      method: 'DELETE'
    });
  }

  async updateProgrammeOrder(programmes) {
    return this.apiCall('/admin/programmes/order', {
      method: 'PATCH',
      body: JSON.stringify(programmes)
    });
  }

  // ==================== PROGRAMME PURCHASES ====================
  async getProgrammePurchases(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/programmes/purchases${queryString ? `?${queryString}` : ''}`);
  }

  async getProgrammePurchaseById(id) {
    return this.apiCall(`/admin/programmes/purchases/${id}`);
  }

  async createProgrammePurchase(purchaseData) {
    return this.apiCall('/admin/programmes/purchases', {
      method: 'POST',
      body: JSON.stringify(purchaseData)
    });
  }

  async updateProgrammePurchase(id, purchaseData) {
    return this.apiCall(`/admin/programmes/purchases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(purchaseData)
    });
  }

  async deleteProgrammePurchase(id) {
    return this.apiCall(`/admin/programmes/purchases/${id}`, {
      method: 'DELETE'
    });
  }

  // ==================== PROGRAMME STATISTICS ====================
  async getProgrammeStats() {
    return this.apiCall('/admin/programmes/stats');
  }

  async getRevenueOverTime(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/payments/revenue-over-time${queryString ? `?${queryString}` : ''}`);
  }

  // ==================== COUPONS ====================
  async getCoupons(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/coupons${queryString ? `?${queryString}` : ''}`);
  }

  async getCouponById(id) {
    return this.apiCall(`/admin/coupons/${id}`);
  }

  async createCoupon(couponData) {
    return this.apiCall('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(couponData)
    });
  }

  async updateCoupon(id, couponData) {
    return this.apiCall(`/admin/coupons/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(couponData)
    });
  }

  async deleteCoupon(id) {
    return this.apiCall(`/admin/coupons/${id}`, {
      method: 'DELETE'
    });
  }


  // ==================== UPLOADS ====================
  async uploadImage(file, module = 'general') {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('module', module);
    
    return this.apiCall('/images/upload', {
      method: 'POST',
      body: formData
      // No headers - let browser set Content-Type for FormData
      // Authorization will be added by apiCall method
    });
  }

  async uploadVideo(formData) {
    return this.apiCall('/uploads/admin/videos', {
      method: 'POST',
      body: formData
      // Don't set Content-Type for FormData - browser will set it with boundary
    });
  }





  // ==================== UPLOADS ====================
  async uploadImage(formData) {
    return this.apiCall('/uploads/admin/images', {
      method: 'POST',
      body: formData
      // Don't set Content-Type for FormData - browser will set it with boundary
    });
  }

  async uploadDocument(formData) {
    return this.apiCall('/uploads/admin/documents', {
      method: 'POST',
      body: formData
      // Don't set Content-Type for FormData - browser will set it with boundary
    });
  }

  async getImages() {
    return this.apiCall('/uploads/admin/images', {
      method: 'GET'
    });
  }

  async getDocuments() {
    return this.apiCall('/uploads/admin/documents', {
      method: 'GET'
    });
  }

  async getPaymentProofs() {
    return this.apiCall('/uploads/admin/payment-proofs', {
      method: 'GET'
    });
  }

  async getUploadsByCategory(category, isPublic = false) {
    return this.apiCall(`/uploads/admin/category?category=${category}&isPublic=${isPublic}`, {
      method: 'GET'
    });
  }

  async getImage(id) {
    return this.apiCall(`/uploads/${id}`, {
      method: 'GET'
    });
  }

  async deleteImage(id) {
    return this.apiCall(`/uploads/${id}`, {
      method: 'DELETE'
    });
  }

  async getUploadStats() {
    return this.apiCall('/uploads/admin/stats', {
      method: 'GET'
    });
  }

  async cleanupOrphanedFiles() {
    return this.apiCall('/uploads/admin/cleanup', {
      method: 'POST'
    });
  }

  // ==================== PAYMENT VERIFICATION ====================
  async getPayments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/admin/payments${queryString ? `?${queryString}` : ''}`);
  }

  async getPendingPayments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.apiCall(`/api/payments/admin/pending${queryString ? `?${queryString}` : ''}`);
  }

  async approvePayment(paymentId) {
    return this.apiCall(`/api/payments/admin/${paymentId}/approve`, {
      method: 'POST'
    });
  }

  async rejectPayment(paymentId) {
    return this.apiCall(`/api/payments/admin/${paymentId}/reject`, {
      method: 'POST'
    });
  }

  async getPaymentById(paymentId) {
    return this.apiCall(`/api/payments/${paymentId}`);
  }

  // ==================== ORDER ACTIVATION ====================
  async activateOrder(orderId) {
    return this.apiCall(`/admin/orders/${orderId}/activate`, {
      method: 'POST'
    });
  }

  async rejectOrder(orderId) {
    return this.apiCall(`/admin/orders/${orderId}/reject`, {
      method: 'POST',
      body: JSON.stringify({})
    });
  }

  // ==================== ADMIN MANAGEMENT ====================
  async createAdmin(adminData) {
    return this.apiCall('/admin/admins', {
      method: 'POST',
      body: JSON.stringify(adminData)
    });
  }
}

// Create and export a singleton instance
const adminApiService = new AdminApiService();
export default adminApiService;
