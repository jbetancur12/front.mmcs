import React, { useState } from 'react'
import { Box, Button, Grid, Typography } from '@mui/material'

const isMissingValue = (children: React.ReactNode) =>
  typeof children === 'string' && /^(Sin |ODS pendiente|—)/.test(children.trim())

interface DetailFieldProps {
  label: string
  children: React.ReactNode
}

/**
 * Dato de una ficha: etiqueta pequeña y valor debajo.
 * Cuando el dato falta ("Sin registrar", "Sin definir"…) se ve más tenue para que
 * lo completo destaque.
 */
export const DetailField = ({ label, children }: DetailFieldProps) => (
  <Box>
    <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
      {label}
    </Typography>
    <Typography
      variant='body2'
      component='div'
      sx={{
        fontWeight: isMissingValue(children) ? 400 : 600,
        color: isMissingValue(children) ? 'text.disabled' : 'text.primary',
        wordBreak: 'break-word'
      }}
    >
      {children}
    </Typography>
  </Box>
)

interface DetailSectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

/** Bloque de la ficha con título; los datos van en dos columnas. */
export const DetailSection = ({ title, description, children }: DetailSectionProps) => (
  <Box sx={{ '& + &': { mt: 3, pt: 3, borderTop: '1px solid #e5e7eb' } }}>
    <Typography variant='subtitle1' fontWeight={700}>
      {title}
    </Typography>
    {description ? (
      <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
        {description}
      </Typography>
    ) : (
      <Box sx={{ mb: 1.5 }} />
    )}
    <Grid container spacing={2}>
      {children}
    </Grid>
  </Box>
)

/** Celda de una sección: media fila, o fila completa con `full`. */
export const DetailCell = ({ full = false, children }: { full?: boolean; children: React.ReactNode }) => (
  <Grid item xs={12} md={full ? 12 : 6}>
    {children}
  </Grid>
)

/** Texto largo (comentarios, acuerdos): se recorta y se abre con "Ver todo". */
export const ClampedText = ({ text, lines = 4 }: { text: string; lines?: number }) => {
  const [open, setOpen] = useState(false)
  const isLong = text.length > 280
  return (
    <Box>
      <Typography
        variant='body2'
        sx={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          ...(isLong && !open
            ? { display: '-webkit-box', WebkitLineClamp: lines, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
            : {})
        }}
      >
        {text}
      </Typography>
      {isLong && (
        <Button
          size='small'
          onClick={() => setOpen((value) => !value)}
          sx={{ mt: 0.5, px: 0, textTransform: 'none', fontWeight: 600, color: '#00897B', minWidth: 0 }}
        >
          {open ? 'Ver menos' : 'Ver todo'}
        </Button>
      )}
    </Box>
  )
}
