import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import FormDialog from '../../Components/Common/FormDialog'
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

/** Envía el formato logístico de ingreso y entrega por correo y, si se quiere, por WhatsApp. */
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
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title='Enviar formato logístico'
      subtitle={service.serviceCode}
      submitLabel={sendWhatsApp ? 'Enviar correo y WhatsApp' : 'Enviar correo'}
      onSubmit={() => void handleSubmit()}
      loading={isLoading}
      submitDisabled={
        !recipientEmail.trim() || (sendWhatsApp && !whatsappPhone.trim())
      }
    >
      <Stack spacing={2}>
        <Typography variant='body2' color='text.secondary'>
          Se genera una versión nueva del PDF de control de ingreso y entrega
          con lo diligenciado hasta ahora y se envía adjunto por correo.
        </Typography>

        {sendPreview?.isDevOverride ? (
          <Alert severity='warning'>
            En desarrollo, el correo se redirigirá a{' '}
            <strong>
              {sendPreview.actualRecipient || 'sin correo override'}
            </strong>
            . Normalmente iría a{' '}
            <strong>
              {sendPreview.intendedRecipient || 'sin correo sugerido'}
            </strong>
            .
          </Alert>
        ) : null}

        <TextField
          fullWidth
          label='Nombre del destinatario'
          value={recipientName}
          onChange={(event) => setRecipientName(event.target.value)}
          helperText='Opcional. Se usa como saludo del correo.'
        />
        <TextField
          fullWidth
          required
          type='email'
          label='Correo destino'
          value={recipientEmail}
          onChange={(event) => setRecipientEmail(event.target.value)}
          helperText={`Sugerido: ${defaultSource}. Puedes cambiarlo antes de enviar.`}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={sendWhatsApp}
              onChange={(event) => setSendWhatsApp(event.target.checked)}
              sx={{ '&.Mui-checked': { color: '#00BFA5' } }}
            />
          }
          label='Enviar también por WhatsApp'
        />

        {sendWhatsApp ? (
          <TextField
            fullWidth
            required
            label='Número de WhatsApp'
            value={whatsappPhone}
            onChange={(event) => setWhatsappPhone(event.target.value)}
            helperText='Debe ser un celular con WhatsApp; los fijos no reciben. Por defecto, el teléfono de contacto del servicio.'
          />
        ) : null}
      </Stack>
    </FormDialog>
  )
}

export default CalibrationServiceSendLogisticsEmailDialog
