import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Paper, Stack, Typography } from '@mui/material'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import LmsStatCard, { LmsStatTone } from 'src/Components/lms/admin/LmsStatCard'
import { useCalibrationServiceMyQueue } from '../../../hooks/useCalibrationServices'

// El color dice qué tan urgente es: rojo = bloquea dinero, naranja = espera una acción, azul = seguimiento.
const SECTION_TONES: Record<string, LmsStatTone> = {
  unpaid: 'red',
  certificates: 'orange',
  without_cut: 'orange',
  to_schedule: 'orange',
  approved_without_ods: 'orange',
  ready_to_invoice: 'blue',
  quotes_waiting: 'blue',
  my_execution: 'teal'
}

/**
 * "Mis pendientes": una tarjeta por tarea que le toca al usuario según sus capacidades. Al elegir una se listan sus
 * servicios con la acción a un clic. Si no hay nada pendiente, no ocupa espacio.
 */
const CalibrationServiceMyQueueStrip = () => {
  const navigate = useNavigate()
  const { data } = useCalibrationServiceMyQueue()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  if (!data?.sections.length) {
    return null
  }

  const selected =
    data.sections.find((section) => section.key === selectedKey) || null

  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant='subtitle2' color='text.secondary' sx={{ mb: 1 }}>
        Mis pendientes · {data.total}
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gap: 2,
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
            lg: 'repeat(4, minmax(0, 1fr))'
          }
        }}
      >
        {data.sections.map((section) => (
          <LmsStatCard
            key={section.key}
            label={section.label}
            value={section.count}
            icon={<AssignmentTurnedInOutlinedIcon />}
            tone={SECTION_TONES[section.key] || 'teal'}
            variant='quiet'
            active={selectedKey === section.key}
            onClick={() =>
              setSelectedKey(selectedKey === section.key ? null : section.key)
            }
          />
        ))}
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
