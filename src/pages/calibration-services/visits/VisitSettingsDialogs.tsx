import { useEffect, useState } from 'react'
import { Alert, Stack, TextField } from '@mui/material'
import FormDialog, {
  FormDialogSection
} from '../../../Components/Common/FormDialog'
import { useVisitMutation } from '../../../hooks/useCalibrationVisits'
import {
  CalibrationVisit,
  CalibrationVisitsResponse,
  CertificateDeadlines
} from '../../../types/calibrationVisit'

export type VisitReasonAction = {
  type: 'cancel' | 'due_date'
  visit: CalibrationVisit
}

/** Cancelar una visita o ampliar su plazo de carga: ambas piden el motivo. */
export const VisitReasonDialog = ({
  serviceId,
  action,
  onClose
}: {
  serviceId: number
  action: VisitReasonAction | null
  onClose: () => void
}) => {
  const [reason, setReason] = useState('')
  const [dueDate, setDueDate] = useState('')
  const mutation = useVisitMutation(serviceId)

  useEffect(() => {
    setReason('')
    setDueDate(action?.visit.uploadDueDateOverride || '')
  }, [action])

  if (!action) return null
  const { visit, type } = action
  const cancelling = type === 'cancel'

  return (
    <FormDialog
      open
      onClose={mutation.isLoading ? () => undefined : onClose}
      title={cancelling ? 'Cancelar visita' : 'Cambiar plazo de carga'}
      subtitle={`Visita ${visit.visitNumber}`}
      submitLabel={cancelling ? 'Cancelar la visita' : 'Guardar plazo'}
      cancelLabel='Volver'
      onSubmit={() =>
        mutation.mutate(
          {
            method: cancelling ? 'post' : 'put',
            path: cancelling
              ? `visits/${visit.id}/cancel`
              : `visits/${visit.id}/upload-due-date`,
            success: cancelling ? 'Visita cancelada' : 'Plazo actualizado',
            body: cancelling ? { reason } : { reason, dueDate: dueDate || null }
          },
          { onSuccess: onClose }
        )
      }
      loading={mutation.isLoading}
      submitDisabled={!reason.trim()}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        {!cancelling && (
          <TextField
            type='date'
            label='Nueva fecha límite'
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            InputLabelProps={{ shrink: true }}
            inputProps={{ min: visit.endDate }}
            helperText='Déjala vacía para volver al plazo normal'
          />
        )}
        <TextField
          label='Motivo'
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
          multiline
          minRows={2}
        />
      </Stack>
    </FormDialog>
  )
}

const CLOCKS = [
  { key: 'upload', label: 'Cargar certificados (desde el fin de la visita)' },
  { key: 'review', label: 'Revisar y liberar (desde la carga)' },
  { key: 'adjustment', label: 'Corregir un certificado devuelto' },
  { key: 'nextVisit', label: 'Programar la próxima visita si quedan equipos' }
] as const

/** Plazos propios de la orden o contrato; vacío significa el general. */
export const ServiceDeadlinesDialog = ({
  serviceId,
  open,
  deadlines,
  onClose
}: {
  serviceId: number
  open: boolean
  deadlines: CalibrationVisitsResponse['deadlines']
  onClose: () => void
}) => {
  const [values, setValues] = useState<Record<string, string>>({})
  const mutation = useVisitMutation(serviceId)

  useEffect(() => {
    if (open)
      setValues(
        Object.fromEntries(
          Object.entries(deadlines.service).map(([k, v]) => [k, String(v)])
        )
      )
  }, [open, deadlines.service])

  const field = (key: keyof CertificateDeadlines, label: string) => (
    <TextField
      type='number'
      label={label}
      value={values[key] ?? ''}
      inputProps={{ min: 0, max: 60 }}
      placeholder={String(deadlines.general[key])}
      InputLabelProps={{ shrink: true }}
      helperText={`General: ${deadlines.general[key]}`}
      onChange={(event) =>
        setValues((current) => ({ ...current, [key]: event.target.value }))
      }
    />
  )

  return (
    <FormDialog
      open={open}
      onClose={mutation.isLoading ? () => undefined : onClose}
      title='Plazos de esta orden'
      subtitle='Días hábiles. Aplican a las visitas que programes desde ahora.'
      submitLabel='Guardar plazos'
      onSubmit={() =>
        mutation.mutate(
          {
            method: 'put',
            path: 'certificate-deadlines',
            success: 'Plazos guardados',
            body: values
          },
          { onSuccess: onClose }
        )
      }
      loading={mutation.isLoading}
      maxWidth='md'
    >
      <Alert severity='info' sx={{ mb: 2 }}>
        Deja un campo vacío para usar el plazo general.
      </Alert>
      {CLOCKS.map((clock) => (
        <FormDialogSection key={clock.key} title={clock.label}>
          {field(`${clock.key}WarningBusinessDays`, 'Avisar desde el día')}
          {field(`${clock.key}TargetBusinessDays`, 'Plazo máximo')}
        </FormDialogSection>
      ))}
    </FormDialog>
  )
}

/** Cambiar la fecha límite pactada de la orden, con su motivo. */
export const CommitmentDateDialog = ({
  serviceId,
  open,
  current,
  onClose
}: {
  serviceId: number
  open: boolean
  current: string | null
  onClose: () => void
}) => {
  const [date, setDate] = useState('')
  const [reason, setReason] = useState('')
  const mutation = useVisitMutation(serviceId)

  useEffect(() => {
    if (open) {
      setDate(current || '')
      setReason('')
    }
  }, [open, current])

  return (
    <FormDialog
      open={open}
      onClose={mutation.isLoading ? () => undefined : onClose}
      title='Cambiar fecha compromiso'
      subtitle='Fecha límite pactada para calibrar todos los equipos de la orden'
      submitLabel='Guardar fecha'
      onSubmit={() =>
        mutation.mutate(
          {
            method: 'put',
            path: 'commitment-date',
            success: 'Fecha compromiso actualizada',
            body: { commitmentDate: date, reason }
          },
          { onSuccess: onClose }
        )
      }
      loading={mutation.isLoading}
      submitDisabled={!date || date === current || !reason.trim()}
    >
      <Stack spacing={2} sx={{ pt: 1 }}>
        <TextField
          type='date'
          label='Nueva fecha compromiso'
          value={date}
          onChange={(event) => setDate(event.target.value)}
          InputLabelProps={{ shrink: true }}
          required
        />
        <TextField
          label='Motivo'
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          required
          multiline
          minRows={2}
        />
      </Stack>
    </FormDialog>
  )
}
