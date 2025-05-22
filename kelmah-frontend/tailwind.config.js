/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'kelmah-primary': {
          light: '#3498db',
          DEFAULT: '#3498db',
          dark: '#2980b9'
        },
        'kelmah-secondary': {
          light: '#2ecc71',
          DEFAULT: '#2ecc71',
          dark: '#27ae60'
        },
        'kelmah-accent': {
          light: '#e74c3c',
          DEFAULT: '#e74c3c',
          dark: '#c0392b'
        },
        'kelmah-background': {
          light: '#f4f6f7',
          DEFAULT: '#f4f6f7',
          dark: '#1c1c1c'
        },
        'dark': {
          50: '#1c1c1c',
          100: '#2c2c2c',
          200: '#3c3c3c',
          300: '#4c4c4c',
          400: '#5c5c5c',
          500: '#6c6c6c',
          600: '#7c7c7c',
          700: '#8c8c8c',
          800: '#9c9c9c',
          900: '#acacac'
        }
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'kelmah-card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'kelmah-card-dark': '0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -1px rgba(255, 255, 255, 0.06)'
      },
      typography: {
        DEFAULT: {
          css: {
            color: '#1c1c1c',
            a: {
              color: '#3498db',
              '&:hover': {
                color: '#2980b9'
              }
            }
          }
        },
        dark: {
          css: {
            color: '#f4f6f7',
            a: {
              color: '#3498db',
              '&:hover': {
                color: '#2980b9'
              }
            }
          }
        }
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    function({ addBase, theme }) {
      addBase({
        'html': { 
          backgroundColor: theme('colors.kelmah-background.light'),
          color: theme('colors.gray.900')
        },
        'html.dark': { 
          backgroundColor: theme('colors.kelmah-background.dark'),
          color: theme('colors.gray.100')
        }
      })
    }
  ],
};
