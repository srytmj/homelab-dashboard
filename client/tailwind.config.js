/** @type {import('tailwindcss').Config} */
function withOpacity(variable) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

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
          bg: withOpacity('--cockpit-bg'),
          panel: withOpacity('--cockpit-panel'),
          panelHover: withOpacity('--cockpit-panel-hover'),
          topbar: withOpacity('--cockpit-topbar'),
          border: withOpacity('--cockpit-border'),
          text: withOpacity('--cockpit-text'),
          muted: withOpacity('--cockpit-muted'),
          accent: withOpacity('--cockpit-accent'),
        },
        state: {
          good: withOpacity('--state-good'),
          warn: withOpacity('--state-warn'),
          bad: withOpacity('--state-bad'),
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
