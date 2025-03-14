import { atom, action } from 'nanostores'
import { DataPayload, SData, type DeviceIot } from '../Components/Iot/types'

// Atoms para el estado
export const $devicesIot = atom<DeviceIot[]>([])
export const $realTimeData = atom<Record<string, DataPayload[]>>({})

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

export const loadDevices = action(
  $devicesIot,
  'loadDevices',
  (store, devicesIot: DeviceIot[]) => {
    store.set(devicesIot)
  }
)
