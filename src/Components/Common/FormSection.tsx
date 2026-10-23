import React from 'react'
import { Box, Paper, Typography } from '@mui/material'

interface FormSectionProps {
  /** Qué agrupa: "Datos generales", "Servicio afectado". */
  title: string
  /** Una línea opcional sobre para qué sirven estos datos. */
  description?: string
  children: React.ReactNode
}

const gridSx = {
  display: 'grid',
  gap: 2,
  // Columnas según el ancho: mínimo 300px por campo y como máximo 3 por fila
  gridTemplateColumns:
    'repeat(auto-fill, minmax(min(100%, max(300px, calc((100% - 32px) / 3))), 1fr))'
}

/**
 * Sección de un formulario de página completa: tarjeta blanca con borde
 * `#e5e7eb`, título en negrita y los campos en una cuadrícula que se adapta al ancho
 * (1 a 3 columnas, mínimo 300px por campo). Es el equivalente de `FormDialogSection` fuera de un diálogo.
 * Los hijos directos son subsecciones (`FormSubsection`) o campos.
 */
const FormSection: React.FC<FormSectionProps> = ({
  title,
  description,
  children
}) => (
  <Paper
    component='section'
    elevation={0}
    sx={{
      p: { xs: 2, md: 3 },
      borderRadius: '16px',
      border: '1px solid #e5e7eb'
    }}
  >
    <Typography
      component='h2'
      sx={{ fontSize: 17, fontWeight: 700, color: '#111827' }}
    >
      {title}
    </Typography>
    {description && (
      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.25 }}>
        {description}
      </Typography>
    )}
    <Box sx={{ ...gridSx, mt: 2.5 }}>{children}</Box>
  </Paper>
)

export default FormSection

interface FormSubsectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

/** Subgrupo dentro de una `FormSection` (4.1, 4.2...): ocupa todo el ancho y tiene su propia cuadrícula. */
export const FormSubsection: React.FC<FormSubsectionProps> = ({
  title,
  description,
  children
}) => (
  <Box
    component='fieldset'
    sx={{ border: 0, m: 0, p: 0, minWidth: 0, gridColumn: '1 / -1' }}
  >
    <Typography
      component='legend'
      sx={{ p: 0, fontSize: 15, fontWeight: 600, color: '#00695C' }}
    >
      {title}
    </Typography>
    {description && (
      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.25 }}>
        {description}
      </Typography>
    )}
    <Box sx={{ ...gridSx, mt: 1.5 }}>{children}</Box>
  </Box>
)

/** Hijo de la cuadrícula que ocupa todo el ancho (textos largos, resúmenes). */
export const FormGridItem: React.FC<{ children: React.ReactNode }> = ({
  children
}) => <Box sx={{ gridColumn: '1 / -1' }}>{children}</Box>
