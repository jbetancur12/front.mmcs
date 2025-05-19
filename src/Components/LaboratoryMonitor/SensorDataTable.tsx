// src/Components/LaboratoryMonitor/SensorDataTable.tsx
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
  Box
} from '@mui/material'
import { SensorDataPoint, SensorType } from './types'

interface SensorDataTableProps {
  data: SensorDataPoint[]
  sensorType: SensorType
}

const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

export const SensorDataTable: React.FC<SensorDataTableProps> = ({
  data,
  sensorType
}) => {
  if (!data || data.length === 0) {
    return (
      <Box p={2} textAlign='center'>
        <Typography variant='body2' color='textSecondary'>
          No hay datos recientes para mostrar en la tabla.
        </Typography>
      </Box>
    )
  }

  return (
    <TableContainer
      component={Paper}
      variant='outlined'
      sx={{ maxHeight: 300, my: 2 }}
    >
      <Table stickyHeader size='small' aria-label='tabla de datos del sensor'>
        <TableHead>
          <TableRow>
            <TableCell>Hora</TableCell>
            {sensorType.includes('temperature') && (
              <TableCell align='right'>Temp. (°C)</TableCell>
            )}
            {sensorType.includes('humidity') && (
              <TableCell align='right'>Hum. (%)</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {data
            .slice()
            .reverse()
            .map(
              (
                row,
                index // Mostrar los más recientes primero
              ) => (
                <TableRow key={row.timestamp || index}>
                  <TableCell component='th' scope='row'>
                    {formatDate(row.timestamp)}
                  </TableCell>
                  {sensorType.includes('temperature') && (
                    <TableCell align='right'>
                      {row.temperature?.toFixed(2) ?? 'N/A'}
                    </TableCell>
                  )}
                  {sensorType.includes('humidity') && (
                    <TableCell align='right'>
                      {row.humidity?.toFixed(2) ?? 'N/A'}
                    </TableCell>
                  )}
                </TableRow>
              )
            )}
        </TableBody>
      </Table>
    </TableContainer>
  )
}
