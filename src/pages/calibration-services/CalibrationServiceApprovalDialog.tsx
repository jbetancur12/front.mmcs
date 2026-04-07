import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import { useEffect, useState } from 'react'

const APPROVAL_CHANNEL_OPTIONS = [
  'En persona',
  'Por Email',
  'Por Telefono',
  'Por WhatsApp'
]

export type CalibrationServiceDecisionMode = 'approve' | 'reject'

export interface CalibrationServiceDecisionValues {
  approvalChannel: string
  approvalReference: string
  decisionDate: string
  notes: string
  evidenceFile: File | null
}

interface CalibrationServiceApprovalDialogProps {
  open: boolean
  mode: CalibrationServiceDecisionMode
  serviceCode: string
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: CalibrationServiceDecisionValues) => Promise<void> | void
}

const buildTodayValue = () => new Date().toISOString().slice(0, 10)

const createInitialValues = (): CalibrationServiceDecisionValues => ({
  approvalChannel: '',
  approvalReference: '',
  decisionDate: buildTodayValue(),
  notes: '',
  evidenceFile: null
})

const CalibrationServiceApprovalDialog = ({
  open,
  mode,
  serviceCode,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceApprovalDialogProps) => {
  const [values, setValues] = useState<CalibrationServiceDecisionValues>(
    createInitialValues
  )

  useEffect(() => {
    if (!open) {
      setValues(createInitialValues())
    }
  }, [open, mode])

  const isRejectMode = mode === 'reject'

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>
        {isRejectMode ? 'Registrar rechazo formal' : 'Registrar aprobación formal'}
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Alert severity={isRejectMode ? 'warning' : 'success'}>
            {isRejectMode
              ? `Esta acción deja trazabilidad formal del rechazo para ${serviceCode}.`
              : `Esta acción deja trazabilidad formal de la aprobación para ${serviceCode}.`}
          </Alert>

          <FormControl fullWidth required>
            <InputLabel>
              {isRejectMode ? 'Medio de rechazo' : 'Medio de aprobación'}
            </InputLabel>
            <Select
              value={values.approvalChannel}
              label={isRejectMode ? 'Medio de rechazo' : 'Medio de aprobación'}
              disabled={isLoading}
              onChange={(event) =>
                setValues((previous) => ({
                  ...previous,
                  approvalChannel: event.target.value
                }))
              }
            >
              {APPROVAL_CHANNEL_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type='date'
            label='Fecha'
            value={values.decisionDate}
            disabled={isLoading}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                decisionDate: event.target.value
              }))
            }
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            required={!isRejectMode}
            label='Email o teléfono'
            value={values.approvalReference}
            disabled={isLoading}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                approvalReference: event.target.value
              }))
            }
            helperText={
              isRejectMode
                ? 'Opcional si el rechazo no llegó por un contacto específico.'
                : 'Campo obligatorio para dejar la referencia del visto bueno.'
            }
          />

          <TextField
            fullWidth
            required={isRejectMode}
            multiline
            minRows={4}
            label={isRejectMode ? 'Motivo u observación' : 'Observación'}
            value={values.notes}
            disabled={isLoading}
            onChange={(event) =>
              setValues((previous) => ({
                ...previous,
                notes: event.target.value
              }))
            }
            helperText={
              isRejectMode
                ? 'Describe brevemente por qué la cotización fue rechazada.'
                : 'Úsalo para dejar contexto adicional de la aprobación.'
            }
          />

          <Box>
            <Button
              component='label'
              variant='outlined'
              startIcon={<UploadFileOutlinedIcon />}
              disabled={isLoading}
            >
              Adjuntar evidencia
              <input
                hidden
                type='file'
                accept='.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx'
                onChange={(event) =>
                  setValues((previous) => ({
                    ...previous,
                    evidenceFile: event.target.files?.[0] || null
                  }))
                }
              />
            </Button>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              {values.evidenceFile
                ? values.evidenceFile.name
                : 'Puedes adjuntar correo, captura, acta o soporte documental.'}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          variant='contained'
          color={isRejectMode ? 'warning' : 'success'}
          disabled={isLoading}
          onClick={() => void onSubmit(values)}
        >
          {isRejectMode
            ? isLoading
              ? 'Registrando rechazo...'
              : 'Registrar rechazo'
            : isLoading
              ? 'Registrando aprobación...'
              : 'Registrar aprobación'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceApprovalDialog
