/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Palette médicale professionnelle
        med: {
          50: '#e6fbf4',
          100: '#b3f3de',
          200: '#80ebc8',
          300: '#4de3b2',
          400: '#1adb9c',
          500: '#00d68f',
          600: '#00a86b',
          700: '#007a4d',
          800: '#004c30',
          900: '#001e13',
        },
        // Fond sombre professionnel
        dark: {
          50: '#e8edf2',
          100: '#c5d1dc',
          200: '#8fa3b8',
          300: '#5a7085',
          400: '#3d5060',
          500: '#2a3a4a',
          600: '#1e2a36',
          700: '#1a232d',
          800: '#131a21',
          900: '#0f1419',
          950: '#0a0f14',
        },
        // Accents
        accent: {
          cyan: '#00b8d9',
          warning: '#ffaa00',
          danger: '#ff4757',
          info: '#3b82f6',
        }
      },
      fontFamily: {
        sans: ['Source Sans 3', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 214, 143, 0.15)',
        'glow-lg': '0 0 40px rgba(0, 214, 143, 0.2)',
      }
    }
  },
  plugins: []
}
