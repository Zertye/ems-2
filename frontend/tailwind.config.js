/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: 'class', // Activation du mode sombre manuel (via classe)
  theme: {
    extend: {
      colors: {
        // OVERRIDE MAJEUR : On remplace la palette "blue" par les codes hex du ROUGE.
        // Cela permet de ne pas toucher au JSX (qui contient "text-blue-600", etc.)
        // tout en changeant visuellement le rendu.
        blue: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // On aligne aussi la couleur "primary" sur ce même rouge
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        sidebar: {
          DEFAULT: '#0f172a',
          hover: '#1e293b',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    }
  },
  plugins: []
}
