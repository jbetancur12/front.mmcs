import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material'
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import {
  CalibrationServiceSlaIndicator,
  CalibrationServiceStatus
} from '../../types/calibrationService'

interface Stage {
  status: CalibrationServiceStatus
  label: string
}

// Ciclo completo de un servicio, en el orden en que ocurre.
const STAGES: Stage[] = [
  { status: 'draft', label: 'Borrador' },
  { status: 'pending_approval', label: 'Cotización enviada' },
  { status: 'approved', label: 'Aprobada' },
  { status: 'ods_issued', label: 'ODS emitida' },
  { status: 'pending_programming', label: 'Por programar' },
  { status: 'scheduled', label: 'Programada' },
  { status: 'in_execution', label: 'En ejecución' },
  { status: 'technically_completed', label: 'Finalizada' },
  { status: 'closed', label: 'Cerrada' }
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
    ? STAGES.filter((stage) => !['draft', 'pending_approval', 'approved'].includes(stage.status))
    : STAGES
  const isStopped = status === 'rejected' || status === 'cancelled'
  const currentIndex = stages.findIndex((stage) => stage.status === status)
  const stoppedLabel = status === 'rejected' ? 'Cotización rechazada' : 'Servicio cancelado'

  const slaColor = SLA_COLORS[sla?.color || 'gray']
  const target = Math.max(sla?.targetBusinessDays || 0, 1)
  const warning = sla?.warningBusinessDays || 0
  const elapsed = sla?.businessDaysElapsed || 0
  const progress = Math.min((elapsed / target) * 100, 100)
  const warningAt = Math.min((warning / target) * 100, 100)
  const showSla = Boolean(sla?.isActive) && !isStopped

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, p: { xs: 2, md: 3 }, mb: 2 }}>
      {isStopped ? (
        <Stack direction='row' spacing={1.5} alignItems='center'>
          <BlockOutlinedIcon sx={{ color: '#ef4444' }} />
          <Box>
            <Typography fontWeight={700}>{stoppedLabel}</Typography>
            <Typography variant='body2' color='text.secondary'>
              El servicio no avanza a más etapas.
            </Typography>
          </Box>
        </Stack>
      ) : (
        <>
          {/* Escritorio: todas las etapas */}
          <Box
            component='ol'
            aria-label='Etapas del servicio'
            sx={{
              display: { xs: 'none', md: 'flex' },
              listStyle: 'none',
              m: 0,
              p: 0
            }}
          >
            {stages.map((stage, index) => {
              const done = currentIndex > index
              const current = currentIndex === index
              return (
                <Box
                  component='li'
                  key={stage.status}
                  aria-current={current ? 'step' : undefined}
                  sx={{ flex: 1, position: 'relative', textAlign: 'center', minWidth: 0 }}
                >
                  {index > 0 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 13,
                        left: '-50%',
                        width: '100%',
                        height: 2,
                        bgcolor: currentIndex >= index ? '#00BFA5' : '#e5e7eb'
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 1,
                      mx: 'auto',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: done ? '#00BFA5' : current ? '#fff' : '#fff',
                      border: '2px solid',
                      borderColor: done || current ? '#00BFA5' : '#d1d5db',
                      color: done ? '#fff' : '#00897B',
                      boxShadow: current ? '0 0 0 4px rgba(0,191,165,0.18)' : 'none'
                    }}
                  >
                    {done ? (
                      <CheckRoundedIcon sx={{ fontSize: 16 }} />
                    ) : current ? (
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#00BFA5' }} />
                    ) : null}
                  </Box>
                  <Typography
                    variant='caption'
                    sx={{
                      display: 'block',
                      mt: 0.75,
                      px: 0.5,
                      lineHeight: 1.25,
                      fontWeight: current ? 700 : 500,
                      color: current ? '#00695C' : done ? '#374151' : '#9ca3af'
                    }}
                  >
                    {stage.label}
                  </Typography>
                </Box>
              )
            })}
          </Box>

          {/* Móvil: una línea con la etapa actual y el avance */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Stack direction='row' justifyContent='space-between' alignItems='baseline' mb={0.75}>
              <Typography fontWeight={700} sx={{ color: '#00695C' }}>
                {stages[currentIndex]?.label ?? 'Sin etapa'}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                Etapa {Math.max(currentIndex + 1, 1)} de {stages.length}
              </Typography>
            </Stack>
            <LinearProgress
              variant='determinate'
              value={stages.length ? ((Math.max(currentIndex, 0) + 1) / stages.length) * 100 : 0}
              sx={{ height: 8, borderRadius: 999, bgcolor: '#E0F7F4', '& .MuiLinearProgress-bar': { borderRadius: 999, bgcolor: '#00BFA5' } }}
            />
          </Box>
        </>
      )}

      {sla && !isStopped && (
        <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #e5e7eb' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={{ xs: 1.5, md: 4 }} alignItems={{ md: 'center' }}>
            <Stack direction='row' spacing={1.5} alignItems='flex-start' sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: slaColor, mt: 0.75, flexShrink: 0 }} />
              <Box>
                <Typography fontWeight={700}>{sla.label || 'SLA no iniciado'}</Typography>
                <Typography variant='body2' color='text.secondary'>
                  {sla.message || 'Todavía no hay un SLA activo para este servicio.'}
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
                    sx={{ height: 10, borderRadius: 999, bgcolor: '#f3f4f6', '& .MuiLinearProgress-bar': { borderRadius: 999, bgcolor: slaColor } }}
                  />
                  <Box sx={{ position: 'absolute', top: -2, bottom: -2, left: `${warningAt}%`, width: 2, bgcolor: '#f59e0b', borderRadius: 1 }} aria-hidden />
                </Box>
                <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                  Amarillo desde el día {warning}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      )}
    </Paper>
  )
}

export default CalibrationServiceStageTracker
