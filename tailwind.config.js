/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './App.tsx', './index.tsx', './components/**/*.{ts,tsx}', './services/**/*.ts'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif"', 'Georgia', 'serif'],
      },
      colors: {
        son: { 50: '#FDF3F2', 100: '#FBE3E0', 200: '#F5C0BA', 400: '#DA5B4F', 500: '#C73A2E', 600: '#B3261E', 700: '#921D17', 800: '#6F1611' },
        kim: { 50: '#FBF6E6', 100: '#F6EBC4', 300: '#E3C86A', 400: '#D6B23F', 500: '#C9A227', 600: '#A6841B', 700: '#7D6314' },
        giay: { DEFAULT: '#FBF6EC', 100: '#F6EEDD', 200: '#EEE2C8' },
        muc: '#2B2118',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'slide-up': { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'none' } },
        'sheet-up': { from: { transform: 'translateY(100%)' }, to: { transform: 'none' } },
        'flip': { '0%': { transform: 'perspective(800px) rotateX(-12deg)', opacity: 0.4 }, '100%': { transform: 'none', opacity: 1 } },
      },
      animation: {
        'fade-in': 'fade-in .3s ease-out both',
        'slide-up': 'slide-up .35s ease-out both',
        'sheet-up': 'sheet-up .35s cubic-bezier(.2,.8,.2,1) both',
        'flip': 'flip .45s cubic-bezier(.2,.8,.2,1) both',
      },
    },
  },
  plugins: [],
};
