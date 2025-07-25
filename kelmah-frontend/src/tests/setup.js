import '@testing-library/jest-dom';
import React from 'react';
// Stub MUI styles to bypass ThemeProvider context issues
jest.mock('@mui/material/styles', () => {
  const actual = jest.requireActual('@mui/material/styles');
  return {
    ...actual,
    ThemeProvider: ({ children }) => <>{children}</>,
    createTheme: () => ({}),
    useTheme: () => ({}),
  };
});
// Mock MUI material components to avoid context issues
jest.mock('@mui/material', () => {
  const React = require('react');
  return {
    __esModule: true,
    Box: ({ children, ...props }) => React.createElement('div', props, children),
    Button: ({ children, ...props }) => React.createElement('button', props, children),
    TextField: ({ label, ...props }) => React.createElement('input', { 'aria-label': label, ...props }),
    Typography: ({ children, ...props }) => React.createElement('span', props, children),
    Paper: ({ children, ...props }) => React.createElement('div', props, children),
    Grid: ({ children, ...props }) => React.createElement('div', props, children),
    Link: ({ children, ...props }) => React.createElement('a', props, children),
    Divider: (props) => React.createElement('hr', props),
    FormControlLabel: ({ label, control, ...props }) => React.createElement('label', props, label, control),
    Checkbox: (props) => React.createElement('input', { type: 'checkbox', ...props }),
    InputAdornment: ({ children, ...props }) => React.createElement('div', props, children),
    IconButton: ({ children, ...props }) => React.createElement('button', props, children),
    Alert: ({ children, ...props }) => React.createElement('div', props, children),
    CircularProgress: () => React.createElement('div', { 'data-testid': 'circular-progress' }),
  };
});
// Mock useNavigate to be a no-op to avoid Router context requirement
jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => () => {},
  };
});
import { cleanup } from '@testing-library/react';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock sessionStorage
const sessionStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
};
global.sessionStorage = sessionStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

// Mock window.scrollTo
window.scrollTo = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
        this.callback = callback;
    }
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
};

// Mock console methods to avoid cluttering test output
const originalConsoleError = console.error;
console.error = (...args) => {
    if (
        /Warning: ReactDOM.render is no longer supported in React 18/.test(args[0]) ||
        /Warning: Failed prop type/.test(args[0]) ||
        /Warning: React does not recognize the/.test(args[0])
    ) {
        return;
    }
    originalConsoleError(...args);
};

// Extended cleanup
afterEach(() => {
    cleanup();
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
}); 