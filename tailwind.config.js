/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: { emerald: '#00B887', 'emerald-bright': '#00D6A0', forest: '#004C3F', 'forest-deep': '#003D32', mint: '#C9F5E8', 'mint-dark': '#064E3B' },
        bg: { DEFAULT: '#F4F8F7', dark: '#071714' },
        surface: { DEFAULT: '#FFFFFF', dark: '#10231F', muted: '#F4F8F7', 'muted-dark': '#064E3B' },
        text: { DEFAULT: '#14231F', muted: '#758780', 'dark': '#F4FAF7', 'dark-muted': '#91A69E' },
        border: { DEFAULT: '#E1EBE7', dark: '#29463E' },
        success: '#12B76A', warning: '#F79009', danger: '#F04438',
      },
      borderRadius: { md: '10px', lg: '14px', xl: '18px' },
    },
  },
  plugins: [],
};
