import { useState } from 'react'
import { Alert, Box, Button, Stack, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EventNoteOutlinedIcon from '@mui/icons-material/EventNoteOutlined'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import SignalLoader from 'src/Components/Common/SignalLoader'
import EmptyState from '../../../Components/Common/EmptyState'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import {
  useServiceProgress,
  useServiceVisits,
  useVisitMutation
} from '../../../hooks/useCalibrationVisits'
import { CalibrationService } from '../../../types/calibrationService'
import {
  CalibrationVisit,
  ServiceProgressResponse
} from '../../../types/calibrationVisit'
import { neutral } from 'src/theme/designTokens'
import { formatDay } from './visitUtils'
import CalibrationVisitCard, {
  VisitCertificateList
} from './CalibrationVisitCard'
import VisitFormDialog from './VisitFormDialog'
import VisitExecutionDialog from './VisitExecutionDialog'
import {
  CommitmentDateDialog,
  ServiceDeadlinesDialog,
  VisitReasonAction,
  VisitReasonDialog
} from './VisitSettingsDialogs'

const PROGRESS_STEPS: Array<{
  key: keyof ServiceProgressResponse['totals']
  label: string
}> = [
  { key: 'contracted', label: 'Contratados' },
  { key: 'scheduled', label: 'Programados' },
  { key: 'executed', label: 'Calibrados' },
  { key: 'uploaded', label: 'Cargados' },
  { key: 'delivered', label: 'Entregados' },
  { key: 'invoiced', label: 'Facturados' }
]

const ProgressStrip = ({ progress }: { progress: ServiceProgressResponse }) => (
  <Box
    sx={{
      display: 'grid',
      gridTemplateColumns: {
        xs: 'repeat(3, minmax(0, 1fr))',
        md: 'repeat(6, minmax(0, 1fr))'
      },
      border: `1px solid ${neutral.border}`,
      borderRadius: 2,
      py: 1.5,
      rowGap: 1.5
    }}
    aria-label='Avance de la orden en equipos'
  >
    {PROGRESS_STEPS.map((step) => (
      <Box key={step.key} sx={{ textAlign: 'center' }}>
        <Typography variant='h5' fontWeight={700}>
          {progress.totals[step.key]}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {step.label}
        </Typography>
      </Box>
    ))}
  </Box>
)

/** Visitas de la orden: programar, registrar lo ejecutado y seguir sus certificados. */
const CalibrationVisitsPanel = ({
  service
}: {
  service: CalibrationService
}) => {
  const permissions = {
    schedule: useCan(PERMISSIONS.CALIBRATION_SERVICE_SCHEDULE),
    reschedule: useCan(PERMISSIONS.CALIBRATION_SERVICE_RESCHEDULE),
    execute: useCan(PERMISSIONS.CALIBRATION_SERVICE_EXECUTE)
  }
  const { data, isLoading, isError, refetch } = useServiceVisits(service.id)
  const { data: progress } = useServiceProgress(service.id)
  const mutation = useVisitMutation(service.id)

  const [form, setForm] = useState<{ visit: CalibrationVisit | null } | null>(
    null
  )
  const [executing, setExecuting] = useState<CalibrationVisit | null>(null)
  const [reasonAction, setReasonAction] = useState<VisitReasonAction | null>(
    null
  )
  const [deadlinesOpen, setDeadlinesOpen] = useState(false)
  const [commitmentOpen, setCommitmentOpen] = useState(false)

  if (isLoading) return <SignalLoader />
  if (isError || !data)
    return (
      <Alert
        severity='error'
        action={<Button onClick={() => void refetch()}>Reintentar</Button>}
      >
        No pudimos cargar las visitas.
      </Alert>
    )

  const open = !['cancelled', 'closed'].includes(service.status)
  const canAdd =
    permissions.schedule &&
    !service.isPaused &&
    ['ods_issued', 'pending_programming', 'scheduled', 'in_execution'].includes(
      service.status
    )
  const cardPermissions = {
    schedule: permissions.schedule && open && !service.isPaused,
    reschedule: permissions.reschedule && open && !service.isPaused,
    execute:
      permissions.execute &&
      !service.isPaused &&
      ['scheduled', 'in_execution'].includes(service.status)
  }
  const move =
    permissions.schedule || permissions.execute
      ? (certificateId: number, visitId: number | null) =>
          mutation.mutate({
            method: 'put',
            path: 'visits/certificates',
            success: 'Certificado movido',
            body: { certificateIds: [certificateId], visitId }
          })
      : undefined
  const { effective } = data.deadlines

  return (
    <Stack spacing={2}>
      {progress && <ProgressStrip progress={progress} />}

      <Stack
        direction='row'
        spacing={1}
        alignItems='center'
        flexWrap='wrap'
        useFlexGap
      >
        <Typography variant='body2'>
          <b>Fecha compromiso:</b>{' '}
          {data.commitmentDate
            ? formatDay(data.commitmentDate, "d 'de' MMMM yyyy")
            : 'Sin definir'}
        </Typography>
        {permissions.reschedule && open && !service.isPaused && (
          <Button size='small' onClick={() => setCommitmentOpen(true)}>
            {data.commitmentDate ? 'Cambiar' : 'Definir'}
          </Button>
        )}
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ sm: 'center' }}
        justifyContent='space-between'
      >
        <Typography variant='body2' color='text.secondary'>
          {`Plazos en días hábiles: cargar ${effective.uploadTargetBusinessDays}, revisar y firmar ${effective.reviewTargetBusinessDays}, entregar ${effective.deliveryTargetBusinessDays}, corregir ${effective.adjustmentTargetBusinessDays}.`}
        </Typography>
        <Stack direction='row' spacing={1}>
          {permissions.schedule && open && (
            <Button
              startIcon={<TimerOutlinedIcon />}
              onClick={() => setDeadlinesOpen(true)}
            >
              Plazos
            </Button>
          )}
          {canAdd && (
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={() => setForm({ visit: null })}
            >
              Programar visita
            </Button>
          )}
        </Stack>
      </Stack>

      {data.visits.length === 0 && (
        <EmptyState
          icon={<EventNoteOutlinedIcon />}
          title='Sin visitas programadas'
          hint='Programa la primera visita cuando la ODS esté emitida.'
        />
      )}
      {[...data.visits].reverse().map((visit) => (
        <CalibrationVisitCard
          key={visit.id}
          visit={visit}
          visits={data.visits}
          permissions={cardPermissions}
          onExecute={() => setExecuting(visit)}
          onEdit={() => setForm({ visit })}
          onDueDate={() => setReasonAction({ type: 'due_date', visit })}
          onCancel={() => setReasonAction({ type: 'cancel', visit })}
          onMoveCertificate={move}
        />
      ))}

      {data.certificatesWithoutVisit.length > 0 && (
        <Box>
          <Alert severity='warning' sx={{ mb: 1 }}>
            {`${data.certificatesWithoutVisit.length} certificados de esta orden no están en ninguna visita y no cuentan para su plazo.`}
          </Alert>
          <VisitCertificateList
            certificates={data.certificatesWithoutVisit}
            visits={data.visits}
            onMove={move}
          />
        </Box>
      )}

      <VisitFormDialog
        open={Boolean(form)}
        service={service}
        visit={form?.visit}
        onClose={() => setForm(null)}
      />
      <VisitExecutionDialog
        service={service}
        visit={executing}
        onClose={() => setExecuting(null)}
      />
      <VisitReasonDialog
        serviceId={service.id}
        action={reasonAction}
        onClose={() => setReasonAction(null)}
      />
      <CommitmentDateDialog
        serviceId={service.id}
        open={commitmentOpen}
        current={data.commitmentDate}
        onClose={() => setCommitmentOpen(false)}
      />
      <ServiceDeadlinesDialog
        serviceId={service.id}
        open={deadlinesOpen}
        deadlines={data.deadlines}
        onClose={() => setDeadlinesOpen(false)}
      />
    </Stack>
  )
}

export default CalibrationVisitsPanel
