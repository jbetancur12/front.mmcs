// components/DeviceIotMap/parts/DeviceMarkers.tsx
import { Marker, Popup } from 'react-leaflet'
import { useMapEvents } from 'react-leaflet'
import { memo } from 'react'

import { DevicePopupContent } from './DevicePopupContent'
import { createDeviceIcon } from '../utils/createDeviceIcon'
import { DeviceIot } from '../../types'

interface DeviceMarkersProps {
  devices: DeviceIot[]
  onSelect: (device: DeviceIot) => void
}

const MarkerComponent = memo(
  ({
    device,
    onSelect
  }: {
    device: DeviceIot
    onSelect: (device: DeviceIot) => void
  }) => {
    useMapEvents({
      click: () => {
        // Maneja clics en el mapa general si es necesario
        onSelect(device)
      }
    })

    return (
      <Marker
        position={[device.lastLocation.lat, device.lastLocation.lng]}
        icon={createDeviceIcon(device.src, device.isOnline)}
        eventHandlers={{
          click: () => {
            // Maneja clics específicos en el marcador
            onSelect(device)
          }
        }}
      >
        <Popup>
          <DevicePopupContent device={device} />
        </Popup>
      </Marker>
    )
  }
)

export const DeviceMarkers = ({ devices, onSelect }: DeviceMarkersProps) => {
  return (
    <>
      {devices.map((device) => (
        <MarkerComponent key={device.id} device={device} onSelect={onSelect} />
      ))}
    </>
  )
}
