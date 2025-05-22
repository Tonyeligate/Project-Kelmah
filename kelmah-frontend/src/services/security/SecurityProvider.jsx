import React, { createContext, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CryptoJS from 'crypto-js';

const SecurityContext = createContext();

export const useSecurity = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within SecurityProvider');
  }
  return context;
};

export const SecurityProvider = ({ children }) => {
  const navigate = useNavigate();
  const secretKey = "kelmah-development-encryption-key-2023";

  const encrypt = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  };

  const decrypt = (encryptedData) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  };

  const secureStorage = {
    setItem: (key, value) => {
      const encrypted = encrypt(value);
      localStorage.setItem(key, encrypted);
    },
    getItem: (key) => {
      const encrypted = localStorage.getItem(key);
      return encrypted ? decrypt(encrypted) : null;
    },
    removeItem: (key) => {
      localStorage.removeItem(key);
    },
  };

  // XSS Protection
  const sanitizeInput = (input) => {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  };

  // CSRF Protection
  const csrfToken = Math.random().toString(36).slice(2);
  useEffect(() => {
    document.cookie = `XSRF-TOKEN=${csrfToken}; path=/; secure; samesite=strict`;
  }, [csrfToken]);

  // Session Management
  const checkSession = () => {
    const lastActivity = secureStorage.getItem('lastActivity');
    const now = new Date().getTime();
    if (lastActivity && now - lastActivity > 30 * 60 * 1000) { // 30 minutes
      // Session expired
      secureStorage.removeItem('token');
      navigate('/login');
    } else {
      secureStorage.setItem('lastActivity', now);
    }
  };

  useEffect(() => {
    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <SecurityContext.Provider value={{
      secureStorage,
      sanitizeInput,
      csrfToken,
      encrypt,
      decrypt,
    }}>
      {children}
    </SecurityContext.Provider>
  );
}; 