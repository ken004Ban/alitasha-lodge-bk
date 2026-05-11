/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Great Vibes"', 'cursive'],
      },
      colors: {
        primary: {
          blue: '#1e3a8a',
          gold: '#d4af37',
        }
      }
    },
  },
  plugins: [],
}