import { VictoryChart, VictoryLine, VictoryTheme } from 'victory'
import { SensorData } from './types'

const TemperatureChart = ({
  data,
  type
}: {
  data: SensorData[]
  type: 'temperature' | 'humidity'
}) => {
  const transformedData = data.map((d) => {
    if (type === 'temperature') {
      return {
        timestamp: new Date(d.ts), // Convierte la marca de tiempo a Date
        temperature: parseFloat(d.sen.t) // Convierte la temperatura a número
      }
    }
    if (type === 'humidity') {
      return {
        timestamp: new Date(d.ts), // Convierte la marca de tiempo a Date
        humidity: parseFloat(d.sen.h) // Convierte la temperatura a número
      }
    }
  })

  return (
    <VictoryChart
      theme={VictoryTheme.material}
      scale={{ x: 'time' }}
      width={500}
    >
      <VictoryLine
        data={transformedData}
        x='timestamp'
        y='temperature'
        style={{ data: { stroke: '#F44336', strokeWidth: 0.3 } }}
      />
    </VictoryChart>
  )
}

export default TemperatureChart
