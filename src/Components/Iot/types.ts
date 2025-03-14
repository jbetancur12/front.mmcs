import { Customer } from '../Quotations/types'

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
