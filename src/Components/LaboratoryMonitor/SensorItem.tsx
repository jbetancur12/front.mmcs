// src/Components/LaboratoryMonitor/SensorItem.tsx
import React, { useState } from 'react' // useMemo no se usa pero puede quedar
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  IconButton,
  Grid,
  Chip,
  Tooltip as MuiTooltip,
  CircularProgress
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DeleteIcon from '@mui/icons-material/Delete'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import OpacityIcon from '@mui/icons-material/Opacity'
import ShowChartIcon from '@mui/icons-material/ShowChart'

// Ajusta ruta a tipos
import { Sensor, CHAMBER_STATUS, ChamberStatus, Pattern } from './types'
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
  isLoadingDelete = false
}) => {
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

  const handleAccordionChange = (
    _event: React.SyntheticEvent,
    expanded: boolean
  ) => {
    setIsExpanded(expanded)
  }

  const getSensorTypeLabel = () => {
    if (type === 'temperature_humidity') return 'Temp & Hum'
    return 'Solo Temp'
  }

  return (
    <Accordion
      expanded={isExpanded}
      onChange={handleAccordionChange}
      sx={{ mb: 1, '&.Mui-expanded': { mb: 1 } }}
      TransitionProps={{ unmountOnExit: true }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />} /* ... aria ... */>
        {/* ... Contenido del Summary (Iconos, Nombre, Chip, Botón Borrar) ... */}
        <Box
          sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 1 }}
        >
          <Box sx={{ display: 'flex' }}>
            {type === 'temperature_humidity' ? (
              <>
                <MuiTooltip title='Temperatura'>
                  <ThermostatIcon
                    sx={{ color: 'error.main' }}
                    fontSize='small'
                  />
                </MuiTooltip>
                <MuiTooltip title='Humedad'>
                  <OpacityIcon sx={{ color: 'info.main' }} fontSize='small' />
                </MuiTooltip>
              </>
            ) : (
              <MuiTooltip title='Temperatura'>
                <ThermostatIcon sx={{ color: 'error.main' }} fontSize='small' />
              </MuiTooltip>
            )}
          </Box>
          <Typography variant='subtitle1' sx={{ flexGrow: 1, mr: 1 }}>
            {name}
          </Typography>
          {showGraph && (
            <MuiTooltip title='Gráfica Activada'>
              <ShowChartIcon color='action' fontSize='small' />
            </MuiTooltip>
          )}
          <Chip label={getSensorTypeLabel()} size='small' variant='outlined' />
          <MuiTooltip title='Eliminar Sensor'>
            <span>
              <IconButton
                size='small'
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteSensor(sensorId)
                }}
                disabled={isLoadingDelete}
                color='error'
              >
                {isLoadingDelete ? (
                  <CircularProgress size={20} color='inherit' />
                ) : (
                  <DeleteIcon fontSize='small' />
                )}
              </IconButton>
            </span>
          </MuiTooltip>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ backgroundColor: 'grey.50', p: 2 }}>
        <Grid container spacing={2} sx={{ mb: showGraph ? 2 : 0 }}>
          {/* Valores Actuales */}
          {type.includes('temperature') && (
            <Grid item xs={12} sm={type === 'temperature_humidity' ? 6 : 12}>
              <Typography variant='h6' color='textPrimary'>
                Temp:{' '}
                {lastTemperature?.toFixed(2) ??
                  lastTemperature?.toFixed(2) ??
                  '--'}
                °C
              </Typography>
            </Grid>
          )}
          {type.includes('humidity') && (
            <Grid item xs={12} sm={6}>
              <Typography variant='h6' color='textPrimary'>
                Hum:{' '}
                {lastHumidity?.toFixed(2) ?? lastHumidity?.toFixed(2) ?? '--'}%
              </Typography>
            </Grid>
          )}
        </Grid>

        {/* Mostrar sección de gráfica y tabla si showGraph es true */}
        {showGraph ? (
          // Mostrar contenido SOLO si está calibrando (según "lo otro no lo necesito")
          isCalibrating ? (
            <>
              <SensorDataTable data={historicalData} sensorType={type} />
              <SensorRealtimeChart data={historicalData} sensorType={type} />
            </>
          ) : (
            <Typography
              variant='body2'
              color='textSecondary'
              sx={{ textAlign: 'center', py: 4 }}
            >
              La gráfica y tabla se muestran durante la calibración.
            </Typography>
          )
        ) : (
          <Typography
            variant='body2'
            color='textSecondary'
            sx={{ textAlign: 'center', py: 4 }}
          >
            Gráfica desactivada para este sensor.
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  )
}
