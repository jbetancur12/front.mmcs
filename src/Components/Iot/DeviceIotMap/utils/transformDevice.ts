// components/DeviceIotMap/utils/transformDevice.ts
import { DeviceIot, DeviceIotRaw } from '../../types'

export const transformDevice = (device: DeviceIotRaw): DeviceIot => {
  const [lng, lat] = device.lastLocation?.coordinates ?? [0, 0]
  return {
    id: device.id ?? '',
    imei: device.imei ?? '',
    name: device.name ?? 'Sin nombre',
    lastLocation: { lat, lng },
    lastSeen: new Date(device.lastSeen ?? Date.now()),
    status: device.isOnline ? 'online' : 'offline',
    customer: device.customer ?? null,
    customerId: device.customerId ?? undefined,
    isOnline: device.isOnline ?? false,
    src: device.src === 'bat' ? 'bat' : 'main',
    sensorData: {
      h: device.lastHumidity ?? '',
      t: device.lastTemperature ?? ''
    },
    deviceIotConfigs: device.deviceIotConfigs ?? [],
    isInAlarm: device.isInAlarm ?? false,
    alarms: device.alarms ?? [],
    location: device.location ?? ''
  }
}
