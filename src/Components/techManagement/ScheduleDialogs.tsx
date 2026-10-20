import { useEffect, useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Typography
} from '@mui/material'
import { UploadFile } from '@mui/icons-material'
import {
  techErrorMessage,
  useExecuteActivity,
  useScheduleActivity,
  useServiceRequest
} from '@hooks/useTechManagement'
import { EquipmentActivity } from 'src/types/techManagement'
import { ACTIVITY_TYPE_LABELS, formatDate, notifyError, notifySuccess, primaryButtonSx, todayIso } from './techUi'

const dialogTitleSx = {
  background: 'linear-gradient(135deg, #10b981, #059669)',
  color: 'white',
  textAlign: 'center' as const,
  fontWeight: 700
}

interface ScheduleProps {
  customerId: string
  equipmentIds: number[]
  open: boolean
  onClose: () => void
}

/** Programa un preventivo o una calibración para uno o varios equipos. */
export const ScheduleActivityDialog = ({ customerId, equipmentIds, open, onClose }: ScheduleProps) => {
  const [type, setType] = useState('preventive')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const schedule = useScheduleActivity(customerId)

  useEffect(() => {
    if (open) {
      setType('preventive')
      setDueDate('')
      setNotes('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!dueDate) {
      notifyError('Indica la fecha programada')
      return
    }
    try {
      await schedule.mutateAsync({ customerEquipmentIds: equipmentIds, type, dueDate, notes: notes || undefined })
      notifySuccess(equipmentIds.length > 1 ? `${equipmentIds.length} actividades programadas` : 'Actividad programada')
      onClose()
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo programar'))
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={dialogTitleSx}>Programar actividad</DialogTitle>
      <DialogContent sx={{ pt: '24px !important' }}>
        <Typography variant='body2' color='text.secondary' mb={2}>
          {equipmentIds.length === 1 ? '1 equipo seleccionado' : `${equipmentIds.length} equipos seleccionados`}
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField select fullWidth size='small' label='Tipo' value={type} onChange={(e) => setType(e.target.value)}>
              <MenuItem value='preventive'>{ACTIVITY_TYPE_LABELS.preventive}</MenuItem>
              <MenuItem value='calibration'>{ACTIVITY_TYPE_LABELS.calibration}</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size='small'
              type='date'
              label='Fecha programada'
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size='small' multiline minRows={2} label='Notas' value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={schedule.isLoading} sx={primaryButtonSx}>
          Programar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface ExecuteProps {
  customerId: string
  open: boolean
  /** Actividad programada a ejecutar; sin ella se registra una ejecución no programada (p. ej. un correctivo). */
  activity?: EquipmentActivity | null
  equipmentId?: number
  onClose: () => void
}

/** Registra la ejecución: fecha, resultado, quién la hizo y la evidencia (PDF o imagen). */
export const ExecuteActivityDialog = ({ customerId, open, activity, equipmentId, onClose }: ExecuteProps) => {
  const [type, setType] = useState('corrective')
  const [executedAt, setExecutedAt] = useState(todayIso())
  const [result, setResult] = useState('conforme')
  const [origin, setOrigin] = useState('metromedics')
  const [provider, setProvider] = useState('')
  const [notes, setNotes] = useState('')
  const [nextDueDate, setNextDueDate] = useState('')
  const [evidence, setEvidence] = useState<File | null>(null)
  const execute = useExecuteActivity(customerId)

  useEffect(() => {
    if (open) {
      setType('corrective')
      setExecutedAt(todayIso())
      setResult('conforme')
      setOrigin('metromedics')
      setProvider('')
      setNotes('')
      setNextDueDate('')
      setEvidence(null)
    }
  }, [open])

  const handleSubmit = async () => {
    if (evidence && evidence.size > 15 * 1024 * 1024) {
      notifyError('La evidencia no puede superar 15 MB')
      return
    }
    try {
      await execute.mutateAsync({
        activityId: activity?.id,
        customerEquipmentId: activity ? undefined : equipmentId,
        type: activity ? undefined : type,
        executedAt,
        result,
        origin,
        provider: origin === 'third_party' ? provider : undefined,
        notes: notes || undefined,
        nextDueDate: nextDueDate || undefined,
        evidence
      })
      notifySuccess('Ejecución registrada')
      onClose()
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo registrar la ejecución'))
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={dialogTitleSx}>{activity ? 'Registrar ejecución' : 'Registrar servicio no programado'}</DialogTitle>
      <DialogContent sx={{ pt: '24px !important' }}>
        {activity && (
          <Typography variant='body2' color='text.secondary' mb={2}>
            {ACTIVITY_TYPE_LABELS[activity.type]} programado para el {formatDate(activity.dueDate)}
            {activity.equipment && ` · ${activity.equipment.name}`}
          </Typography>
        )}
        <Grid container spacing={2}>
          {!activity && (
            <Grid item xs={12} sm={6}>
              <TextField select fullWidth size='small' label='Tipo' value={type} onChange={(e) => setType(e.target.value)}>
                {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                  <MenuItem key={value} value={value}>
                    {label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size='small'
              type='date'
              label='Fecha de ejecución'
              value={executedAt}
              onChange={(e) => setExecutedAt(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <RadioGroup row value={result} onChange={(e) => setResult(e.target.value)}>
              <FormControlLabel value='conforme' control={<Radio />} label='Conforme' />
              <FormControlLabel value='no_conforme' control={<Radio />} label='No conforme' />
            </RadioGroup>
            {(result === 'no_conforme' || (!activity && type === 'corrective')) && (
              <Alert severity='info' sx={{ mt: 1 }}>
                Quedará pendiente la pregunta de tecnovigilancia: ¿pudo afectar a un paciente o usuario?
              </Alert>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth size='small' label='Realizado por' value={origin} onChange={(e) => setOrigin(e.target.value)}>
              <MenuItem value='metromedics'>Metromedics</MenuItem>
              <MenuItem value='third_party'>Otro proveedor</MenuItem>
            </TextField>
          </Grid>
          {origin === 'third_party' && (
            <Grid item xs={12} sm={6}>
              <TextField fullWidth size='small' label='Proveedor' value={provider} onChange={(e) => setProvider(e.target.value)} />
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size='small'
              type='date'
              label='Próxima fecha (opcional)'
              helperText='Si se deja vacía, se calcula con la periodicidad del equipo'
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth size='small' multiline minRows={2} label='Observaciones / diagnóstico' value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <Button component='label' variant='outlined' startIcon={<UploadFile />} sx={{ textTransform: 'none' }}>
              {evidence ? evidence.name : 'Adjuntar evidencia (PDF o imagen)'}
              <input
                hidden
                type='file'
                accept='application/pdf,image/png,image/jpeg,image/webp'
                onChange={(event) => setEvidence(event.target.files?.[0] || null)}
              />
            </Button>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={execute.isLoading} sx={primaryButtonSx}>
          Registrar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

interface ServiceRequestProps {
  customerId: string
  equipmentIds: number[]
  open: boolean
  onClose: () => void
}

/** Solicitud de servicio a Metromedics para los equipos seleccionados (llega por correo al área comercial). */
export const ServiceRequestDialog = ({ customerId, equipmentIds, open, onClose }: ServiceRequestProps) => {
  const [message, setMessage] = useState('')
  const request = useServiceRequest(customerId)

  useEffect(() => {
    if (open) setMessage('')
  }, [open])

  const handleSubmit = async () => {
    try {
      await request.mutateAsync({ customerEquipmentIds: equipmentIds, message })
      notifySuccess('Solicitud enviada a Metromedics')
      onClose()
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo enviar la solicitud'))
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth='sm' fullWidth PaperProps={{ sx: { borderRadius: '16px' } }}>
      <DialogTitle sx={dialogTitleSx}>Solicitar servicio a Metromedics</DialogTitle>
      <DialogContent sx={{ pt: '24px !important' }}>
        <Typography variant='body2' color='text.secondary' mb={2}>
          {equipmentIds.length} equipo(s) seleccionado(s). Metromedics recibirá la lista con sus datos y se pondrá en
          contacto para programar el servicio.
        </Typography>
        <TextField
          fullWidth
          multiline
          minRows={3}
          label='¿Qué necesitas? (calibración, mantenimiento, una falla...)'
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleSubmit} disabled={request.isLoading} sx={primaryButtonSx}>
          Enviar solicitud
        </Button>
      </DialogActions>
    </Dialog>
  )
}
