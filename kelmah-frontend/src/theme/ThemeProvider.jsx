import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme, lightTheme } from '../design-system/theme';
import PropTypes from 'prop-types';

/**
 * Enhanced Theme Provider with Design System Integration
 * 
 * Features:
 * - Persistent theme preference
 * - Smooth theme transitions
 * - System preference detection
 * - Theme context for components
 */

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a KelmahThemeProvider');
  }
  return context;
};

const KelmahThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or system preference
  const getInitialTheme = () => {
    try {
      const savedTheme = localStorage.getItem('kelmah-theme');
      if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
        return savedTheme;
      }
    } catch (error) {
      console.warn('Failed to read theme from localStorage:', error);
    }
    
    // Fallback to system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    return 'dark'; // Default fallback
  };

  const [mode, setMode] = useState(getInitialTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      // Only update if no manual preference is stored
      const savedTheme = localStorage.getItem('kelmah-theme');
      if (!savedTheme) {
        setMode(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Persist theme preference
  useEffect(() => {
    try {
      localStorage.setItem('kelmah-theme', mode);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, [mode]);

  const toggleTheme = () => {
    setIsTransitioning(true);
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
    
    // Reset transition state after animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  const setTheme = (newMode) => {
    if (['light', 'dark'].includes(newMode) && newMode !== mode) {
      setIsTransitioning(true);
      setMode(newMode);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }
  };

  const currentTheme = mode === 'light' ? lightTheme : darkTheme;

  // Add transition styles to theme
  const themeWithTransitions = {
    ...currentTheme,
    transitions: {
      ...currentTheme.transitions,
      create: (props, options = {}) => {
        const defaultOptions = {
          duration: currentTheme.transitions.duration.standard,
          easing: currentTheme.transitions.easing.easeInOut,
        };
        
        if (isTransitioning) {
          return currentTheme.transitions.create(props, {
            ...defaultOptions,
            ...options,
            duration: 300,
          });
        }
        
        return currentTheme.transitions.create(props, {
          ...defaultOptions,
          ...options,
        });
      },
    },
    components: {
      ...currentTheme.components,
      
      // Add smooth transitions to all components during theme changes
      MuiCssBaseline: {
        ...currentTheme.components.MuiCssBaseline,
        styleOverrides: {
          ...currentTheme.components.MuiCssBaseline.styleOverrides,
          '*': {
            transition: isTransitioning ? 'background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease' : undefined,
          },
        },
      },
    },
  };

  const contextValue = {
    mode,
    toggleTheme,
    setTheme,
    theme: currentTheme,
    isTransitioning,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={themeWithTransitions}>
        <CssBaseline enableColorScheme />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

KelmahThemeProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default KelmahThemeProvider; 