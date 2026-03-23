module.exports = {
  projects: [
    '<rootDir>/kelmah-frontend/jest.smoke.config.cjs',
    {
      displayName: 'node-tests',
      testEnvironment: 'node',
      roots: ['<rootDir>/kelmah-backend'],
      testPathIgnorePatterns: [
        '<rootDir>/backup/',
        '<rootDir>/spec-kit/',
      ],
      modulePathIgnorePatterns: ['<rootDir>/backup/', '<rootDir>/spec-kit/'],
    },
  ],
};