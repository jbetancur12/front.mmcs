import React from 'react'
import { Box, Button, CircularProgress, Paper } from '@mui/material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'

interface FormPageProps {
  /** Acción que hace el formulario: "Nuevo reporte", "Editar reporte". */
  title: string
  /** Una frase sobre qué se registra. */
  subtitle?: string
  /** Ícono del círculo del encabezado (de `@mui/icons-material`). */
  icon: React.ReactElement
  onSubmit: (e?: React.FormEvent<HTMLFormElement>) => void
  onCancel: () => void
  /** Texto del botón principal; repite el verbo del título. */
  submitLabel: string
  /** Bloquea los botones y muestra un indicador en el principal. */
  loading?: boolean
  /** Avisos que van encima de los botones (por ejemplo `FormErrorSummary`). */
  notices?: React.ReactNode
  /** Secciones: `FormSection`. */
  children: React.ReactNode
}

/**
 * Página de formulario largo (más de un diálogo): `Container xl`,
 * encabezado de página, secciones en tarjetas y una barra inferior fija con
 * Cancelar / acción principal en turquesa. Los campos reciben el foco
 * turquesa igual que en `FormDialog`.
 */
const FormPage: React.FC<FormPageProps> = ({
  title,
  subtitle,
  icon,
  onSubmit,
  onCancel,
  submitLabel,
  loading = false,
  notices,
  children
}) => (
  <Box
    component='form'
    noValidate
    onSubmit={onSubmit}
    sx={{
      '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#00897B'
      },
      '& .MuiInputLabel-root.Mui-focused': { color: '#00695C' }
    }}
  >
    <LmsPageHeader title={title} subtitle={subtitle} icon={icon} />
    <Box sx={{ display: 'grid', gap: 3, maxWidth: 1100 }}>{children}</Box>
    <Paper
      elevation={0}
      sx={{
        position: 'sticky',
        bottom: 0,
        zIndex: 2,
        mt: 3,
        maxWidth: 1100,
        px: 3,
        py: 1.5,
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        flexWrap: 'wrap'
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>{notices}</Box>
      <Button onClick={onCancel} disabled={loading} sx={{ color: '#4b5563' }}>
        Cancelar
      </Button>
      <Button
        type='submit'
        variant='contained'
        disabled={loading}
        startIcon={
          loading ? <CircularProgress size={18} color='inherit' /> : undefined
        }
        sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
      >
        {submitLabel}
      </Button>
    </Paper>
  </Box>
)

export default FormPage
