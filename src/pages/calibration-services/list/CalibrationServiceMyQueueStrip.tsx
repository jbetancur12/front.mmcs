import { CalibrationServiceCutTask } from '../../../types/calibrationService'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Chip, Paper, Stack, Typography } from '@mui/material'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import LmsStatCard, { LmsStatTone } from 'src/Components/lms/admin/LmsStatCard'
import { useCalibrationServiceMyQueue } from '../../../hooks/useCalibrationServices'

// El color dice qué tan urgente es: rojo = bloquea dinero, naranja = espera una acción, azul = seguimiento.
const SECTION_TONES: Record<string, LmsStatTone> = {
  unpaid: 'red',
  receivable: 'blue',
  certificates: 'orange',
  without_cut: 'orange',
  to_schedule: 'orange',
  approved_without_ods: 'orange',
  ready_to_invoice: 'blue',
  quotes_waiting: 'blue',
  my_execution: 'teal'
}

// Secciones que repiten un paso del embudo de etapas que está justo debajo (mismo número, mismo filtro): se omiten
// para no mostrar el dato dos veces. Las demás son tareas de cortes o personales, que el embudo no cuenta.
const MIRRORED_BY_PIPELINE = new Set([
  'quotes_waiting',
  'approved_without_ods',
  'to_schedule'
])

// Tareas de cortes: la tarjeta aplica el mismo filtro de la bandeja (una sola forma de ver "lo que falta"). Las que no
// tienen filtro equivalente, como "Mis servicios en curso", abren su propia lista corta.
const CUT_TASK_BY_SECTION: Record<string, CalibrationServiceCutTask> = {
  ready_to_invoice: 'ready_to_invoice',
  unpaid: 'unpaid',
  receivable: 'receivable',
  certificates: 'certificates_pending'
}

// Columnas de la cuadrícula según cuántas tarjetas hay: hasta 4 usan 4 columnas fijas (no se estiran), 5 y 6 se reparten
// en 3 por fila, y con ancho de sobra 5 tarjetas caben en una sola fila.
const columns = (count: number, wide: boolean) => {
  const n = count <= 4 ? 4 : wide && count === 5 ? 5 : count <= 6 ? 3 : 4
  return `repeat(${n}, minmax(0, 1fr))`
}

interface CalibrationServiceMyQueueStripProps {
  activeCutTask: CalibrationServiceCutTask | ''
  onSelectCutTask: (task: CalibrationServiceCutTask | '') => void
}

/**
 * "Mis pendientes": una tarjeta por tarea que le toca al usuario según sus capacidades. Al elegir una se listan sus
 * servicios con la acción a un clic. Si no hay nada pendiente, no ocupa espacio.
 */
const CalibrationServiceMyQueueStrip = ({
  activeCutTask,
  onSelectCutTask
}: CalibrationServiceMyQueueStripProps) => {
  const navigate = useNavigate()
  const { data } = useCalibrationServiceMyQueue()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const sections = (data?.sections || []).filter(
    (section) => !MIRRORED_BY_PIPELINE.has(section.key)
  )
  const total = sections.reduce((sum, section) => sum + section.count, 0)

  if (!sections.length) {
    return null
  }

  const selected =
    sections.find((section) => section.key === selectedKey) || null

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction='row' spacing={1} alignItems='center' sx={{ mb: 1.5 }}>
        <Typography
          component='h2'
          sx={{ fontSize: 16, fontWeight: 700, color: '#111827' }}
        >
          Mis pendientes
        </Typography>
        <Chip
          size='small'
          variant='outlined'
          label={total}
          aria-label={`${total} pendientes`}
          sx={{ fontWeight: 600, color: '#00695C', borderColor: '#b2ebe3' }}
        />
      </Stack>
      {/* Se mide el ancho del bloque (no el de la pantalla): con el menú lateral abierto o cerrado cambia el espacio. */}
      <Box sx={{ containerType: 'inline-size' }}>
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: 'minmax(0, 1fr)',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: columns(sections.length, false)
            },
            // 5 tarjetas caben en una fila solo con ancho de sobra; si no, 3 + 2 en vez de 4 + 1 huérfana.
            '@container (min-width: 1240px)': {
              gridTemplateColumns: columns(sections.length, true)
            }
          }}
        >
          {sections.map((section) => (
            <LmsStatCard
              key={section.key}
              label={section.label}
              value={section.count}
              icon={<AssignmentTurnedInOutlinedIcon />}
              tone={SECTION_TONES[section.key] || 'teal'}
              variant='quiet'
              active={
                CUT_TASK_BY_SECTION[section.key]
                  ? activeCutTask === CUT_TASK_BY_SECTION[section.key]
                  : selectedKey === section.key
              }
              onClick={() => {
                const task = CUT_TASK_BY_SECTION[section.key]
                if (task) {
                  setSelectedKey(null)
                  onSelectCutTask(activeCutTask === task ? '' : task)
                  return
                }
                onSelectCutTask('')
                setSelectedKey(selectedKey === section.key ? null : section.key)
              }}
            />
          ))}
        </Box>
      </Box>
      {selected ? (
        <Paper
          variant='outlined'
          sx={{ mt: 2, p: 2, borderRadius: '16px', borderColor: '#e5e7eb' }}
        >
          <Stack spacing={1}>
            {selected.items.map((item) => (
              <Stack
                key={`${item.serviceId}-${item.cutId || 0}`}
                direction='row'
                justifyContent='space-between'
                alignItems='center'
                spacing={2}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={600} noWrap>
                    {item.cutCode || item.serviceCode}
                  </Typography>
                  <Typography variant='body2' color='text.secondary' noWrap>
                    {item.hint}
                  </Typography>
                </Box>
                <Button
                  size='small'
                  variant='outlined'
                  onClick={() => navigate(item.actionUrl)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    color: '#00897B',
                    borderColor: '#00BFA5'
                  }}
                >
                  Abrir
                </Button>
              </Stack>
            ))}
            {selected.count > selected.items.length ? (
              <Typography variant='caption' color='text.secondary'>
                Y {selected.count - selected.items.length} más. Usa los filtros
                de abajo para verlos todos.
              </Typography>
            ) : null}
          </Stack>
        </Paper>
      ) : null}
    </Box>
  )
}

export default CalibrationServiceMyQueueStrip
