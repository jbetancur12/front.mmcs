import React from 'react'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material'
import { WarningAmberRounded, HelpOutlineRounded } from '@mui/icons-material'

interface ConfirmDialogProps {
  open: boolean
  title: string
  /** Explicación de qué pasa si se confirma. */
  message: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` para acciones que quitan acceso o borran: botón rojo e ícono de advertencia. */
  tone?: 'default' | 'danger'
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}

/**
 * Confirmación antes de una acción con consecuencias (desactivar, quitar acceso, cambios masivos).
 * Cerrar con Esc o clic afuera equivale a cancelar, salvo mientras la acción está en curso.
 */
const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'default',
  loading = false,
  onConfirm,
  onClose
}) => {
  const danger = tone === 'danger'
  const accent = danger ? '#dc2626' : '#00BFA5'
  const Icon = danger ? WarningAmberRounded : HelpOutlineRounded

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth='xs'
      fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pt: 3 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'grid',
            placeItems: 'center',
            bgcolor: danger ? '#fef2f2' : '#e0f7f4',
            color: accent,
            flexShrink: 0
          }}
        >
          <Icon />
        </Box>
        <Typography component='span' variant='h6' fontWeight={700}>
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography component='div' variant='body2' color='text.secondary'>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} disabled={loading} sx={{ textTransform: 'none' }}>
          {cancelLabel}
        </Button>
        <Button
          variant='contained'
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={16} color='inherit' /> : undefined}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            bgcolor: accent,
            '&:hover': { bgcolor: danger ? '#b91c1c' : '#00ACC1' }
          }}
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ConfirmDialog
