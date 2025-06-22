import '@testing-library/jest-dom';
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