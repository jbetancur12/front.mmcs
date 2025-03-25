// components/DeviceIotMap/utils/transformDevice.ts
import { DeviceIot } from '../../types'
import { Device } from '../types'

export const transformDevice = (device: any): DeviceIot => {
  const [lng, lat] = device.lastLocation.coordinates
  return {
    id: device.id,
    imei: device.imei,
    name: device.name,
    lastLocation: { lat, lng },
    lastSeen: new Date(device.lastSeen),
    status: device.isOnline ? 'online' : 'offline',
    customer: device.customer,
    isOnline: device.isOnline,
    src: device.src,
    sensorData: device.sensorData,
    deviceIotConfigs: device.deviceIotConfigs,
    isInAlarm: device.isInAlarm
  }
}
