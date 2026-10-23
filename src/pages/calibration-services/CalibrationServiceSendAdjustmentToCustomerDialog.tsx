import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  LinearProgress,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import FormDialog from '../../Components/Common/FormDialog'
import {
  CalibrationService,
  CalibrationServiceAdjustment,
  CalibrationServiceSendPreviewResult
} from '../../types/calibrationService'

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

const CHANGE_TYPE_LABELS: Record<string, string> = {
  quantity_less: 'Cant. menor',
  quantity_more: 'Cant. mayor',
  extra_item: 'Item adicional',
  not_received: 'No recibido',
  scope_change: 'Cambio alcance'
}

/** Envía por correo una o varias novedades al cliente para que las valide. */
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
    <FormDialog
      open={open}
      onClose={isLoading || isSending ? () => undefined : onClose}
      title={
        adjustments.length > 1
          ? `Enviar ${adjustments.length} novedades al cliente`
          : 'Enviar novedad al cliente'
      }
      subtitle={service.serviceCode}
      submitLabel={
        adjustments.length > 1
          ? `Enviar consolidado (${adjustments.length})`
          : 'Enviar correo'
      }
      onSubmit={() => void handleSubmit()}
      loading={isLoading || isSending}
      submitDisabled={!recipientEmail.trim()}
    >
      <Stack spacing={2}>
        {adjustments.length > 1 ? (
          <>
            <Typography variant='body2' color='text.secondary'>
              Se enviará <strong>un solo correo</strong> con las{' '}
              <strong>{adjustments.length} novedades</strong> consolidadas.
            </Typography>
            <Stack spacing={0.25}>
              <Typography variant='subtitle2' fontWeight={700}>
                Novedades a enviar
              </Typography>
              {adjustments.map((a) => (
                <Typography key={a.id} variant='body2' color='text.secondary'>
                  • {a.itemName} —{' '}
                  {CHANGE_TYPE_LABELS[a.changeType] || a.changeType}
                </Typography>
              ))}
            </Stack>
          </>
        ) : (
          <Typography variant='body2' color='text.secondary'>
            Se enviará la novedad{' '}
            <strong>{adjustments[0]?.itemName || 'sin ítem'}</strong> al cliente
            para su validación.
          </Typography>
        )}

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
          helperText='Opcional. Sirve para personalizar el correo.'
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

        {isSending ? (
          <Stack spacing={1}>
            <LinearProgress
              variant='determinate'
              value={(progress.current / progress.total) * 100}
              sx={{
                '& .MuiLinearProgress-bar': { bgcolor: '#00BFA5' },
                bgcolor: '#E0F7F4'
              }}
            />
            <Typography
              variant='caption'
              color='text.secondary'
              textAlign='center'
            >
              Enviando {progress.current} de {progress.total}…
            </Typography>
          </Stack>
        ) : null}
      </Stack>
    </FormDialog>
  )
}

export default CalibrationServiceSendAdjustmentToCustomerDialog
