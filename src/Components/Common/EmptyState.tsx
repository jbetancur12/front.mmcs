import React from 'react'
import { Box, Typography } from '@mui/material'

interface EmptyStateProps {
  icon: React.ReactElement
  /** Qué falta, en una frase. */
  title: string
  /** Qué hacer para llenarlo. */
  hint?: string
  /** Botón que resuelve el vacío. */
  action?: React.ReactNode
  /** Versión baja para vacíos dentro de una tarjeta. */
  compact?: boolean
}

/**
 * Pantalla o bloque sin datos: dice qué falta y cómo resolverlo.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  hint,
  action,
  compact = false
}) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 0.5,
      py: compact ? 2.5 : 5,
      px: 2,
      color: 'text.secondary'
    }}
  >
    {React.cloneElement(icon, {
      sx: { fontSize: compact ? 28 : 40, color: '#9ca3af', mb: 0.5 }
    })}
    <Typography variant='body2' fontWeight={600} color='text.primary'>
      {title}
    </Typography>
    {hint && (
      <Typography variant='body2' sx={{ maxWidth: 420 }}>
        {hint}
      </Typography>
    )}
    {action && <Box sx={{ mt: 1.5 }}>{action}</Box>}
  </Box>
)

export default EmptyState
