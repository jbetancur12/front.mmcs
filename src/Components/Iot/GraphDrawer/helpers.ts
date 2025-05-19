// components/DeviceGraphs/GraphDrawer/helpers.ts
import { ModuleConfig, GaugeConfig } from './types'

export const getGaugeConfig = (
  configs: ModuleConfig[] | undefined,
  sensorType: 'TEMPERATURA' | 'HUMEDAD'
): GaugeConfig | null => {
  const config = configs?.find((c) => c.sensorType === sensorType)
  if (!config) return null

  return {
    absoluteMin: Number(config.absoluteMin),
    absoluteMax: Number(config.absoluteMax),
    okMin: Number(config.okMin),
    okMax: Number(config.okMax),
    alarmThresholds: config.alarmThresholds,
    warningThresholds: config.warningThresholds,
    sensorType: config.sensorType
  }
}

export const aggregateStats = (graphData: any[]) => {
  if (!graphData || graphData.length === 0) return null

  const tempValues = graphData.reduce(
    (acc, dp) => {
      acc.sum += dp.avg_temperature
      acc.min = Math.min(acc.min, dp.min_temperature)
      acc.max = Math.max(acc.max, dp.max_temperature)
      return acc
    },
    { sum: 0, min: Infinity, max: -Infinity }
  )

  const humValues = graphData.reduce(
    (acc, dp) => {
      acc.sum += dp.avg_humidity
      acc.min = Math.min(acc.min, dp.min_humidity)
      acc.max = Math.max(acc.max, dp.max_humidity)
      return acc
    },
    { sum: 0, min: Infinity, max: -Infinity }
  )

  return {
    avgTemp: tempValues.sum / graphData.length,
    minTemp: tempValues.min,
    maxTemp: tempValues.max,
    avgHum: humValues.sum / graphData.length,
    minHum: humValues.min,
    maxHum: humValues.max
  }
}
