module.exports = {
  projects: [
    // Frontend configuration
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      rootDir: './kelmah-frontend',
      testMatch: ['<rootDir>/src/**/*.test.{js,jsx}', '<rootDir>/src/**/*.spec.{js,jsx}'],
      transform: {
        '^.+\\.(js|jsx)$': ['babel-jest', { configFile: './babel.config.js' }],
      },
      moduleNameMapper: {
        '\\.(css|less|scss|sass)$': '<rootDir>/src/tests/mocks/styleMock.js',
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/src/tests/mocks/fileMock.js',
        '^@/(.*)$': '<rootDir>/src/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/src/tests/setup.js'],
      collectCoverageFrom: [
        '<rootDir>/src/**/*.{js,jsx}',
        '!<rootDir>/src/**/*.d.ts',
        '!<rootDir>/src/**/index.{js,jsx}',
        '!<rootDir>/src/tests/**/*',
        '!<rootDir>/src/main.jsx',
      ],
      coverageThreshold: {
        global: {
          statements: 10,
          branches: 10,
          functions: 10,
          lines: 10,
        },
      },
    },
    // Backend services configuration - auth service
    {
      displayName: 'auth-service',
      testEnvironment: 'node',
      rootDir: './kelmah-backend/services/auth-service',
      testMatch: ['<rootDir>/**/*.test.js', '<rootDir>/**/*.spec.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      setupFilesAfterEnv: ['../../../test-setup/backend-setup.js'],
      collectCoverageFrom: [
        '<rootDir>/**/*.js',
        '!<rootDir>/node_modules/**',
        '!<rootDir>/coverage/**',
      ],
    },
    // Backend services configuration - payment service
    {
      displayName: 'payment-service',
      testEnvironment: 'node',
      rootDir: './kelmah-backend/services/payment-service',
      testMatch: ['<rootDir>/**/*.test.js', '<rootDir>/**/*.spec.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      setupFilesAfterEnv: ['../../../test-setup/backend-setup.js'],
      collectCoverageFrom: [
        '<rootDir>/**/*.js',
        '!<rootDir>/node_modules/**',
        '!<rootDir>/coverage/**',
      ],
    },
    // Backend services configuration - notification service
    {
      displayName: 'notification-service',
      testEnvironment: 'node',
      rootDir: './kelmah-backend/services/notification-service',
      testMatch: ['<rootDir>/**/*.test.js', '<rootDir>/**/*.spec.js'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      setupFilesAfterEnv: ['../../../test-setup/backend-setup.js'],
      collectCoverageFrom: [
        '<rootDir>/**/*.js',
        '!<rootDir>/node_modules/**',
        '!<rootDir>/coverage/**',
      ],
    },
  ],
  // Global configuration
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-reports',
        outputName: 'junit.xml',
      },
    ],
  ],
}; 