// src/Components/LaboratoryMonitor/SensorItem.tsx
import React, { useState } from 'react' // useMemo no se usa pero puede quedar
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Grid,
  IconButton,
  Tooltip as MuiTooltip,
  CircularProgress
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DeleteIcon from '@mui/icons-material/Delete'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import OpacityIcon from '@mui/icons-material/Opacity'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import ReadingValue from 'src/Components/Common/ReadingValue'
import EmptyState from 'src/Components/Common/EmptyState'

// Ajusta ruta a tipos
import { Sensor, CHAMBER_STATUS, ChamberStatus, Pattern } from './types'
import { getStaleSensorIds } from './stability'
import StatusPill from 'src/Components/Common/StatusPill'
import { SensorDataTable } from './SensorDataTable'
import { SensorRealtimeChart } from './SensorRealtimeChart'

interface SensorItemProps {
  sensor: Sensor
  chamberStatus: ChamberStatus // <= Prop obligatorio para saber el estado
  onDeleteSensor: (sensorId: string | number) => void
  isLoadingDelete?: boolean
  pattern: Pattern
}

export const SensorItem: React.FC<SensorItemProps> = ({
  sensor: sensorProp,
  chamberStatus, // <= Recibir estado
  onDeleteSensor,
  isLoadingDelete = false,
  pattern
}) => {
  const canManage = useCan(PERMISSIONS.LABORATORY_CALIBRATION_MANAGE)
  // Desestructurar el sensor que viene de React Query (actualizado por WS)
  const {
    id: sensorId,
    name,
    type,
    showGraph,
    lastTemperature,
    lastHumidity,
    historicalData = [] // Este array es la fuente principal, actualizado por WS
  } = sensorProp

  const [isExpanded, setIsExpanded] = useState(showGraph) // Expandir inicialmente si la gráfica está activa

  const isCalibrating = chamberStatus === CHAMBER_STATUS.CALIBRATING
  const hasHumidity = type.includes('humidity')
  // Solo importa mientras se calibra: fuera de calibración los sensores pueden callar
  const isStale = isCalibrating && getStaleSensorIds(pattern).has(sensorId)

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    expanded: boolean
  ) => {
    setIsExpanded(expanded)
  }

  return (
    <Accordion
      expanded={isExpanded}
      onChange={handleAccordionChange}
      disableGutters
      elevation={0}
      TransitionProps={{ unmountOnExit: true }}
      sx={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px !important',
        '&:before': { display: 'none' },
        '&.Mui-expanded': { borderColor: '#00BFA5' }
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        sx={{
          '&:focus-visible': { outline: '3px solid #00897B', outlineOffset: -3 }
        }}
      >
        {/* La lectura vive en la fila cerrada: se ve sin abrir cada sensor */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: { xs: 1.5, sm: 3 },
            flexWrap: 'wrap',
            pr: 1
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flex: '1 1 140px',
              minWidth: 0
            }}
          >
            <Typography variant='subtitle2' fontWeight={700} noWrap>
              {name}
            </Typography>
            {isStale && (
              <MuiTooltip title='Este sensor lleva más tiempo sin reportar que los demás del patrón. No cuenta para la estabilidad.'>
                <span>
                  <StatusPill label='Sin señal' tone='warning' size='small' />
                </span>
              </MuiTooltip>
            )}
            {showGraph && (
              <MuiTooltip title='Gráfica activada'>
                <ShowChartIcon sx={{ fontSize: 18, color: '#9ca3af' }} />
              </MuiTooltip>
            )}
          </Box>
          <ReadingValue
            label='Temperatura'
            value={lastTemperature}
            unit='°C'
            tone='temperature'
            icon={<ThermostatIcon />}
          />
          {hasHumidity && (
            <ReadingValue
              label='Humedad'
              value={lastHumidity}
              unit='%'
              tone='humidity'
              icon={<OpacityIcon />}
            />
          )}
          {canManage && (
            <MuiTooltip title='Eliminar sensor'>
              <span>
                <IconButton
                  size='small'
                  aria-label={`Eliminar sensor ${name}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteSensor(sensorId)
                  }}
                  disabled={isLoadingDelete}
                  sx={{ color: '#4b5563', '&:hover': { color: 'error.main' } }}
                >
                  {isLoadingDelete ? (
                    <CircularProgress size={20} color='inherit' />
                  ) : (
                    <DeleteIcon fontSize='small' />
                  )}
                </IconButton>
              </span>
            </MuiTooltip>
          )}
        </Box>
      </AccordionSummary>
      <AccordionDetails
        sx={{ bgcolor: '#fafafa', p: 2, borderTop: '1px solid #e5e7eb' }}
      >
        {/* Mostrar sección de gráfica y tabla si showGraph es true */}
        {!showGraph ? (
          <EmptyState
            compact
            icon={<ShowChartIcon />}
            title='La gráfica está desactivada para este sensor'
            hint='Actívala desde la configuración del patrón.'
          />
        ) : !isCalibrating ? (
          <EmptyState
            compact
            icon={<ShowChartIcon />}
            title='La gráfica y la tabla se muestran durante la calibración'
            hint='Inicia la calibración de la cámara para ver las lecturas en vivo.'
          />
        ) : historicalData.length === 0 ? (
          <EmptyState
            compact
            icon={<HourglassEmptyIcon />}
            title='Aún no hay lecturas para graficar'
            hint='La tabla y la gráfica se llenan con las lecturas que el sensor publique desde que inició la calibración.'
          />
        ) : (
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <SensorRealtimeChart data={historicalData} sensorType={type} />
            </Grid>
            <Grid item xs={12} md={4}>
              <SensorDataTable data={historicalData} sensorType={type} />
            </Grid>
          </Grid>
        )}
      </AccordionDetails>
    </Accordion>
  )
}
