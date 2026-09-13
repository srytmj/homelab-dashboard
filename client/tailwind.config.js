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
        panel: '16px',
        lg: '10px',
      },
      boxShadow: {
        'glow-accent': '0 0 15px 0 rgba(var(--cockpit-accent) / 0.3)',
        'glow-good': '0 0 15px 0 rgba(var(--state-good) / 0.3)',
        'glow-warn': '0 0 15px 0 rgba(var(--state-warn) / 0.3)',
        'glow-bad': '0 0 15px 0 rgba(var(--state-bad) / 0.3)',
        'panel': '0 8px 30px rgba(0, 0, 0, 0.12), 0 2px 10px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'panel-in': 'panelIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pop': 'popIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        panelIn: {
          '0%': { opacity: '0', transform: 'translateY(15px) scale(0.97)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        popIn: {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      }
    },
  },
  plugins: [],
}
