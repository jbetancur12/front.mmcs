// Design System Constants for Templates Enhancement
// Following the emerald green color palette and modern UI principles

export const colors = {
  // Primary emerald green palette
  primary: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981', // Main primary color
    600: '#059669', // Dark primary color
    700: '#047857',
    800: '#065f46',
    900: '#064e3b'
  },

  // Gray scale for neutral elements
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  },

  // Semantic colors
  success: {
    50: '#f0fdf4',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a'
  },

  error: {
    50: '#fef2f2',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626'
  },

  warning: {
    50: '#fffbeb',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706'
  },

  info: {
    50: '#eff6ff',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb'
  }
}

export const typography = {
  fontFamily: {
    sans: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif'
    ].join(',')
  },

  fontSize: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem' // 36px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700
  },

  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75
  }
}

export const spacing = {
  // 8px grid system
  0: '0',
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem' // 96px
}

export const borderRadius = {
  none: '0',
  sm: '0.125rem', // 2px
  base: '0.25rem', // 4px
  md: '0.375rem', // 6px
  lg: '0.5rem', // 8px
  xl: '0.75rem', // 12px
  '2xl': '1rem', // 16px
  full: '9999px'
}

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
}

export const transitions = {
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms'
  },

  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)'
  }
}

// Component-specific design tokens
export const components = {
  button: {
    borderRadius: borderRadius.xl, // 12px as specified in requirements
    padding: {
      sm: `${spacing[2]} ${spacing[4]}`, // 8px 16px
      md: `${spacing[3]} ${spacing[6]}`, // 12px 24px
      lg: `${spacing[4]} ${spacing[8]}` // 16px 32px
    }
  },

  card: {
    borderRadius: borderRadius.xl,
    padding: spacing[6], // 24px
    shadow: shadows.md
  },

  table: {
    borderRadius: borderRadius.xl,
    cellPadding: spacing[4], // 16px
    headerBackground: colors.gray[50],
    hoverBackground: colors.primary[50]
  },

  modal: {
    borderRadius: borderRadius['2xl'], // 16px
    padding: spacing[8], // 32px
    minWidth: '500px',
    maxWidth: '600px'
  },

  form: {
    fieldSpacing: spacing[4], // 16px
    groupSpacing: spacing[6], // 24px
    sectionSpacing: spacing[8] // 32px
  }
}
