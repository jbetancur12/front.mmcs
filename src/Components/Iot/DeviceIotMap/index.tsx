// components/DeviceIotMap/index.tsx
import 'leaflet/dist/leaflet.css'
import { useStore } from '@nanostores/react'
import { Box, CircularProgress } from '@mui/material'
import { MapContainer, TileLayer } from 'react-leaflet'
import { DeviceSidebar } from './sidebar'

import { $devicesIot, loadDevices } from 'src/store/deviceIotStore'
import { DEFAULT_MAP_CENTER, MAP_STYLE } from './constants'
import { Device } from './types'
import { useMapSetup } from './hooks/useMapSetup'
import { useEffect, useState } from 'react'
import { useDeviceData } from './hooks/useDeviceData'
import { MapControls } from './parts/MapControls'
import { DeviceMapController } from './parts/DeviceMapController'
import { DeviceMarkers } from './parts/DeviceMarkers'
import { DeviceIot } from '../types'
import useAxiosPrivate from '@utils/use-axios-private'
import { useQuery } from 'react-query'
import { transformDevice } from './utils/transformDevice'
import GraphDrawer from '../GraphDrawer'

const DeviceIotMap = () => {
  const devices = useStore($devicesIot)

  const axiosPrivate = useAxiosPrivate()
  const { handleMapRef, isSidebarOpen, toggleSidebar } = useMapSetup()
  const { filteredDevices, filterState, handleFilterChange } =
    useDeviceData(devices)
  const [selectedDevice, setSelectedDevice] = useState<DeviceIot | null>(null)
  const [graphDeviceId, setGraphDeviceId] = useState<number | string | null>(
    null
  )
  const [deviceName, setDeviceName] = useState<string>('')

  const { data: apiDevices } = useQuery(
    'devices',
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
      <DeviceSidebar
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        devices={filteredDevices}
        filterState={filterState}
        onFilterChange={handleFilterChange}
        onSelectDevice={setSelectedDevice}
        handleShowDeviceGraph={handleShowDeviceGraph}
      />
      <GraphDrawer
        deviceId={graphDeviceId}
        deviceName={deviceName}
        open={graphDeviceId !== null}
        onClose={() => setGraphDeviceId(null)}
        devicesFromApi={devices}
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
          zoom={3}
          style={MAP_STYLE}
          ref={handleMapRef}
        >
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='&copy; OpenStreetMap contributors'
          />
          <DeviceMapController
            devices={devices}
            selectedDevice={selectedDevice}
          />
          <DeviceMarkers
            devices={filteredDevices}
            onSelect={(device) => {
              setSelectedDevice(device)
              // Lógica adicional al seleccionar dispositivo
            }}
          />
        </MapContainer>
      </Box>
    </>
  )
}

export default DeviceIotMap
