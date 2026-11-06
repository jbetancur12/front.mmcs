import { brand, accent, detail } from './src/theme/designTokens.ts'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      // Mismos tokens que el tema de MUI: bg-brand, hover:bg-brand-hover, text-brand-ink, bg-brand-soft...
      colors: {
        brand: {
          DEFAULT: brand.main,
          on: brand.onMain,
          hover: brand.hover,
          ink: brand.ink,
          soft: brand.soft,
          softer: brand.softer
        },
        accent: { DEFAULT: accent.main, ink: accent.ink, soft: accent.soft },
        detail: { from: detail.from, to: detail.to }
      },
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
