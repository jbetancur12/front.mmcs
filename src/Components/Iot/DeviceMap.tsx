import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L, { Map } from 'leaflet'
import { useStore } from '@nanostores/react'
import { $devicesIot, loadDevices } from 'src/store/deviceIotStore'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Drawer,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  TextField,
  Typography
} from '@mui/material'
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  MyLocation,
  BarChart
} from '@mui/icons-material'
import GraphDrawer from './GraphDrawer'

const createSvgIcon = (color: string) => {
  const svg = `
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.59644 0 0 5.59644 0 12.5C0 22.5 12.5 41 12.5 41C12.5 41 25 22.5 25 12.5C25 5.59644 19.4036 0 12.5 0Z" fill="currentColor"/>
    </svg>
  `

  return L.divIcon({
    className: 'custom-marker-icon',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    // Aplica el color usando inline style en el contenedor
    // Nota: Esto agregará un style directamente al div que envuelve el SVG
    // Si prefieres usar clases CSS, puedes definir estilos para .custom-marker-icon.online y .custom-marker-icon.offline
    // y asignar la clase adecuada.
    html: `<div style="color: ${color};">${svg}</div>`
  })
}

const createDeviceIcon = (
  powerSource: 'main' | 'bat',
  alarm: boolean,
  isOnline: boolean
) => {
  // Si está offline, usamos un color gris (por ejemplo, "#9E9E9E")
  if (!isOnline) {
    return createSvgIcon('#9E9E9E')
  }

  // Si está online, definimos el color según la fuente y si hay alarma:
  // Si está conectado a la corriente ('main'):
  //   - Sin alarmas: verde (#4CAF50)
  //   - Con alarmas: rojo (#F44336)
  // Si está en batería ('bat'):
  //   - Sin alarmas: azul (#2196F3)
  //   - Con alarmas: naranja (#FF9800)
  let color = ''
  if (powerSource === 'main') {
    color = alarm ? '#F44336' : '#4CAF50'
  } else if (powerSource === 'bat') {
    color = alarm ? '#F44336' : '#2196F3'
  }
  return createSvgIcon(color)
}

// Función para transformar el dispositivo recibido de la API
const transformDevice = (device: any) => {
  const [lng, lat] = device.lastLocation.coordinates
  return {
    id: device.id,
    imei: device.imei,
    name: device.name,
    lastLocation: { lat, lng },
    lastSeen: new Date(device.lastSeen),
    status: device.isOnline ? 'online' : 'offline',
    customer: device.customer,
    isOnline: device.isOnline,
    src: device.src,
    sensorData: device.sensorData // Asegúrate de tener este campo o ajusta según corresponda
  }
}

// Componente que ajusta los límites del mapa según todos los dispositivos
const FitBounds = ({ devices }: { devices: any[] }) => {
  const map = useMap()

  useEffect(() => {
    if (devices.length > 0) {
      const bounds = L.latLngBounds(
        devices.map(
          (device) =>
            [device.lastLocation.lat, device.lastLocation.lng] as [
              number,
              number
            ]
        )
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [devices, map])

  return null
}

const DeviceIotMap = () => {
  const axiosPrivate = useAxiosPrivate()
  const devicesIot = useStore($devicesIot)

  const mapRef = useRef<Map | null>(null)

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(
    new Set(['online'])
  )
  const [selectedPowerSources, setSelectedPowerSources] = useState<Set<string>>(
    new Set(['main', 'bat'])
  )
  const [selectedDeviceId, setSelectedDeviceId] = useState<
    number | string | null
  >(null)

  // Estado para abrir el Drawer de la gráfica
  const [graphDeviceId, setGraphDeviceId] = useState<number | string | null>(
    null
  )

  const DefaultIcon = L.icon({
    iconUrl: '/images/location.png',
    iconSize: [25, 41]
  })

  const onlineIcon = createSvgIcon('#4CAF50') // verde para online
  const offlineIcon = createSvgIcon('#F44336') // rojo para offline

  L.Marker.prototype.options.icon = DefaultIcon

  const {
    data: devicesFromApi,
    isLoading,
    error
  } = useQuery(
    'devices',
    async () => {
      const response = await axiosPrivate.get('/devicesIot')
      return response.data.map(transformDevice)
    },
    {
      refetchOnWindowFocus: false
    }
  )

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current

      setTimeout(() => {
        map.invalidateSize()
      }, 300) // Ajusta el tiempo según sea necesario
    }
  }, [isSidebarOpen])

  // Al obtener los dispositivos, actualizamos el store
  useEffect(() => {
    if (devicesFromApi) {
      loadDevices(devicesFromApi)
    }
  }, [devicesFromApi])

  // Define un centro por defecto en caso de que no haya dispositivos
  const defaultCenter: [number, number] = [-12.046373, -77.042754]

  const MapCenterer = ({ deviceId }: { deviceId: number | string | null }) => {
    const map = useMap()

    useEffect(() => {
      if (deviceId && devicesIot) {
        const device = devicesIot.find((d) => d.id === deviceId)
        if (device) {
          map.flyTo([device.lastLocation.lat, device.lastLocation.lng], 10)
        }
      }
    }, [deviceId])

    return null
  }

  // Filtrado combinado
  const filteredDevices = useMemo(() => {
    return devicesIot.filter((device) => {
      const matchesSearch = device.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
      const matchesStatus = selectedStatuses.has(
        device.isOnline ? 'online' : 'offline'
      )
      const matchesPowerSource = selectedPowerSources.has(device.src)

      return matchesSearch && matchesStatus && matchesPowerSource
    })
  }, [devicesIot, searchQuery, selectedStatuses, selectedPowerSources])

  // Manejadores de filtros
  const handleStatusChange = (status: string) => {
    const newStatuses = new Set(selectedStatuses)
    newStatuses.has(status)
      ? newStatuses.delete(status)
      : newStatuses.add(status)
    setSelectedStatuses(newStatuses)
  }

  const handlePowerSourceChange = (source: string) => {
    const newSources = new Set(selectedPowerSources)
    newSources.has(source) ? newSources.delete(source) : newSources.add(source)
    setSelectedPowerSources(newSources)
  }

  return (
    <>
      <Drawer
        variant='persistent'
        open={isSidebarOpen}
        onTransitionEnd={() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize()
          }
        }}
        sx={{
          width: isSidebarOpen ? 320 : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 320,
            boxSizing: 'border-box',
            mt: 8
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant='h6'>Dispositivos</Typography>
            <IconButton onClick={() => setIsSidebarOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          <TextField
            fullWidth
            label='Buscar dispositivos'
            variant='outlined'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Box sx={{ mb: 3 }}>
            <Typography variant='subtitle1'>Estado:</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedStatuses.has('online')}
                  onChange={() => handleStatusChange('online')}
                />
              }
              label='Online'
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedStatuses.has('offline')}
                  onChange={() => handleStatusChange('offline')}
                />
              }
              label='Offline'
            />
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant='subtitle1'>Fuente de poder:</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedPowerSources.has('main')}
                  onChange={() => handlePowerSourceChange('main')}
                />
              }
              label='Corriente principal'
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={selectedPowerSources.has('bat')}
                  onChange={() => handlePowerSourceChange('bat')}
                />
              }
              label='Batería'
            />
          </Box>

          <List sx={{ overflow: 'auto', maxHeight: '400px' }}>
            {filteredDevices.map((device) => (
              <ListItem
                key={device.id}
                button
                selected={selectedDeviceId === device.id}
              >
                <ListItemText
                  primary={device.name}
                  secondary={`Última actualización: ${new Date(device.lastSeen).toLocaleString()}`}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton onClick={() => setSelectedDeviceId(device.id)}>
                    <MyLocation />
                  </IconButton>
                  <IconButton onClick={() => setGraphDeviceId(device.id)}>
                    <BarChart />
                  </IconButton>
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* <GraphDrawer
        deviceId={graphDeviceId}
        open={graphDeviceId !== null}
        onClose={() => setGraphDeviceId(null)}
      /> */}

      <Box
        sx={{ flexGrow: 1, position: 'relative', ml: isSidebarOpen ? 8 : 0 }}
      >
        {!isSidebarOpen && (
          <IconButton
            sx={{
              position: 'absolute',
              borderRadius: 0,
              width: 30,
              border: '2px solid rgba(0,0,0,0.2)',
              height: 30,
              lineHeight: 30,
              left: 12,
              top: 88,
              backgroundColor: '#fff',
              zIndex: 1300 // Asegura que el botón esté por encima de otros elementos
            }}
            onClick={() => setIsSidebarOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        )}

        <MapContainer
          center={defaultCenter}
          zoom={3}
          style={{ height: '80vh', width: '100%' }}
          ref={(mapInstance) => {
            mapRef.current = mapInstance
            if (mapInstance) {
              setTimeout(() => {
                mapInstance.invalidateSize()
              }, 300)
            }
          }}
        >
          <TileLayer
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
            attribution='&copy; OpenStreetMap contributors'
          />
          {/* Ajusta el mapa para que muestre todos los dispositivos */}
          <FitBounds devices={devicesIot} />
          <MapCenterer deviceId={selectedDeviceId} />
          {filteredDevices.map((deviceIot) => {
            return (
              <Marker
                key={deviceIot.id}
                position={[
                  deviceIot.lastLocation.lat,
                  deviceIot.lastLocation.lng
                ]}
                icon={createDeviceIcon(
                  deviceIot.src,
                  false,
                  deviceIot.isOnline
                )}
                eventHandlers={{
                  click: () => setSelectedDeviceId(deviceIot.id)
                }}
              >
                <Popup>
                  <Card sx={{ minWidth: 200 }}>
                    <CardContent>
                      <Typography variant='h6' component='div' gutterBottom>
                        {deviceIot.name}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Última actualización:{' '}
                        {new Date(deviceIot.lastSeen).toLocaleString()}
                      </Typography>
                      <Typography variant='body2' color='text.secondary'>
                        Estado: {deviceIot.status}
                      </Typography>
                      <Box mt={1}>
                        <Typography variant='body2' color='text.secondary'>
                          t: {deviceIot?.sensorData?.t || 0} °C
                        </Typography>
                        <Typography variant='body2' color='text.secondary'>
                          h: {deviceIot?.sensorData?.h || 0} %
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Popup>
              </Marker>
            )
          })}
        </MapContainer>
      </Box>
    </>
  )
}

export default DeviceIotMap
