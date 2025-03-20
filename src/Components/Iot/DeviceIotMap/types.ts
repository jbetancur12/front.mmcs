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
