// components/DeviceIotMap/index.tsx
import 'leaflet/dist/leaflet.css'
import { useStore } from '@nanostores/react'
import { Box, CircularProgress } from '@mui/material'
import {
  LayersControl,
  MapContainer,
  TileLayer,
  ZoomControl
} from 'react-leaflet'
import { DeviceSidebar } from './sidebar'

import { $devicesIot, loadDevices } from 'src/store/deviceIotStore'
import { DEFAULT_MAP_CENTER, MAP_LAYERS, MAP_STYLE } from './constants'

import { useMapSetup } from './hooks/useMapSetup'
import { useState } from 'react'
import { useDeviceData } from './hooks/useDeviceData'
import { MapControls } from './parts/MapControls'
import { DeviceMapController } from './parts/DeviceMapController'
import { DeviceMarkers } from './parts/DeviceMarkers'
import { DeviceIot } from '../types'
import useAxiosPrivate from '@utils/use-axios-private'
import { useQuery } from 'react-query'
import { transformDevice } from './utils/transformDevice'
import GraphDrawer from '../GraphDrawer/index.tsx'
import { userStore } from '@stores/userStore'

import MarkerClusterGroup from 'react-leaflet-cluster'
import AlarmNotification from './parts/AlarmNotification.tsx'

const DeviceIotMap = () => {
  const devices = useStore($devicesIot)

  const $user = useStore(userStore)
  const axiosPrivate = useAxiosPrivate()
  const { handleMapRef, isSidebarOpen, toggleSidebar } = useMapSetup()
  const { filteredDevices, filterState, handleFilterChange } =
    useDeviceData(devices)
  const [selectedDevice, setSelectedDevice] = useState<DeviceIot | null>(null)
  const [graphDeviceId, setGraphDeviceId] = useState<number | string | null>(
    null
  )
  const [deviceName, setDeviceName] = useState<string>('')
  const [selectedDeviceForGraph, setSelectedDeviceForGraph] =
    useState<DeviceIot | null>(null)

  const { data: apiDevices } = useQuery(
    ['devices', $user?.customer?.id],
    async () => {
      const response = await axiosPrivate.get('/devicesIot')
      const transformed = response.data.map(transformDevice)
      loadDevices(transformed) // Guardar en el store
      return transformed // Asegurar que transformDevice existe
    },
    {
      staleTime: 5 * 60 * 1000 // 5 minutos
    }
  )

  const handleShowDeviceGraph = (device: DeviceIot) => {
    setGraphDeviceId(device.id)
    setDeviceName(device.name)
    setSelectedDeviceForGraph(device)
  }

  return (
    <>
      {!apiDevices && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <CircularProgress />
        </Box>
      )}
      <AlarmNotification onFilterChange={handleFilterChange} />
      <DeviceSidebar
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        filteredDevices={filteredDevices}
        filterState={filterState}
        onFilterChange={handleFilterChange}
        onSelectDevice={setSelectedDevice}
        handleShowDeviceGraph={handleShowDeviceGraph}
      />
      <GraphDrawer
        device={selectedDeviceForGraph}
        deviceId={graphDeviceId}
        deviceName={deviceName}
        open={graphDeviceId !== null}
        onClose={() => setGraphDeviceId(null)}
      />

      <MapControls
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <Box
        sx={{ flexGrow: 1, position: 'relative', ml: isSidebarOpen ? 8 : 0 }}
      >
        <MapContainer
          center={DEFAULT_MAP_CENTER}
          zoomControl={false}
          style={MAP_STYLE}
          ref={handleMapRef}
        >
          <LayersControl position='topright'>
            {/* Capas base */}
            {MAP_LAYERS.baseLayers.map((layer, index) => (
              <LayersControl.BaseLayer
                key={index}
                name={layer.name}
                checked={layer.checked}
              >
                <TileLayer attribution={layer.attribution} url={layer.url} />
              </LayersControl.BaseLayer>
            ))}

            {/* Capas overlay */}
            {MAP_LAYERS.overlays.map((layer, index) => (
              <LayersControl.Overlay key={index} name={layer.name}>
                <TileLayer attribution={layer.attribution} url={layer.url} />
              </LayersControl.Overlay>
            ))}
          </LayersControl>
          <ZoomControl position='bottomright' />
          <DeviceMapController selectedDevice={selectedDevice} />

          <MarkerClusterGroup
            chunkedLoading
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            maxClusterRadius={40}
          >
            <DeviceMarkers
              devices={filteredDevices}
              onSelect={(device) => {
                setSelectedDevice(device)
                // Lógica adicional al seleccionar dispositivo
              }}
              isSelected={selectedDevice?.id === graphDeviceId}
              onViewDetails={handleShowDeviceGraph}
            />
          </MarkerClusterGroup>
        </MapContainer>
      </Box>
    </>
  )
}

export default DeviceIotMap
