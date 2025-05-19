// components/DeviceIotMap/parts/DeviceMapController.tsx
import { useMap } from 'react-leaflet'
import { useEffect } from 'react'
import L from 'leaflet'

import { DeviceIot } from '../../types'

interface DeviceMapControllerProps {
  selectedDevice?: DeviceIot | null
}

// const COLOMBIA_CENTER = [4.5709, -74.2973] // Bogotá
const COLOMBIA_BOUNDS = L.latLngBounds(
  L.latLng(12.4375, -79.84), // Norte-Oeste
  L.latLng(-4.227, -66.87) // Sur-Este
)

export const DeviceMapController = ({
  selectedDevice
}: DeviceMapControllerProps) => {
  const map = useMap()

  useEffect(() => {
    // Ajustar vista inicial a los límites de Colombia
    map.fitBounds(COLOMBIA_BOUNDS, {
      padding: [50, 50],
      animate: false
    })

    // Opcional: Centrar en Bogotá con zoom específico
    // map.setView(COLOMBIA_CENTER, 6)
  }, [map]) // Solo se ejecuta una vez al montar el componente

  useEffect(() => {
    if (selectedDevice) {
      map.flyTo(
        [selectedDevice.lastLocation.lat, selectedDevice.lastLocation.lng],
        18,
        {
          duration: 0.75
        }
      )
    }
  }, [selectedDevice, map])

  return null
}
