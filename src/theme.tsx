import { createTheme } from '@mui/material/styles'
import { colors, typography, borderRadius, shadows } from './theme/designSystem'

export const theme = createTheme({
  palette: {
    primary: {
      light: colors.primary[400],
      main: colors.primary[500], // #10b981 - emerald green
      dark: colors.primary[600], // #059669 - dark emerald
      contrastText: '#fff'
    },
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
    grey: colors.gray,
    background: {
      default: colors.gray[50],
      paper: '#ffffff'
    },
    text: {
      primary: colors.gray[900],
      secondary: colors.gray[600]
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
