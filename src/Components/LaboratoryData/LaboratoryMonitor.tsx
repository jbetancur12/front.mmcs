import React, { useState, useEffect, useMemo } from 'react'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'

import Box from '@mui/material/Box'
import AddIcon from '@mui/icons-material/Add'

import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
// Importaciones para la tabla de estadísticas
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'

// Importar useQuery, useQueryClient
import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private' // Tu hook de Axios privado

// Importar componentes hijos y hook de WebSocket
import SensorCard from './SensorCard' // Asegúrate que la ruta sea correcta
import AddSensorModal from './AddSensorModal'
import EditSensorModal from './EditSensorModal' // Importar modal editar
import DeleteConfirmDialog from './DeleteConfirmDialog' // Importar diálogo eliminar
import useWebSocket from '@utils/use-websockets' // Asegúrate que esta ruta sea correcta
import { format, subDays } from 'date-fns' // Añadir parseISO si es necesario
import { Checkbox, FormControlLabel, FormGroup, Grid } from '@mui/material'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import HistoricalCharts from './HistoricalCharts'

// --- INTERFACES (MANTENEMOS LAS EXISTENTES Y AÑADIMOS NUEVAS) ---

// Interfaz para los datos del sensor (sin cambios)
export interface ApiDeviceData {
  id: number
  name: string
  location: string | null
  lastTemperature: number | null
  lastHumidity: number | null
  lastSeen: string | null | undefined
  color: string | null
  createdAt?: string
  updatedAt?: string
}

// Interfaz para el estado del dispositivo de WebSocket (sin cambios)
interface WebSocketDeviceState {
  id: number
  name: string
  lastTemperature: number | null
  lastHumidity: number | null
  lastSeen: string | null | undefined
  location?: string | null
  color?: string | null
}

// Interfaz para UN punto de dato histórico crudo (sin cambios)
interface RawHistoricalDataPoint {
  id: number
  temperature: number | null // Permitir null si la BD lo permite
  humidity: number | null // Permitir null
  timestamp: string // ISO string
  deviceLaboratoryId: number
  deviceLaboratory: {
    id: number
    name: string
    location: string | null
    color: string | null
  }
  createdAt: string
  updatedAt: string
}

// Interfaz para los datos procesados para Recharts (sin cambios)
interface ChartDataPoint {
  timestamp: string
  [key: string]: any
}

// --- NUEVAS INTERFACES ---

// Interfaz para las estadísticas calculadas de UN sensor
export interface SensorStatistics {
  id: number
  name: string
  location: string | null
  color: string | null
  minTemp: number | null
  maxTemp: number | null
  avgTemp: number | null
  minHum: number | null
  maxHum: number | null
  avgHum: number | null
  // Podríamos añadir countTemp, countHum si son útiles en el frontend
}

// Interfaz para la respuesta COMPLETA de la API de datos históricos
interface HistoricalApiResponse {
  historicalData: RawHistoricalDataPoint[]
  statistics: {
    // La clave es el ID del sensor (como string o number, depende de JS/JSON)
    // Usaremos number aquí para consistencia con los IDs
    [sensorId: number]: SensorStatistics
  }
}

// --- COMPONENTE ---

const LaboratoryMonitor: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const { lastMessage } = useWebSocket()

  // Estados de modales/diálogos (sin cambios)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [sensorToEdit, setSensorToEdit] = useState<ApiDeviceData | null>(null)
  const [sensorToDeleteId, setSensorToDeleteId] = useState<number | null>(null)

  // Estados para la sección histórica (sin cambios)
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    subDays(new Date(), 1)
  )
  const [selectedSensorIds, setSelectedSensorIds] = useState<number[]>([])

  // Query para la lista inicial de dispositivos (sin cambios)
  const {
    isLoading: isLoadingDevices, // Renombrar para claridad
    isError: isErrorDevices, // Renombrar
    data: initialDevices,
    error: errorDevices, // Renombrar
    refetch: refetchDevices // Renombrar
  } = useQuery<ApiDeviceData[], Error>({
    queryKey: ['laboratoryDevices'],
    queryFn: async () =>
      axiosPrivate.get('/laboratory/devices').then((res) => res.data)
  })

  // Estado local para dispositivos mostrados (sin cambios)
  const [displayedDevices, setDisplayedDevices] = useState<ApiDeviceData[]>([])

  // Efecto para inicializar/actualizar displayedDevices desde useQuery (sin cambios)
  useEffect(() => {
    if (initialDevices !== undefined) {
      setDisplayedDevices(initialDevices)
    }
  }, [initialDevices])

  // Efecto para manejar WebSocket (sin cambios, excepto usar refetchDevices)
  useEffect(() => {
    if (lastMessage && lastMessage.type === 'LABORATORY_DATA') {
      console.log(
        'Received LABORATORY_DATA WebSocket message:',
        lastMessage.data
      )
      const updatedDeviceState: WebSocketDeviceState =
        lastMessage.data?.deviceState

      if (!updatedDeviceState || updatedDeviceState.id === undefined) {
        console.warn(
          'Received LABORATORY_DATA message with missing or invalid deviceState payload.',
          lastMessage.data
        )
        return
      }

      setDisplayedDevices((prevDevices) => {
        const deviceIndex = prevDevices.findIndex(
          (d) => d.id === updatedDeviceState.id
        )

        if (deviceIndex === -1) {
          console.warn(
            `WebSocket update for unknown DeviceLaboratory ID: ${updatedDeviceState.id}. Refetching list.`
          )
          refetchDevices() // Usar refetch de la query de dispositivos
          return prevDevices
        }

        const newDevices = [...prevDevices]
        const deviceToUpdate = { ...newDevices[deviceIndex] }

        deviceToUpdate.lastTemperature =
          updatedDeviceState.lastTemperature ?? deviceToUpdate.lastTemperature
        deviceToUpdate.lastHumidity =
          updatedDeviceState.lastHumidity ?? deviceToUpdate.lastHumidity
        deviceToUpdate.lastSeen =
          updatedDeviceState.lastSeen ?? deviceToUpdate.lastSeen
        deviceToUpdate.location =
          updatedDeviceState.location ?? deviceToUpdate.location
        deviceToUpdate.color = updatedDeviceState.color ?? deviceToUpdate.color

        newDevices[deviceIndex] = deviceToUpdate
        console.log(
          `Updated state for device ID "${updatedDeviceState.id}" via WebSocket.`
        )
        return newDevices
      })
    }
  }, [lastMessage, refetchDevices]) // Depender de refetchDevices

  // --- Query para Datos Históricos (MODIFICADA) ---
  const {
    isLoading: isLoadingHistory,
    isError: isErrorHistory,
    // Ahora 'data' contiene el objeto { historicalData, statistics }
    data: historicalApiResponse,
    error: errorHistory

    // El tipo genérico ahora es HistoricalApiResponse
  } = useQuery<HistoricalApiResponse, Error>({
    queryKey: [
      'laboratoryHistoricalData',
      selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
      selectedSensorIds.sort().join(',')
    ], // Ordenar IDs para consistencia de la key
    queryFn: async () => {
      if (!selectedDate || selectedSensorIds.length === 0) {
        // Devolver una estructura válida vacía si no se debe fetchear
        return { historicalData: [], statistics: {} }
      }
      const dateString = format(selectedDate, 'yyyy-MM-dd')
      const sensorIdsString = selectedSensorIds.join(',')

      const response = await axiosPrivate.get(
        `/laboratory/historical-data?date=${dateString}&sensorIds=${sensorIdsString}`
      )
      // response.data debería ser { historicalData: [...], statistics: {...} }
      return response.data
    },
    enabled: !!selectedDate && selectedSensorIds.length > 0,
    staleTime: 5 * 60 * 1000
    // keepPreviousData: true, // Opcional: Muestra datos viejos mientras carga los nuevos
  })

  // --- Extraer datos del resultado de la query ---
  const rawHistoricalData = historicalApiResponse?.historicalData
  const statisticsData = historicalApiResponse?.statistics

  // --- Procesar datos históricos para Recharts (Adaptado) ---
  const processedHistoricalData = useMemo(() => {
    // Ahora depende de 'rawHistoricalData' extraído de la respuesta
    if (!rawHistoricalData || rawHistoricalData.length === 0) {
      return []
    }

    const dataMap = new Map<string, ChartDataPoint>()

    rawHistoricalData.forEach((point) => {
      const timestampKey = point.timestamp
      if (!dataMap.has(timestampKey)) {
        dataMap.set(timestampKey, { timestamp: timestampKey })
      }
      const dataPoint = dataMap.get(timestampKey)!

      // Añadir solo si los valores no son null
      if (point.temperature !== null) {
        dataPoint[`temp_${point.deviceLaboratoryId}`] = point.temperature
      }
      if (point.humidity !== null) {
        dataPoint[`hum_${point.deviceLaboratoryId}`] = point.humidity
      }
    })

    const processedArray = Array.from(dataMap.values())
    processedArray.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
    return processedArray
    // La dependencia es 'rawHistoricalData'
  }, [rawHistoricalData])

  // Handlers de Modales/Diálogos (sin cambios)
  const handleOpenAddModal = () => setIsAddModalOpen(true)
  const handleOpenEditModal = (sensor: ApiDeviceData) => {
    setSensorToEdit(sensor)
    setIsEditModalOpen(true)
  }
  const handleOpenDeleteDialog = (sensorId: number) => {
    setSensorToDeleteId(sensorId)
    setIsDeleteDialogOpen(true)
  }
  const handleCloseAddModal = () => setIsAddModalOpen(false)
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSensorToEdit(null)
  }
  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setSensorToDeleteId(null)
  }
  const handleSensorAdded = (newSensor: ApiDeviceData) => {
    console.log('Sensor successfully added via modal:', newSensor)
    // Refetch de dispositivos o invalidación de caché maneja la actualización
  }
  const handleSensorUpdated = (updatedSensor: ApiDeviceData) => {
    console.log('Sensor successfully updated via modal:', updatedSensor)
    // Refetch de dispositivos o invalidación de caché maneja la actualización
  }
  const handleSensorDeleted = (deletedSensorId: number) => {
    console.log('Sensor successfully deleted via dialog:', deletedSensorId)
    // Refetch de dispositivos o invalidación de caché maneja la actualización
  }

  // Handlers para Históricos (sin cambios)
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date)
  }
  const handleSensorCheckboxChange = (sensorId: number, checked: boolean) => {
    setSelectedSensorIds((prevIds) => {
      if (checked) {
        return [...prevIds, sensorId]
      } else {
        return prevIds.filter((id) => id !== sensorId)
      }
    })
  }

  // --- Helper para formatear valores estadísticos ---
  const formatStatValue = (value: number | null, unit: string): string => {
    if (value === null || value === undefined || isNaN(value)) {
      return 'N/A'
    }
    return `${value.toFixed(2)} ${unit}`
  }

  // --- Renderizado ---
  if (isLoadingDevices) {
    // Carga inicial de la lista de sensores
    return (
      <Box className='flex justify-center items-center h-64'>
        <CircularProgress />
        <Typography className='ml-4'>Cargando sensores...</Typography>
      </Box>
    )
  }

  if (isErrorDevices) {
    // Error en carga inicial de sensores
    return (
      <Box className='p-6'>
        <Alert severity='error'>
          Error al cargar los sensores:{' '}
          {errorDevices?.message || 'Error desconocido'}
        </Alert>
        <Button onClick={() => refetchDevices()} className='mt-4'>
          Reintentar Carga
        </Button>
      </Box>
    )
  }

  // Render principal si la lista de sensores cargó
  return (
    <div className='container mx-auto p-6'>
      {/* Cabecera: Título, Agregar Sensor */}
      <Box className='flex justify-between items-center mb-8'>
        <Typography
          variant='h4'
          component='h1'
          className='font-bold text-gray-800'
        >
          Monitoreo de Laboratorio
        </Typography>
        <Box className='flex items-center space-x-4'>
          <Button
            variant='contained'
            startIcon={<AddIcon />}
            onClick={handleOpenAddModal}
            className='bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded normal-case'
          >
            Agregar Sensor
          </Button>
        </Box>
      </Box>
      {/* Lista de Tarjetas (sin cambios) */}
      {displayedDevices.length === 0 && !isLoadingDevices ? (
        <Typography>No hay sensores de laboratorio creados.</Typography>
      ) : (
        <Box className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
          {displayedDevices.map((device) => {
            return (
              <SensorCard
                key={device.id}
                sensor={{
                  // Asegúrate que SensorCard espera esta estructura o ajusta
                  id: device.id,
                  name: device.name,
                  location: device.location || 'N/A',
                  lastTemperature: device.lastTemperature, // Pasar null si es null
                  lastHumidity: device.lastHumidity, // Pasar null si es null
                  lastSeen: device.lastSeen,
                  color: device.color || '#8884d8' // Un color por defecto
                }}
                onEditClick={handleOpenEditModal}
                onDeleteClick={handleOpenDeleteDialog}
              />
            )
          })}
        </Box>
      )}
      {/* --- Sección de Históricos --- */}
      <Box className='mt-12'>
        <Paper
          elevation={1}
          sx={{
            p: 1.5, // Padding interno reducido
            mb: 3, // Margen inferior para separarlo del título "Datos Históricos"
            border: '1px solid', // Borde general
            borderColor: 'divider'
          }}
        >
          <Grid container spacing={0} mb={4}>
            {' '}
            {/* Sin espaciado entre items del Grid */}
            {/* Columna Izquierda: Información del Documento */}
            <Grid
              item
              xs={3}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Box
                sx={{
                  p: 0.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography
                  variant='caption'
                  component='div'
                  sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}
                >
                  CÓDIGO: FOT-MMCS-13
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 0.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography
                  variant='caption'
                  component='div'
                  sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}
                >
                  VERSIÓN: 04
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 0.5,
                  borderBottom: '1px solid',
                  borderColor: 'divider'
                }}
              >
                <Typography
                  variant='caption'
                  component='div'
                  sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}
                >
                  FECHA: 2019-12-28
                </Typography>
              </Box>
              <Box sx={{ p: 0.5 }}>
                <Typography
                  variant='caption'
                  component='div'
                  sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}
                >
                  PÁGINA 1 de 2
                </Typography>
              </Box>
            </Grid>
            {/* Columna Central: Títulos */}
            <Grid
              item
              xs={6}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center', // Centrar verticalmente el contenido
                borderRight: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Box
                sx={{
                  textAlign: 'center',
                  p: 0.5,
                  borderTop: '1px solid',
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  height: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  variant='subtitle2'
                  component='div'
                  sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  METROMEDICS
                </Typography>
              </Box>
              <Box
                sx={{
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  textAlign: 'center',
                  p: 0.5,
                  height: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography
                  variant='subtitle2'
                  component='div'
                  sx={{ fontWeight: 'bold', fontSize: '0.8rem' }}
                >
                  CONTROL DE CONDICIONES AMBIENTALES
                </Typography>
              </Box>
            </Grid>
            {/* Columna Derecha: Logo */}
            <Grid
              item
              xs={3}
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRight: '1px solid',
                borderTop: '1px solid',
                borderBottom: '1px solid',
                borderColor: 'divider',
                p: 0.5
              }}
            >
              {/* Asume que tienes una imagen de logo en tu carpeta public o src/assets */}
              <img
                src='/images/logo2.png' // ¡CAMBIA ESTA RUTA!
                alt='Metromedics Logo'
                style={{ maxHeight: '50px', width: 'auto' }} // Ajusta el tamaño según sea necesario
              />
            </Grid>
          </Grid>

          <Box className='flex justify-between items-center mb-4'>
            <Typography
              variant='h5'
              component='h2'
              className='font-bold text-gray-800'
            >
              Datos Históricos
            </Typography>
            <Box className='flex items-center space-x-4'>
              {/* Selector de Fecha */}
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label='Seleccionar Día'
                  value={selectedDate}
                  onChange={handleDateChange}
                  maxDate={new Date()}
                  slotProps={{ textField: { size: 'small' } }}
                />
              </LocalizationProvider>
              {/* Botón Descargar Reporte */}
            </Box>
          </Box>

          {/* Checkboxes para seleccionar sensores (sin cambios) */}
          {displayedDevices.length > 0 && (
            <Box className='mb-4'>
              <Typography variant='subtitle1' className='mb-2'>
                Seleccionar Sensores para Graficar:
              </Typography>
              <FormGroup row>
                {displayedDevices.map((device) => (
                  <FormControlLabel
                    key={device.id}
                    control={
                      <Checkbox
                        checked={selectedSensorIds.includes(device.id)}
                        onChange={(e) =>
                          handleSensorCheckboxChange(
                            device.id,
                            e.target.checked
                          )
                        }
                      />
                    }
                    label={`${device.name} (${device.location || 'N/A'})`}
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          {/* Componente de Gráficas Históricas (sin cambios en props) */}
          {/* Mostrar solo si hay IDs seleccionados para evitar renderizado innecesario */}
          {selectedSensorIds.length > 0 && (
            <HistoricalCharts
              data={processedHistoricalData}
              // Pasar info de los sensores seleccionados para la leyenda/tooltips
              sensors={displayedDevices.filter((device) =>
                selectedSensorIds.includes(device.id)
              )}
              isLoading={isLoadingHistory} // Pasar estado de carga de históricos
              isError={isErrorHistory} // Pasar estado de error de históricos
              errorMessage={errorHistory?.message} // Pasar mensaje de error
            />
          )}
          {/* Mensaje si no se han seleccionado sensores */}
          {selectedSensorIds.length === 0 && selectedDate && (
            <Typography className='mt-4 italic'>
              Seleccione al menos un sensor para ver los datos históricos.
            </Typography>
          )}

          {/* --- NUEVA SECCIÓN: Tabla de Estadísticas --- */}
          {/* Mostrar solo si la carga de históricos terminó, no hay error, y hay estadísticas */}
          {!isLoadingHistory &&
            !isErrorHistory &&
            statisticsData &&
            selectedSensorIds.length > 0 && (
              <Box sx={{ mt: 4 }}>
                {' '}
                {/* Más margen superior */}
                <Typography
                  variant='h6'
                  component='h3'
                  sx={{ mb: 2, fontWeight: '600', color: 'text.primary' }}
                >
                  {' '}
                  {/* Título más prominente */}
                  Resumen Estadístico (
                  {selectedDate
                    ? format(selectedDate, 'yyyy-MM-dd')
                    : 'Fecha no seleccionada'}
                  )
                </Typography>
                {/* Mostrar tabla solo si hay claves en statisticsData */}
                {statisticsData && Object.keys(statisticsData).length > 0 ? (
                  <TableContainer
                    component={Paper}
                    elevation={2} // Sombra sutil
                    sx={{ borderRadius: '8px', overflowX: 'auto' }} // Bordes redondeados y scroll horizontal
                  >
                    <Table
                      aria-label='tabla de estadísticas moderna'
                      size='medium'
                    >
                      <TableHead>
                        {/* Encabezado con borde inferior y texto capitalizado */}
                        <TableRow
                          sx={{
                            '& th': {
                              fontWeight: 'bold',
                              color: 'text.secondary',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              borderBottom: '1px solid',
                              borderColor: 'divider',
                              py: 1,
                              px: 2,
                              backgroundColor: 'background.paper'
                            }
                          }}
                        >
                          <TableCell>Sensor</TableCell>
                          <TableCell align='right'>Temp Min (°C)</TableCell>
                          <TableCell align='right'>Temp Max (°C)</TableCell>
                          <TableCell align='right'>Temp Prom (°C)</TableCell>
                          <TableCell align='right'>Hum Min (%)</TableCell>
                          <TableCell align='right'>Hum Max (%)</TableCell>
                          <TableCell align='right'>Hum Prom (%)</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {/* Iterar sobre los IDs de los sensores SELECCIONADOS */}
                        {selectedSensorIds.map((sensorId) => {
                          const stats = statisticsData[sensorId]
                          if (!stats) return null // Omitir si no hay datos

                          return (
                            <TableRow
                              key={stats.id}
                              sx={{
                                '&:hover': {
                                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                                }, // Hover más sutil
                                '& td, & th': { py: 1.5, px: 2 }, // Padding consistente
                                // Quitar borde inferior de la última fila para limpieza
                                '&:last-child td, &:last-child th': {
                                  borderBottom: 0
                                }
                              }}
                            >
                              {/* Celda del Sensor con nombre y ubicación */}
                              <TableCell
                                component='th'
                                scope='row'
                                sx={{
                                  fontWeight: '500',
                                  color: 'text.primary'
                                }}
                              >
                                {stats.name}
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                  component='span'
                                  sx={{ display: 'block', fontSize: '0.8rem' }}
                                >
                                  ({stats.location || 'N/A'})
                                </Typography>
                              </TableCell>
                              {/* Celdas de datos */}
                              <TableCell align='right'>
                                {formatStatValue(stats.minTemp, '°C')}
                              </TableCell>
                              <TableCell align='right'>
                                {formatStatValue(stats.maxTemp, '°C')}
                              </TableCell>
                              <TableCell align='right'>
                                {formatStatValue(stats.avgTemp, '°C')}
                              </TableCell>
                              <TableCell align='right'>
                                {formatStatValue(stats.minHum, '%')}
                              </TableCell>
                              <TableCell align='right'>
                                {formatStatValue(stats.maxHum, '%')}
                              </TableCell>
                              <TableCell align='right'>
                                {formatStatValue(stats.avgHum, '%')}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  // Mensaje si no hay estadísticas (pero la carga fue exitosa)
                  <Typography
                    sx={{ mt: 2, fontStyle: 'italic', color: 'text.secondary' }}
                  >
                    No se encontraron datos estadísticos para la selección
                    actual. Puede que no haya habido lecturas en este día.
                  </Typography>
                )}
              </Box>
            )}
          {/* Mostrar indicador de carga o error específico para históricos */}
          {isLoadingHistory && selectedSensorIds.length > 0 && (
            <Box className='flex justify-center items-center h-32'>
              <CircularProgress size={24} />
              <Typography className='ml-2'>
                Cargando datos históricos...
              </Typography>
            </Box>
          )}
          {isErrorHistory && selectedSensorIds.length > 0 && (
            <Alert severity='error' className='mt-4'>
              Error al cargar datos históricos:{' '}
              {errorHistory?.message || 'Error desconocido'}
            </Alert>
          )}
        </Paper>
      </Box>{' '}
      {/* Fin Sección Históricos */}
      {/* Modales y Diálogos (sin cambios) */}
      <AddSensorModal
        open={isAddModalOpen}
        onClose={handleCloseAddModal}
        onSensorAdded={handleSensorAdded}
      />
      <EditSensorModal
        open={isEditModalOpen}
        onClose={handleCloseEditModal}
        sensorData={sensorToEdit}
        onSensorUpdated={handleSensorUpdated}
      />
      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        sensorId={sensorToDeleteId}
        sensorName={
          displayedDevices.find((d) => d.id === sensorToDeleteId)?.name || null
        }
        onSensorDeleted={handleSensorDeleted}
      />
    </div> // Fin container principal
  )
}

export default LaboratoryMonitor
