const path = require('path');

module.exports = {
  rootDir: __dirname,
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/tests/smoke/**/*.test.jsx'],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      { configFile: path.join(__dirname, 'babel.jest.config.cjs') },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/src/tests/testSetup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(png|jpg|jpeg|gif|svg)$': '<rootDir>/src/tests/testFileStub.js',
  },
  modulePathIgnorePatterns: [
    '<rootDir>/../backup/',
    '<rootDir>/../spec-kit/',
    '<rootDir>/build/',
  ],
};