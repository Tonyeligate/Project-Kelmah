/* eslint-env node */
const kelmahTokens = require('./kelmah-design-tokens.cjs');

const { color, radius } = kelmahTokens;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'kelmah-gold': {
          light: color.goldBright,
          DEFAULT: color.gold,
          dark: color.goldMuted,
        },
        'kelmah-black': {
          light: color.darkSurfaceElevated,
          DEFAULT: color.navyContainer,
          dark: color.navy,
        },
        'kelmah-background': {
          light: color.background,
          DEFAULT: color.darkSurface,
          dark: color.darkBackground,
        },
        'kelmah-surface': {
          light: color.surface,
          DEFAULT: color.darkSurface,
          elevated: color.darkSurfaceElevated,
          variant: color.surfaceVariant,
        },
        'kelmah-accent': {
          positive: color.accentPositive,
          warning: color.accentWarning,
          info: color.accentInfo,
          error: color.error,
        },
      },
      borderRadius: {
        'kelmah-xs': `${radius.xs}px`,
        'kelmah-sm': `${radius.sm}px`,
        'kelmah-md': `${radius.md}px`,
        'kelmah-lg': `${radius.lg}px`,
        'kelmah-xl': `${radius.xl}px`,
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'kelmah-card':
          '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'kelmah-card-dark':
          '0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06)',
      },
      typography: {
        DEFAULT: {
          css: {
            color: color.navy,
            a: {
              color: color.accentInfo,
              '&:hover': {
                color: color.goldMuted,
              },
            },
          },
        },
        dark: {
          css: {
            color: color.darkOnSurface,
            a: {
              color: color.accentInfo,
              '&:hover': {
                color: color.gold,
              },
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addBase, theme }) {
      addBase({
        html: {
          backgroundColor: theme('colors.kelmah-black.DEFAULT'),
          color: theme('colors.gray.100'),
        },
        '.dark html': {
          backgroundColor: theme('colors.kelmah-black.dark'),
          color: theme('colors.gray.100'),
        }
      });
    }
  ],
};
