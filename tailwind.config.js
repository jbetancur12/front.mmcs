/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        'helvetica-bold': ['Helvetica-Bold', 'sans-serif']
      },
      fontWeight: {
        extrabold: 900
      }
    }
  },
  plugins: [require('tw-elements/dist/plugin.cjs')],
  darkMode: 'class'
}
