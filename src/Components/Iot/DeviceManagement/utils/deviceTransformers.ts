import { Customer } from 'src/Components/Quotations/types'
import { DeviceIot, DeviceIotConfig } from '../../types'

export const transformDevice = (device: any): DeviceIot => {
  const [lng, lat] = device.lastLocation?.coordinates || [0, 0]

  return {
    id: device.id?.toString() || '',
    imei: device.imei || '',
    name: device.name || 'Sin nombre',
    lastLocation: { lat, lng },
    lastSeen: new Date(device.lastSeen || Date.now()),
    status: device.isOnline ? 'online' : 'offline',
    customer: (device.customer as Customer) || null,
    customerId: device.customerId || null,
    isOnline: device.isOnline || false,
    sensorData: {
      h: device.lastHumidity,
      t: device.lastTemperature
    },
    src: device.src === 'bat' ? 'bat' : 'main',
    deviceIotConfigs: (device.deviceIotConfigs as DeviceIotConfig[]) || [],
    isInAlarm: device.isInAlarm || false,
    alarms: device.alarms,
    location: device.location
  }
}
