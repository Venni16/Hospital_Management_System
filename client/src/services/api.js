const API_BASE_URL = 'http://localhost:8000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Token ${this.token}` }),
      },
      ...options,
    };

    console.log('Making API request to:', url);
    console.log('Request config:', config);

    try {
      const response = await fetch(url, config);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
              if (!response.ok) {
          if (response.status === 401) {
            // Token expired or invalid - logout user
            this.logout();
            throw new Error('Session expired. Please login again.');
          }
          
          const errorData = await response.json().catch(() => ({}));
          console.log('Error response data:', errorData);
          
          // Handle Django REST Framework validation errors
          if (errorData && typeof errorData === 'object') {
            if (errorData.detail) {
              throw new Error(errorData.detail);
            } else if (errorData.error) {
              throw new Error(errorData.error);
            } else {
              // Format field-specific errors
              const fieldErrors = Object.entries(errorData)
                .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
                .join('; ');
              
              if (fieldErrors) {
                throw new Error(`Validation errors: ${fieldErrors}`);
              }
            }
          }
          
          throw new Error(`HTTP error! status: ${response.status}`);
        }

              // For DELETE requests or 204 No Content responses, return nothing
        if (options.method === 'DELETE' || response.status === 204) {
          return;
        }
        
        const data = await response.json();
        console.log('Response data:', data);
        return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(username, password) {
    try {
      const response = await this.request('/users/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });
      
      if (response.token) {
        this.token = response.token;
        localStorage.setItem('token', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response.user));
      }
      
      return response;
    } catch (error) {
      throw new Error('Invalid username or password');
    }
  }

  async logout() {
    try {
      if (this.token) {
        await this.request('/users/logout/', { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('currentUser');
    }
  }

  async getCurrentUser() {
    return this.request('/users/me/');
  }

  // Patients
  async getPatients(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/patients/${queryString ? `?${queryString}` : ''}`);
  }

  async createPatient(patientData) {
    return this.request('/patients/', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  async updatePatient(id, patientData) {
    return this.request(`/patients/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(patientData),
    });
  }

  async deletePatient(id) {
    return this.request(`/patients/${id}/`, {
      method: 'DELETE',
    });
  }

  // Visitors
  async getVisitors(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/visitors/${queryString ? `?${queryString}` : ''}`);
  }

  async createVisitor(visitorData) {
    return this.request('/visitors/', {
      method: 'POST',
      body: JSON.stringify(visitorData),
    });
  }

  async checkoutVisitor(visitorId) {
    return this.request(`/visitors/${visitorId}/checkout/`, {
      method: 'PATCH',
    });
  }

  // Wards and Beds
  async getWards(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/wards/${queryString ? `?${queryString}` : ''}`);
  }

  async createWard(wardData) {
    return this.request('/wards/', {
      method: 'POST',
      body: JSON.stringify(wardData),
    });
  }

  async updateWard(id, wardData) {
    return this.request(`/wards/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(wardData),
    });
  }

  async deleteWard(id) {
    return this.request(`/wards/${id}/`, {
      method: 'DELETE',
    });
  }

  async getBeds(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/beds/${queryString ? `?${queryString}` : ''}`);
  }

  async updateBedStatus(bedId, updateData) {
    return this.request(`/beds/${bedId}/update_status/`, {
      method: 'PATCH',
      body: JSON.stringify(updateData),
    });
  }

  async getAvailableBeds() {
    return this.request('/beds/available/');
  }

  async getWardOccupancyStats() {
    return this.request('/wards/occupancy_stats/');
  }

  // Appointments
  async getAppointments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/appointments/${queryString ? `?${queryString}` : ''}`);
  }

  async createAppointment(appointmentData) {
    return this.request('/appointments/', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async updateAppointment(id, appointmentData) {
    return this.request(`/appointments/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    });
  }

  async getTodayAppointments() {
    return this.request('/appointments/today/');
  }

  async getUpcomingAppointments() {
    return this.request('/appointments/upcoming/');
  }

  async completeAppointment(id) {
    return this.request(`/appointments/${id}/complete/`, {
      method: 'PATCH',
    });
  }

  async cancelAppointment(id) {
    return this.request(`/appointments/${id}/cancel/`, {
      method: 'PATCH',
    });
  }

  async noShowAppointment(id) {
    return this.request(`/appointments/${id}/no_show/`, {
      method: 'PATCH',
    });
  }

  // Medical Records
  async getMedicalRecords(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/medical-records/${queryString ? `?${queryString}` : ''}`);
  }

  async createMedicalRecord(recordData) {
    return this.request('/medical-records/', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }

  // Prescriptions
  async getPrescriptions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/prescriptions/${queryString ? `?${queryString}` : ''}`);
  }

  async createPrescription(prescriptionData) {
    return this.request('/prescriptions/', {
      method: 'POST',
      body: JSON.stringify(prescriptionData),
    });
  }

  async getActivePrescriptions() {
    return this.request('/prescriptions/active/');
  }

  // Lab Tests
  async getLabTests(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/lab-tests/${queryString ? `?${queryString}` : ''}`);
  }

  async createLabTest(testData) {
    console.log('API createLabTest called with:', testData);
    return this.request('/lab-tests/', {
      method: 'POST',
      body: JSON.stringify(testData),
    });
  }

  async getPendingLabTests() {
    return this.request('/lab-tests/pending/');
  }

  async completeLabTest(id, results, notes = '') {
    return this.request(`/lab-tests/${id}/complete/`, {
      method: 'PATCH',
      body: JSON.stringify({ results, notes }),
    });
  }

  async startLabTestProcessing(id) {
    return this.request(`/lab-tests/${id}/start_processing/`, {
      method: 'PATCH',
    });
  }

  async cancelLabTest(id, reason) {
    return this.request(`/lab-tests/${id}/cancel/`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  }

  // Inventory
  async getInventory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/inventory/${queryString ? `?${queryString}` : ''}`);
  }

  async createInventoryItem(itemData) {
    return this.request('/inventory/', {
      method: 'POST',
      body: JSON.stringify(itemData),
    });
  }

  async updateInventoryItem(id, itemData) {
    return this.request(`/inventory/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
  }

  async deleteInventoryItem(id) {
    return this.request(`/inventory/${id}/`, {
      method: 'DELETE',
    });
  }

  async getLowStockItems() {
    return this.request('/inventory/low_stock/');
  }

  async getExpiringItems() {
    return this.request('/inventory/expiring_soon/');
  }

  async adjustStock(id, quantityChange, reason) {
    return this.request(`/inventory/${id}/adjust_stock/`, {
      method: 'POST',
      body: JSON.stringify({ quantity_change: quantityChange, reason }),
    });
  }

  // Billing
  async getBills(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/bills/${queryString ? `?${queryString}` : ''}`);
  }

  async createBill(billData) {
    return this.request('/bills/', {
      method: 'POST',
      body: JSON.stringify(billData),
    });
  }

  async getPendingBills() {
    return this.request('/bills/pending/');
  }

  async addPayment(billId, paymentData) {
    return this.request(`/bills/${billId}/add_payment/`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  async getRevenueStats() {
    return this.request('/bills/revenue_stats/');
  }

  // Staff Management
  async getStaff() {
    return this.request('/users/staff/');
  }

  async getDoctors() {
    return this.request('/users/doctors/');
  }

  async getNurses() {
    return this.request('/users/nurses/');
  }

  async createUser(userData) {
    return this.request('/users/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}/`, {
      method: 'DELETE',
    });
  }

  // Password Reset Functions
  async forgotPassword(email) {
    try {
      const response = await this.request('/users/forgot_password/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to send reset instructions');
    }
  }

  async resetPasswordConfirm({ token, uidb64, new_password, confirm_password }) {
    try {
      const response = await this.request('/users/reset_password_confirm/', {
        method: 'POST',
        body: JSON.stringify({
          token,
          uidb64,
          new_password,
          confirm_password,
        }),
      });
      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to reset password');
    }
  }
}

export default new ApiService();