import { createTheme } from '@mui/material/styles'
import {
  colors,
  typography,
  borderRadius,
  shadows,
  brand,
  neutral
} from './theme/designSystem'

// Expone `theme.palette.brand` (ink, soft, softer...) para usarlo en `sx`: color: 'brand.ink'
declare module '@mui/material/styles' {
  interface Palette {
    brand: typeof brand
  }
  interface PaletteOptions {
    brand?: typeof brand
  }
}

export const theme = createTheme({
  palette: {
    // Turquesa de la marca (antes esmeralda). El esmeralda queda reservado en `detail`.
    primary: {
      light: brand.soft,
      main: brand.main,
      dark: brand.hover,
      contrastText: brand.onMain
    },
    brand,
    secondary: {
      light: colors.info[400],
      main: colors.info[500],
      dark: colors.info[600],
      contrastText: '#fff'
    },
    error: {
      light: colors.error[400],
      main: colors.error[500],
      dark: colors.error[600],
      contrastText: '#fff'
    },
    warning: {
      light: colors.warning[400],
      main: colors.warning[500],
      dark: colors.warning[600],
      contrastText: '#fff'
    },
    success: {
      light: colors.success[400],
      main: colors.success[500],
      dark: colors.success[600],
      contrastText: '#fff'
    },
    // Escala gris de MUI (`grey.50`, `grey.300`...) sacada de los tokens: 600 y 700 son el mismo gris de cuerpo,
    // 800 y 900 el de títulos (la escala de Tailwind traía grises intermedios que ya no existen en el sistema)
    grey: {
      50: neutral.surfaceAlt,
      100: neutral.surfaceHead,
      200: neutral.border,
      300: neutral.borderStrong,
      400: neutral.textFaint,
      500: neutral.textMuted,
      600: neutral.textBody,
      700: neutral.textBody,
      800: neutral.text,
      900: neutral.text
    },
    background: {
      default: neutral.surfaceAlt,
      paper: neutral.surface
    },
    // Decisión 2026-11-02: el texto de apoyo (text.secondary, ~900 usos) pasa al gris neutral.textBody.
    text: {
      primary: neutral.text,
      secondary: neutral.textBody
    }
  },
  typography: {
    fontFamily: typography.fontFamily.sans,
    h1: {
      fontSize: typography.fontSize['4xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight
    },
    h2: {
      fontSize: typography.fontSize['3xl'],
      fontWeight: typography.fontWeight.bold,
      lineHeight: typography.lineHeight.tight
    },
    h3: {
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.tight
    },
    h4: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      lineHeight: typography.lineHeight.normal
    },
    h5: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal
    },
    h6: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.medium,
      lineHeight: typography.lineHeight.normal
    },
    body1: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal
    },
    body2: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.normal,
      lineHeight: typography.lineHeight.normal
    },
    button: {
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.semibold,
      textTransform: 'none'
    }
  },
  shape: {
    borderRadius: parseInt(borderRadius.xl.replace('rem', '')) * 16 // Convert rem to px for MUI
  },
  shadows: [
    'none',
    shadows.sm,
    shadows.base,
    shadows.md,
    shadows.lg,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl,
    shadows.xl
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.xl,
          textTransform: 'none',
          fontWeight: typography.fontWeight.semibold,
          transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-1px)'
          }
        },
        contained: {
          boxShadow: shadows.sm,
          '&:hover': {
            boxShadow: shadows.md
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: borderRadius.xl,
          boxShadow: shadows.base,
          border: `1px solid ${colors.gray[200]}`
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: borderRadius['2xl']
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: borderRadius.lg
          }
        }
      }
    }
  }
})
