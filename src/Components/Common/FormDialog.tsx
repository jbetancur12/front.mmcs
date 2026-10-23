import React from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'

interface FormDialogProps {
  open: boolean
  onClose: () => void
  /** Acción que hace el diálogo: "Agregar sensor", "Configurar patrón". */
  title: string
  /** Sobre qué actúa: el nombre de la cámara o del patrón. */
  subtitle?: string
  /** Texto del botón principal. Repite el verbo del título. */
  submitLabel: string
  onSubmit: () => void
  /** Bloquea los botones y muestra un indicador en el principal. */
  loading?: boolean
  /** Bloquea el botón principal cuando el formulario no es válido. */
  submitDisabled?: boolean
  /** Texto del botón de cerrar; por defecto "Cancelar". */
  cancelLabel?: string
  /** Acción secundaria a la izquierda de los botones (por ejemplo, "Enviar por WhatsApp"). */
  extraActions?: React.ReactNode
  /** `xs` para uno o dos campos; `md` para formularios con secciones. */
  maxWidth?: 'xs' | 'sm' | 'md'
  children: React.ReactNode
}

/**
 * Diálogo de formulario de la operación: título con contexto, contenido y
 * botones Cancelar / acción principal en turquesa. Para diálogos de
 * cliente y usuarios (cabecera esmeralda) sigue el patrón de `/settings`.
 */
const FormDialog: React.FC<FormDialogProps> = ({
  open,
  onClose,
  title,
  subtitle,
  submitLabel,
  onSubmit,
  loading = false,
  submitDisabled = false,
  cancelLabel = 'Cancelar',
  extraActions,
  maxWidth = 'xs',
  children
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth={maxWidth}
    fullWidth
    PaperProps={{ sx: { borderRadius: '12px' } }}
  >
    <DialogTitle
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 1
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant='h6' component='span' fontWeight={700}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant='body2' color='text.secondary'>
            {subtitle}
          </Typography>
        )}
      </Box>
      <IconButton aria-label='Cerrar' onClick={onClose} edge='end'>
        <CloseIcon />
      </IconButton>
    </DialogTitle>
    <DialogContent
      dividers
      sx={{
        pt: 2.5,
        // Foco turquesa en los campos, igual que AuthField y DataTable
        '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
          { borderColor: '#00897B' },
        '& .MuiInputLabel-root.Mui-focused': { color: '#00695C' }
      }}
    >
      {children}
    </DialogContent>
    <DialogActions sx={{ p: '16px 24px' }}>
      {extraActions ? <Box sx={{ mr: 'auto' }}>{extraActions}</Box> : null}
      <Button onClick={onClose} disabled={loading} sx={{ color: '#4b5563' }}>
        {cancelLabel}
      </Button>
      <Button
        variant='contained'
        onClick={onSubmit}
        disabled={loading || submitDisabled}
        startIcon={
          loading ? <CircularProgress size={18} color='inherit' /> : undefined
        }
        sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
      >
        {submitLabel}
      </Button>
    </DialogActions>
  </Dialog>
)

export default FormDialog

interface FormDialogSectionProps {
  /** Qué agrupa: "Datos de la empresa", "Contacto". */
  title: string
  /** Una línea opcional sobre para qué sirven estos datos. */
  description?: string
  children: React.ReactNode
}

/**
 * Grupo de campos dentro de un FormDialog: título corto en negrita y los
 * campos en una cuadrícula de 2 columnas (1 en móvil). Entre secciones,
 * 24px de aire; sin íconos ni colores propios.
 */
export const FormDialogSection: React.FC<FormDialogSectionProps> = ({
  title,
  description,
  children
}) => (
  <Box
    component='fieldset'
    sx={{ border: 0, m: 0, p: 0, minWidth: 0, '& + &': { mt: 3 } }}
  >
    <Typography
      component='legend'
      sx={{ p: 0, fontSize: 15, fontWeight: 700, color: '#111827' }}
    >
      {title}
    </Typography>
    {description && (
      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.25 }}>
        {description}
      </Typography>
    )}
    <Box
      sx={{
        mt: 1.5,
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: 'minmax(0, 1fr)',
          sm: 'repeat(2, minmax(0, 1fr))'
        }
      }}
    >
      {children}
    </Box>
  </Box>
)
