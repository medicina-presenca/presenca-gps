/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/client/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1A5F9C',
          dark: '#144a7a',
          light: '#5b9fdb',
        }
      }
    },
  },
  plugins: [],
}
