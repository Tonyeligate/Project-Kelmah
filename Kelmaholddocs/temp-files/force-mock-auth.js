/**
 * This script forces the authentication system to always use mock mode in development.
 * Run it with: node force-mock-auth.js
 */

const fs = require('fs');
const path = require('path');

// Path to the auth service file
const authServicePath = path.join('kelmah-frontend', 'src', 'modules', 'auth', 'services', 'authService.js');

// Modified auth service content
const authServiceContent = `import axiosInstance from '../../common/services/axios';

// Mock data for development mode when backend is not available
const DEV_MODE_USER = {
  id: "dev-user-123",
  email: "dev@example.com",
  firstName: "Development",
  lastName: "User",
  name: "Development User",
  role: "worker",
  skills: ["Carpentry", "Plumbing", "Electrical"],
  rating: 4.8,
  profileImage: null
};

// Always use mock mode for development
const isDevelopmentMode = true;

const authService = {
  // Login user
  login: async (credentials) => {
    // Always use mock data in development mode
    if (isDevelopmentMode) {
      console.log('Development mode: Using mock login');
      return {
        user: DEV_MODE_USER,
        token: "dev-mode-fake-token-12345"
      };
    }
    
    try {
      // Convert credentials to plain object if needed
      const loginData = typeof credentials === 'string' ? { email: credentials } : credentials;
      
      // Create a config object with explicit headers
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Use stringified JSON for the request
      const response = await axiosInstance.post(
        \`/api/auth/login\`, 
        JSON.stringify(loginData), 
        config
      );
      
      // Handle both API response structures
      // API Gateway returns: { success: true, data: { token, user } }
      // But some places expect: { token, user }
      const responseData = response.data;
      
      console.log('API Login Response:', responseData);
      
      if (responseData.data && responseData.success) {
        console.log('API Gateway format detected, extracting data:', responseData.data);
        return responseData.data;
      }
      
      return responseData;
    } catch (error) {
      throw error;
    }
  },

  // Register user
  register: async (userData) => {
    // Always use mock data in development mode
    if (isDevelopmentMode) {
      console.log('Development mode: Using mock registration');
      return {
        message: "Registration successful",
        user: { ...DEV_MODE_USER, ...userData },
        token: "dev-mode-fake-token-12345"
      };
    }
    
    try {
      // Create a config object with explicit headers
      const config = {
        headers: {
          'Content-Type': 'application/json'
        }
      };
      
      // Use stringified JSON for the request
      const response = await axiosInstance.post(
        \`/api/auth/register\`, 
        JSON.stringify(userData), 
        config
      );
      
      // Handle both API response structures like we did for login
      const responseData = response.data;
      
      if (responseData.data && responseData.success) {
        console.log('API Gateway format detected, extracting data');
        return responseData.data;
      }
      
      return responseData;
    } catch (error) {
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    if (isDevelopmentMode) {
      console.log('Development mode: Using mock logout');
      return { success: true };
    }
    
    try {
      const response = await axiosInstance.post(\`/api/auth/logout\`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get current user
  getCurrentUser: async () => {
    if (isDevelopmentMode) {
      console.log('Development mode: Using mock user data');
      return DEV_MODE_USER;
    }
    
    try {
      const response = await axiosInstance.get(\`/api/auth/me\`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Verify auth status
  verifyAuth: async () => {
    if (isDevelopmentMode) {
      console.log('Development mode: Using mock auth verification');
      return { isValid: true };
    }
    
    try {
      const response = await axiosInstance.get(\`/api/auth/verify\`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    if (isDevelopmentMode) {
      console.log('Development mode: Using mock password reset request');
      return { message: "Password reset email sent successfully" };
    }
    
    const response = await axiosInstance.post(\`/api/auth/forgot-password\`, { email });
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    if (isDevelopmentMode) {
      console.log('Development mode: Using mock password reset');
      return { message: "Password reset successful" };
    }
    
    const response = await axiosInstance.post(\`/api/auth/reset-password\`, { token, newPassword });
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    if (isDevelopmentMode) {
      console.log('Development mode: Using mock profile update');
      return { 
        message: "Profile updated successfully",
        user: { ...DEV_MODE_USER, ...profileData }
      };
    }
    
    const response = await axiosInstance.put(\`/api/users/profile\`, profileData);
    return response.data;
  }
};

export default authService;`;

try {
  // Make a backup of the original file
  const backupPath = `${authServicePath}.bak`;
  if (fs.existsSync(authServicePath)) {
    console.log(`Creating backup at ${backupPath}`);
    fs.copyFileSync(authServicePath, backupPath);
  }
  
  // Write the modified content
  console.log(`Updating ${authServicePath}`);
  fs.writeFileSync(authServicePath, authServiceContent);
  
  console.log('Authentication system has been updated to always use mock mode in development.');
  console.log('You can restore the original file from the backup if needed.');
} catch (err) {
  console.error('Error updating the authentication system:', err);
} 