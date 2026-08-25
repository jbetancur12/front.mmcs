import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import {
  CalibrationService,
  CalibrationServiceSendPreviewResult
} from '../../types/calibrationService'

interface Props {
  open: boolean
  service: CalibrationService
  isLoading?: boolean
  sendPreview?: CalibrationServiceSendPreviewResult | null
  onClose: () => void
  onSubmit: (values: {
    recipientEmail?: string | null
    recipientName?: string | null
  }) => void | Promise<void>
}

const CalibrationServiceSendLogisticsEmailDialog = ({
  open,
  service,
  isLoading = false,
  sendPreview = null,
  onClose,
  onSubmit
}: Props) => {
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

  useEffect(() => {
    if (!open) {
      return
    }

    setRecipientEmail(defaultRecipientEmail)
    setRecipientName(defaultRecipientName)
  }, [defaultRecipientEmail, defaultRecipientName, open])

  const handleSubmit = async () => {
    await onSubmit({
      recipientEmail: recipientEmail.trim() || null,
      recipientName: recipientName.trim() || null
    })
  }

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Enviar formato logístico</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <Typography variant='body2' color='text.secondary'>
            Se generará una nueva versión del PDF de control de ingreso y entrega con
            la información diligenciada actualmente y se enviará adjunta por correo.
          </Typography>

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
            helperText='Opcional. Se usará como saludo del correo.'
          />

          <TextField
            fullWidth
            type='email'
            label='Correo destino'
            value={recipientEmail}
            onChange={(event) => setRecipientEmail(event.target.value)}
            helperText='Puedes dejar el sugerido o cambiarlo antes de enviar.'
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={() => void handleSubmit()}
          disabled={isLoading || !recipientEmail.trim()}
        >
          Enviar correo
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceSendLogisticsEmailDialog
