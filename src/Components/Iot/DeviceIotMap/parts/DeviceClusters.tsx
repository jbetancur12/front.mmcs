import { memo, useEffect, useCallback } from 'react'
import * as L from 'leaflet'
import { useMap } from 'react-leaflet'
import { renderToStaticMarkup } from 'react-dom/server'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import { DeviceStatus } from '../constants'
import { DeviceIot } from '../../types'
import DevicePopup from './DevicePopupContent'
import 'leaflet.markercluster'
import { Sensors } from '@mui/icons-material'

interface DeviceClustersProps {
  devices: DeviceIot[]
  onSelect: (device: DeviceIot) => void
  isSelected: boolean
}

const DeviceClusters = ({
  devices,
  onSelect,
  isSelected
}: DeviceClustersProps) => {
  const map = useMap()

  // Función para crear iconos memoizada
  const createCustomIcon = useCallback(
    (device: DeviceIot, isSelected: boolean) => {
      const markerColor = getMarkerColor(device.status, device.isInAlarm)
      const iconSize = isSelected ? 40 : 32
      const transform = isSelected ? 'scale(1.1)' : 'none'

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

      return L.divIcon({
        html: iconHtml,
        className: `custom-marker-icon  ${isSelected ? 'marker-active' : ''} ${device.isInAlarm ? 'blinking' : ''} `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      })
    },
    []
  )

  // Renderizado de popups memoizado
  const renderPopup = useCallback((device: DeviceIot) => {
    return L.popup({ maxWidth: 300 }).setContent(
      renderToStaticMarkup(<DevicePopup device={device} />)
    )
  }, [])

  useEffect(() => {
    const clusterGroup = (L as any).markerClusterGroup({
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      animate: true,
      spiderfyDistanceMultiplier: 1.5
    })

    // Crear marcadores
    const markers = devices.map((device) => {
      const marker = L.marker(
        [device.lastLocation.lat, device.lastLocation.lng],
        { icon: createCustomIcon(device, isSelected) }
      )

      marker.on('click', () => {
        onSelect(device)
        map.flyTo([device.lastLocation.lat, device.lastLocation.lng], 15)
      })

      marker.bindPopup(renderPopup(device), {
        offset: L.point(0, -20),
        className: 'custom-popup'
      })

      return marker
    })

    clusterGroup.addLayers(markers)
    map.addLayer(clusterGroup)

    return () => {
      map.removeLayer(clusterGroup)
    }
  }, [devices, map, onSelect, isSelected, createCustomIcon, renderPopup])

  return null
}

// Función helper para determinar color del marcador
const getMarkerColor = (status: string, isInAlarm: boolean) => {
  if (isInAlarm) return '#f44336'
  switch (status) {
    case DeviceStatus.ONLINE:
      return '#1976d2'
    case DeviceStatus.OFFLINE:
      return '#808080'
    case DeviceStatus.LOW_BATTERY:
      return '#ff9800'
    default:
      return '#808080'
  }
}

export default memo(DeviceClusters)
