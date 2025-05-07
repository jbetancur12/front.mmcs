// src/Components/LaboratoryMonitor/SensorsSummaryTable.tsx
import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Tooltip
} from '@mui/material'
import ThermostatIcon from '@mui/icons-material/Thermostat'
import OpacityIcon from '@mui/icons-material/Opacity'
import { SensorSummaryViewData } from './types' // Asegúrate que la ruta sea correcta

interface SensorsSummaryTableProps {
  summaryData: SensorSummaryViewData[]
  isLoading?: boolean
}

export const SensorsSummaryTable: React.FC<SensorsSummaryTableProps> = ({
  summaryData,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Typography sx={{ p: 2, textAlign: 'center' }}>
        Cargando resumen de sensores...
      </Typography>
    )
  }
  if (!summaryData || summaryData.length === 0) {
    return (
      <Box
        p={2}
        textAlign='center'
        component={Paper}
        variant='outlined'
        sx={{ mt: 2 }}
      >
        <Typography variant='body2' color='textSecondary'>
          No hay sensores para mostrar en el resumen.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant='h5' gutterBottom>
        Resumen de Sensores
      </Typography>
      <Typography variant='subtitle1' gutterBottom color='textSecondary'>
        Lecturas de Todos los Sensores
      </Typography>
      <TableContainer component={Paper} variant='outlined'>
        <Table aria-label='resumen de sensores'>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'grey.100' }}>
              <TableCell>Patrón</TableCell>
              <TableCell>Sensor</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell align='right'>Última Temp. (°C)</TableCell>
              <TableCell align='right'>Temp. Prom. (°C)</TableCell>
              <TableCell align='right'>Última Hum. (%)</TableCell>
              <TableCell align='right'>Hum. Prom. (%)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summaryData.map((row) => (
              <TableRow key={row.sensorId}>
                <TableCell component='th' scope='row'>
                  {row.patternName}
                </TableCell>
                <TableCell>{row.sensorName}</TableCell>
                <TableCell>
                  <Tooltip
                    title={
                      row.sensorType === 'temperature_humidity'
                        ? 'Temperatura y Humedad'
                        : 'Solo Temperatura'
                    }
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {row.sensorType.includes('temperature') && (
                        <ThermostatIcon fontSize='small' color='error' />
                      )}
                      {row.sensorType.includes('humidity') && (
                        <OpacityIcon fontSize='small' color='info' />
                      )}
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align='right'>
                  {row.latestTemperature?.toFixed(2) ?? '–'}
                </TableCell>
                <TableCell align='right'>
                  {row.averageTemperature?.toFixed(2) ?? '–'}
                </TableCell>
                <TableCell align='right'>
                  {row.latestHumidity?.toFixed(2) ?? '–'}
                </TableCell>
                <TableCell align='right'>
                  {row.averageHumidity?.toFixed(2) ?? '–'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
