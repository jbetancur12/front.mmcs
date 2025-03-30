// components/DeviceIotMap/types.ts
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
  customer: any
  isOnline: boolean
  src: 'main' | 'bat'
  sensorData?: {
    t: number
    h: number
  }
  deviceIotConfigs?: any[]
}

export interface FilterState {
  searchQuery: string
  statuses: Set<'online' | 'offline'>
  powerSources: Set<'main' | 'bat'>
}

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
