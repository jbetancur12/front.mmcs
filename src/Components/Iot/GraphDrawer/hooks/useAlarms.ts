// components/DeviceGraphs/GraphDrawer/useAlarms.ts
import { DeviceIot } from '../../types'
import { AlarmValues } from '../types'

export const useAlarms = (deviceData?: DeviceIot | null): AlarmValues => {
  const temperatureConfig = deviceData?.deviceIotConfigs?.find(
    (c) => c.sensorType === 'TEMPERATURA'
  )
  const humidityConfig = deviceData?.deviceIotConfigs?.find(
    (c) => c.sensorType === 'HUMEDAD'
  )

  return {
    temperatureAlarms: {
      above: temperatureConfig?.alarmThresholds?.find(
        (t) => t.type === 'ABOVE' && t.enabled
      )?.min,
      below: temperatureConfig?.alarmThresholds?.find(
        (t) => t.type === 'BELOW' && t.enabled
      )?.max
    },
    humidityAlarms: {
      above: humidityConfig?.alarmThresholds?.find(
        (t) => t.type === 'ABOVE' && t.enabled
      )?.min,
      below: humidityConfig?.alarmThresholds?.find(
        (t) => t.type === 'BELOW' && t.enabled
      )?.max
    }
  }
}
