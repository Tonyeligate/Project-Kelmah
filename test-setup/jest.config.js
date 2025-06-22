module.exports = {
  // Separate test configurations for frontend and backend
  projects: [
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/frontend/**/*.test.{js,jsx,ts,tsx}'],
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
      testEnvironment: 'node',
      testMatch: ['<rootDir>/backend/**/*.test.{js,ts}'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/backend/src/$1'
      },
      setupFilesAfterEnv: ['<rootDir>/test-setup/backend-setup.js'],
      collectCoverageFrom: [
        'backend/src/**/*.{js,ts}',
        '!backend/src/**/*.d.ts',
        '!backend/src/**/index.{js,ts}',
        '!backend/src/types/**/*'
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
  ]
}; 