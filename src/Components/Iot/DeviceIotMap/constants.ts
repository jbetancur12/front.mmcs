// components/DeviceIotMap/constants.ts
export const DEFAULT_MAP_CENTER: [number, number] = [-12.046373, -77.042754]
export const MAP_STYLE = { height: '80vh', width: '100%', minHeight: '500px' }
export const SIDEBAR_WIDTH = 320

export const DeviceStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  LOW_BATTERY: 'low_battery',
  IN_ALARM: 'in_alarm'
} as const

export const PowerSource = {
  BATTERY: 'bat',
  MAIN: 'main'
} as const
