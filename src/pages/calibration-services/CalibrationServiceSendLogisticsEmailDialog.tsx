import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
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
    sendWhatsApp?: boolean
    whatsappPhone?: string | null
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
  const defaultWhatsappPhone = useMemo(
    () => service.contactPhone || service.customer?.telefono || '',
    [service.contactPhone, service.customer?.telefono]
  )
  const defaultSource = service.contactEmail
    ? 'correo de contacto del servicio'
    : service.customer?.email
      ? 'correo del cliente maestro'
      : 'sin correo definido'

  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [sendWhatsApp, setSendWhatsApp] = useState(false)
  const [whatsappPhone, setWhatsappPhone] = useState('')

  useEffect(() => {
    if (!open) {
      return
    }

    setRecipientEmail(defaultRecipientEmail)
    setRecipientName(defaultRecipientName)
    setSendWhatsApp(false)
    setWhatsappPhone(defaultWhatsappPhone)
  }, [defaultRecipientEmail, defaultRecipientName, defaultWhatsappPhone, open])

  const handleSubmit = async () => {
    await onSubmit({
      recipientEmail: recipientEmail.trim() || null,
      recipientName: recipientName.trim() || null,
      sendWhatsApp,
      whatsappPhone: sendWhatsApp ? whatsappPhone.trim() || null : null
    })
  }

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Enviar formato logístico</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2.5} sx={{ mt: 0.5 }}>
          <Typography variant='body2' color='text.secondary'>
            Se generará una nueva versión del PDF de control de ingreso y entrega con
            la información diligenciada actualmente y se enviará adjunta por correo. También
            puedes enviarlo por WhatsApp al mismo tiempo.
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

          <FormControlLabel
            control={
              <Checkbox
                checked={sendWhatsApp}
                onChange={(event) => setSendWhatsApp(event.target.checked)}
              />
            }
            label='Enviar también por WhatsApp'
          />

          {sendWhatsApp ? (
            <TextField
              fullWidth
              label='Número de WhatsApp'
              value={whatsappPhone}
              onChange={(event) => setWhatsappPhone(event.target.value)}
              helperText='Debe ser un celular con WhatsApp (los teléfonos fijos no reciben). Por defecto: el teléfono de contacto del servicio.'
            />
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={() => void handleSubmit()}
          disabled={
            isLoading ||
            !recipientEmail.trim() ||
            (sendWhatsApp && !whatsappPhone.trim())
          }
        >
          {sendWhatsApp ? 'Enviar correo y WhatsApp' : 'Enviar correo'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceSendLogisticsEmailDialog
