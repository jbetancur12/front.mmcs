import React from 'react'
import { Box, Typography } from '@mui/material'

export type ReadingTone = 'temperature' | 'humidity' | 'neutral'

const TONES: Record<ReadingTone, string> = {
  temperature: '#c2410c',
  humidity: '#0369a1',
  neutral: '#374151'
}

interface ReadingValueProps {
  label: string
  value?: number | null
  unit: string
  tone?: ReadingTone
  /** Decimales a mostrar. Por defecto 2, como llegan del sensor. */
  digits?: number
  /** Ícono pequeño antes de la etiqueta. */
  icon?: React.ReactElement
  size?: 'small' | 'large'
}

/**
 * Lectura de un instrumento: número con unidad y etiqueta.
 * Sin dato muestra "--": nunca un 0 que parezca una medición.
 */
const ReadingValue: React.FC<ReadingValueProps> = ({
  label,
  value,
  unit,
  tone = 'neutral',
  digits = 2,
  icon,
  size = 'small'
}) => {
  const hasValue = typeof value === 'number' && Number.isFinite(value)
  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
        {icon && React.cloneElement(icon, { sx: { fontSize: 14 } })}
        <Typography variant='caption' sx={{ lineHeight: 1.3 }}>
          {label}
        </Typography>
      </Box>
      <Typography
        component='div'
        sx={{
          fontWeight: 700,
          fontSize: size === 'large' ? '1.75rem' : '1.125rem',
          lineHeight: 1.2,
          fontVariantNumeric: 'tabular-nums',
          color: hasValue ? TONES[tone] : '#9ca3af'
        }}
      >
        {hasValue ? (value as number).toFixed(digits) : '--'}
        <Typography
          component='span'
          sx={{ ml: 0.25, fontSize: size === 'large' ? '0.9rem' : '0.75rem', fontWeight: 500, color: 'text.secondary' }}
        >
          {unit}
        </Typography>
      </Typography>
    </Box>
  )
}

export default ReadingValue
