import { config } from '../config';
import authService from './authService';

const API_BASE_URL = config.API_BASE_URL;

class ProgrammeService {
  async getProgrammes(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await fetch(`${API_BASE_URL}/api/programmes?${queryParams}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch programmes');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Programmes fetch error: ${error.message}`);
    }
  }

  async getProgramme(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/programmes/${id}`, {
        method: 'GET',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch programme');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Programme fetch error: ${error.message}`);
    }
  }

  async purchaseProgramme(id, country = 'EG', purchaseData = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/programmes/${id}/purchase-with-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...purchaseData, country }),
      });
      
      if (!response.ok) {
        throw new Error('Programme purchase failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Programme purchase error: ${error.message}`);
    }
  }

  async getUserProgrammes() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/programmes/user/my-programmes`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user programmes');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`User programmes fetch error: ${error.message}`);
    }
  }

  // Admin methods
  async createProgramme(programmeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/programmes`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(programmeData),
      });
      
      if (!response.ok) {
        throw new Error('Programme creation failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Programme creation error: ${error.message}`);
    }
  }

  async updateProgramme(id, programmeData) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/programmes/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(programmeData),
      });
      
      if (!response.ok) {
        throw new Error('Programme update failed');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Programme update error: ${error.message}`);
    }
  }

  async deleteProgramme(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/programmes/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Programme deletion failed');
      }
      
      return true;
    } catch (error) {
      throw new Error(`Programme deletion error: ${error.message}`);
    }
  }

  async getProgrammeStats() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/programmes/stats/overview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authService.getToken()}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch programme stats');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      throw new Error(`Programme stats fetch error: ${error.message}`);
    }
  }
}

export default new ProgrammeService();
