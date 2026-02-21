/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        surface: {
          DEFAULT: '#0a0a0a',
          50: '#171717',
          100: '#1a1a1a',
          200: '#262626',
          300: '#404040',
        },
        gold: {
          DEFAULT: '#d4a843',
          light: '#f0d68a',
          dark: '#a07d2e',
        },
      },
      fontFamily: {
        arabic: ['"Amiri Quran"', '"Amiri"', 'serif'],
        sans: ['Cairo', 'sans-serif'],
      },
      animation: {
        'blink-feedback': 'blinkFlash 200ms ease-out',
        'fade-in': 'fadeIn 300ms ease-in',
        'slide-up': 'slideUp 300ms ease-out',
      },
      keyframes: {
        blinkFlash: {
          '0%': { boxShadow: '0 0 0 0 rgba(212, 168, 67, 0)' },
          '50%': { boxShadow: '0 0 0 4px rgba(212, 168, 67, 0.6)' },
          '100%': { boxShadow: '0 0 0 0 rgba(212, 168, 67, 0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
