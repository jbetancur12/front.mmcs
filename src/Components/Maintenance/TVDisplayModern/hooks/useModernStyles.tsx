import { useMemo } from 'react'
import { ModernColors } from '../types'

export const useModernStyles = () => {
  const modernColors: ModernColors = useMemo(() => ({
    primary: '#5ed65a', // Verde más oscuro como solicitaste
    primaryLight: '#7bff7f',
    primaryDark: '#4caf50',
    background: '#ffffff',
    cardBackground: '#ffffff',
    secondaryBackground: '#f8f9fa',
    textPrimary: '#000000', // Negro puro para mejor contraste
    textSecondary: '#333333', // Más oscuro para mejor legibilidad
    textMuted: '#666666',
    success: '#28a745',
    warning: '#ffc107',
    danger: '#dc3545',
    info: '#17a2b8',
    border: '#e9ecef',
    borderLight: '#f1f3f4'
  }), [])

  const cardStyles = useMemo(() => ({
    base: {
      backgroundColor: modernColors.cardBackground,
      border: `3px solid ${modernColors.borderLight}`, // Borde más grueso para TV
      borderRadius: '20px', // Más redondeado
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.12)', // Sombra más pronunciada
      transition: 'all 0.3s ease',
      '&:hover': {
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.18)',
        transform: 'translateY(-3px)'
      }
    },
    metric: {
      height: '100px', // Más compacto para evitar scroll
      p: 2, // Padding reducido
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center'
    },
    urgent: {
      backgroundColor: '#ffebee', // Fondo más visible para TV
      border: `4px solid ${modernColors.danger}`, // Borde más grueso
      borderLeft: `8px solid ${modernColors.danger}`, // Borde izquierdo más prominente
      boxShadow: '0 6px 20px rgba(220, 53, 69, 0.2)',
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
      },
      '&:hover': {
        boxShadow: '0 10px 30px rgba(220, 53, 69, 0.3)',
        transform: 'translateY(-3px)'
      }
    },
    regular: {
      backgroundColor: modernColors.cardBackground,
      border: `2px solid ${modernColors.border}`,
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      height: '160px', // Altura reducida para evitar scroll
      '&:hover': {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
        transform: 'translateY(-2px)'
      }
    }
  }), [modernColors])

  const iconContainerStyles = useMemo(() => ({
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
  }), [modernColors])

  // Tipografía optimizada para TV
  const tvTypography = useMemo(() => ({
    ticketCode: {
      fontSize: '2.2rem', // Más grande para TV
      fontWeight: 900,
      textShadow: '1px 1px 2px rgba(0,0,0,0.3)', // Sombra para legibilidad
      letterSpacing: '0.02em'
    },
    equipmentName: {
      fontSize: '1.6rem', // Más prominente
      fontWeight: 700,
      textShadow: '1px 1px 1px rgba(0,0,0,0.2)'
    },
    metricNumber: {
      fontSize: '4rem', // Números gigantes para métricas
      fontWeight: 800,
      textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
    },
    timeElapsed: {
      fontSize: '1.3rem', // Más visible
      fontWeight: 600
    },
    statusText: {
      fontSize: '1.1rem',
      fontWeight: 600
    }
  }), [])

  // Animaciones para TV
  const tvAnimations = useMemo(() => ({
    subtlePulse: {
      '@keyframes subtlePulse': {
        '0%': { boxShadow: '0 0 0 0 rgba(244, 67, 54, 0.4)' },
        '70%': { boxShadow: '0 0 0 15px rgba(244, 67, 54, 0)' },
        '100%': { boxShadow: '0 0 0 0 rgba(244, 67, 54, 0)' }
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
  }), [])

  return {
    modernColors,
    cardStyles,
    iconContainerStyles,
    tvTypography,
    tvAnimations
  }
}