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
export const $hasAlarms = atom<boolean>(false)
export const $deviceSensorData = atom<
  Record<string, { lastSeen: Date; sensorData: SData }>
>({})

export const updateDeviceIotSensorData = action(
  $deviceSensorData,
  'updateDeviceSensorData',
  (store, deviceIotId: string, timestamp: string, sensorData: SData) => {
    const currentData = store.get()

    const sameSensorData =
      JSON.stringify(currentData[deviceIotId]?.sensorData) ===
      JSON.stringify(sensorData)

    if (sameSensorData) return // No actualizamos si no hay cambios

    store.set({
      ...currentData,
      [deviceIotId]: {
        lastSeen: new Date(timestamp),
        sensorData
      }
    })
  }
)

// Acciones
export const updateDeviceIotStatus = action(
  $devicesIot,
  'updateDeviceStatus',
  (store, deviceIotId: string, status, isOnline, src) => {
    const devicesIot = store.get()
    let hasChanges = false

    const updatedDevices = devicesIot.map((deviceIot) => {
      if (deviceIot.name !== deviceIotId) return deviceIot

      // Verificar si hay cambios en los valores relevantes
      const statusChanged = deviceIot.status !== status
      const isOnlineChanged = deviceIot.isOnline !== isOnline
      const srcChanged = deviceIot.src !== src

      if (statusChanged || isOnlineChanged || srcChanged) {
        hasChanges = true

        // Obtener la hora exacta del cambio
        const now = new Date()
        const formattedTime = now.toLocaleTimeString() // HH:MM:SS

        console.debug(
          `[DEBUG] Estado actualizado para ${deviceIotId} a las ${formattedTime}`,
          {
            oldStatus: deviceIot.status,
            newStatus: status,
            oldIsOnline: deviceIot.isOnline,
            newIsOnline: isOnline,
            oldSrc: deviceIot.src,
            newSrc: src
          }
        )

        return { ...deviceIot, status, isOnline, src }
      }

      return deviceIot
    })

    if (hasChanges) {
      store.set(updatedDevices)
    }
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
    const devices = store.get()
    let hasChanges = false

    const updatedDevices = devices.map((device) => {
      const currentDeviceId =
        typeof device.id === 'number' ? device.id.toString() : device.id

      const targetDeviceId =
        typeof deviceId === 'number' ? deviceId.toString() : deviceId

      if (currentDeviceId !== targetDeviceId) return device

      // Comparar alarmas existentes con las nuevas
      const oldAlarms = JSON.stringify(device.alarms)
      const newAlarmsStr = JSON.stringify(newAlarms)

      if (oldAlarms !== newAlarmsStr) {
        hasChanges = true
        return {
          ...device,
          alarms: newAlarms,
          isInAlarm: newAlarms.some((alarm) => alarm.active)
        }
      }

      return device
    })

    if (hasChanges) {
      store.set(updatedDevices)
    }
  }
)

export const updateDeviceIotLocation = action(
  $devicesIot,
  'updateDeviceLocation',
  (store, deviceIotId: string, gps: number[]) => {
    const devicesIot = store.get()
    let hasChanges = false

    const updatedDevices = devicesIot.map((deviceIot) => {
      if (deviceIot.name !== deviceIotId) return deviceIot

      // Redondear a 4 decimales
      const lat = Number(gps[0].toFixed(4))
      const lng = Number(gps[1].toFixed(4))

      const sameLocation =
        deviceIot.lastLocation.lat === lat && deviceIot.lastLocation.lng === lng

      if (sameLocation) return deviceIot

      hasChanges = true

      // Obtener la hora exacta del cambio
      const now = new Date()
      const formattedTime = now.toLocaleTimeString() // HH:MM:SS

      console.debug(
        `[DEBUG] Ubicación actualizada para ${deviceIotId} a las ${formattedTime}`,
        {
          oldLocation: deviceIot.lastLocation,
          newLocation: { lat, lng }
        }
      )

      return {
        ...deviceIot,
        lastLocation: { lat, lng }
      }
    })

    if (hasChanges) {
      store.set(updatedDevices)
    }
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

export const hasAlarms = action(
  $hasAlarms,
  'hasAlarms',
  (store, data: boolean) => {
    const alarms = store.get()
    console.log('🚀 ~ data:', data, alarms)
    if (data === alarms) return
    store.set(data)
  }
)

export const loadDevices = action(
  $devicesIot,
  'loadDevices',
  (store, devicesIot: DeviceIot[]) => {
    store.set(devicesIot)
  }
)
