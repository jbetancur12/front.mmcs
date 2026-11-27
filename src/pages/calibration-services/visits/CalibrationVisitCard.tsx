import { useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Collapse,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import {
  CalibrationVisit,
  VisitCertificate
} from '../../../types/calibrationVisit'
import { intent, neutral } from 'src/theme/designTokens'
import {
  CLOCK_META,
  VISIT_STATUS_LABEL,
  clockDetail,
  formatDay,
  formatRange,
  todayKey,
  uploadSummary
} from './visitUtils'

export interface VisitCardPermissions {
  schedule: boolean
  reschedule: boolean
  execute: boolean
}

interface CertificateListProps {
  certificates: VisitCertificate[]
  visits: CalibrationVisit[]
  /** Sin esta función la lista es de solo lectura. */
  onMove?: (certificateId: number, visitId: number | null) => void
}

export const VisitCertificateList = ({
  certificates,
  visits,
  onMove
}: CertificateListProps) => (
  <Stack spacing={1}>
    {certificates.map((certificate) => (
      <Stack
        key={certificate.id}
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1}
        alignItems={{ sm: 'center' }}
        sx={{ borderTop: `1px solid ${neutral.border}`, pt: 1 }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant='body2' fontWeight={600} noWrap>
            {certificate.documentNumber || `Certificado ${certificate.id}`}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            {[
              certificate.instrument,
              certificate.serie,
              `Cargado ${formatDay(certificate.createdAt)}`
            ]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        </Box>
        {certificate.clock && (
          <Chip
            size='small'
            variant='outlined'
            color={CLOCK_META[certificate.clock.state].color}
            label={
              certificate.clock.stage === 'released'
                ? `Liberado ${formatDay(certificate.releasedAt)}`
                : `${certificate.clock.stage === 'adjustment' ? 'Corrección' : 'Revisión'}: ${CLOCK_META[certificate.clock.state].label.toLowerCase()}`
            }
            title={clockDetail(certificate.clock)}
          />
        )}
        {onMove && (
          <TextField
            select
            size='small'
            label='Visita'
            value={certificate.visitId ?? ''}
            onChange={(event) =>
              onMove(
                certificate.id,
                event.target.value ? Number(event.target.value) : null
              )
            }
            SelectProps={{ displayEmpty: true }}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 170 }}
          >
            <MenuItem value=''>Sin visita</MenuItem>
            {visits
              .filter((v) => v.status !== 'cancelled')
              .map((v) => (
                <MenuItem key={v.id} value={v.id}>
                  {`Visita ${v.visitNumber} · ${formatDay(v.startDate)}`}
                </MenuItem>
              ))}
          </TextField>
        )}
      </Stack>
    ))}
  </Stack>
)

interface Props {
  visit: CalibrationVisit
  visits: CalibrationVisit[]
  permissions: VisitCardPermissions
  onExecute: () => void
  onEdit: () => void
  onDueDate: () => void
  onCancel: () => void
  onMoveCertificate?: CertificateListProps['onMove']
}

const CalibrationVisitCard = ({
  visit,
  visits,
  permissions,
  onExecute,
  onEdit,
  onDueDate,
  onCancel,
  onMoveCertificate
}: Props) => {
  const [showCertificates, setShowCertificates] = useState(false)
  const cancelled = visit.status === 'cancelled'
  const scheduled = visit.status === 'scheduled'
  const finished = visit.endDate <= todayKey()
  const { uploaded, expectedCertificates } = visit.quantities
  const progress = expectedCertificates
    ? Math.min((uploaded / expectedCertificates) * 100, 100)
    : 0
  const overdue = visit.upload?.state === 'overdue'

  return (
    <Paper
      variant='outlined'
      sx={{
        p: 2,
        borderRadius: 2,
        borderColor: overdue ? intent.danger : neutral.border,
        opacity: cancelled ? 0.65 : 1
      }}
    >
      <Stack
        direction='row'
        spacing={1}
        alignItems='center'
        flexWrap='wrap'
        useFlexGap
      >
        <Typography fontWeight={700}>
          {`Visita ${visit.visitNumber} · ${formatRange(visit.startDate, visit.endDate)}`}
        </Typography>
        <Chip
          size='small'
          label={VISIT_STATUS_LABEL[visit.status]}
          color={visit.status === 'executed' ? 'success' : 'default'}
          variant='outlined'
        />
        {visit.upload && (
          <Chip
            size='small'
            color={CLOCK_META[visit.upload.state].color}
            label={`Carga: ${CLOCK_META[visit.upload.state].label.toLowerCase()}`}
          />
        )}
      </Stack>

      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
        {visit.metrologists
          .map((m) =>
            m.userId === visit.uploadResponsibleUserId
              ? `${m.name} (carga)`
              : m.name
          )
          .join(', ') || 'Sin personal'}
        {visit.siteName ? ` · ${visit.siteName}` : ''}
      </Typography>

      {cancelled ? (
        <Typography variant='body2' sx={{ mt: 1 }}>
          {visit.cancelReason}
        </Typography>
      ) : (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant='body2' fontWeight={600}>
            {uploadSummary(visit)}
            {` · ${visit.quantities.released} liberados`}
          </Typography>
          <LinearProgress
            variant='determinate'
            value={progress}
            color={overdue ? 'error' : 'primary'}
            aria-label='Certificados cargados'
            sx={{ mt: 0.5, height: 8, borderRadius: 4 }}
          />
          <Typography variant='caption' color='text.secondary'>
            {scheduled
              ? `Planeados: ${visit.quantities.planned} equipos. Falta registrar la ejecución.`
              : `Calibrados: ${visit.quantities.executed} equipos.`}
            {visit.upload ? ` ${clockDetail(visit.upload)}.` : ''}
          </Typography>
        </Box>
      )}

      {!cancelled && (
        <Stack
          direction='row'
          spacing={1}
          flexWrap='wrap'
          useFlexGap
          sx={{ mt: 1.5 }}
        >
          {permissions.execute && (
            <Button
              size='small'
              variant={scheduled && finished ? 'contained' : 'outlined'}
              disabled={!finished}
              title={finished ? undefined : 'La visita todavía no termina'}
              onClick={onExecute}
            >
              {scheduled ? 'Registrar ejecución' : 'Corregir cantidades'}
            </Button>
          )}
          {permissions.reschedule && (
            <Button size='small' onClick={onEdit}>
              Editar
            </Button>
          )}
          {permissions.schedule && visit.trackDeadlines && (
            <Button size='small' onClick={onDueDate}>
              Cambiar plazo
            </Button>
          )}
          {permissions.reschedule && scheduled && (
            <Button size='small' color='error' onClick={onCancel}>
              Cancelar visita
            </Button>
          )}
          {visit.certificates.length > 0 && (
            <Button
              size='small'
              onClick={() => setShowCertificates((current) => !current)}
              aria-expanded={showCertificates}
            >
              {showCertificates
                ? 'Ocultar certificados'
                : `Ver certificados (${visit.certificates.length})`}
            </Button>
          )}
        </Stack>
      )}

      <Collapse in={showCertificates} unmountOnExit>
        <Box sx={{ mt: 1.5 }}>
          <VisitCertificateList
            certificates={visit.certificates}
            visits={visits}
            onMove={onMoveCertificate}
          />
        </Box>
      </Collapse>
    </Paper>
  )
}

export default CalibrationVisitCard
