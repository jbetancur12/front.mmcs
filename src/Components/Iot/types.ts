import { DeviceAlarm } from './DeviceIotMap/types'
import { AlarmThreshold, WarningThreshold } from './GraphDrawer/types'

export interface Customer {
  id: number
  nombre: string
  identificacion?: string
  direccion?: string
  email?: string
  telefono?: string
  ciudad?: string
  departamento?: string
}

export interface SData {
  h: string
  t: string
}

export interface DeviceIot {
  id: string | number
  name: string
  imei: string
  location: string
  lastLocation: {
    lat: number
    lng: number
  }
  lastSeen: Date
  status: 'online' | 'offline'
  customerId?: string | number
  customer?: Customer | null
  isOnline: boolean
  sensorData: SData
  src: 'main' | 'bat'
  deviceIotConfigs: DeviceIotConfig[]
  isInAlarm: boolean
  alarms: DeviceAlarm[]
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

/** Dispositivo como lo entrega el API, antes de normalizarlo a DeviceIot. */
export interface DeviceIotRaw {
  id?: number | string | null
  imei?: string
  name?: string
  location?: string
  lastLocation?: {
    coordinates?: [number, number]
  }
  lastSeen?: string
  isOnline?: boolean
  customerId?: string | number | null
  customer?: Customer | null
  src?: string
  lastHumidity?: string
  lastTemperature?: string
  deviceIotConfigs?: DeviceIotConfig[]
  isInAlarm?: boolean
  alarms?: DeviceAlarm[]
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
