/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: { emerald: '#00B894', navy: '#101B2D', blue: '#4778F5' },
        bg: { DEFAULT: '#F5F7FA', dark: '#0D1622' },
        surface: { DEFAULT: '#FFFFFF', dark: '#17263B', muted: '#FAFBFC', 'muted-dark': '#1C2D45' },
        text: { DEFAULT: '#172033', muted: '#667085', 'dark': '#F4F7FB', 'dark-muted': '#B8C5D6' },
        border: { DEFAULT: '#E4E9F0', dark: '#2A3B52' },
        success: '#12B76A', warning: '#F79009', danger: '#F04438',
      },
      borderRadius: { md: '10px', lg: '14px', xl: '18px' },
    },
  },
  plugins: [],
};
