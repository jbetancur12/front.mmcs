import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { CalibrationService, CalibrationServiceAdjustment } from '../../types/calibrationService'
import { CalibrationServiceSendPreviewResult } from '../../types/calibrationService'

interface CalibrationServiceSendAdjustmentToCustomerDialogProps {
  open: boolean
  service: CalibrationService
  adjustments: CalibrationServiceAdjustment[]
  isLoading?: boolean
  sendPreview?: CalibrationServiceSendPreviewResult | null
  onClose: () => void
  onSubmit: (values: {
    recipientEmail?: string | null
    recipientName?: string | null
  }) => Promise<void>
}

const CalibrationServiceSendAdjustmentToCustomerDialog = ({
  open,
  service,
  adjustments,
  isLoading = false,
  sendPreview = null,
  onClose,
  onSubmit
}: CalibrationServiceSendAdjustmentToCustomerDialogProps) => {
  const defaultRecipientEmail = useMemo(
    () => service.contactEmail || service.customer?.email || '',
    [service.contactEmail, service.customer?.email]
  )
  const defaultRecipientName = useMemo(
    () => service.contactName || service.customer?.nombre || '',
    [service.contactName, service.customer?.nombre]
  )
  const defaultSource = service.contactEmail
    ? 'correo de contacto del servicio'
    : service.customer?.email
      ? 'correo del cliente maestro'
      : 'sin correo definido'

  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [progress, setProgress] = useState({ current: 0, total: 0 })

  useEffect(() => {
    if (!open) {
      return
    }

    setRecipientEmail(defaultRecipientEmail)
    setRecipientName(defaultRecipientName)
    setProgress({ current: 0, total: 0 })
  }, [open, defaultRecipientEmail, defaultRecipientName])

  const isSending = progress.total > 0

  const handleSubmit = async () => {
    setProgress({ current: 1, total: adjustments.length })
    await onSubmit({
      recipientEmail: recipientEmail.trim() || null,
      recipientName: recipientName.trim() || null
    })
    setProgress({ current: 0, total: 0 })
  }

  return (
    <Dialog open={open} onClose={isSending ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>
        {adjustments.length > 1
          ? `Enviar ${adjustments.length} novedades al cliente`
          : 'Enviar novedad al cliente'}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          {adjustments.length > 1 ? (
            <Alert severity='info'>
              Se enviará un <strong>solo correo</strong> con las{' '}
              <strong>{adjustments.length} novedades</strong> consolidadas.
              El cliente ve todo en un solo mensaje.
            </Alert>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              Vamos a enviar la novedad{' '}
              <strong>{adjustments[0]?.itemName || 'sin ítem'}</strong> al cliente para su
              validación.
            </Typography>
          )}

          {adjustments.length > 1 ? (
            <Stack spacing={0.5}>
              <Typography variant='subtitle2' fontWeight={700}>
                Novedades a enviar:
              </Typography>
              {adjustments.map((a) => (
                <Typography key={a.id} variant='body2' color='text.secondary'>
                  • {a.itemName} —{' '}
                  {({
                    quantity_less: 'Cant. menor',
                    quantity_more: 'Cant. mayor',
                    extra_item: 'Item adicional',
                    not_received: 'No recibido',
                    scope_change: 'Cambio alcance'
                  }[a.changeType] || a.changeType)}
                </Typography>
              ))}
            </Stack>
          ) : null}

          <Alert severity='info'>
            Correo sugerido según la regla actual: <strong>{defaultSource}</strong>.
          </Alert>

          {sendPreview?.isDevOverride ? (
            <Alert severity='warning'>
              En desarrollo, el correo se redirigirá a{' '}
              <strong>{sendPreview.actualRecipient || 'sin correo override'}</strong>.
              {' '}Normalmente iría a{' '}
              <strong>{sendPreview.intendedRecipient || 'sin correo sugerido'}</strong>.
            </Alert>
          ) : null}

          <TextField
            fullWidth
            label='Nombre del destinatario'
            value={recipientName}
            onChange={(event) => setRecipientName(event.target.value)}
            helperText='Opcional. Sirve para personalizar el correo.'
          />

          <TextField
            fullWidth
            type='email'
            label='Correo destino'
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            helperText='Puedes dejar el sugerido o cambiarlo antes de enviar.'
          />

          {isSending ? (
            <Stack spacing={1}>
              <LinearProgress
                variant='determinate'
                value={(progress.current / progress.total) * 100}
              />
              <Typography variant='caption' color='text.secondary' textAlign='center'>
                Enviando {progress.current} de {progress.total}...
              </Typography>
            </Stack>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading || isSending}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={() => void handleSubmit()}
          disabled={isLoading || isSending || !recipientEmail.trim()}
        >
          {adjustments.length > 1
            ? `Enviar consolidado (${adjustments.length})`
            : 'Enviar correo'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceSendAdjustmentToCustomerDialog
