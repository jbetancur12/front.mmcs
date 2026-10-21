import React from 'react'
import { Box, Typography } from '@mui/material'
import { keyframes } from '@emotion/react'

interface AuthLayoutProps {
  /** Lo que la persona hace en esta pantalla: "Ingresa a la plataforma". */
  title: string
  /** Una frase que explica qué necesita para seguir. */
  subtitle?: string
  /** Enlaces bajo el formulario (volver al inicio de sesión, recuperar clave). */
  footer?: React.ReactNode
  children: React.ReactNode
}

// Escala de 0 a 40 con marcas largas cada 10 y medias cada 5.
const TICKS = 41
const SCALE_START = 12
const SCALE_STEP = 9.4
const POINTER_REST = SCALE_START + SCALE_STEP * 27.5

const settle = keyframes`
  0% { transform: translateX(${-POINTER_REST + SCALE_START}px); }
  55% { transform: translateX(14px); }
  72% { transform: translateX(-6px); }
  86% { transform: translateX(2px); }
  100% { transform: translateX(0); }
`

/**
 * Escala graduada de calibración. El indicador recorre la escala y se
 * asienta una sola vez al cargar; sin movimiento si el sistema lo pide.
 */
const CalibrationScale: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <Box
    component='svg'
    viewBox={compact ? '0 0 400 46' : '0 0 400 84'}
    aria-hidden='true'
    sx={{
      display: 'block',
      width: '100%',
      height: 'auto',
      '& .pointer': {
        animation: `${settle} 1.8s cubic-bezier(.22,.9,.3,1) .2s both`
      },
      '@media (prefers-reduced-motion: reduce)': {
        '& .pointer': { animation: 'none' }
      }
    }}
  >
    <g className='pointer'>
      <path d={`M${POINTER_REST - 6} 2 h12 l-6 10 z`} fill='#ffffff' />
      <line
        x1={POINTER_REST}
        x2={POINTER_REST}
        y1={12}
        y2={compact ? 44 : 50}
        stroke='#ffffff'
        strokeWidth={1.5}
      />
    </g>
    <line
      x1={SCALE_START}
      x2={SCALE_START + SCALE_STEP * (TICKS - 1)}
      y1={compact ? 44 : 50}
      y2={compact ? 44 : 50}
      stroke='#e0f7f4'
      strokeOpacity={0.6}
    />
    {Array.from({ length: TICKS }, (_, i) => {
      const x = SCALE_START + SCALE_STEP * i
      const major = i % 10 === 0
      const mid = !major && i % 5 === 0
      const length = major ? 26 : mid ? 16 : 9
      const base = compact ? 44 : 50
      return (
        <g key={i}>
          <line
            x1={x}
            x2={x}
            y1={base - length}
            y2={base}
            stroke='#e0f7f4'
            strokeOpacity={major ? 1 : 0.7}
            strokeWidth={major ? 2 : 1.2}
          />
          {major && !compact && (
            <text
              x={x}
              y={base + 22}
              textAnchor='middle'
              fill='#e0f7f4'
              fontSize={12}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {i}
            </text>
          )}
        </g>
      )
    })}
  </Box>
)

/**
 * Marco de las pantallas de acceso (inicio de sesión, recuperar y crear
 * contraseña): panel de marca con la escala de calibración y el
 * formulario a la derecha. En móvil la escala queda como franja superior.
 */
const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  footer,
  children
}) => (
  <Box
    sx={{
      minHeight: '100dvh',
      display: 'grid',
      gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: '44% minmax(0, 1fr)' },
      bgcolor: '#ffffff'
    }}
  >
    <Box
      component='aside'
      sx={{
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        justifyContent: 'space-between',
        bgcolor: '#00695c',
        color: '#ffffff',
        px: { md: 6, lg: 8 },
        py: 6
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 15, color: '#e0f7f4' }}>
        Ingeniería y laboratorio de metrología
      </Typography>

      <Box sx={{ maxWidth: 440 }}>
        <Typography
          component='p'
          sx={{
            fontSize: { md: 34, lg: 40 },
            lineHeight: 1.15,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            mb: 2.5
          }}
        >
          Tus equipos y certificados de calibración, en un solo lugar.
        </Typography>
        <Typography sx={{ fontSize: 16, lineHeight: 1.6, color: '#e0f7f4' }}>
          Consulta el estado de cada equipo, descarga certificados y sigue los
          servicios en curso.
        </Typography>
      </Box>

      <CalibrationScale />
    </Box>

    <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
      <Box
        sx={{
          display: { xs: 'block', md: 'none' },
          bgcolor: '#00695c',
          px: 2,
          pt: 1.5
        }}
      >
        <CalibrationScale compact />
      </Box>

      <Box
        component='main'
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: 2,
          py: { xs: 5, md: 6 }
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Box
            component='img'
            src='/images/logo2.png'
            alt='Metromedics'
            sx={{ display: 'block', height: 52, width: 'auto', mb: 5 }}
          />
          <Typography
            component='h1'
            sx={{
              fontSize: 26,
              fontWeight: 700,
              lineHeight: 1.25,
              color: '#111827',
              mb: subtitle ? 1 : 4
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              sx={{ fontSize: 15, lineHeight: 1.6, color: '#4b5563', mb: 4 }}
            >
              {subtitle}
            </Typography>
          )}

          {children}

          {footer && (
            <Box sx={{ mt: 4, fontSize: 14, color: '#4b5563' }}>{footer}</Box>
          )}
        </Box>
      </Box>

      <Typography
        sx={{
          px: 2,
          pb: 3,
          fontSize: 12,
          color: '#4b5563',
          textAlign: 'center'
        }}
      >
        © {new Date().getFullYear()} Metromedics S.A.S.
      </Typography>
    </Box>
  </Box>
)

export default AuthLayout
