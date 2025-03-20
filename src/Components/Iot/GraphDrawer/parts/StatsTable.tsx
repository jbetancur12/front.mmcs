// components/DeviceGraphs/GraphDrawer/parts/StatsTable.tsx
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box
} from '@mui/material'
import { Typography } from '@mui/material'

interface StatsTableProps {
  stats: {
    avgTemp: number
    minTemp: number
    maxTemp: number
    avgHum: number
    minHum: number
    maxHum: number
  }
}

export const StatsTable = ({ stats }: StatsTableProps) => (
  <Box
    sx={{
      mt: 2,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}
  >
    <Box
      sx={{
        maxWidth: 400,
        width: '100%',
        border: '1px solid #e0e0e0',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <Table size='small' sx={{ width: '100%' }}>
        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
          <TableRow>
            <TableCell sx={{ width: '40%', padding: '8px' }}></TableCell>
            <TableCell align='center' sx={{ padding: '8px' }}>
              Temperatura (°C)
            </TableCell>
            <TableCell align='center' sx={{ padding: '8px' }}>
              Humedad (%)
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[
            { label: 'Promedio', temp: stats.avgTemp, hum: stats.avgHum },
            { label: 'Mínimo', temp: stats.minTemp, hum: stats.minHum },
            { label: 'Máximo', temp: stats.maxTemp, hum: stats.maxHum }
          ].map((row) => (
            <TableRow key={row.label}>
              <TableCell sx={{ padding: '8px', fontWeight: 500 }}>
                {row.label}
              </TableCell>
              <TableCell align='center' sx={{ padding: '8px' }}>
                {typeof row.temp === 'number' ? row.temp.toFixed(2) : 'N/A'}
              </TableCell>
              <TableCell align='center' sx={{ padding: '8px' }}>
                {typeof row.hum === 'number' ? row.hum.toFixed(2) : 'N/A'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  </Box>
)
