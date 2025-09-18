import apiClient from './apiClient';

class LeadService {
  async submitLead(leadData) {
    try {
      const response = await apiClient.request('/leads', {
        method: 'POST',
        body: JSON.stringify(leadData),
      });
      
      return response;
    } catch (error) {
      throw new Error(`Lead submission error: ${error.message}`);
    }
  }

  async getLeads(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.page) {
queryParams.append('page', filters.page);
}
      if (filters.pageSize) {
queryParams.append('pageSize', filters.pageSize);
}
      if (filters.q) {
queryParams.append('q', filters.q);
}
      if (filters.status) {
queryParams.append('status', filters.status);
}
      if (filters.sortBy) {
queryParams.append('sortBy', filters.sortBy);
}
      if (filters.sortOrder) {
queryParams.append('sortOrder', filters.sortOrder);
}
      
      const response = await apiClient.request(`/admin/leads?${queryParams}`, {
        method: 'GET',
      });
      
      return response;
    } catch (error) {
      throw new Error(`Leads fetch error: ${error.message}`);
    }
  }

  async updateLeadStatus(leadId, status) {
    try {
      const response = await apiClient.request(`/admin/leads/${leadId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      
      return response;
    } catch (error) {
      throw new Error(`Lead status update error: ${error.message}`);
    }
  }

  async deleteLead(leadId) {
    try {
      await apiClient.request(`/admin/leads/${leadId}`, {
        method: 'DELETE',
      });
      
      return true;
    } catch (error) {
      throw new Error(`Lead deletion error: ${error.message}`);
    }
  }

  async exportLeads() {
    try {
      const response = await apiClient.request('/admin/leads/export', {
        method: 'GET',
      });
      
      return response;
    } catch (error) {
      throw new Error(`Leads export error: ${error.message}`);
    }
  }
}

export default new LeadService();
