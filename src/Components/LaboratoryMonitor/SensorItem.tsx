// src/Components/LaboratoryMonitor/SensorItem.tsx
import React from 'react'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  IconButton,
  Grid,
  Chip,
  Tooltip as MuiTooltip // Renombrar para evitar conflicto con Recharts Tooltip
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DeleteIcon from '@mui/icons-material/Delete'
import ThermostatIcon from '@mui/icons-material/Thermostat' // Para temperatura
import OpacityIcon from '@mui/icons-material/Opacity' // Para humedad
import ShowChartIcon from '@mui/icons-material/ShowChart'
import { Sensor } from './types'
import { SensorDataTable } from './SensorDataTable'
import { SensorRealtimeChart } from './SensorRealtimeChart'

interface SensorItemProps {
  sensor: Sensor
  onDeleteSensor: (sensorId: string) => void
  isLoadingDelete?: boolean
}

export const SensorItem: React.FC<SensorItemProps> = ({
  sensor,
  onDeleteSensor,
  isLoadingDelete
}) => {
  const {
    id,
    name,
    type,
    showGraph,
    currentTemperature,
    averageTemperature,
    currentHumidity,
    averageHumidity,
    historicalData
  } = sensor

  const getSensorTypeLabel = () => {
    if (type === 'temperature_humidity') return 'Temperatura y Humedad'
    return 'Solo Temperatura'
  }

  return (
    <Accordion sx={{ mb: 1 }} defaultExpanded={showGraph}>
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`sensor-${id}-content`}
        id={`sensor-${id}-header`}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          {type === 'temperature_humidity' ? (
            <>
              <ThermostatIcon
                sx={{ mr: 0.5, color: 'error.main' }}
                fontSize='small'
              />
              <OpacityIcon
                sx={{ mr: 1, color: 'info.main' }}
                fontSize='small'
              />
            </>
          ) : (
            <ThermostatIcon
              sx={{ mr: 1, color: 'error.main' }}
              fontSize='small'
            />
          )}
          <Typography variant='subtitle1' sx={{ flexGrow: 1 }}>
            {name}
          </Typography>
          {showGraph && (
            <ShowChartIcon color='action' sx={{ mr: 1 }} fontSize='small' />
          )}
          <Chip
            label={getSensorTypeLabel()}
            size='small'
            variant='outlined'
            sx={{ mr: 2 }}
          />
          <MuiTooltip title='Eliminar Sensor'>
            <IconButton
              size='small'
              onClick={(e) => {
                e.stopPropagation() // Evitar que se expanda/colapse el acordeón
                onDeleteSensor(id)
              }}
              disabled={isLoadingDelete}
              color='error'
            >
              <DeleteIcon fontSize='small' />
            </IconButton>
          </MuiTooltip>
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ backgroundColor: 'grey.50', p: 2 }}>
        <Grid container spacing={2} sx={{ mb: showGraph ? 2 : 0 }}>
          {type.includes('temperature') && (
            <Grid item xs={12} sm={type === 'temperature_humidity' ? 6 : 12}>
              <Typography variant='h6' color='textPrimary'>
                Temperatura: {currentTemperature?.toFixed(2) ?? 'N/A'}°C
              </Typography>
              <Typography variant='caption' color='textSecondary'>
                Prom: {averageTemperature?.toFixed(2) ?? 'N/A'}°C
              </Typography>
            </Grid>
          )}
          {type.includes('humidity') && (
            <Grid item xs={12} sm={6}>
              <Typography variant='h6' color='textPrimary'>
                Humedad: {currentHumidity?.toFixed(2) ?? 'N/A'}%
              </Typography>
              <Typography variant='caption' color='textSecondary'>
                Prom: {averageHumidity?.toFixed(2) ?? 'N/A'}%
              </Typography>
            </Grid>
          )}
        </Grid>

        {showGraph ? (
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
            Gráfica desactivada para este sensor.
          </Typography>
        )}
      </AccordionDetails>
    </Accordion>
  )
}
