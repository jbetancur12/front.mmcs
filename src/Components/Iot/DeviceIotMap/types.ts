// components/DeviceIotMap/types.ts
import type { Customer, DeviceIotConfig } from '../types'

export interface Device {
  id: string | number
  imei: string
  name: string
  lastLocation: {
    lat: number
    lng: number
  }
  lastSeen: Date
  status: 'online' | 'offline'
  customer: Customer | null
  isOnline: boolean
  src: 'main' | 'bat'
  sensorData?: {
    t: number
    h: number
  }
  deviceIotConfigs?: DeviceIotConfig[]
}

export interface FilterState {
  searchQuery: string
  statuses: Set<'online' | 'offline'>
  powerSources: Set<'main' | 'bat'>
  alarmSeverities: Set<string>
  withAnyAlarm: boolean
  customerId?: number | null // Nuevo campo
}

/** Valor que puede recibir un filtro del mapa (cada campo valida el suyo). */
export type FilterValue = string | Set<string> | boolean | number | null

export type OnFilterChange = (
  type: keyof FilterState,
  value: FilterValue
) => void

export interface MapControlsProps {
  isSidebarOpen: boolean
  onToggleSidebar: () => void
}

export type DeviceAlarm = {
  id: number
  deviceId: number
  name: string
  description?: string
  metric: string // temperature, humidity, battery, etc.
  condition: string // above, below, equal
  threshold: number
  enabled: boolean // Si el usuario activó/desactivó la alarma
  active: boolean // Si la alarma está actualmente disparada
  severity: 'info' | 'warning' | 'critical'
  createdAt: Date
  lastTriggered?: Date | null // Puede ser null si aún no se ha disparado
}

export interface DeviceReadingPayload {
  dev: string
  ts: number
  sen: {
    t: string // temperatura
    h: string // humedad
  }
  gps: [number, number] // [latitud, longitud]
  pwr: {
    v: string // voltaje
    src: string // fuente de energía
  }
}
