import React, { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import PropTypes from 'prop-types';
import darkTheme, { lightTheme } from './index';

const THEME_STORAGE_KEY = 'kelmah-theme-mode';
const THEME_STORAGE_VERSION = 2;
const SYSTEM_PREFERENCE_MEDIA = '(prefers-color-scheme: dark)';
const DARK_THEME_COLOR = darkTheme?.palette?.background?.default || '#050507';
const LIGHT_THEME_COLOR = lightTheme?.palette?.background?.default || '#F9F7ED';

const isValidMode = (value) => value === 'dark' || value === 'light';

const isBrowser = () => typeof window !== 'undefined' && typeof document !== 'undefined';

const serializeThemePreference = (mode) =>
  JSON.stringify({
    mode,
    updatedAt: Date.now(),
    version: THEME_STORAGE_VERSION,
  });

const parseThemePreference = (rawValue) => {
  if (!rawValue) {
    return null;
  }

  if (isValidMode(rawValue)) {
    return { mode: rawValue, updatedAt: 0, version: 1 };
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (!isValidMode(parsed?.mode)) {
      return null;
    }

    return {
      mode: parsed.mode,
      updatedAt: typeof parsed.updatedAt === 'number' ? parsed.updatedAt : 0,
      version: parsed.version || 1,
    };
  } catch (error) {
    console.warn('Failed to parse stored theme preference:', error);
    return null;
  }
};

const readStoredThemePreference = () => {
  if (!isBrowser()) {
    return null;
  }

  const candidates = [];

  const pushCandidate = (value, source) => {
    const parsed = parseThemePreference(value);
    if (parsed) {
      candidates.push({ ...parsed, source });
    }
  };

  try {
    pushCandidate(window.localStorage.getItem(THEME_STORAGE_KEY), 'localStorage');
  } catch (error) {
    console.warn('Failed to read theme from localStorage:', error);
  }

  try {
    pushCandidate(window.sessionStorage.getItem(THEME_STORAGE_KEY), 'sessionStorage');
  } catch (error) {
    console.warn('Failed to read theme from sessionStorage:', error);
  }

  const domTheme = document.documentElement?.getAttribute('data-theme');
  if (isValidMode(domTheme)) {
    candidates.push({ mode: domTheme, updatedAt: 0, version: THEME_STORAGE_VERSION, source: 'dom' });
  }

  if (!candidates.length) {
    return null;
  }

  return candidates.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))[0];
};

const applyDocumentTheme = (mode) => {
  if (!isBrowser()) {
    return;
  }

  document.documentElement.setAttribute('data-theme', mode);

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute(
      'content',
      mode === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR,
    );
  }
};

const persistThemeMode = (mode) => {
  if (!isBrowser()) {
    return null;
  }

  const payload = serializeThemePreference(mode);

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, payload);
  } catch (error) {
    console.warn('Failed to save theme to localStorage:', error);
  }

  try {
    window.sessionStorage.setItem(THEME_STORAGE_KEY, payload);
  } catch (error) {
    console.warn('Failed to save theme to sessionStorage:', error);
  }

  return payload;
};

const resolveInitialMode = () => {
  const storedPreference = readStoredThemePreference();
  if (storedPreference) {
    applyDocumentTheme(storedPreference.mode);
    return storedPreference.mode;
  }

  if (isBrowser() && window.matchMedia) {
    const prefersDark = window.matchMedia(SYSTEM_PREFERENCE_MEDIA).matches;
    const mode = prefersDark ? 'dark' : 'light';
    applyDocumentTheme(mode);
    persistThemeMode(mode);
    return mode;
  }

  return 'dark';
};

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
  const [mode, setMode] = useState(resolveInitialMode);
  const [hasStoredPreference, setHasStoredPreference] = useState(() =>
    Boolean(readStoredThemePreference()),
  );

  // Update localStorage when mode changes
  useEffect(() => {
    persistThemeMode(mode);
    applyDocumentTheme(mode);
  }, [mode]);

  // Keep multiple tabs/windows in sync
  useEffect(() => {
    if (!isBrowser()) {
      return () => {};
    }

    const handleStorage = (event) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const preference = parseThemePreference(event.newValue);
      if (!preference) {
        return;
      }

      setMode((prevMode) => {
        if (preference.mode === prevMode) {
          return prevMode;
        }
        setHasStoredPreference(true);
        return preference.mode;
      });
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!isBrowser()) {
      return () => {};
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      const storedPreference = readStoredThemePreference();
      if (storedPreference && storedPreference.mode !== mode) {
        setMode(storedPreference.mode);
        setHasStoredPreference(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () =>
      document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [mode]);

  // Follow system preference until user explicitly chooses a mode
  useEffect(() => {
    if (!isBrowser() || hasStoredPreference || !window.matchMedia) {
      return () => {};
    }

    const mediaQueryList = window.matchMedia(SYSTEM_PREFERENCE_MEDIA);
    const handleChange = (event) => {
      setMode(event.matches ? 'dark' : 'light');
    };

    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
      return () => mediaQueryList.removeEventListener('change', handleChange);
    }

    mediaQueryList.addListener(handleChange);
    return () => mediaQueryList.removeListener(handleChange);
  }, [hasStoredPreference]);

  // Theme toggle function
  const toggleTheme = () => {
    setHasStoredPreference(true);
    setMode((prevMode) => (prevMode === 'dark' ? 'light' : 'dark'));
  };

  // Set theme mode directly
  const setThemeMode = (newMode) => {
    if (newMode === 'dark' || newMode === 'light') {
      setHasStoredPreference(true);
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
