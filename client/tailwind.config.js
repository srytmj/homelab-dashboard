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
          bg: '#090D16',
          card: '#0F172A',
          cardHover: '#131F37',
          border: '#1E293B',
          muted: '#64748B',
          text: '#F8FAFC',
          accent: '#06B6D4', // cyan-500
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      }
    },
  },
  plugins: [],
}
