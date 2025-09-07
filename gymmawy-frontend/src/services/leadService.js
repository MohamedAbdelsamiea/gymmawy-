import { config } from '../config';

const API_BASE_URL = config.API_BASE_URL;

class LeadService {
  async submitLead(leadData) {
    try {
      const response = await fetch(`${API_BASE_URL}/leads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error?.message || data.message || 'Failed to submit lead';
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      throw new Error(`Lead submission error: ${error.message}`);
    }
  }

  async getLeads(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.pageSize) queryParams.append('pageSize', filters.pageSize);
      if (filters.q) queryParams.append('q', filters.q);
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
      
      const response = await fetch(`${API_BASE_URL}/admin/leads?${queryParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Leads fetch error: ${error.message}`);
    }
  }

  async updateLeadStatus(leadId, status) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/leads/${leadId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update lead status');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Lead status update error: ${error.message}`);
    }
  }

  async deleteLead(leadId) {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/leads/${leadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete lead');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Lead deletion error: ${error.message}`);
    }
  }

  async exportLeads() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/leads/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to export leads');
      }
      
      return response;
    } catch (error) {
      throw new Error(`Leads export error: ${error.message}`);
    }
  }
}

export default new LeadService();
