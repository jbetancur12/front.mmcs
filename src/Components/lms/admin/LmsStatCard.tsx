import React from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'

export type LmsStatTone = 'blue' | 'green' | 'orange' | 'red' | 'teal'

// Mismos degradados de las tarjetas del inicio de la aplicación
const GRADIENTS: Record<LmsStatTone, { background: string; ring: string }> = {
  blue: {
    background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)',
    ring: 'rgba(33,150,243,0.35)'
  },
  green: {
    background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
    ring: 'rgba(76,175,80,0.35)'
  },
  orange: {
    background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)',
    ring: 'rgba(255,152,0,0.35)'
  },
  red: {
    background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)',
    ring: 'rgba(244,67,54,0.35)'
  },
  teal: {
    background: 'linear-gradient(135deg, #00acc1 0%, #26c6da 100%)',
    ring: 'rgba(0,172,193,0.35)'
  }
}

// Estilo "quiet": tarjeta blanca; el color va en el número y en la cajita del
// ícono, con contraste suficiente sobre blanco (más de 4.5:1).
const QUIET: Record<LmsStatTone, { ink: string; soft: string }> = {
  blue: { ink: '#1565c0', soft: '#e3f2fd' },
  green: { ink: '#2e7d32', soft: '#e8f5e9' },
  orange: { ink: '#b45309', soft: '#fff3e0' },
  red: { ink: '#b91c1c', soft: '#fee2e2' },
  teal: { ink: '#00695c', soft: '#e0f7f4' }
}
const QUIET_IDLE = { ink: '#374151', soft: '#f3f4f6' }

export type LmsStatVariant = 'gradient' | 'quiet'

interface LmsStatCardProps {
  label: string
  value: number | string
  icon: React.ReactElement
  tone: LmsStatTone
  /** Resalta la tarjeta cuando es el filtro activo. */
  active?: boolean
  /** Número en tamaño h4, para valores largos como montos. */
  compact?: boolean
  /** Frase de apoyo bajo el número. */
  caption?: string
  onClick?: () => void
  /**
   * `quiet` (por defecto): tarjeta blanca con el color en el número y el
   * ícono; en 0 queda en gris, para que el color solo aparezca cuando hay
   * algo que mirar.
   * `gradient`: el degradado antiguo con texto blanco. No usar en pantallas
   * nuevas; se conserva solo por compatibilidad.
   */
  variant?: LmsStatVariant
}

/**
 * Tarjeta de indicador con degradado de color, igual a las del inicio.
 * Si recibe onClick funciona como botón (por ejemplo, para filtrar una tabla).
 */
const QuietStatCard: React.FC<Omit<LmsStatCardProps, 'variant'>> = ({
  label,
  value,
  icon,
  tone,
  active = false,
  compact = false,
  caption,
  onClick
}) => {
  // También reconoce ceros con formato: "$ 0", "0.00", "0 %"
  const text = String(value)
  const isZero = /\d/.test(text) && Number(text.replace(/[^\d.-]/g, '')) === 0
  const colors = isZero ? QUIET_IDLE : QUIET[tone]
  return (
    <Card
      elevation={0}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-pressed={onClick ? active : undefined}
      onClick={onClick}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault()
          onClick()
        }
      }}
      sx={{
        height: '100%',
        borderRadius: '16px',
        border: '1px solid',
        borderColor: active ? '#00695C' : '#e5e7eb',
        // El borde de 2px del filtro activo no debe mover el contenido
        boxShadow: active ? 'inset 0 0 0 1px #00695C' : 'none',
        bgcolor: active ? '#f0fbf9' : '#fff',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color .15s, box-shadow .15s, background-color .15s',
        '&:hover': onClick
          ? {
              borderColor: active ? '#00695C' : '#9ca3af',
              boxShadow: active
                ? 'inset 0 0 0 1px #00695C'
                : '0 4px 12px rgba(17,24,39,0.08)'
            }
          : undefined,
        '&:focus-visible': { outline: '3px solid #00695C', outlineOffset: 2 },
        '@media (prefers-reduced-motion: reduce)': { transition: 'none' }
      }}
    >
      <CardContent
        sx={{
          p: { xs: 1.5, sm: 2 },
          '&:last-child': { pb: { xs: 1.5, sm: 2 } },
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}
      >
        <Box
          aria-hidden
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: '12px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: colors.soft,
            color: colors.ink
          }}
        >
          {React.cloneElement(icon, { sx: { fontSize: 24 } })}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 14,
              fontWeight: 500,
              color: '#4b5563',
              lineHeight: 1.3
            }}
          >
            {label}
          </Typography>
          <Typography
            sx={{
              fontSize: compact ? { xs: 20, sm: 22 } : { xs: 24, sm: 28 },
              fontWeight: 700,
              lineHeight: 1.15,
              color: colors.ink,
              fontVariantNumeric: 'tabular-nums'
            }}
          >
            {value}
          </Typography>
          {caption && (
            <Typography
              variant='caption'
              sx={{
                display: 'block',
                mt: 0.25,
                color: '#4b5563',
                lineHeight: 1.4
              }}
            >
              {caption}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

const LmsStatCard: React.FC<LmsStatCardProps> = ({
  variant = 'quiet',
  ...props
}) =>
  variant === 'quiet' ? (
    <QuietStatCard {...props} />
  ) : (
    <GradientStatCard {...props} />
  )

const GradientStatCard: React.FC<Omit<LmsStatCardProps, 'variant'>> = ({
  label,
  value,
  icon,
  tone,
  active = false,
  compact = false,
  caption,
  onClick
}) => (
  <Card
    elevation={active ? 6 : 3}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    onClick={onClick}
    onKeyDown={(event) => {
      if (onClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        onClick()
      }
    }}
    sx={{
      background: GRADIENTS[tone].background,
      color: 'white',
      cursor: onClick ? 'pointer' : 'default',
      outline: active ? `3px solid ${GRADIENTS[tone].ring}` : 'none',
      outlineOffset: 2,
      transition: 'transform 0.2s ease-in-out',
      '&:hover': { transform: onClick ? 'translateY(-4px)' : 'none' }
    }}
  >
    <CardContent
      sx={{ p: { xs: 1.5, sm: 2 }, '&:last-child': { pb: { xs: 1.5, sm: 2 } } }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant='subtitle1'
            sx={{
              fontWeight: 600,
              mb: 0.5,
              fontSize: { xs: '0.85rem', sm: '1rem' }
            }}
          >
            {label}
          </Typography>
          <Typography
            variant={compact ? 'h4' : 'h3'}
            sx={{
              fontWeight: 'bold',
              fontSize: { xs: compact ? '1.25rem' : '1.75rem' }
            }}
          >
            {value}
          </Typography>
          {caption && (
            <Typography
              variant='caption'
              sx={{ display: 'block', mt: 0.5, opacity: 0.9, lineHeight: 1.4 }}
            >
              {caption}
            </Typography>
          )}
        </Box>
        {React.cloneElement(icon, {
          sx: { fontSize: { xs: 30, sm: 44 }, opacity: 0.85, flexShrink: 0 }
        })}
      </Box>
    </CardContent>
  </Card>
)

export default LmsStatCard
