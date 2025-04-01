// components/DeviceGraphs/GraphDrawer/types.ts

import { DeviceIot } from '../types'

export type SensorType = 'TEMPERATURA' | 'HUMEDAD' | 'PRESION' | 'OTRO'

export interface ModuleConfig {
  deviceIotId?: number
  sensorType: SensorType
  absoluteMin: number
  absoluteMax: number
  okMin: number
  okMax: number
  alarmThresholds: AlarmThreshold[]
  warningThresholds: WarningThreshold[]
  id?: number
  createdAt?: string
  updatedAt?: string
}

export interface AlarmThreshold {
  min?: number
  max?: number
  type: 'ABOVE' | 'BELOW'
  enabled: boolean
}

export interface WarningThreshold extends AlarmThreshold {}

export interface DeviceData {
  id: number
  deviceIotConfigs: ModuleConfig[]
  [key: string]: any
}

export interface AlarmValues {
  temperatureAlarms?: {
    above?: number
    below?: number
  }
  humidityAlarms?: {
    above?: number
    below?: number
  }
}

export interface GraphDrawerProps {
  device: DeviceIot | null
  deviceId: number | string | null
  deviceName: string
  open: boolean
  onClose: () => void
}

export interface TabComponentProps {
  deviceId: number | string
  deviceName: string
  currentDevice?: DeviceData
  combinedData: Array<{
    timestamp: number
    temperature: number
    humidity: number
  }>
  aggregateStats: {
    avgTemp: number
    minTemp: number
    maxTemp: number
    avgHum: number
    minHum: number
    maxHum: number
  } | null
  realTimeDataFlat: any[]
  lastEntry?: any
}

export interface GaugeConfig {
  absoluteMin: number
  absoluteMax: number
  okMin: number
  okMax: number
  alarmThresholds: AlarmThreshold[]
  warningThresholds: WarningThreshold[]
  sensorType: SensorType
}

export interface RangeOption {
  label: string
  hours: number
}
