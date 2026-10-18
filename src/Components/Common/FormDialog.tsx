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
  maxWidth?: 'xs' | 'sm'
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
    <DialogContent dividers sx={{ pt: 2.5 }}>
      {children}
    </DialogContent>
    <DialogActions sx={{ p: '16px 24px' }}>
      <Button onClick={onClose} disabled={loading} sx={{ color: '#4b5563' }}>
        Cancelar
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
