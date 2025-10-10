/* eslint-env jest */
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import React from 'react';

// Mock MUI components to avoid style-related errors
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  ThemeProvider: ({ children }) => <div>{children}</div>,
  createTheme: () => ({}),
  useTheme: () => ({}),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// General cleanup after each test
afterEach(() => {
  cleanup();
  jest.clearAllMocks();
  localStorage.clear();
  sessionStorage.clear();
});
