/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        syne: ['Syne', 'sans-serif'],
        outfit: ['Outfit', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bg: '#060a12',
        surface: '#0c1220',
        surface2: '#111c30',
        border: '#1e3048',
        accent: '#a855f7',
        success: '#10b981',
        danger: '#ef4444',
        gold: '#f59e0b',
        muted: '#475569',
      },
    },
  },
  plugins: [],
}
