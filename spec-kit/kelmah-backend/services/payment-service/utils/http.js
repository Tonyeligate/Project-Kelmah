/**
 * HTTP utility for payment service
 */

const axios = require('axios');

const http = {
  async get(url, options = {}) {
    try {
      const response = await axios.get(url, options);
      return response.data;
    } catch (error) {
      throw new Error(`HTTP GET failed: ${error.message}`);
    }
  },

  async post(url, data = {}, options = {}) {
    try {
      const response = await axios.post(url, data, options);
      return response.data;
    } catch (error) {
      throw new Error(`HTTP POST failed: ${error.message}`);
    }
  },

  async put(url, data = {}, options = {}) {
    try {
      const response = await axios.put(url, data, options);
      return response.data;
    } catch (error) {
      throw new Error(`HTTP PUT failed: ${error.message}`);
    }
  },

  async delete(url, options = {}) {
    try {
      const response = await axios.delete(url, options);
      return response.data;
    } catch (error) {
      throw new Error(`HTTP DELETE failed: ${error.message}`);
    }
  }
};

module.exports = { http };
