import React from 'react'
import { Box, Card, CardContent, Typography } from '@mui/material'

export type LmsStatTone = 'blue' | 'green' | 'orange' | 'red' | 'teal'

// Mismos degradados de las tarjetas del inicio de la aplicación
const GRADIENTS: Record<LmsStatTone, { background: string; ring: string }> = {
  blue: { background: 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)', ring: 'rgba(33,150,243,0.35)' },
  green: { background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)', ring: 'rgba(76,175,80,0.35)' },
  orange: { background: 'linear-gradient(135deg, #ff9800 0%, #ffb74d 100%)', ring: 'rgba(255,152,0,0.35)' },
  red: { background: 'linear-gradient(135deg, #f44336 0%, #ef5350 100%)', ring: 'rgba(244,67,54,0.35)' },
  teal: { background: 'linear-gradient(135deg, #00acc1 0%, #26c6da 100%)', ring: 'rgba(0,172,193,0.35)' }
}

interface LmsStatCardProps {
  label: string
  value: number | string
  icon: React.ReactElement
  tone: LmsStatTone
  /** Resalta la tarjeta cuando es el filtro activo. */
  active?: boolean
  onClick?: () => void
}

/**
 * Tarjeta de indicador con degradado de color, igual a las del inicio.
 * Si recibe onClick funciona como botón (por ejemplo, para filtrar una tabla).
 */
const LmsStatCard: React.FC<LmsStatCardProps> = ({ label, value, icon, tone, active = false, onClick }) => (
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
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant='subtitle1' sx={{ fontWeight: 600, mb: 0.5 }}>
            {label}
          </Typography>
          <Typography variant='h3' sx={{ fontWeight: 'bold' }}>
            {value}
          </Typography>
        </Box>
        {React.cloneElement(icon, { sx: { fontSize: 44, opacity: 0.85 } })}
      </Box>
    </CardContent>
  </Card>
)

export default LmsStatCard
