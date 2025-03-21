// components/DeviceIotMap/parts/DeviceMapController.tsx
import { useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'

import { DeviceIot } from '../../types'

interface DeviceMapControllerProps {
  devices: DeviceIot[]
  selectedDevice?: DeviceIot | null
}

export const DeviceMapController = ({
  devices,
  selectedDevice
}: DeviceMapControllerProps) => {
  const map = useMap()

  useEffect(() => {
    if (devices.length > 0) {
      const bounds = L.latLngBounds(
        devices.map((d) => [d.lastLocation.lat, d.lastLocation.lng])
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [devices, map])

  useEffect(() => {
    if (selectedDevice) {
      map.flyTo(
        [selectedDevice.lastLocation.lat, selectedDevice.lastLocation.lng],
        10
      )
    }
  }, [selectedDevice, map])

  return null
}
