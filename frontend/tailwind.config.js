/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'ms-bg':      '#030308',
        'ms-surface': '#080812',
        'ms-border':  '#1a1a3a',
        'ms-cyan':    '#00f5ff',
        'ms-magenta': '#ff0080',
        'ms-purple':  '#7b00ff',
        'ms-text':    '#e0e8ff',
        'ms-muted':   '#4a5080',
        // ps- aliases for compat
        'ps-bg':      '#030308',
        'ps-surface': '#080812',
        'ps-border':  '#1a1a3a',
        'ps-accent':  '#00f5ff',
        'ps-accent2': '#ff0080',
        'ps-neon':    '#00f5ff',
        'ps-text':    '#e0e8ff',
        'ps-muted':   '#4a5080',
      },
      fontFamily: {
        display: ['Orbitron', 'monospace'],
        mono:    ['Share Tech Mono', 'monospace'],
        sans:    ['Rajdhani', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
