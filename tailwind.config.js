/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'preparados': {
          blue: '#0F2A4A',
          yellow: '#FFC107',
          green: '#2E7D32',
          gray: '#F5F7FA',
        },
      },
    },
  },
  plugins: [],
}