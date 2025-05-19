// components/DeviceGraphs/GraphDrawer/useAlarms.ts
import { ModuleConfig, AlarmValues } from '../types'

export const useAlarms = (deviceData?: any): AlarmValues => {
  const temperatureConfig = deviceData?.deviceIotConfigs?.find(
    (c: ModuleConfig) => c.sensorType === 'TEMPERATURA'
  )
  const humidityConfig = deviceData?.deviceIotConfigs?.find(
    (c: ModuleConfig) => c.sensorType === 'HUMEDAD'
  )

  return {
    temperatureAlarms: {
      above: temperatureConfig?.alarmThresholds?.find(
        (t: Record<string, string>) => t.type === 'ABOVE' && t.enabled
      )?.min,
      below: temperatureConfig?.alarmThresholds?.find(
        (t: Record<string, string>) => t.type === 'BELOW' && t.enabled
      )?.max
    },
    humidityAlarms: {
      above: humidityConfig?.alarmThresholds?.find(
        (t: Record<string, string>) => t.type === 'ABOVE' && t.enabled
      )?.min,
      below: humidityConfig?.alarmThresholds?.find(
        (t: Record<string, string>) => t.type === 'BELOW' && t.enabled
      )?.max
    }
  }
}
