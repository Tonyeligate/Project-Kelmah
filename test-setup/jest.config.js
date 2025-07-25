const path = require('path');

module.exports = {
  transformIgnorePatterns: [],
  // Separate test configurations for frontend and backend
  projects: [
    {
      displayName: 'frontend',
      moduleDirectories: ['kelmah-frontend/node_modules', 'node_modules'],
      testEnvironment: 'jsdom',
      transformIgnorePatterns: [],
      transform: {
        '^.+\\.[jt]sx?$': 'babel-jest'
      },
      testMatch: ['<rootDir>/kelmah-frontend/src/**/*.test.{js,jsx,ts,tsx}'],
      moduleNameMapper: {
        // Handle module aliases and CSS/asset imports
        '^@/(.*)$': '<rootDir>/frontend/src/$1',
        '\\.(css|less|scss|sass)$': '<rootDir>/test-setup/mocks/styleMock.js',
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/test-setup/mocks/fileMock.js'
      },
      setupFilesAfterEnv: ['<rootDir>/test-setup/frontend-setup.js'],
      collectCoverageFrom: [
        'frontend/src/**/*.{js,jsx,ts,tsx}',
        '!frontend/src/**/*.d.ts',
        '!frontend/src/**/index.{js,jsx,ts,tsx}',
        '!frontend/src/types/**/*'
      ],
      coverageThreshold: {
        global: {
          statements: 10,
          branches: 10,
          functions: 10,
          lines: 10
        }
      },
      rootDir: process.cwd()
    },
    {
      displayName: 'backend',
      // Run backend tests within the kelmah-backend directory
      rootDir: path.resolve(__dirname, '../kelmah-backend'),
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/**/*.test.{js,ts}'],
      moduleNameMapper: {
        '^@\/(.*)$': '<rootDir>/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/../test-setup/backend-setup.js'],
      collectCoverageFrom: [
        'src/**/*.{js,ts}',
        '!src/**/*.d.ts',
        '!src/**/index.{js,ts}',
        '!src/types/**/*'
      ],
      coverageThreshold: {
        global: {
          statements: 10,
          branches: 10,
          functions: 10,
          lines: 10
        }
      }
    }
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
        outputName: 'junit.xml'
      }
    ]
  ],
  rootDir: path.resolve(__dirname, '..')
}; 