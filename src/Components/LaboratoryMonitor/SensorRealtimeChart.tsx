// src/Components/LaboratoryMonitor/SensorRealtimeChart.tsx
import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { Box, Typography } from '@mui/material'
import { SensorDataPoint, SensorType } from './types'

interface SensorRealtimeChartProps {
  data: SensorDataPoint[]
  sensorType: SensorType
}

const formatXAxis = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const SensorRealtimeChart: React.FC<SensorRealtimeChartProps> = ({
  data,
  sensorType
}) => {
  if (!data || data.length === 0) {
    return (
      <Box
        p={2}
        textAlign='center'
        height={300}
        display='flex'
        alignItems='center'
        justifyContent='center'
      >
        <Typography variant='body2' color='textSecondary'>
          Esperando datos para la gráfica...
        </Typography>
      </Box>
    )
  }

  // Asegurarse que los datos estén ordenados por timestamp para Recharts
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp)

  return (
    <Box sx={{ height: 300, width: '100%', my: 2 }}>
      <ResponsiveContainer>
        <LineChart data={sortedData}>
          <CartesianGrid strokeDasharray='3 3' />
          <XAxis
            dataKey='timestamp'
            tickFormatter={formatXAxis}
            angle={-30}
            textAnchor='end'
            height={50}
            dy={10}
          />
          {sensorType.includes('temperature') && (
            <YAxis
              yAxisId='left'
              stroke='#8884d8'
              domain={['dataMin - 1', 'dataMax + 1']}
            />
          )}
          {sensorType.includes('humidity') && (
            <YAxis
              yAxisId='right'
              orientation='right'
              stroke='#82ca9d'
              domain={['dataMin - 5', 'dataMax + 5']}
            />
          )}
          <Tooltip
            labelFormatter={formatXAxis}
            formatter={(value: number, name: string) => [
              `${value.toFixed(2)} ${name === 'temperature' ? '°C' : '%'}`,
              name === 'temperature' ? 'Temperatura' : 'Humedad'
            ]}
          />
          <Legend />
          {sensorType.includes('temperature') && (
            <Line
              yAxisId='left'
              type='monotone'
              dataKey='temperature'
              stroke='#8884d8'
              strokeWidth={2}
              dot={false}
              name='Temperatura'
            />
          )}
          {sensorType.includes('humidity') && (
            <Line
              yAxisId='right'
              type='monotone'
              dataKey='humidity'
              stroke='#82ca9d'
              strokeWidth={2}
              dot={false}
              name='Humedad'
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}
