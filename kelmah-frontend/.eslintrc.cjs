module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier',
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', 'jsx-a11y', 'react-hooks', 'prettier'],
  ignorePatterns: [
    '**/tests/**',
    '**/*.test.js',
    '**/*.test.jsx',
    '**/*.spec.js',
    '**/*.spec.jsx',
    '*.config.js',
    'build/',
    'dist/',
    'coverage/',
    'tmp_*.js',
    'tmp_*.mjs',
    '!src/**/*.js',
    'scripts/**',
    '**/*.config.*',
  ],
  overrides: [
    {
      files: [
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)',
      ],
      env: {
        jest: true,
        node: true,
      },
    },
    // Utilities, services, worker modules, and build scripts are not React functions/components.
    {
      files: [
        'src/utils/**/*.js',
        'src/utils/**/*.jsx',
        'src/services/**/*.js',
        'src/services/**/*.jsx',
        '**/scripts/**/*.js',
        '**/scripts/**/*.mjs',
        'vercel-build.js',
        'tmp_*.mjs',
      ],
      env: {
        browser: true,
        node: true,
        es2021: true,
      },
      rules: {
        'prettier/prettier': 'off',
        'react/prop-types': 'off',
        'react/no-unescaped-entities': 'off',
        'react/jsx-no-undef': 'off',
        'react-hooks/rules-of-hooks': 'off',
        'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
        'no-undef': 'off',
      },
    },
  ],
  rules: {
    'prettier/prettier': 'error',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'warn',
    'no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};
