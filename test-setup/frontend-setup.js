// Mock console
console.error = jest.fn();
console.warn = jest.fn();
console.log = jest.fn();

// Mock browser objects
if (typeof window !== 'undefined') {
  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    length: 0,
    key: jest.fn(),
  };
  
  Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  
  // Mock matchMedia
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
}

// Global test timeouts
jest.setTimeout(10000);

// Console error handling to catch React warnings and errors
const originalConsoleError = console.error;
console.error = (...args) => {
  // Filter out specific React warning errors that might clutter test output
  if (
    /Warning: ReactDOM.render is no longer supported in React 18/.test(args[0]) ||
    /Warning: Failed prop type/.test(args[0])
  ) {
    return;
  }
  originalConsoleError(...args);
}; 