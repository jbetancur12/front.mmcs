import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import { CalibrationServiceAdjustment } from '../../types/calibrationService'

interface CalibrationServiceAdjustmentCustomerResponseDialogProps {
  open: boolean
  adjustment: CalibrationServiceAdjustment | null
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: {
    decision: 'approved' | 'rejected' | 'changes_requested'
    responseChannel?: string | null
    responseReference?: string | null
    notes?: string | null
    evidenceFile?: File | null
  }) => void | Promise<void>
}

const CalibrationServiceAdjustmentCustomerResponseDialog = ({
  open,
  adjustment,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceAdjustmentCustomerResponseDialogProps) => {
  const [decision, setDecision] = useState<
    'approved' | 'rejected' | 'changes_requested'
  >('approved')
  const [responseChannel, setResponseChannel] = useState('whatsapp')
  const [responseReference, setResponseReference] = useState('')
  const [notes, setNotes] = useState('')
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    setDecision('approved')
    setResponseChannel('whatsapp')
    setResponseReference('')
    setNotes('')
    setEvidenceFile(null)
  }, [open, adjustment])

  const handleSubmit = async () => {
    await onSubmit({
      decision,
      responseChannel: responseChannel || null,
      responseReference: responseReference.trim() || null,
      notes: notes.trim() || null,
      evidenceFile
    })
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle>Registrar respuesta del cliente/calidad</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 0.5 }}>
          <Typography variant='body2' color='text.secondary'>
            {adjustment?.itemName || 'Sin ítem'} ·{' '}
            {adjustment?.description || 'Sin descripción'}
          </Typography>
          <TextField
            select
            fullWidth
            label='Respuesta del cliente/calidad'
            value={decision}
            onChange={(event) =>
              setDecision(
                event.target.value as
                  | 'approved'
                  | 'rejected'
                  | 'changes_requested'
              )
            }
          >
            <MenuItem value='approved'>Aprueba la novedad</MenuItem>
            <MenuItem value='rejected'>Rechaza la novedad</MenuItem>
            <MenuItem value='changes_requested'>
              Solicita ajuste o nueva propuesta
            </MenuItem>
          </TextField>
          <TextField
            select
            fullWidth
            label='Medio de respuesta'
            value={responseChannel}
            onChange={(event) => setResponseChannel(event.target.value)}
            helperText='Indica cómo confirmaron la respuesta.'
          >
            <MenuItem value='whatsapp'>WhatsApp</MenuItem>
            <MenuItem value='call'>Llamada</MenuItem>
            <MenuItem value='email'>Correo electrónico</MenuItem>
            <MenuItem value='in_person'>Presencial</MenuItem>
            <MenuItem value='other'>Otro</MenuItem>
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
            minRows={3}
            label='Observación'
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            helperText='Úsalo para dejar trazabilidad de la respuesta del cliente/calidad.'
          />
          <Stack spacing={1}>
            <Button component='label' variant='outlined' disabled={isLoading}>
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
                : 'Puedes adjuntar captura de WhatsApp, correo, acta o cualquier soporte útil.'}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={() => void handleSubmit()}
          disabled={isLoading}
        >
          Guardar respuesta
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceAdjustmentCustomerResponseDialog
