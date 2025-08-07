import axios from 'axios';

// Base API configuration
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? (process.env.VITE_API_BASE_URL || 'https://kelmah-team-api.onrender.com')
  : 'http://localhost:5001';

// Create axios instance with default config
const teamApi = axios.create({
  baseURL: `${API_BASE_URL}/api/team`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor for debugging
teamApi.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      method: config.method.toUpperCase(),
      url: config.url,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
teamApi.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('API Error:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      errors: error.response?.data?.errors
    });
    
    // Handle specific error cases
    if (error.response?.status === 429) {
      throw new Error('Too many requests. Please try again later.');
    }
    
    if (error.response?.status === 409) {
      throw new Error(error.response.data.message || 'Conflict occurred');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw error.response?.data || error;
  }
);

/**
 * Team Registration API Service
 */
export const teamRegistrationApi = {
  /**
   * Submit team registration application
   * @param {Object} registrationData - Complete registration form data
   * @returns {Promise<Object>} Registration response with ID and next steps
   */
  async submitRegistration(registrationData) {
    try {
      const response = await teamApi.post('/register', {
        ...registrationData,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || window.location.origin
      });
      
      return response.data;
    } catch (error) {
      console.error('Registration submission failed:', error);
      throw this.formatError(error);
    }
  },

  /**
   * Process payment for registration
   * @param {string} registrationId - Registration ID from previous step
   * @param {Object} paymentData - Payment information
   * @returns {Promise<Object>} Payment confirmation
   */
  async processPayment(registrationId, paymentData) {
    try {
      const response = await teamApi.post('/payment', {
        registrationId,
        ...paymentData,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      console.error('Payment processing failed:', error);
      throw this.formatError(error);
    }
  },

  /**
   * Get registration status
   * @param {string} registrationId - Registration ID
   * @returns {Promise<Object>} Current registration status
   */
  async getRegistrationStatus(registrationId) {
    try {
      const response = await teamApi.get(`/status/${registrationId}`);
      return response.data;
    } catch (error) {
      console.error('Status check failed:', error);
      throw this.formatError(error);
    }
  },

  /**
   * Get program statistics (public stats only)
   * @returns {Promise<Object>} Public registration statistics
   */
  async getStats() {
    try {
      const response = await teamApi.get('/stats');
      return response.data;
    } catch (error) {
      console.error('Stats fetch failed:', error);
      throw this.formatError(error);
    }
  },

  /**
   * Check email availability
   * @param {string} email - Email to check
   * @returns {Promise<Object>} Availability status
   */
  async checkEmailAvailability(email) {
    try {
      const response = await teamApi.post('/check-email', { email });
      return response.data;
    } catch (error) {
      // Handle 409 (conflict) as email exists
      if (error.response?.status === 409) {
        return { 
          available: false, 
          message: 'Email already registered' 
        };
      }
      throw this.formatError(error);
    }
  },

  /**
   * Validate registration data
   * @param {Object} registrationData - Data to validate
   * @returns {Promise<Object>} Validation results
   */
  async validateRegistration(registrationData) {
    try {
      const response = await teamApi.post('/validate', registrationData);
      return response.data;
    } catch (error) {
      throw this.formatError(error);
    }
  },

  /**
   * Format error messages for consistent handling
   * @param {Error} error - Original error
   * @returns {Error} Formatted error
   */
  formatError(error) {
    if (error.response?.data) {
      const { message, errors } = error.response.data;
      
      if (errors && Array.isArray(errors)) {
        // Format validation errors
        const errorMessages = errors.map(err => 
          err.message || err.msg || String(err)
        ).join('; ');
        
        const formattedError = new Error(message || 'Validation failed');
        formattedError.validationErrors = errors;
        formattedError.details = errorMessages;
        return formattedError;
      }
      
      return new Error(message || 'Request failed');
    }
    
    return new Error(error.message || 'Network error occurred');
  }
};

/**
 * Payment Processing API Service
 */
export const paymentApi = {
  /**
   * Process credit card payment
   * @param {Object} cardData - Card information
   * @param {number} amount - Payment amount
   * @param {string} registrationId - Registration ID
   * @returns {Promise<Object>} Payment result
   */
  async processCardPayment(cardData, amount, registrationId) {
    try {
      const response = await teamApi.post('/payment', {
        registrationId,
        paymentMethod: 'card',
        amount,
        paymentData: {
          cardNumber: cardData.cardNumber,
          expiryDate: cardData.expiryDate,
          cvv: cardData.cvv,
          cardholderName: cardData.cardholderName
        },
        billingInfo: {
          email: cardData.email,
          phone: cardData.phone
        }
      });
      
      return response.data;
    } catch (error) {
      throw teamRegistrationApi.formatError(error);
    }
  },

  /**
   * Process PayPal payment
   * @param {Object} paypalData - PayPal payment information
   * @param {number} amount - Payment amount
   * @param {string} registrationId - Registration ID
   * @returns {Promise<Object>} Payment result
   */
  async processPayPalPayment(paypalData, amount, registrationId) {
    try {
      const response = await teamApi.post('/payment', {
        registrationId,
        paymentMethod: 'paypal',
        amount,
        paymentData: paypalData
      });
      
      return response.data;
    } catch (error) {
      throw teamRegistrationApi.formatError(error);
    }
  },

  /**
   * Initiate bank transfer
   * @param {Object} bankData - Bank transfer information
   * @param {number} amount - Payment amount
   * @param {string} registrationId - Registration ID
   * @returns {Promise<Object>} Transfer instructions
   */
  async initiateBankTransfer(bankData, amount, registrationId) {
    try {
      const response = await teamApi.post('/payment', {
        registrationId,
        paymentMethod: 'bank',
        amount,
        paymentData: bankData
      });
      
      return response.data;
    } catch (error) {
      throw teamRegistrationApi.formatError(error);
    }
  },

  /**
   * Get payment receipt
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Receipt data
   */
  async getReceipt(transactionId) {
    try {
      const response = await teamApi.get(`/receipt/${transactionId}`);
      return response.data;
    } catch (error) {
      throw teamRegistrationApi.formatError(error);
    }
  }
};

/**
 * Utility functions
 */
export const teamApiUtils = {
  /**
   * Check if API is available
   * @returns {Promise<boolean>} API availability
   */
  async isApiAvailable() {
    try {
      const response = await teamApi.get('/health');
      return response.status === 200;
    } catch (error) {
      console.warn('API health check failed:', error.message);
      return false;
    }
  },

  /**
   * Get current API configuration
   * @returns {Object} API configuration
   */
  getApiConfig() {
    return {
      baseURL: teamApi.defaults.baseURL,
      timeout: teamApi.defaults.timeout,
      environment: process.env.NODE_ENV,
      version: '1.0.0'
    };
  },

  /**
   * Format currency for display
   * @param {number} amount - Amount in dollars
   * @returns {string} Formatted currency string
   */
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  /**
   * Generate unique reference code
   * @param {string} prefix - Code prefix
   * @returns {string} Unique reference code
   */
  generateReferenceCode(prefix = 'KLM') {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }
};

// Export default teamRegistrationApi for backward compatibility
export default teamRegistrationApi;
