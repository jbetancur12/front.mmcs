import { Box, LinearProgress, Stack, Typography } from '@mui/material'
import StageTracker, {
  StageTrackerStage
} from 'src/Components/Common/StageTracker'
import {
  CalibrationServiceSlaIndicator,
  CalibrationServiceStatus
} from '../../types/calibrationService'

// Ciclo completo de un servicio, en el orden en que ocurre.
const STAGES: StageTrackerStage[] = [
  { key: 'draft', label: 'Borrador' },
  { key: 'pending_approval', label: 'Cotización enviada' },
  { key: 'approved', label: 'Aprobada' },
  { key: 'ods_issued', label: 'ODS emitida' },
  { key: 'pending_programming', label: 'Por programar' },
  { key: 'scheduled', label: 'Programada' },
  { key: 'in_execution', label: 'En ejecución' },
  { key: 'technically_completed', label: 'Finalizada' },
  { key: 'closed', label: 'Cerrada' }
]

const SLA_COLORS: Record<string, string> = {
  green: '#00BFA5',
  yellow: '#f59e0b',
  red: '#ef4444',
  gray: '#9ca3af',
  blue: '#3b82f6'
}

interface CalibrationServiceStageTrackerProps {
  status: CalibrationServiceStatus
  sla?: CalibrationServiceSlaIndicator
  /** En la vista técnica solo importan las etapas desde la ODS. */
  technicalOnly?: boolean
}

const CalibrationServiceStageTracker = ({
  status,
  sla,
  technicalOnly = false
}: CalibrationServiceStageTrackerProps) => {
  const stages = technicalOnly
    ? STAGES.filter(
        (stage) =>
          !['draft', 'pending_approval', 'approved'].includes(stage.key)
      )
    : STAGES
  const isStopped = status === 'rejected' || status === 'cancelled'

  const slaColor = SLA_COLORS[sla?.color || 'gray']
  const target = Math.max(sla?.targetBusinessDays || 0, 1)
  const warning = sla?.warningBusinessDays || 0
  const elapsed = sla?.businessDaysElapsed || 0
  const progress = Math.min((elapsed / target) * 100, 100)
  const warningAt = Math.min((warning / target) * 100, 100)
  const showSla = Boolean(sla?.isActive) && !isStopped

  return (
    <StageTracker
      stages={stages}
      current={status}
      ariaLabel='Etapas del servicio'
      stopped={
        isStopped
          ? {
              title:
                status === 'rejected'
                  ? 'Cotización rechazada'
                  : 'Servicio cancelado',
              message: 'El servicio no avanza a más etapas.'
            }
          : undefined
      }
    >
      {sla && !isStopped && (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 1.5, md: 4 }}
          alignItems={{ md: 'center' }}
        >
          <Stack
            direction='row'
            spacing={1.5}
            alignItems='flex-start'
            sx={{ flex: 1, minWidth: 0 }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                bgcolor: slaColor,
                mt: 0.75,
                flexShrink: 0
              }}
            />
            <Box>
              <Typography fontWeight={700}>
                {sla.label || 'SLA no iniciado'}
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {sla.message ||
                  'Todavía no hay un SLA activo para este servicio.'}
              </Typography>
            </Box>
          </Stack>
          {showSla && (
            <Box sx={{ width: { xs: '100%', md: 320 } }}>
              <Typography variant='body2' fontWeight={600} sx={{ mb: 0.5 }}>
                {elapsed > target
                  ? `Van ${elapsed} días hábiles, el plazo es ${target}`
                  : `Día ${elapsed} de ${target} hábiles`}
              </Typography>
              <Box sx={{ position: 'relative' }}>
                <LinearProgress
                  variant='determinate'
                  value={progress}
                  sx={{
                    height: 10,
                    borderRadius: '999px',
                    bgcolor: '#f3f4f6',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: '999px',
                      bgcolor: slaColor
                    }
                  }}
                />
                <Box
                  sx={{
                    position: 'absolute',
                    top: -2,
                    bottom: -2,
                    left: `${warningAt}%`,
                    width: 2,
                    bgcolor: '#f59e0b',
                    borderRadius: 1
                  }}
                  aria-hidden
                />
              </Box>
              <Typography
                variant='caption'
                color='text.secondary'
                sx={{ display: 'block', mt: 0.5 }}
              >
                Amarillo desde el día {warning}
              </Typography>
            </Box>
          )}
        </Stack>
      )}
    </StageTracker>
  )
}

export default CalibrationServiceStageTracker
