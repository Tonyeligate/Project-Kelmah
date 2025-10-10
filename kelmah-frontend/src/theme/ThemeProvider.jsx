import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import PropTypes from 'prop-types';
import darkTheme, { lightTheme } from './index';

// Theme Context
const ThemeContext = createContext();

// Custom hook to use theme context
export const useThemeMode = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeMode must be used within a KelmahThemeProvider');
  }
  return context;
};

// Theme Provider Component
export const KelmahThemeProvider = ({ children }) => {
  // Initialize theme mode from localStorage or default to dark
  const [mode, setMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem('kelmah-theme-mode');
      return savedMode || 'dark';
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
      return 'dark';
    }
  });

  // Update localStorage when mode changes
  useEffect(() => {
    try {
      localStorage.setItem('kelmah-theme-mode', mode);
      // Update HTML data attribute for CSS customizations
      document.documentElement.setAttribute('data-theme', mode);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [mode]);

  // Theme toggle function
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
  };

  // Set theme mode directly
  const setThemeMode = (newMode) => {
    if (newMode === 'dark' || newMode === 'light') {
      setMode(newMode);
    }
  };

  // Get current theme object
  const currentTheme = mode === 'dark' ? darkTheme : lightTheme;

  // Context value
  const contextValue = {
    mode,
    toggleTheme,
    setThemeMode,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

KelmahThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default KelmahThemeProvider;
