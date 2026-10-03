import React from 'react'
import { Avatar, Box, Typography } from '@mui/material'

interface LmsPageHeaderProps {
  title: string
  subtitle?: string
  icon: React.ReactElement
  /** Color del círculo del ícono. Por defecto el verde azulado de la aplicación. */
  color?: string
  /** Botones o controles alineados a la derecha. */
  actions?: React.ReactNode
}

/**
 * Encabezado de página con el mismo estilo del inicio y de Clientes:
 * círculo de color con ícono, título en negrita, frase corta y acciones a la derecha.
 */
const LmsPageHeader: React.FC<LmsPageHeaderProps> = ({
  title,
  subtitle,
  icon,
  color = '#00BFA5',
  actions
}) => (
  <Box
    component='header'
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 2,
      mb: 4
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
      <Avatar sx={{ bgcolor: color, mr: 2, width: 48, height: 48 }}>
        {React.cloneElement(icon, { sx: { fontSize: 28 } })}
      </Avatar>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant='h4' component='h1' fontWeight='bold'>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant='body2' color='text.secondary'>
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
    {actions && <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>{actions}</Box>}
  </Box>
)

export default LmsPageHeader
