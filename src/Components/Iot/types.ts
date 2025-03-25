import { Customer } from '../Quotations/types'
import { AlarmThreshold, WarningThreshold } from './GraphDrawer/types'

export interface SData {
  h: string
  t: string
}

export interface DeviceIot {
  id: string | number
  name: string
  imei: string
  lastLocation: {
    lat: number
    lng: number
  }
  lastSeen: Date
  status: 'online' | 'offline'
  customer: Customer | null
  isOnline: boolean
  sensorData: SData
  src: 'main' | 'bat'
  deviceIotConfigs: DeviceIotConfig[]
  isInAlarm: boolean
}

export interface DeviceIotConfig {
  id: number | string
  deviceIotId: number | string
  sensorType: string
  absoluteMin: number
  absoluteMax: number
  okMin: number
  okMax: number
  alarmThresholds: AlarmThreshold[]
  warningThresholds: WarningThreshold[]
  // ... otras propiedades según tu API
}

export interface SensorData {
  dev: string
  gps: number[]
  pwr: {
    v: string
    src: 'main' | 'bat'
  }
  sen: {
    t: string
    h: string
  }
  ts: number
}

export interface DataPayload {
  data: SensorData
  timestamp: string
}
