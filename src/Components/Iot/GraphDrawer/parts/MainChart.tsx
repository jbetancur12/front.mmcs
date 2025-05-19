import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { Box, Typography, Stack } from '@mui/material'
import { useMemo } from 'react'

interface MainChartProps {
  graphData: Array<{
    timestamp: number
    temperature: number
    humidity: number
  }>
  visibleSeries: {
    temperature: boolean
    humidity: boolean
  }
  onToggleSeries: (series: 'temperature' | 'humidity') => void
  // referenceAboveTemperature?: number
  // referenceBelowTemperature?: number
  // referenceHumidity?: number // Nueva prop
  temperatureAlarms?: {
    above?: number
    below?: number
  }
  humidityAlarms?: {
    above?: number
    below?: number
  }
}

const MainChart = ({
  graphData,
  visibleSeries,
  onToggleSeries,
  // referenceAboveTemperature,
  // referenceBelowTemperature,
  // referenceHumidity
  temperatureAlarms,
  humidityAlarms
}: MainChartProps) => {
  // Custom Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label)
      return (
        <Box
          sx={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            padding: 1,
            borderRadius: 1,
            boxShadow: 1
          }}
        >
          <Stack spacing={0.5}>
            {payload.map((pl: any) => (
              <Typography
                key={pl.dataKey}
                variant='caption'
                sx={{ color: pl.color }}
              >
                {pl.dataKey === 'temperature'
                  ? `Temp: ${pl.value.toFixed(2)}°C`
                  : `Hum: ${pl.value.toFixed(2)}%`}
              </Typography>
            ))}
            <Typography variant='caption' sx={{ fontWeight: 'bold' }}>
              {`${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`}
            </Typography>
          </Stack>
        </Box>
      )
    }
    return null
  }
  // Calcular dominios dinámicos
  const { tempDomain, humDomain, yAxisFormatter } = useMemo(() => {
    if (!graphData || graphData.length === 0) {
      return {
        tempDomain: [0, 40], // Rango default temperatura
        humDomain: [0, 100], // Rango default humedad
        yAxisFormatter: (value: number) => value.toFixed(1)
      }
    }

    const tempValues = graphData
      .map((d) => d.temperature)
      .filter((value) => !isNaN(value) && typeof value === 'number')

    const humValues = graphData
      .map((d) => d.humidity)
      .filter((value) => !isNaN(value) && typeof value === 'number')

    const safeTempDomain = [
      Math.floor(Math.min(...tempValues)),
      Math.ceil(Math.max(...tempValues))
    ]

    const safeHumDomain = [
      Math.floor(Math.min(...humValues)),
      Math.ceil(Math.max(...humValues))
    ]

    return {
      tempDomain: safeTempDomain,
      humDomain: safeHumDomain,
      yAxisFormatter: (value: number) => {
        // Convertir valores grandes a notación científica
        if (value > 1000) return value.toExponential(1)
        return value % 1 === 0 ? value.toString() : value.toFixed(1)
      }
    }
  }, [graphData])
  // Handler para clics en leyenda
  const handleLegendClick = (o: any) => {
    const { dataKey } = o
    onToggleSeries(dataKey as 'temperature' | 'humidity')
  }

  return (
    <Box sx={{ width: '100%', height: 400, mb: 4 }}>
      <ResponsiveContainer>
        <LineChart data={graphData}>
          <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
          {visibleSeries.temperature && temperatureAlarms?.above && (
            <ReferenceLine
              y={temperatureAlarms.above}
              yAxisId='left'
              stroke='#F44336'
              strokeDasharray='5 5'
              label={{
                value: `Alta: ${temperatureAlarms.above}°C`,
                position: 'right',
                fill: '#F44336'
              }}
            />
          )}
          {visibleSeries.temperature && temperatureAlarms?.below && (
            <ReferenceLine
              y={temperatureAlarms.below}
              yAxisId='left'
              stroke='#F44336'
              strokeDasharray='5 5'
              label={{
                value: `Baja: ${temperatureAlarms.below}°C`,
                position: 'right',
                fill: '#F44336'
              }}
            />
          )}

          {/* Líneas de referencia para humedad */}
          {visibleSeries.humidity && humidityAlarms?.above && (
            <ReferenceLine
              y={humidityAlarms.above}
              yAxisId='right'
              stroke='#2196F3'
              strokeDasharray='5 5'
              label={{
                value: `Alta: ${humidityAlarms.above}%`,
                position: 'left',
                fill: '#2196F3'
              }}
            />
          )}
          {visibleSeries.humidity && humidityAlarms?.below && (
            <ReferenceLine
              y={humidityAlarms.below}
              yAxisId='right'
              stroke='#2196F3'
              strokeDasharray='5 5'
              label={{
                value: `Baja: ${humidityAlarms.below}%`,
                position: 'left',
                fill: '#2196F3'
              }}
            />
          )}
          <XAxis
            dataKey='timestamp'
            type='number'
            domain={['dataMin', 'dataMax']}
            tick={{ fontSize: 12 }}
            tickMargin={10}
            tickFormatter={(tick) => {
              const date = new Date(tick)
              return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
            }}
          />
          <YAxis
            yAxisId='left'
            tickCount={5}
            domain={tempDomain}
            tickFormatter={yAxisFormatter}
            label={{ value: '°C', angle: -90, position: 'insideLeft' }}
            allowDataOverflow={true}
          />
          <YAxis
            yAxisId='right'
            tickCount={5}
            domain={humDomain}
            tickFormatter={yAxisFormatter}
            orientation='right'
            label={{ value: '%', angle: 90, position: 'insideRight' }}
            allowDataOverflow={true}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend onClick={handleLegendClick} />
          <Line
            yAxisId='left'
            type='monotone'
            dataKey='temperature'
            stroke='#F44336'
            hide={!visibleSeries.temperature}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            strokeOpacity={visibleSeries.temperature ? 1 : 0}
          />
          <Line
            yAxisId='right'
            type='monotone'
            dataKey='humidity'
            stroke='#2196F3'
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            hide={!visibleSeries.humidity}
            strokeOpacity={visibleSeries.humidity ? 1 : 0}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  )
}

export default MainChart
