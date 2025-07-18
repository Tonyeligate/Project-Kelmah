/**
 * Service Client for Inter-Service Communication
 * Provides methods for communicating with other microservices
 */
const axios = require("axios");
const { handleError } = require("../utils/errorHandler");

// Get service URLs from environment variables or use defaults
const serviceUrls = {
  USER: process.env.USER_SERVICE_URL || "http://localhost:3002/api",
  MESSAGING: process.env.MESSAGING_SERVICE_URL || "http://localhost:3003/api",
  JOB: process.env.JOB_SERVICE_URL || "http://localhost:3004/api",
  PAYMENT: process.env.PAYMENT_SERVICE_URL || "http://localhost:3005/api",
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
const userServiceClient = createServiceClient(serviceUrls.USER);
const messagingServiceClient = createServiceClient(serviceUrls.MESSAGING);
const jobServiceClient = createServiceClient(serviceUrls.JOB);
const paymentServiceClient = createServiceClient(serviceUrls.PAYMENT);

const ServiceClient = {
  // User Service methods
  user: {
    getUserByEmail: async (email) => {
      try {
        const response = await userServiceClient.get(`/users/email/${email}`);
        return response.data;
      } catch (error) {
        if (error.response && error.response.status === 404) {
          return null; // User not found
        }
        throw new Error(`User service error: ${error.message}`);
      }
    },

    createUser: async (userData) => {
      try {
        const response = await userServiceClient.post("/users", userData);
        return response.data;
      } catch (error) {
        throw new Error(`User service error: ${error.message}`);
      }
    },

    getUserById: async (userId) => {
      try {
        const response = await userServiceClient.get(`/users/${userId}`);
        return response.data;
      } catch (error) {
        throw new Error(`User service error: ${error.message}`);
      }
    },

    updateUserRole: async (userId, role) => {
      try {
        const response = await userServiceClient.patch(
          `/users/${userId}/role`,
          { role },
        );
        return response.data;
      } catch (error) {
        throw new Error(`User service error: ${error.message}`);
      }
    },
  },

  // Messaging Service methods
  messaging: {
    sendWelcomeNotification: async (userId) => {
      try {
        const response = await messagingServiceClient.post(
          "/notifications/system",
          {
            recipient: userId,
            type: "welcome",
            title: "Welcome to Kelmah",
            content: "Thank you for joining our platform!",
          },
        );
        return response.data;
      } catch (error) {
        console.error(`Messaging service error: ${error.message}`);
        // Non-critical, so we don't throw
        return null;
      }
    },

    sendPasswordResetNotification: async (userId, resetToken) => {
      try {
        const response = await messagingServiceClient.post(
          "/notifications/system",
          {
            recipient: userId,
            type: "password_reset",
            title: "Password Reset",
            content: "Your password reset was successful",
            metadata: {
              resetToken: resetToken,
            },
          },
        );
        return response.data;
      } catch (error) {
        console.error(`Messaging service error: ${error.message}`);
        // Non-critical, so we don't throw
        return null;
      }
    },
  },

  // Payment Service methods (for subscription plans if applicable)
  payment: {
    createUserWallet: async (userId) => {
      try {
        const response = await paymentServiceClient.post("/wallets", {
          userId,
        });
        return response.data;
      } catch (error) {
        console.error(`Payment service error: ${error.message}`);
        // Non-critical for auth flow, so we log but don't throw
        return null;
      }
    },
  },
};

module.exports = ServiceClient;
