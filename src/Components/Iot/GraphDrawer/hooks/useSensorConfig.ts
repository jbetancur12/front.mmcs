// components/DeviceGraphs/GraphDrawer/hooks/useSensorConfig.ts
import { useState } from 'react'
import { ModuleConfig, SensorType } from '../types'

export const useSensorConfig = (deviceId: number | string | null) => {
  const [selectedConfig, setSelectedConfig] = useState<
    ModuleConfig | undefined
  >()
  const [selectedSensorType, setSelectedSensorType] =
    useState<SensorType | null>(null)

  const handleSelectSensorType = (
    sensorType: SensorType,
    existingConfig?: ModuleConfig
  ) => {
    setSelectedSensorType(sensorType)

    if (existingConfig) {
      setSelectedConfig({
        ...existingConfig,
        absoluteMin: Number(existingConfig.absoluteMin),
        absoluteMax: Number(existingConfig.absoluteMax),
        okMin: Number(existingConfig.okMin),
        okMax: Number(existingConfig.okMax)
      })
    } else {
      setSelectedConfig({
        deviceIotId: Number(deviceId),
        sensorType,
        absoluteMin: sensorType === 'TEMPERATURA' ? 20 : 50,
        absoluteMax: sensorType === 'TEMPERATURA' ? 30 : 80,
        okMin: sensorType === 'TEMPERATURA' ? 20 : 50,
        okMax: sensorType === 'TEMPERATURA' ? 25 : 60,
        alarmThresholds: [],
        warningThresholds: []
      })
    }
  }

  const resetConfig = () => {
    setSelectedSensorType(null)
    setSelectedConfig(undefined)
  }

  return {
    selectedConfig,
    selectedSensorType,
    handleSelectSensorType,
    resetConfig
  }
}
