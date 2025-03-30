import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { SensorData } from './types'

type SensorDataWithTimestamp = SensorData & { timestamp: string }

const TemperatureChart = ({
  data,
  type,
  height = 250
}: {
  data: SensorDataWithTimestamp[]
  type: 'temperature' | 'humidity'
  height?: number
}) => {
  // Transforma los datos de acuerdo al tipo seleccionado
  const transformedData = data.map((d) => {
    if (type === 'temperature') {
      return {
        timestamp: new Date(d.timestamp).getTime(), // Convierte la marca de tiempo a número
        temperature: parseFloat(d.sen.t)
      }
    }
    if (type === 'humidity') {
      return {
        timestamp: new Date(d.timestamp).getTime(),
        humidity: parseFloat(d.sen.h)
      }
    }
    return {} as any
  })

  return (
    <ResponsiveContainer width='100%' height={height}>
      <LineChart data={transformedData}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis
          dataKey='timestamp'
          type='number'
          domain={['auto', 'auto']}
          tickFormatter={(tick) => {
            const date = new Date(tick)
            return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
          }}
        />
        <YAxis />
        <Tooltip
          labelFormatter={(label) => {
            const date = new Date(label)
            return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}:${date
              .getSeconds()
              .toString()
              .padStart(2, '0')}`
          }}
        />

        <Line
          type='monotone'
          dataKey={type === 'temperature' ? 'temperature' : 'humidity'}
          stroke={type === 'temperature' ? '#F44336' : '#2196F3'}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default TemperatureChart
