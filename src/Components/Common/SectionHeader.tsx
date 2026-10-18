import React from 'react'
import { Box, Typography } from '@mui/material'

interface SectionHeaderProps {
  title: string
  /** Cantidad de elementos de la sección, junto al título. */
  count?: number
  /** Frase corta bajo el título. */
  description?: string
  /** Botones alineados a la derecha. */
  actions?: React.ReactNode
}

/**
 * Título de una sección dentro de una página (no el de la página).
 * Para el encabezado de la pantalla usa LmsPageHeader.
 */
const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  count,
  description,
  actions
}) => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexWrap: 'wrap',
      gap: 1.5,
      mb: 2
    }}
  >
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography variant='h6' component='h2' fontWeight={700}>
          {title}
        </Typography>
        {count !== undefined && (
          <Typography variant='body2' color='text.secondary'>
            {count}
          </Typography>
        )}
      </Box>
      {description && (
        <Typography variant='body2' color='text.secondary'>
          {description}
        </Typography>
      )}
    </Box>
    {actions && <Box sx={{ display: 'flex', gap: 1 }}>{actions}</Box>}
  </Box>
)

export default SectionHeader
