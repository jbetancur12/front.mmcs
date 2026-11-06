import {
  brand,
  neutral,
  intent,
  accent,
  detail
} from './src/theme/designTokens.ts'

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
        // bg-neutral-alt, text-neutral-muted, border-neutral-border...
        neutral: {
          text: neutral.text,
          body: neutral.textBody,
          muted: neutral.textMuted,
          faint: neutral.textFaint,
          border: neutral.border,
          'border-strong': neutral.borderStrong,
          surface: neutral.surface,
          alt: neutral.surfaceAlt,
          head: neutral.surfaceHead
        },
        // bg-intent-danger, text-intent-success-ink, bg-intent-info-soft...
        intent: {
          action: intent.action,
          danger: intent.danger,
          'danger-ink': intent.dangerInk,
          'danger-soft': intent.dangerSoft,
          warning: intent.warning,
          'warning-ink': intent.warningInk,
          'warning-soft': intent.warningSoft,
          success: intent.success,
          'success-ink': intent.successInk,
          'success-soft': intent.successSoft,
          info: intent.info,
          'info-ink': intent.infoInk,
          'info-soft': intent.infoSoft
        },
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
