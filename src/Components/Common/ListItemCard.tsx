import React from 'react'
import { Box, Paper, Stack, Typography } from '@mui/material'

interface ListItemCardProps {
  /** Código o nombre del elemento, en negrita. */
  title: string
  /** Empresa, cliente u otra referencia principal bajo el título. */
  subtitle?: string
  /** Dato que debe leerse de un vistazo (por ejemplo, un total). */
  highlight?: React.ReactNode
  /** Líneas pequeñas de apoyo: quién, cuándo, a cargo de quién. */
  meta?: React.ReactNode[]
  /** Si es true, la última línea de `meta` se marca en ámbar (algo falta). */
  metaWarning?: boolean
  /** Estado del elemento, normalmente un Chip a la derecha del título. */
  status?: React.ReactNode
  /** Acciones rápidas al pie. Los clics no abren el elemento. */
  actions?: React.ReactNode
  /** Abre el elemento. Sin esto la tarjeta es solo informativa. */
  onClick?: () => void
}

/**
 * Tarjeta de un elemento de una lista: título, referencia, estado y datos de apoyo.
 * Con `onClick` se comporta como botón (foco visible, Enter y espacio).
 */
const ListItemCard: React.FC<ListItemCardProps> = ({
  title,
  subtitle,
  highlight,
  meta = [],
  metaWarning = false,
  status,
  actions,
  onClick
}) => (
  <Paper
    variant='outlined'
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
      p: 1.5,
      borderRadius: '12px',
      borderColor: '#e5e7eb',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'border-color 0.15s, background-color 0.15s',
      '&:hover': onClick ? { borderColor: '#00BFA5', bgcolor: '#E0F7F4' } : undefined,
      '&:focus-visible': { outline: '3px solid #00897B', outlineOffset: 2 }
    }}
  >
    <Stack direction='row' justifyContent='space-between' alignItems='flex-start' spacing={1}>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant='body2' fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant='body2' color='text.secondary'>
            {subtitle}
          </Typography>
        )}
      </Box>
      {status}
    </Stack>
    {highlight && (
      <Typography variant='body2' sx={{ mt: 0.75 }}>
        {highlight}
      </Typography>
    )}
    {meta.map((line, index) => {
      const warn = metaWarning && index === meta.length - 1
      return (
        <Typography
          key={index}
          variant='caption'
          sx={{ display: 'block', mt: index === 0 && !highlight ? 0.5 : 0, color: warn ? '#b45309' : 'text.secondary', fontWeight: warn ? 600 : 400 }}
        >
          {line}
        </Typography>
      )
    })}
    {actions && (
      <Box
        sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {actions}
      </Box>
    )}
  </Paper>
)

export default ListItemCard
