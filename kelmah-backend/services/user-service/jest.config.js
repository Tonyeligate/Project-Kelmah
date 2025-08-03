module.exports = {
  "testEnvironment": "node",
  "setupFilesAfterEnv": [
    "<rootDir>/tests/setup.js"
  ],
  "testMatch": [
    "**/__tests__/**/*.js",
    "**/?(*.)+(spec|test).js"
  ],
  "collectCoverageFrom": [
    "src/**/*.js",
    "controllers/**/*.js",
    "services/**/*.js",
    "middlewares/**/*.js",
    "utils/**/*.js",
    "!**/node_modules/**",
    "!**/coverage/**",
    "!**/tests/**"
  ],
  "coverageDirectory": "coverage",
  "coverageReporters": [
    "text",
    "lcov",
    "html"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  },
  "testTimeout": 10000,
  "verbose": true,
  "forceExit": true,
  "detectOpenHandles": true,
  "displayName": "user-service",
  "rootDir": "."
};