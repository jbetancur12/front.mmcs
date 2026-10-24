import React from 'react'
import { Box, Typography, keyframes } from '@mui/material'

type SignalLoaderSize = 'small' | 'medium' | 'large'

interface SignalLoaderProps {
  /** Texto bajo la señal; por defecto "Cargando...". */
  message?: string
  size?: SignalLoaderSize
  /** Centra la señal en una pantalla completa (fallback de rutas). */
  fullPage?: boolean
}

const WIDTHS: Record<SignalLoaderSize, number> = {
  small: 96,
  medium: 160,
  large: 220
}

// Un latido: línea base, onda P, complejo QRS, onda T y línea base.
const TRACE =
  'M0 28 H24 q4 -8 8 0 H44 l4 4 l6 -26 l7 40 l4 -18 H80 q6 -12 12 0 H120 ' +
  'q4 -6 8 0 H160'

const sweep = keyframes`
  from { stroke-dashoffset: 30; }
  to { stroke-dashoffset: -100; }
`

const blink = keyframes`
  0%, 100% { opacity: 0.35; }
  50% { opacity: 1; }
`

/**
 * Cargando con una señal biomédica (latido tipo ECG) que recorre la línea,
 * en los colores del sistema de diseño. SVG + CSS: sin dependencias y respeta
 * `prefers-reduced-motion`.
 */
const SignalLoader: React.FC<SignalLoaderProps> = ({
  message = 'Cargando...',
  size = 'medium',
  fullPage = false
}) => {
  const width = WIDTHS[size]

  return (
    <Box
      role='status'
      aria-live='polite'
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.5,
        py: fullPage ? 0 : 4,
        height: fullPage ? '80vh' : 'auto'
      }}
    >
      <Box
        sx={{
          width,
          px: 1.5,
          py: 1,
          borderRadius: '16px',
          border: '1px solid #e5e7eb',
          bgcolor: '#ffffff',
          backgroundImage:
            'linear-gradient(#f3f4f6 1px, transparent 1px),' +
            'linear-gradient(90deg, #f3f4f6 1px, transparent 1px)',
          backgroundSize: '12px 12px'
        }}
      >
        <svg
          viewBox='0 0 160 56'
          width='100%'
          fill='none'
          strokeLinecap='round'
          strokeLinejoin='round'
          aria-hidden='true'
        >
          <path d={TRACE} stroke='#E0F7F4' strokeWidth='3' />
          <Box
            component='path'
            d={TRACE}
            pathLength={100}
            stroke='#00BFA5'
            strokeWidth='3'
            strokeDasharray='30 100'
            sx={{
              animation: `${sweep} 1.6s linear infinite`,
              '@media (prefers-reduced-motion: reduce)': {
                animation: 'none',
                strokeDasharray: 'none'
              }
            }}
          />
        </svg>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            bgcolor: '#00BFA5',
            animation: `${blink} 1.6s ease-in-out infinite`,
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
          }}
        />
        <Typography variant='body2' color='text.secondary' fontWeight={600}>
          {message}
        </Typography>
      </Box>
    </Box>
  )
}

export default SignalLoader
