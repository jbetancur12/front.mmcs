import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { DeviceIot } from 'src/Components/Iot/types'
import { transformDevice as transformMapDevice } from 'src/Components/Iot/DeviceIotMap/utils/transformDevice'
import { hasAlarms, loadDevices } from 'src/store/deviceIotStore'

/**
 * Claves de dispositivos IoT. Se conservan las claves históricas ('devices'),
 * ya que AddDeviceIotModal y DeviceManagement invalidan 'devices'.
 */
export const IOT_DEVICES_QUERY_KEYS = {
  list: 'devices',
  map: (customerId: number | string | undefined) =>
    ['devices', customerId] as const
}

interface ApiIotDevice {
  id: number | string
  imei: string
  name: string
  lastLocation: { coordinates: [number, number] }
  lastSeen: string
  isOnline: boolean
  customer: unknown
}

const transformTableDevice = (device: ApiIotDevice) => {
  const [lng, lat] = device.lastLocation.coordinates
  return {
    id: device.id.toString(), // o device.id si lo manejas como string
    imei: device.imei,
    name: device.name,
    lastLocation: { lat, lng },
    lastSeen: device.lastSeen,
    status: device.isOnline ? 'online' : 'offline',
    customer: device.customer
  }
}

/** Dispositivos IoT para la tabla de administración */
export const useIotDevicesTable = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<DeviceIot[]>(IOT_DEVICES_QUERY_KEYS.list, async () => {
    const response = await axiosPrivate.get('/devicesIot')
    return response.data.map(transformTableDevice)
  })
}

/** Dispositivos IoT del mapa: además sincroniza el store de dispositivos y alarmas */
export const useIotMapDevices = (customerId?: number | string) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    IOT_DEVICES_QUERY_KEYS.map(customerId),
    async () => {
      const response = await axiosPrivate.get('/devicesIot')
      const transformed = response.data.map(transformMapDevice)

      const hasAlarm = response.data.some(
        (device: DeviceIot) => device.isInAlarm
      )
      hasAlarms(hasAlarm)
      loadDevices(transformed) // Guardar en el store
      return transformed
    },
    {
      staleTime: 5 * 60 * 1000 // 5 minutos
    }
  )
}
