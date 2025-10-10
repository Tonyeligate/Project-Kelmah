module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 12,
    sourceType: 'module'
  },
  plugins: [
    'react',
    'jsx-a11y',
    'react-hooks',
    'prettier'
  ],
  ignorePatterns: [
    '**/tests/**',
    '**/*.test.js',
    '**/*.test.jsx',
    '**/*.spec.js',
    '**/*.spec.jsx',
    '*.config.js',
    'build/',
    'dist/',
    'coverage/'
  ],
  overrides: [
    {
      files: [
        '**/__tests__/**/*.[jt]s?(x)',
        '**/?(*.)+(spec|test).[jt]s?(x)'
      ],
      env: {
        jest: true,
        node: true
      }
    },
    // Temporarily relax rules for worker module and services during refactoring
    {
      files: [
        'src/modules/worker/**/*.jsx',
        'src/modules/worker/**/*.js',
        'src/services/**/*.js'
      ],
      rules: {
        'react/prop-types': 'off',
        'no-unused-vars': 'warn',
        'no-undef': 'warn'
      }
    }
  ],
  rules: {
    'prettier/prettier': 'error',
    'react/react-in-jsx-scope': 'off', // Not needed in React 18 with new JSX transform
    'react/prop-types': 'warn', // Downgrade to warning globally
    'no-unused-vars': ['error', { 
      varsIgnorePattern: '^_',
      argsIgnorePattern: '^_'
    }]
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
 