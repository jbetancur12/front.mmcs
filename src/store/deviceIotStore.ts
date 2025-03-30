import { atom, action } from 'nanostores'
import {
  DataPayload,
  DeviceIotConfig,
  SData,
  type DeviceIot
} from '../Components/Iot/types'

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
