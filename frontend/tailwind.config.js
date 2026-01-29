/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6f0ff',
          100: '#b3d1ff',
          200: '#80b3ff',
          300: '#4d94ff',
          400: '#1a75ff',
          500: '#001f5c', // Navy Blue
          600: '#001847',
          700: '#001233',
          800: '#000c1f',
          900: '#00060a',
        },
        accent: {
          50: '#ffe6e6',
          100: '#ffb3b3',
          200: '#ff8080',
          300: '#ff4d4d',
          400: '#ff1a1a',
          500: '#cc0000', // Reddish
          600: '#990000',
          700: '#660000',
          800: '#330000',
          900: '#1a0000',
        },
      },
    },
  },
  plugins: [],
}