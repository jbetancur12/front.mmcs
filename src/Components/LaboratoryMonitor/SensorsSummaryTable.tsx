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
import TableChartOutlined from '@mui/icons-material/TableChartOutlined'
import SectionHeader from 'src/Components/Common/SectionHeader'
import EmptyState from 'src/Components/Common/EmptyState'
import { SensorSummaryViewData } from './types' // Asegúrate que la ruta sea correcta

interface SensorsSummaryTableProps {
  summaryData: SensorSummaryViewData[]
  isLoading?: boolean
}

const valueSx = { fontVariantNumeric: 'tabular-nums' } as const

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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}
