// components/DeviceIotMap/parts/DeviceMarkers.tsx
import { Marker, Popup } from 'react-leaflet'
import { useMapEvents } from 'react-leaflet'
import { memo } from 'react'

import DevicePopupContent from './DevicePopupContent'

import { DeviceIot } from '../../types'
import { DeviceStatus } from '../constants'
import { Sensors } from '@mui/icons-material'
import { renderToStaticMarkup } from 'react-dom/server'
import { divIcon } from 'leaflet'

interface DeviceMarkersProps {
  devices: DeviceIot[]
  onSelect: (device: DeviceIot) => void
  isSelected: boolean
  onViewDetails: (device: DeviceIot) => void
}

const MarkerComponent = memo(
  ({
    device,
    onSelect,
    isSelected,
    onViewDetails
  }: {
    device: DeviceIot
    onSelect: (device: DeviceIot) => void
    isSelected: boolean
    onViewDetails: (device: DeviceIot) => void
  }) => {
    const getMarkerColor = (status: string, isInAlarm: boolean) => {
      if (isInAlarm) {
        return '#f44336' // rojo
      }

      switch (status) {
        case DeviceStatus.ONLINE:
          return '#1976d2' // primary
        case DeviceStatus.OFFLINE:
          return '#808080' // error
        case DeviceStatus.LOW_BATTERY:
          return '#ff9800' // warning
        default:
          return '#808080'
      }
    }

    // Create custom marker icon
    const markerColor = getMarkerColor(device.status, device.isInAlarm)
    const markerSize = isSelected ? 'w-10 h-10' : 'w-8 h-8'
    const transform = isSelected ? 'transform scale-110' : ''

    const iconHtml = renderToStaticMarkup(
      <div
        style={{
          width: isSelected ? 40 : 32,
          height: isSelected ? 40 : 32,
          backgroundColor: markerColor,
          transform: isSelected ? 'scale(1.1)' : 'none',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}
      >
        <Sensors style={{ width: '16px', height: '16px', color: 'white' }} />
      </div>
    )

    const customIcon = divIcon({
      html: iconHtml,
      className: `custom-marker-icon  ${isSelected ? 'marker-active' : ''} ${device.isInAlarm ? 'blinking' : ''} ${transform} ${markerSize}`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    })

    useMapEvents({
      click: () => {
        // Maneja clics en el mapa general si es necesario
        onSelect(device)
      }
    })

    return (
      <Marker
        position={[device.lastLocation.lat, device.lastLocation.lng]}
        icon={customIcon}
        eventHandlers={{
          add: (e) => {
            // Almacenar datos del dispositivo en el marcador
            ;(e.target as any).deviceData = device
          },
          click: () => {
            // Maneja clics específicos en el marcador
            onSelect(device)
          }
        }}
      >
        <Popup>
          <DevicePopupContent device={device} onViewDetails={onViewDetails} />
        </Popup>
      </Marker>
    )
  }
)

export const DeviceMarkers = ({
  devices,
  onSelect,
  isSelected,
  onViewDetails
}: DeviceMarkersProps) => {
  return (
    <>
      {devices.map((device) => (
        <MarkerComponent
          key={device.id}
          device={device}
          onSelect={onSelect}
          isSelected={isSelected}
          onViewDetails={onViewDetails}
        />
      ))}
    </>
  )
}
