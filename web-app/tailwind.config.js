/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#090d0f",
        background2: "#0d1117",
        background3: "#111820",
        neon: "#00ff7f",
        "neon-dim": "#00cc66",
        "neon-dark": "#003a1e",
        muted: "#4a6a55",
        text: "#e8f5ee",
      },
      fontFamily: {
        mono: ['Share Tech Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': "linear-gradient(rgba(0,255,127,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,127,0.03) 1px, transparent 1px)",
      },
      animation: {
        'fade-up': 'fadeUp 0.8s forwards',
        'pulse-expand': 'pulseExpand 3s ease-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'marquee': 'marquee 24s linear infinite',
      },
      keyframes: {
        fadeUp: {
          'from': { opacity: '0', transform: 'translateY(24px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseExpand: {
          '0%': { width: '200px', height: '200px', opacity: '0.6' },
          '100%': { width: '500px', height: '500px', opacity: '0' },
        },
        marquee: {
          'from': { transform: 'translateX(0)' },
          'to': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
