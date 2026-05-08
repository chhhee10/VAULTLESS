/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FFFFFF',
        accent: '#00FF4D',
        duress: '#FF0000',
        rejection: '#000000'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Space Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
