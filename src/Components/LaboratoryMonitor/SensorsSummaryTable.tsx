// src/Components/LaboratoryMonitor/SensorsSummaryTable.tsx
import SignalLoader from 'src/Components/Common/SignalLoader'
import React, { useEffect, useState } from 'react'
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
import TableChartOutlined from '@mui/icons-material/TableChartOutlined'
import SectionHeader from 'src/Components/Common/SectionHeader'
import EmptyState from 'src/Components/Common/EmptyState'
import { SensorSummaryViewData } from './types' // Asegúrate que la ruta sea correcta

interface SensorsSummaryTableProps {
  summaryData: SensorSummaryViewData[]
  isLoading?: boolean
}

const valueSx = { fontVariantNumeric: 'tabular-nums' } as const

const SILENCE_WARNING_MS = 5 * 60 * 1000 // Más de 5 minutos sin reportar se resalta

// "hace 8 s", "hace 3 min", "hace 2 h"; si la hora del equipo va atrasada, "justo ahora"
const timeAgo = (diffMs: number) => {
  const seconds = Math.max(0, Math.round(diffMs / 1000))
  if (seconds < 10) return 'justo ahora'
  if (seconds < 60) return `hace ${seconds} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  return `hace ${Math.floor(hours / 24)} d`
}

// Refresca "hace X" sin esperar a que llegue otra lectura
const useNow = (intervalMs: number) => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

export const SensorsSummaryTable: React.FC<SensorsSummaryTableProps> = ({
  summaryData,
  isLoading
}) => {
  const now = useNow(15000)
  if (isLoading) {
    return (
      <SignalLoader message='Cargando resumen de sensores...' />
    )
  }
  if (!summaryData || summaryData.length === 0) {
    return (
      <Paper
        variant='outlined'
        sx={{ borderRadius: '12px', borderColor: '#e5e7eb' }}
      >
        <EmptyState
          compact
          icon={<TableChartOutlined />}
          title='Aún no hay sensores para resumir'
          hint='Cuando agregues sensores a los patrones, aquí verás su última lectura.'
        />
      </Paper>
    )
  }

  return (
    <Box>
      <SectionHeader
        title='Resumen de sensores'
        count={summaryData.length}
        description='Última lectura de cada sensor de la cámara.'
      />
      <TableContainer
        component={Paper}
        variant='outlined'
        sx={{ borderRadius: '12px', borderColor: '#e5e7eb' }}
      >
        <Table aria-label='resumen de sensores'>
          <TableHead>
            <TableRow sx={{ '& th': { bgcolor: '#f5f5f5', fontWeight: 600 } }}>
              <TableCell>Patrón</TableCell>
              <TableCell>Sensor</TableCell>
              <TableCell>Mide</TableCell>
              <TableCell align='right'>Temperatura (°C)</TableCell>
              <TableCell align='right'>Humedad (%)</TableCell>
              <TableCell align='right'>Última lectura</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {summaryData.map((row) => (
              <TableRow
                key={row.sensorId}
                hover
                sx={{ '&:hover': { bgcolor: 'rgba(0,191,165,0.04)' } }}
              >
                <TableCell component='th' scope='row'>
                  {row.patternName}
                </TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{row.sensorName}</TableCell>
                <TableCell>
                  <Tooltip
                    title={
                      row.sensorType === 'temperature_humidity'
                        ? 'Temperatura y humedad'
                        : 'Solo temperatura'
                    }
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {row.sensorType.includes('temperature') && (
                        <ThermostatIcon
                          fontSize='small'
                          sx={{ color: '#c2410c' }}
                        />
                      )}
                      {row.sensorType.includes('humidity') && (
                        <OpacityIcon
                          fontSize='small'
                          sx={{ color: '#0369a1' }}
                        />
                      )}
                    </Box>
                  </Tooltip>
                </TableCell>
                <TableCell align='right' sx={valueSx}>
                  {row.latestTemperature?.toFixed(2) ?? '--'}
                </TableCell>
                <TableCell align='right' sx={valueSx}>
                  {row.latestHumidity?.toFixed(2) ?? '--'}
                </TableCell>
                <TableCell align='right' sx={valueSx}>
                  {row.lastSeen ? (
                    <Tooltip
                      title={new Date(row.lastSeen).toLocaleString('es-CO')}
                    >
                      <Typography
                        component='span'
                        variant='body2'
                        sx={{
                          fontWeight:
                            now - new Date(row.lastSeen).getTime() >
                            SILENCE_WARNING_MS
                              ? 600
                              : 400,
                          color:
                            now - new Date(row.lastSeen).getTime() >
                            SILENCE_WARNING_MS
                              ? '#b45309'
                              : 'text.primary'
                        }}
                      >
                        {timeAgo(now - new Date(row.lastSeen).getTime())}
                      </Typography>
                    </Tooltip>
                  ) : (
                    <Typography
                      component='span'
                      variant='body2'
                      color='text.secondary'
                    >
                      Sin lecturas
                    </Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
