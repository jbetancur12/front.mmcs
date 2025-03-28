import { Customer } from 'src/Components/Quotations/types'
import { DeviceIot, DeviceIotConfig, SData } from '../../types'

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
    sensorData: (device.sensorData as SData) || {
      // Proporcionar estructura por defecto según tu SData
      temperature: 0,
      humidity: 0
      // ...otros campos necesarios
    },
    src: device.src === 'bat' ? 'bat' : 'main',
    deviceIotConfigs: (device.deviceIotConfigs as DeviceIotConfig[]) || [],
    isInAlarm: device.isInAlarm || false
  }
}
