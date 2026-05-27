/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1E3A5F',
        secondary: '#2ECC71',
        danger: '#E74C3C',
        warning: '#F39C12',
        bg: '#F8FAFC',
        surface: '#FFFFFF',
        'app-text': '#1A202C',
        muted: '#718096',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
