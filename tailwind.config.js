/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        void: '#050508',
        surface: '#0d0d0f',
        surface2: '#141418',
        green: {
          DEFAULT: '#00ff88',
          dim: '#00cc6a',
        },
        cyan: '#00d4ff',
        purple: '#7b61ff',
        orange: '#ff6b35',
        red: '#ff2d55',
        gray: {
          DEFAULT: '#4a4a5a',
          400: '#9898a8',
          500: '#6a6a7a',
        },
        white: '#e8e8f0',
      },
      boxShadow: {
        'glow-green': '0 0 20px rgba(0,255,136,0.3)',
        'glow-green-lg': '0 0 60px rgba(0,255,136,0.3)',
        'glow-cyan': '0 0 20px rgba(0,212,255,0.3)',
        'glow-red': '0 0 20px rgba(255,45,85,0.3)',
      },
      fontFamily: {
        grotesk: ['Space Grotesk', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
