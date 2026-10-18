import React from 'react'
import { Box } from '@mui/material'

export type StatusPillTone = 'live' | 'idle' | 'success' | 'warning' | 'error'

const TONES: Record<StatusPillTone, { color: string; bg: string }> = {
  live: { color: '#00695C', bg: '#E0F7F4' },
  idle: { color: '#4b5563', bg: '#f3f4f6' },
  success: { color: '#166534', bg: '#dcfce7' },
  warning: { color: '#92400e', bg: '#fef3c7' },
  error: { color: '#b91c1c', bg: '#fee2e2' }
}

interface StatusPillProps {
  label: string
  tone: StatusPillTone
  /** Punto que late: algo está ocurriendo ahora mismo. Se detiene con "reducir movimiento". */
  pulse?: boolean
  size?: 'small' | 'medium'
}

/**
 * Estado de un elemento con un punto de color y texto.
 * El texto siempre dice el estado: el color solo lo refuerza.
 */
const StatusPill: React.FC<StatusPillProps> = ({
  label,
  tone,
  pulse = false,
  size = 'medium'
}) => (
  <Box
    component='span'
    sx={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 0.75,
      px: size === 'small' ? 1 : 1.25,
      py: size === 'small' ? 0.25 : 0.5,
      borderRadius: 999,
      bgcolor: TONES[tone].bg,
      color: TONES[tone].color,
      fontSize: size === 'small' ? '0.75rem' : '0.8125rem',
      fontWeight: 600,
      lineHeight: 1.4,
      whiteSpace: 'nowrap'
    }}
  >
    <Box
      component='span'
      aria-hidden
      sx={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        bgcolor: 'currentColor',
        '@keyframes statusPillPulse': {
          '0%': { boxShadow: '0 0 0 0 currentColor' },
          '70%': { boxShadow: '0 0 0 6px transparent' },
          '100%': { boxShadow: '0 0 0 0 transparent' }
        },
        animation: pulse ? 'statusPillPulse 1.8s ease-out infinite' : 'none',
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
      }}
    />
    {label}
  </Box>
)

export default StatusPill
