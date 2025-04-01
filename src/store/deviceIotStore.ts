import { atom, action } from 'nanostores'
import {
  DataPayload,
  DeviceIotConfig,
  SData,
  type DeviceIot
} from '../Components/Iot/types'
import { DeviceAlarm } from 'src/Components/Iot/DeviceIotMap/types'

// Atoms para el estado
export const $devicesIot = atom<DeviceIot[]>([])
export const $realTimeData = atom<Record<string, DataPayload[]>>({})
export const $latestRealTimeData = atom<Record<string, DataPayload[]>>({})

// Acciones
export const updateDeviceIotStatus = action(
  $devicesIot,
  'updateDeviceStatus',
  (
    store,
    deviceIotId: string,
    status: 'online' | 'offline',
    isOnline: boolean,
    src: 'main' | 'bat'
  ) => {
    const devicesIot = store
      .get()
      .map((deviceIot) =>
        deviceIot.name === deviceIotId
          ? { ...deviceIot, status, isOnline, src }
          : deviceIot
      )
    store.set(devicesIot)
  }
)

export const updateDeviceAlarmStatus = action(
  $devicesIot,
  'updateDeviceAlarmStatus',
  (store, deviceIotId: string, isInAlarm: boolean) => {
    const devices = store
      .get()
      .map((device) =>
        device.name === deviceIotId ? { ...device, isInAlarm } : device
      )
    store.set(devices)
  }
)

export const updateDeviceAlarms = action(
  $devicesIot,
  'updateDeviceAlarms',
  (store, deviceId: string | number, newAlarms: DeviceAlarm[]) => {
    const devices = store.get().map((device) => {
      // Normalizar IDs a string para comparación segura
      const currentDeviceId =
        typeof device.id === 'number' ? device.id.toString() : device.id

      const targetDeviceId =
        typeof deviceId === 'number' ? deviceId.toString() : deviceId

      if (currentDeviceId === targetDeviceId) {
        // Mapear y validar las nuevas alarmas
        const validatedAlarms = newAlarms.map((alarm) => ({
          id: alarm.id,
          deviceId: alarm.deviceId,
          name: alarm.name,
          description: alarm.description || '',
          metric: alarm.metric,
          condition: alarm.condition,
          threshold: alarm.threshold,
          enabled: alarm.enabled,
          active: alarm.active,
          severity: alarm.severity,
          createdAt:
            alarm.createdAt instanceof Date
              ? alarm.createdAt
              : new Date(alarm.createdAt),
          lastTriggered: alarm.lastTriggered
            ? new Date(alarm.lastTriggered)
            : null
        }))

        return {
          ...device,
          alarms: validatedAlarms,
          isInAlarm: validatedAlarms.some((alarm) => alarm.active)
        }
      }
      return device
    })

    store.set(devices)
  }
)

export const updateDeviceIotLocation = action(
  $devicesIot,
  'updateDeviceLocation',
  (
    store,
    deviceIotId: string,
    gps: number[],
    timestamp: number,
    sensorData: SData
  ) => {
    const devicesIot = store.get().map((deviceIot) =>
      deviceIot.name === deviceIotId
        ? {
            ...deviceIot,
            lastLocation: { lat: gps[0], lng: gps[1] },
            lastSeen: new Date(timestamp * 1000),
            sensorData
          }
        : deviceIot
    )
    store.set(devicesIot)
  }
)

export const addRealTimeData = action(
  $realTimeData,
  'addRealTimeData',
  (store, data: DataPayload) => {
    const deviceIotId = data.data.dev
    const current = store.get()
    store.set({
      ...current,
      [deviceIotId]: [...(current[deviceIotId] || []).slice(-50), data]
    })
  }
)

export const setLatestRealTimeData = action(
  $latestRealTimeData,
  'setLatestRealTimeData',
  (store, data: DataPayload) => {
    const deviceIotId = data.data.dev
    store.set({
      ...store.get(),
      [deviceIotId]: [data] // Solo almacena el último valor
    })
  }
)

export const loadDevices = action(
  $devicesIot,
  'loadDevices',
  (store, devicesIot: DeviceIot[]) => {
    store.set(devicesIot)
  }
)

export const updateDeviceConfig = action(
  $devicesIot,
  'updateDeviceConfig',
  (store, updatedConfig: DeviceIotConfig) => {
    const devices = store.get().map((device) => {
      if (device.id === updatedConfig.deviceIotId) {
        return {
          ...device,
          deviceIotConfigs: device.deviceIotConfigs.map((config) =>
            config.id === updatedConfig.id ? updatedConfig : config
          )
        }
      }
      return device
    })
    store.set(devices)
  }
)
