import React from 'react'
import { Box, Card, CardContent, Tooltip, Typography } from '@mui/material'
import { HelpOutline } from '@mui/icons-material'

interface ProfileStatCardProps {
  label: string
  value: React.ReactNode
  /** Ícono ya creado; el componente lo pinta con `color`. */
  icon: React.ReactElement
  /** Color del ícono y del borde cuando la tarjeta está seleccionada. */
  color: string
  /** Fondo pastel de la caja del ícono. */
  background: string
  /** Color del número (token de MUI o hex). Por defecto, el de `color`. */
  valueColor?: string
  /** Texto de ayuda: aparece como "?" junto a la etiqueta. */
  help?: string
  /** Frase o chip bajo la etiqueta (por ejemplo, el origen del dato). */
  footer?: React.ReactNode
  /** Con `onClick` la tarjeta es un botón (por ejemplo, para filtrar). */
  onClick?: () => void
  /** Resalta la tarjeta cuando es el filtro activo. */
  selected?: boolean
}

/**
 * Indicador de las fichas de detalle (`/customers/:id`): tarjeta blanca con
 * borde gris, ícono en caja pastel de 48 px, número h4 en negrita y etiqueta.
 */
const ProfileStatCard: React.FC<ProfileStatCardProps> = ({
  label,
  value,
  icon,
  color,
  background,
  valueColor,
  help,
  footer,
  onClick,
  selected = false
}) => (
  <Card
    elevation={0}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
    aria-pressed={onClick ? selected : undefined}
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
      border: selected ? `2px solid ${color}` : '1px solid #e5e7eb',
      boxShadow: selected ? `0 0 0 3px ${color}22` : 'none',
      ...(onClick && {
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)'
        },
        '&:focus-visible': { outline: `3px solid ${color}55`, outlineOffset: 2 }
      })
    }}
  >
    <CardContent sx={{ textAlign: 'center', py: 3 }}>
      <Box
        aria-hidden
        sx={{
          width: 48,
          height: 48,
          borderRadius: '12px',
          backgroundColor: background,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mx: 'auto',
          mb: 2
        }}
      >
        {React.cloneElement(icon, { sx: { color, fontSize: 24 } })}
      </Box>
      <Typography
        variant='h4'
        fontWeight='bold'
        sx={{ color: valueColor ?? color, fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </Typography>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5
        }}
      >
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>
        {help && (
          <Tooltip title={help} arrow>
            <HelpOutline
              aria-label={help}
              sx={{ fontSize: 16, color: 'text.secondary', cursor: 'help' }}
            />
          </Tooltip>
        )}
      </Box>
      {footer && <Box sx={{ mt: 1 }}>{footer}</Box>}
    </CardContent>
  </Card>
)

export default ProfileStatCard
