// components/DeviceIotMap/constants.ts
export const DEFAULT_MAP_CENTER: [number, number] = [-12.046373, -77.042754]
export const MAP_STYLE = { height: '80vh', width: '100%', minHeight: '500px' }
export const SIDEBAR_WIDTH = 360

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

export const AlarmSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical'
} as const

export const AlarmMetric = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  BATTERY: 'battery'
} as const

export const AlarmCondition = {
  ABOVE: 'above',
  BELOW: 'below',
  EQUAL: 'equal'
} as const

export type AlarmSeverity = (typeof AlarmSeverity)[keyof typeof AlarmSeverity]
export type AlarmMetric = (typeof AlarmMetric)[keyof typeof AlarmMetric]
export type AlarmCondition =
  (typeof AlarmCondition)[keyof typeof AlarmCondition]
