import { useMemo } from 'react'
import { ModernColors } from '../types'
import { brand, neutral, intent, withAlpha } from 'src/theme/designTokens'

export const useModernStyles = () => {
  const modernColors: ModernColors = useMemo(
    () => ({
      primary: brand.main,
      primaryLight: brand.soft,
      primaryDark: brand.ink,
      background: neutral.surface,
      cardBackground: neutral.surface,
      secondaryBackground: neutral.surfaceAlt,
      textPrimary: neutral.text, // Negro puro para mejor contraste
      textSecondary: neutral.textBody, // Más oscuro para mejor legibilidad
      textMuted: neutral.textMuted,
      success: brand.ink,
      warning: intent.warning,
      danger: intent.danger,
      info: brand.main,
      border: neutral.border,
      borderLight: neutral.surfaceHead
    }),
    []
  )

  const cardStyles = useMemo(
    () => ({
      base: {
        backgroundColor: modernColors.cardBackground,
        border: `3px solid ${modernColors.borderLight}`, // Borde más grueso para TV
        borderRadius: '20px', // Más redondeado
        boxShadow: `0 6px 20px ${withAlpha(neutral.black, 0.12)}` // Sombra más pronunciada
        // En una TV no hay cursor: sin efectos de hover
      },
      metric: {
        height: '92px',
        p: 1.5,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      },
      urgent: {
        backgroundColor: intent.dangerSoft, // Fondo más visible para TV
        border: `4px solid ${modernColors.danger}`, // Borde más grueso
        borderLeft: `8px solid ${modernColors.danger}`, // Borde izquierdo más prominente
        boxShadow: `0 6px 20px ${withAlpha(intent.danger, 0.2)}`,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -2,
          left: -2,
          right: -2,
          bottom: -2,
          background: `linear-gradient(45deg, ${modernColors.danger}40, transparent)`,
          borderRadius: 'inherit',
          zIndex: -1,
          animation: 'subtlePulse 3s infinite'
        }
      },
      regular: {
        backgroundColor: modernColors.cardBackground,
        border: `2px solid ${modernColors.border}`,
        borderRadius: '12px',
        boxShadow: `0 2px 8px ${withAlpha(neutral.black, 0.1)}`,
        height: '154px'
      }
    }),
    [modernColors]
  )

  const iconContainerStyles = useMemo(
    () => ({
      base: {
        borderRadius: '50%',
        p: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      primary: {
        backgroundColor: modernColors.primary
      },
      success: {
        backgroundColor: modernColors.success
      },
      warning: {
        backgroundColor: modernColors.warning
      },
      danger: {
        backgroundColor: modernColors.danger
      },
      info: {
        backgroundColor: modernColors.info
      }
    }),
    [modernColors]
  )

  // Tipografía optimizada para TV
  const tvTypography = useMemo(
    () => ({
      ticketCode: {
        fontSize: '2.2rem', // Más grande para TV
        fontWeight: 900,
        letterSpacing: '0.02em'
      },
      equipmentName: {
        fontSize: '1.6rem', // Más prominente
        fontWeight: 700
      },
      metricNumber: {
        fontSize: '4rem', // Números gigantes para métricas
        fontWeight: 800
      },
      timeElapsed: {
        fontSize: '1.3rem', // Más visible
        fontWeight: 600
      },
      statusText: {
        fontSize: '1.1rem',
        fontWeight: 600
      }
    }),
    []
  )

  // Animaciones para TV
  const tvAnimations = useMemo(
    () => ({
      subtlePulse: {
        '@keyframes subtlePulse': {
          '0%': { boxShadow: `0 0 0 0 ${withAlpha(intent.danger, 0.4)}` },
          '70%': { boxShadow: `0 0 0 15px ${withAlpha(intent.danger, 0)}` },
          '100%': { boxShadow: `0 0 0 0 ${withAlpha(intent.danger, 0)}` }
        }
      },
      fadeInUp: {
        '@keyframes fadeInUp': {
          '0%': { opacity: 0, transform: 'translateY(30px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        }
      },
      shimmer: {
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        }
      }
    }),
    []
  )

  return {
    modernColors,
    cardStyles,
    iconContainerStyles,
    tvTypography,
    tvAnimations
  }
}
