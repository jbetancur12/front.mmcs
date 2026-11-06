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

/** Punto que devuelve /devicesIot/dataPoints. */
export interface DeviceDataPoint {
  timestamp: string
  avg_temperature: number
  avg_humidity: number
  min_temperature: number
  max_temperature: number
  min_humidity: number
  max_humidity: number
}

/** Punto ya normalizado para las gráficas. */
export interface CombinedDataPoint {
  timestamp: number
  temperature: number
  humidity: number
}

export interface AggregateStats {
  avgTemp: number
  minTemp: number
  maxTemp: number
  avgHum: number
  minHum: number
  maxHum: number
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
  isInAlarm?: boolean
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
  hours?: number
  isCustom?: boolean
  startDate?: Date
  endDate?: Date
}
