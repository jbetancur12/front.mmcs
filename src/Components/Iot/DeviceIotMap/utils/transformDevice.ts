// components/DeviceIotMap/utils/transformDevice.ts
import { Customer } from 'src/Components/Quotations/types'
import { DeviceIot } from '../../types'

export const transformDevice = (device: any): DeviceIot => {
  const [lng, lat] = device.lastLocation.coordinates
  return {
    id: device.id,
    imei: device.imei,
    name: device.name,
    lastLocation: { lat, lng },
    lastSeen: new Date(device.lastSeen),
    status: device.isOnline ? 'online' : 'offline',
    customer: (device.customer as Customer) || null,
    customerId: device.customerId,
    isOnline: device.isOnline,
    src: device.src,
    sensorData: {
      h: device.lastHumidity,
      t: device.lastTemperature
    },
    deviceIotConfigs: device.deviceIotConfigs,
    isInAlarm: device.isInAlarm,
    alarms: device.alarms,
    location: device.location
  }
}
