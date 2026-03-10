const path = require('path');

module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\.[jt]sx?$': [
      'babel-jest',
      { configFile: path.join(__dirname, 'babel.jest.config.cjs') },
    ],
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/tests/mocks/styleMock.js',
    '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/tests/mocks/fileMock.js'
  },
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.jsx',
    '!src/vite-env.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // Test files patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{js,jsx,ts,tsx}',
  ],
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
  // Module directories
  moduleDirectories: ['node_modules', 'src'],
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(@mui|@emotion|react-router|@reduxjs)/)',
  ],
  // Test timeout
  testTimeout: 10000,
  // Clear mocks between tests
  clearMocks: true,
  // Restore mocks between tests
  restoreMocks: true,
};
