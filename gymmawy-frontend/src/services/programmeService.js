import apiClient from './apiClient';

class ProgrammeService {
  async getProgrammes(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const endpoint = `/programmes${queryParams ? `?${queryParams}` : ''}`;
      return await apiClient.get(endpoint);
    } catch (error) {
      throw new Error(`Programmes fetch error: ${error.message}`);
    }
  }

  async getProgramme(id) {
    try {
      return await apiClient.get(`/programmes/${id}`);
    } catch (error) {
      throw new Error(`Programme fetch error: ${error.message}`);
    }
  }

  async purchaseProgramme(id, country = 'EG', purchaseData = {}) {
    try {
      return await apiClient.post(`/programmes/${id}/purchase-with-payment`, {
        ...purchaseData,
        country,
      });
    } catch (error) {
      throw new Error(`Programme purchase error: ${error.message}`);
    }
  }

  async getUserProgrammes() {
    try {
      return await apiClient.get('/programmes/user/my-programmes');
    } catch (error) {
      throw new Error(`User programmes fetch error: ${error.message}`);
    }
  }

  // Admin methods
  async createProgramme(programmeData) {
    try {
      return await apiClient.post('/programmes', programmeData);
    } catch (error) {
      throw new Error(`Programme creation error: ${error.message}`);
    }
  }

  async updateProgramme(id, programmeData) {
    try {
      return await apiClient.patch(`/programmes/${id}`, programmeData);
    } catch (error) {
      throw new Error(`Programme update error: ${error.message}`);
    }
  }

  async deleteProgramme(id) {
    try {
      await apiClient.delete(`/programmes/${id}`);
      return true;
    } catch (error) {
      throw new Error(`Programme deletion error: ${error.message}`);
    }
  }

  async getProgrammeStats() {
    try {
      return await apiClient.get('/programmes/stats/overview');
    } catch (error) {
      throw new Error(`Programme stats fetch error: ${error.message}`);
    }
  }
}

export default new ProgrammeService();
