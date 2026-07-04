/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/index.html', './src/renderer/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07090f',
          900: '#0b0e14',
          850: '#0f131c',
          800: '#11151f',
          700: '#161b28',
          600: '#1e2430',
          500: '#2a3242',
          400: '#3d4759',
        },
        mist: {
          50: '#f4f6fb',
          100: '#e6e9f2',
          200: '#c5cbdb',
          300: '#9aa3b8',
          400: '#6f7a92',
          500: '#525c72',
        },
        forge: {
          300: '#a9a1ff',
          400: '#8b7dff',
          500: '#6d5efc',
          600: '#5947e8',
          700: '#4736c4',
        },
        good: '#34d399',
        warn: '#fbbf24',
        bad: '#fb7185',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'sans-serif',
        ],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        panel: '0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px -12px rgba(0,0,0,0.5)',
        glow: '0 0 24px -6px rgba(109,94,252,0.45)',
      },
      borderRadius: {
        xl2: '0.875rem',
      },
    },
  },
  plugins: [],
};
