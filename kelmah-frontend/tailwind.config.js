/* eslint-env node */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'kelmah-gold': {
          light: '#FFD700',
          DEFAULT: '#D4AF37',
          dark: '#B8860B',
        },
        'kelmah-black': {
          light: '#2c2c2c',
          DEFAULT: '#1a1a1a',
          dark: '#000000',
        },
        'kelmah-background': {
          light: '#f8fafc',
          DEFAULT: '#1a1a1a',
          dark: '#0f0f0f',
        },
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
            color: '#1c1c1c',
            a: {
              color: '#3498db',
              '&:hover': {
                color: '#2980b9',
              },
            },
          },
        },
        dark: {
          css: {
            color: '#f4f6f7',
            a: {
              color: '#3498db',
              '&:hover': {
                color: '#2980b9',
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
