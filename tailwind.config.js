export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.css"
  ],
  darkMode: 'class', // Support toggling dark mode
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#fcfaf7',
          100: '#f4ebe1',
          200: '#e7d3c1',
          300: '#d5b497',
          400: '#c1926e',
          500: '#b07850',
          600: '#9d613e',
          700: '#824e32',
          800: '#6b3f2b',
          900: '#583424',
          950: '#1b100b',
        },
        espresso: {
          50: '#f5f5f4',
          100: '#e7e5e4',
          200: '#d6d3d1',
          300: '#a8a29e',
          400: '#78716c',
          500: '#57534e',
          600: '#44403c',
          700: '#292524',
          800: '#1c1917',
          900: '#0c0a09',
          950: '#050404',
        },
        moss: {
          50: '#f4f7f4',
          100: '#e3ebe2',
          200: '#cbe0ca',
          300: '#a8cba5',
          400: '#7fad7b',
          500: '#5f8f5b',
          600: '#4a7246',
          700: '#3c5c39',
          800: '#324a30',
          900: '#2b3f29',
          950: '#131e12',
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-outfit)', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(15px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        }
      }
    },
  },
  plugins: [],
}
