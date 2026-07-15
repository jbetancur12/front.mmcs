import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { CalibrationServiceAdjustment } from '../../types/calibrationService'

interface AdjustmentResponseEntry {
  adjustmentId: number
  decision: 'approved' | 'rejected' | 'changes_requested'
}

interface CalibrationServiceAdjustmentCustomerResponseDialogProps {
  open: boolean
  adjustments: CalibrationServiceAdjustment[]
  isLoading?: boolean
  onClose: () => void
  onSubmit: (
    entries: Array<{
      adjustmentId: number
      decision: 'approved' | 'rejected' | 'changes_requested'
      responseChannel?: string | null
      responseReference?: string | null
      notes?: string | null
      evidenceFile?: File | null
    }>
  ) => Promise<void>
}

const DECISION_LABELS: Record<string, string> = {
  approved: 'Aprueba la novedad',
  rejected: 'Rechaza la novedad',
  changes_requested: 'Solicita ajuste o nueva propuesta'
}

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  call: 'Llamada',
  email: 'Correo electrónico',
  in_person: 'Presencial',
  other: 'Otro'
}

const TYPE_LABELS: Record<string, string> = {
  quantity_less: 'Cant. menor',
  quantity_more: 'Cant. mayor',
  extra_item: 'Item adicional',
  not_received: 'No recibido',
  scope_change: 'Cambio alcance'
}

const CalibrationServiceAdjustmentCustomerResponseDialog = ({
  open,
  adjustments,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceAdjustmentCustomerResponseDialogProps) => {
  const [entries, setEntries] = useState<AdjustmentResponseEntry[]>([])
  const [responseChannel, setResponseChannel] = useState('whatsapp')
  const [responseReference, setResponseReference] = useState('')
  const [notes, setNotes] = useState('')
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    setEntries(
      adjustments.map((a) => ({
        adjustmentId: a.id,
        decision: 'approved' as const
      }))
    )
    setResponseChannel('whatsapp')
    setResponseReference('')
    setNotes('')
    setEvidenceFile(null)
    setIsSaving(false)
  }, [open, adjustments])

  const setDecisionFor = (adjustmentId: number, decision: 'approved' | 'rejected' | 'changes_requested') => {
    setEntries((prev) =>
      prev.map((e) => (e.adjustmentId === adjustmentId ? { ...e, decision } : e))
    )
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      await onSubmit(
        entries.map((entry) => ({
          ...entry,
          responseChannel: responseChannel || null,
          responseReference: responseReference.trim() || null,
          notes: notes.trim() || null,
          evidenceFile
        }))
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={isSaving ? undefined : onClose} fullWidth maxWidth='md'>
      <DialogTitle>
        {adjustments.length > 1
          ? `Registrar respuesta del cliente/calidad (${adjustments.length} novedades)`
          : 'Registrar respuesta del cliente/calidad'}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 0.5 }}>
          {/* Common data section */}
          <Stack
            spacing={2}
            sx={{
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography variant='subtitle2' fontWeight={800}>
              Datos comunes
              <Typography variant='caption' color='text.secondary' sx={{ ml: 1 }}>
                (aplica a todas las novedades)
              </Typography>
            </Typography>
            <TextField
              select
              fullWidth
              label='Medio de respuesta'
              value={responseChannel}
              onChange={(event) => setResponseChannel(event.target.value)}
              helperText='Indica cómo confirmaron la respuesta.'
            >
              {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>{label}</MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              label='Referencia o detalle del medio'
              value={responseReference}
              onChange={(event) => setResponseReference(event.target.value)}
              helperText='Opcional. Ejemplo: número de celular, correo, nombre del contacto o contexto breve.'
            />
            <TextField
              fullWidth
              multiline
              minRows={2}
              label='Observación general'
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              helperText='Trazabilidad de la respuesta del cliente/calidad.'
            />
            <Stack spacing={1}>
              <Button component='label' variant='outlined' disabled={isSaving}>
                Adjuntar evidencia opcional
                <input
                  hidden
                  type='file'
                  accept='.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx'
                  onChange={(event) =>
                    setEvidenceFile(event.target.files?.[0] || null)
                  }
                />
              </Button>
              <Typography variant='caption' color='text.secondary'>
                {evidenceFile
                  ? evidenceFile.name
                  : 'Se adjuntará a todas las novedades. Si necesitas archivos distintos, regístralas una por una.'}
              </Typography>
            </Stack>
          </Stack>

          {/* Per-item decisions */}
          <Typography variant='subtitle2' fontWeight={800}>
            Decisión por cada novedad
          </Typography>
          {adjustments.map((adjustment) => {
            const entry = entries.find((e) => e.adjustmentId === adjustment.id)
            return (
              <Stack
                key={adjustment.id}
                spacing={1.5}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  bgcolor: 'background.paper'
                }}
              >
                <Stack direction='row' spacing={1} alignItems='center'>
                  <Typography variant='body2' fontWeight={700} color='primary.main'>
                    {adjustment.itemName}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    · {TYPE_LABELS[adjustment.changeType] || adjustment.changeType}
                  </Typography>
                </Stack>
                <TextField
                  select
                  fullWidth
                  size='small'
                  label='Respuesta del cliente/calidad'
                  value={entry?.decision || 'approved'}
                  onChange={(event) =>
                    setDecisionFor(
                      adjustment.id,
                      event.target.value as 'approved' | 'rejected' | 'changes_requested'
                    )
                  }
                >
                  {Object.entries(DECISION_LABELS).map(([value, label]) => (
                    <MenuItem key={value} value={value}>{label}</MenuItem>
                  ))}
                </TextField>
              </Stack>
            )
          })}

          {isSaving ? (
            <LinearProgress />
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading || isSaving}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={() => void handleSubmit()}
          disabled={isLoading || isSaving}
        >
          {adjustments.length > 1
            ? `Guardar respuestas (${adjustments.length})`
            : 'Guardar respuesta'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceAdjustmentCustomerResponseDialog
