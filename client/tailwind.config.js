/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cockpit: {
          bg: '#101115',
          panel: '#17181e',
          panelHover: '#1c1d24',
          topbar: '#131419',
          border: '#26272f',
          text: '#eef0f4',
          muted: '#84899a',
          accent: '#7c9cff',
        },
        state: {
          good: '#48d597',
          warn: '#f2a93c',
          bad: '#f2554d',
        },
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['IBM Plex Mono', 'JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        panel: '10px',
      },
    },
  },
  plugins: [],
}
