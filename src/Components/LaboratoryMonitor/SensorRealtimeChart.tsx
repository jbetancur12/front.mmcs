// src/Components/LaboratoryMonitor/SensorRealtimeChart.tsx
import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot
} from 'recharts'
import { Box, Typography } from '@mui/material'
import { SensorDataPoint, SensorType } from './types'

interface SensorRealtimeChartProps {
  data: SensorDataPoint[]
  sensorType: SensorType
}

// Mismos colores que las lecturas de las filas (ReadingValue)
const TEMP_COLOR = '#c2410c'
const HUM_COLOR = '#0369a1'
const AXIS_TICK = { fontSize: 12, fill: '#6b7280' }

const formatTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  })

const formatTimeWithSeconds = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })

// Tarjeta del cursor: hora y valor de cada serie con su unidad
const ChartTooltip: React.FC<{
  active?: boolean
  label?: number
  payload?: Array<{ dataKey: string; value: number }>
}> = ({ active, label, payload }) => {
  if (!active || !payload || payload.length === 0 || label === undefined) {
    return null
  }
  return (
    <Box
      sx={{
        bgcolor: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        px: 1.5,
        py: 1
      }}
    >
      <Typography variant='caption' color='text.secondary'>
        {formatTimeWithSeconds(label)}
      </Typography>
      {payload.map((item) => (
        <Typography
          key={item.dataKey}
          variant='body2'
          fontWeight={700}
          sx={{
            color: item.dataKey === 'temperature' ? TEMP_COLOR : HUM_COLOR,
            fontVariantNumeric: 'tabular-nums'
          }}
        >
          {item.dataKey === 'temperature' ? 'Temperatura' : 'Humedad'}{' '}
          {typeof item.value === 'number' ? item.value.toFixed(2) : '--'}
          {item.dataKey === 'temperature' ? ' °C' : ' %'}
        </Typography>
      ))}
    </Box>
  )
}

const LegendDot: React.FC<{ color: string; label: string }> = ({
  color,
  label
}) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
    <Box
      aria-hidden
      sx={{ width: 14, height: 3, borderRadius: 2, bgcolor: color }}
    />
    <Typography variant='caption' color='text.secondary'>
      {label}
    </Typography>
  </Box>
)

export const SensorRealtimeChart: React.FC<SensorRealtimeChartProps> = ({
  data,
  sensorType
}) => {
  if (!data || data.length === 0) {
    return (
      <Box
        p={2}
        textAlign='center'
        height={240}
        display='flex'
        alignItems='center'
        justifyContent='center'
      >
        <Typography variant='body2' color='text.secondary'>
          Esperando datos para la gráfica...
        </Typography>
      </Box>
    )
  }

  // Asegurarse que los datos estén ordenados por timestamp para Recharts
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp)
  const last = sortedData[sortedData.length - 1]
  const hasTemp = sensorType.includes('temperature')
  const hasHum = sensorType.includes('humidity')

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant='subtitle2' fontWeight={700} sx={{ flexGrow: 1 }}>
          Lecturas recientes
        </Typography>
        {hasTemp && <LegendDot color={TEMP_COLOR} label='Temperatura (°C)' />}
        {hasHum && <LegendDot color={HUM_COLOR} label='Humedad (%)' />}
      </Box>
      <Box
        role='img'
        aria-label='Gráfica de temperatura y humedad del sensor en el tiempo'
        sx={{ height: 260, width: '100%' }}
      >
        <ResponsiveContainer>
          <LineChart
            data={sortedData}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <CartesianGrid vertical={false} stroke='#e5e7eb' />
            <XAxis
              dataKey='timestamp'
              tickFormatter={formatTime}
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: '#d1d5db' }}
              minTickGap={48}
            />
            {hasTemp && (
              <YAxis
                yAxisId='left'
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={40}
                domain={['dataMin - 1', 'dataMax + 1']}
                tickFormatter={(v: number) => v.toFixed(1)}
              />
            )}
            {hasHum && (
              <YAxis
                yAxisId='right'
                orientation='right'
                tick={AXIS_TICK}
                tickLine={false}
                axisLine={false}
                width={40}
                domain={['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(v: number) => v.toFixed(0)}
              />
            )}
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ stroke: '#9ca3af', strokeDasharray: '4 4' }}
            />
            {hasTemp && (
              <Line
                yAxisId='left'
                type='monotone'
                dataKey='temperature'
                stroke={TEMP_COLOR}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name='Temperatura'
              />
            )}
            {hasHum && (
              <Line
                yAxisId='right'
                type='monotone'
                dataKey='humidity'
                stroke={HUM_COLOR}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                name='Humedad'
              />
            )}
            {/* Punto en la última lectura: marca "ahora" */}
            {hasTemp && typeof last.temperature === 'number' && (
              <ReferenceDot
                yAxisId='left'
                x={last.timestamp}
                y={last.temperature}
                r={4}
                fill={TEMP_COLOR}
                stroke='#fff'
                strokeWidth={2}
              />
            )}
            {hasHum && typeof last.humidity === 'number' && (
              <ReferenceDot
                yAxisId='right'
                x={last.timestamp}
                y={last.humidity}
                r={4}
                fill={HUM_COLOR}
                stroke='#fff'
                strokeWidth={2}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  )
}
