module.exports = {
  env: {
    browser: true,
    node: true,
    es2021: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaFeatures: { jsx: true },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: ['react', 'jsx-a11y', 'react-hooks', 'prettier'],
  rules: {
    'prettier/prettier': 'error'
  },
  settings: {
    react: { version: 'detect' }
  },
  ignorePatterns: ["**/*.test.js", "**/*.test.jsx", "**/*.spec.js", "**/*.spec.jsx", "kelmah-frontend/src/tests/**", "test-setup/**"],
  overrides: [
    {
      files: ['kelmah-backend/services/**/*.js'],
      env: { node: true, es2021: true },
      parserOptions: { ecmaVersion: 12, sourceType: 'script' }
    }
  ]
}; 