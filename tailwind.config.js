/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#111111',
          800: '#1B2333',
          700: '#2a2a2a',
        }
      }
    },
  },
  plugins: [],
};