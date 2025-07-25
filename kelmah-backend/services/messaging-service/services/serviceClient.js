/**
 * Service Client for Inter-Service Communication
 * Provides methods for communicating with other microservices
 */
const axios = require("axios");
const { handleError } = require("../utils/errorHandler");

// Get service URLs from environment variables or use defaults
const serviceUrls = {
  AUTH: process.env.AUTH_SERVICE_URL || "http://localhost:3001/api",
  USER: process.env.USER_SERVICE_URL || "http://localhost:3002/api",
  PAYMENT: process.env.PAYMENT_SERVICE_URL || "http://localhost:3005/api",
  JOB: process.env.JOB_SERVICE_URL || "http://localhost:3004/api",
};

// Create axios instances for each service
const createServiceClient = (baseURL) => {
  const client = axios.create({
    baseURL,
    timeout: 5000,
    headers: {
      "Content-Type": "application/json",
      "X-Service-Key": process.env.INTER_SERVICE_API_KEY,
    },
  });

  // Add request interceptor for logging
  client.interceptors.request.use(
    (config) => {
      console.log(
        `[Service Request] ${config.method.toUpperCase()} ${config.url}`,
      );
      return config;
    },
    (error) => Promise.reject(error),
  );

  // Add response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error(
        `[Service Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${error.message}`,
      );
      return Promise.reject(error);
    },
  );

  return client;
};

// Create clients for each service
const authServiceClient = createServiceClient(serviceUrls.AUTH);
const userServiceClient = createServiceClient(serviceUrls.USER);
const paymentServiceClient = createServiceClient(serviceUrls.PAYMENT);
const jobServiceClient = createServiceClient(serviceUrls.JOB);

const ServiceClient = {
  // Auth Service methods
  auth: {
    validateToken: async (token) => {
      try {
        const response = await authServiceClient.post("/auth/validate", {
          token,
        });
        return response.data;
      } catch (error) {
        throw new Error(`Auth service error: ${error.message}`);
      }
    },

    getUserPermissions: async (userId) => {
      try {
        const response = await authServiceClient.get(
          `/auth/permissions/${userId}`,
        );
        return response.data;
      } catch (error) {
        throw new Error(`Auth service error: ${error.message}`);
      }
    },
  },

  // User Service methods
  user: {
    getUserDetails: async (userId) => {
      try {
        const response = await userServiceClient.get(`/users/${userId}`);
        return response.data;
      } catch (error) {
        throw new Error(`User service error: ${error.message}`);
      }
    },

    getUsersByIds: async (userIds) => {
      try {
        const response = await userServiceClient.post("/users/batch", {
          userIds,
        });
        return response.data;
      } catch (error) {
        throw new Error(`User service error: ${error.message}`);
      }
    },
  },

  // Payment Service methods
  payment: {
    createInvoice: async (invoiceData) => {
      try {
        const response = await paymentServiceClient.post(
          "/payments/invoices",
          invoiceData,
        );
        return response.data;
      } catch (error) {
        throw new Error(`Payment service error: ${error.message}`);
      }
    },

    checkPaymentStatus: async (paymentId) => {
      try {
        const response = await paymentServiceClient.get(
          `/payments/${paymentId}/status`,
        );
        return response.data;
      } catch (error) {
        throw new Error(`Payment service error: ${error.message}`);
      }
    },
  },

  // Job Service methods
  job: {
    getJobDetails: async (jobId) => {
      try {
        const response = await jobServiceClient.get(`/jobs/${jobId}`);
        return response.data;
      } catch (error) {
        throw new Error(`Job service error: ${error.message}`);
      }
    },

    updateJobStatus: async (jobId, status) => {
      try {
        const response = await jobServiceClient.patch(`/jobs/${jobId}/status`, {
          status,
        });
        return response.data;
      } catch (error) {
        throw new Error(`Job service error: ${error.message}`);
      }
    },
  },
};

module.exports = ServiceClient;
