/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        raakky: {
          red: {
            DEFAULT: '#d90429',
            dark: '#b80222',
            light: '#ef233c',
            subtle: '#fff1f2'
          },
          orange: {
            DEFAULT: '#ea580c',
            light: '#f97316',
            subtle: '#fff7ed'
          },
          yellow: {
            DEFAULT: '#eab308',
            light: '#facc15',
            subtle: '#fefce8'
          },
          green: {
            DEFAULT: '#16a34a',
            light: '#22c55e',
            dark: '#15803d',
            subtle: '#f0fdf4'
          },
          charcoal: {
            DEFAULT: '#050505',
            soft: '#121212',
            card: '#18181b',
            border: '#27272a'
          },
          cream: {
            DEFAULT: '#fffdfa',
            surface: '#fbf8f2',
            border: '#ede8dd'
          }
        }
      },
      fontFamily: {
        condensed: ['"Barlow Condensed"', 'sans-serif'],
        sans: ['"DM Sans"', '"Noto Sans Tamil"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        tamil: ['"Noto Sans Tamil"', '"Mukta Malar"', '"Latha"', 'sans-serif']
      },
      boxShadow: {
        'spicy': '0 4px 20px -2px rgba(217, 4, 41, 0.25)',
        'spicy-lg': '0 10px 30px -3px rgba(217, 4, 41, 0.35)',
        'warm': '0 4px 20px -2px rgba(234, 88, 12, 0.2)',
        'card': '0 2px 8px -1px rgba(0, 0, 0, 0.06), 0 1px 3px -1px rgba(0, 0, 0, 0.04)'
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
