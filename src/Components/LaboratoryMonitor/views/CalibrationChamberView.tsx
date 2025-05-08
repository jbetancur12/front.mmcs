import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { useQuery, useMutation, useQueryClient, QueryKey } from 'react-query' // Import QueryKey for React Query v3

import {
  Chamber,
  Pattern,
  Sensor,
  SensorType,
  SensorSummaryViewData
} from '../types' // Tus tipos
// Ajusta las rutas a tus componentes si están en subdirectorios diferentes
import { ChamberTabs } from '../ChamberTabs'
import { ChamberDetails } from '../ChamberDetails'
import { AddChamberModal } from '../AddChamberModal'

// Importar funciones de API
import {
  fetchChambers as apiFetchChambers,
  createChamber as apiCreateChamber,
  updateChamber as apiUpdateChamber,
  // deleteChamber as apiDeleteChamber, // Descomenta si implementas la función de eliminar cámara
  createPattern as apiCreatePattern,
  deletePattern as apiDeletePattern,
  createSensor as apiCreateSensor,
  deleteSensor as apiDeleteSensor
} from '../services/calibrationApi'
import useAxiosPrivate from '@utils/use-axios-private'
import { useCalibrationRealtimeUpdates } from '@utils/useCalibrationRealtimeUpdates'

// Función para generar el resumen de sensores
export const generateSensorSummary = (
  patterns: Pattern[]
): SensorSummaryViewData[] => {
  const summary: SensorSummaryViewData[] = []
  if (!patterns) return summary
  patterns.forEach((pattern) => {
    ;(pattern.sensors || []).forEach((sensor) => {
      summary.push({
        sensorId: sensor.id,
        patternName: pattern.name,
        sensorName: sensor.name,
        sensorType: sensor.type,
        latestTemperature: sensor.lastTemperature,
        averageTemperature: undefined, // El backend no calcula promedios por defecto
        latestHumidity: sensor.lastHumidity,
        averageHumidity: undefined
      })
    })
  })
  return summary
}

const CalibrationChamberView: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  useCalibrationRealtimeUpdates()

  const [selectedChamberId, setSelectedChamberId] = useState<
    string | number | null
  >(null) // ID puede ser string o number
  const [isAddChamberModalOpen, setIsAddChamberModalOpen] = useState(false)
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: 'success' | 'error'
  }>({
    open: false,
    message: '',
    severity: 'success'
  })

  // Estados para manejar IDs activos para mutaciones específicas (para los Record<string, boolean>)
  const [activePatternForSensorAddition, setActivePatternForSensorAddition] =
    useState<string | number | null>(null)
  const [activePatternForDeletion, setActivePatternForDeletion] = useState<
    string | number | null
  >(null)
  const [activeSensorForDeletion, setActiveSensorForDeletion] = useState<
    string | number | null
  >(null)

  // --- QUERIES ---
  const chambersQueryKey: QueryKey = ['chambers'] // React Query v3 QueryKey
  const {
    data: chambers = [],
    isLoading: isLoadingChambers,
    isError: isErrorChambers,
    error: errorChambers
  } = useQuery<Chamber[], Error>(chambersQueryKey, () =>
    apiFetchChambers(axiosPrivate)
  )

  useEffect(() => {
    if (selectedChamberId === null && chambers.length > 0) {
      setSelectedChamberId(chambers[0].id)
    } else if (
      selectedChamberId &&
      !chambers.find((c) => c.id === selectedChamberId) &&
      chambers.length > 0
    ) {
      setSelectedChamberId(chambers[0].id)
    } else if (chambers.length === 0) {
      setSelectedChamberId(null)
    }
  }, [chambers, selectedChamberId])

  // --- MUTATIONS ---

  const createChamberMutation = useMutation(
    (chamberName: string) =>
      apiCreateChamber(axiosPrivate, { name: chamberName }),
    {
      onSuccess: (newChamber) => {
        queryClient.invalidateQueries(chambersQueryKey)
        setSelectedChamberId(newChamber.id)
        setIsAddChamberModalOpen(false)
        setSnackbar({
          open: true,
          message: `Cámara "${newChamber.name}" creada.`,
          severity: 'success'
        })
      },
      onError: (error: Error) => {
        setSnackbar({
          open: true,
          message: `Error al crear cámara: ${error.message}`,
          severity: 'error'
        })
      }
    }
  )

  const updateChamberStatusMutation = useMutation(
    ({ chamberId, status }: { chamberId: string | number; status: string }) =>
      apiUpdateChamber(axiosPrivate, chamberId, { status }),
    {
      onSuccess: (updatedChamber) => {
        queryClient.invalidateQueries(chambersQueryKey)
        setSnackbar({
          open: true,
          message: `Cámara "${updatedChamber.name}" actualizada a "${updatedChamber.status}".`,
          severity: 'success'
        })
      },
      onError: (error: Error) => {
        setSnackbar({
          open: true,
          message: `Error al actualizar estado: ${error.message}`,
          severity: 'error'
        })
      }
    }
  )

  const createPatternMutation = useMutation(
    ({
      chamberId,
      patternName
    }: {
      chamberId: string | number
      patternName: string
    }) => apiCreatePattern(axiosPrivate, chamberId, { name: patternName }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(chambersQueryKey)
        setSnackbar({
          open: true,
          message: 'Patrón creado.',
          severity: 'success'
        })
      },
      onError: (error: Error) => {
        setSnackbar({
          open: true,
          message: `Error al crear patrón: ${error.message}`,
          severity: 'error'
        })
      }
    }
  )

  const deletePatternMutation = useMutation(
    (patternId: string | number) => {
      setActivePatternForDeletion(patternId)
      return apiDeletePattern(axiosPrivate, patternId)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(chambersQueryKey)
        setSnackbar({
          open: true,
          message: 'Patrón eliminado.',
          severity: 'success'
        })
      },
      onError: (error: Error) => {
        setSnackbar({
          open: true,
          message: `Error al eliminar patrón: ${error.message}`,
          severity: 'error'
        })
      },
      onSettled: () => {
        setActivePatternForDeletion(null)
      }
    }
  )

  const createSensorMutation = useMutation(
    ({
      patternId,
      sensorData
    }: {
      patternId: string | number
      sensorData: { name: string; type: SensorType; showGraph: boolean }
    }) => {
      setActivePatternForSensorAddition(patternId)
      return apiCreateSensor(axiosPrivate, patternId, sensorData)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(chambersQueryKey)
        setSnackbar({
          open: true,
          message: 'Sensor creado.',
          severity: 'success'
        })
      },
      onError: (error: Error) => {
        setSnackbar({
          open: true,
          message: `Error al crear sensor: ${error.message}`,
          severity: 'error'
        })
      },
      onSettled: () => {
        setActivePatternForSensorAddition(null)
      }
    }
  )

  const deleteSensorMutation = useMutation(
    (sensorId: string | number) => {
      setActiveSensorForDeletion(sensorId) // Necesitaríamos un estado para esto si queremos feedback por sensor
      return apiDeleteSensor(axiosPrivate, sensorId)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(chambersQueryKey)
        setSnackbar({
          open: true,
          message: 'Sensor eliminado.',
          severity: 'success'
        })
      },
      onError: (error: Error) => {
        setSnackbar({
          open: true,
          message: `Error al eliminar sensor: ${error.message}`,
          severity: 'error'
        })
      },
      onSettled: () => {
        setActiveSensorForDeletion(null)
      }
    }
  )

  // --- MANEJADORES DE EVENTOS ---
  const handleSelectChamber = (chamberId: string | number) => {
    setSelectedChamberId(chamberId)
  }

  const handleAddChamberSubmit = (chamberName: string) => {
    createChamberMutation.mutate(chamberName)
  }

  const handleStartCalibration = (chamberIdToStart: string | number) => {
    updateChamberStatusMutation.mutate({
      chamberId: chamberIdToStart,
      status: 'Calibración Iniciada'
    })
  }

  const handleAddPattern = (
    chamberId: string | number,
    patternName: string
  ) => {
    createPatternMutation.mutate({ chamberId, patternName })
  }
  const handleDeletePattern = (patternId: string | number) => {
    deletePatternMutation.mutate(patternId)
  }
  const handleAddSensorToPattern = (
    patternId: string | number,
    sensorData: { name: string; type: SensorType; showGraph: boolean }
  ) => {
    createSensorMutation.mutate({ patternId, sensorData })
  }
  const handleDeleteSensorFromPattern = (
    patternId: string | number,
    sensorId: string | number
  ) => {
    // patternId no se usa en la mutación directa si sensorId es único, pero puede ser útil para el estado de carga
    deleteSensorMutation.mutate(sensorId)
  }

  // --- DATOS DERIVADOS Y ESTADOS DE CARGA PARA HIJOS ---
  const selectedChamber = useMemo(
    () => chambers.find((c) => c.id === selectedChamberId) || null,
    [chambers, selectedChamberId]
  )

  const currentPatterns = useMemo(
    () => selectedChamber?.patterns || [],
    [selectedChamber]
  )

  const currentSensorSummary = useMemo(
    () => generateSensorSummary(currentPatterns),
    [currentPatterns]
  )

  const isLoadingDeletePatternRecord: Record<string, boolean> = useMemo(() => {
    if (deletePatternMutation.isLoading && activePatternForDeletion !== null) {
      return { [activePatternForDeletion as string | number]: true }
    }
    return {}
  }, [deletePatternMutation.isLoading, activePatternForDeletion])

  const isLoadingAddSensorToPatternRecord: Record<string, boolean> =
    useMemo(() => {
      if (
        createSensorMutation.isLoading &&
        activePatternForSensorAddition !== null
      ) {
        return { [activePatternForSensorAddition as string | number]: true }
      }
      return {}
    }, [createSensorMutation.isLoading, activePatternForSensorAddition])

  const isLoadingDeleteSensorRecord: Record<string, boolean> = useMemo(() => {
    if (deleteSensorMutation.isLoading && activeSensorForDeletion !== null) {
      return { [activeSensorForDeletion as string | number]: true }
    }
    return {}
  }, [deleteSensorMutation.isLoading, activeSensorForDeletion])

  // --- RENDERIZADO ---
  if (isLoadingChambers) {
    return (
      <Container maxWidth='lg' sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress size={60} />
        <Typography variant='h6' sx={{ mt: 2 }}>
          Cargando datos de cámaras...
        </Typography>
      </Container>
    )
  }

  if (isErrorChambers && errorChambers) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Alert severity='error'>
          Error al cargar cámaras:{' '}
          {errorChambers.message || 'Error desconocido.'}
        </Alert>
      </Container>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2
            }}
          >
            <Typography variant='h4' component='h1'>
              Cámaras Ambientales
            </Typography>
            <Button
              variant='contained'
              startIcon={<AddCircleOutlineIcon />}
              onClick={() => setIsAddChamberModalOpen(true)}
              disabled={createChamberMutation.isLoading}
            >
              {createChamberMutation.isLoading
                ? 'Agregando...'
                : 'Agregar Cámara'}
            </Button>
          </Box>
        </Grid>

        <Grid item xs={12}>
          {chambers.length > 0 ? (
            <ChamberTabs
              chambers={chambers}
              selectedChamberId={selectedChamberId}
              onChamberSelect={handleSelectChamber}
            />
          ) : (
            <Alert severity='info' sx={{ mt: 2 }}>
              No hay cámaras configuradas. Empieza agregando una.
            </Alert>
          )}
        </Grid>

        <Grid item xs={12}>
          {selectedChamber ? (
            <ChamberDetails
              chamber={selectedChamber}
              patterns={currentPatterns}
              sensorsSummary={currentSensorSummary}
              onStartCalibration={handleStartCalibration}
              isStartingCalibration={updateChamberStatusMutation.isLoading}
              onAddPattern={handleAddPattern}
              isLoadingAddPattern={createPatternMutation.isLoading} // Global para "Agregar Patrón"
              onDeletePattern={handleDeletePattern}
              isLoadingDeletePattern={isLoadingDeletePatternRecord} // Record para borrado individual
              onAddSensorToPattern={handleAddSensorToPattern}
              isLoadingAddSensorToPattern={isLoadingAddSensorToPatternRecord} // Record para adición individual
              onDeleteSensorFromPattern={handleDeleteSensorFromPattern}
              isLoadingDeleteSensor={isLoadingDeleteSensorRecord} // Record para borrado individual
            />
          ) : (
            chambers.length > 0 && (
              <Typography
                sx={{ textAlign: 'center', mt: 4 }}
                color='text.secondary'
              >
                Seleccione una cámara de la lista superior para ver sus
                detalles.
              </Typography>
            )
          )}
        </Grid>
      </Grid>

      <AddChamberModal
        open={isAddChamberModalOpen}
        onClose={() => setIsAddChamberModalOpen(false)}
        onSubmit={handleAddChamberSubmit}
        isLoading={createChamberMutation.isLoading}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  )
}

export default CalibrationChamberView

// // src/features/calibrationMonitor/views/CalibrationChamberView.tsx
// import React, { useState, useEffect, useCallback } from 'react'
// import {
//   Box,
//   Typography,
//   Button,
//   Container,
//   Grid,
//   CircularProgress,
//   Alert
// } from '@mui/material'
// import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
// import { v4 as uuidv4 } from 'uuid'

// import {
//   Chamber,
//   Pattern,
//   Sensor,
//   SensorType,
//   SensorSummaryViewData
// } from '../types'
// import { ChamberTabs } from '../ChamberTabs'
// import { ChamberDetails } from '../ChamberDetails'
// import { AddChamberModal } from '../AddChamberModal'
// // Importar MOCK_CHAMBERS, MOCK_PATTERNS_BY_CHAMBER y generateSensorSummary desde mockData.ts
// import {
//   MOCK_CHAMBERS as INITIAL_MOCK_CHAMBERS,
//   MOCK_PATTERNS_BY_CHAMBER as INITIAL_MOCK_PATTERNS,
//   generateSensorSummary
// } from './mockData' // Ajusta la ruta si es necesario

// const CalibrationChamberView: React.FC = () => {
//   // Estados principales
//   const [chambers, setChambers] = useState<Chamber[]>([])
//   const [patternsByChamber, setPatternsByChamber] = useState<
//     Record<string, Pattern[]>
//   >({})
//   const [selectedChamberId, setSelectedChamberId] = useState<string | null>(
//     null
//   )
//   const [isLoading, setIsLoading] = useState(true) // Simular carga inicial

//   // Estados para modales
//   const [isAddChamberModalOpen, setIsAddChamberModalOpen] = useState(false)

//   // Estados de carga para operaciones CRUD (simulados)
//   const [isSubmitting, setIsSubmitting] = useState(false) // Genérico para submits de modales

//   // Simular carga inicial de datos
//   useEffect(() => {
//     setIsLoading(true)
//     setTimeout(() => {
//       setChambers(INITIAL_MOCK_CHAMBERS)
//       setPatternsByChamber(INITIAL_MOCK_PATTERNS)
//       if (INITIAL_MOCK_CHAMBERS.length > 0) {
//         setSelectedChamberId(INITIAL_MOCK_CHAMBERS[0].id)
//       }
//       setIsLoading(false)
//     }, 1000) // Simula delay de red
//   }, [])

//   // --- MANEJADORES DE ESTADO Y CRUD (SIMULADOS) ---

//   const handleSelectChamber = (chamberId: string) => {
//     setSelectedChamberId(chamberId)
//   }

//   // Cámaras
//   const handleAddChamber = async (chamberName: string) => {
//     setIsSubmitting(true)
//     await new Promise((resolve) => setTimeout(resolve, 700)) // Simular delay
//     const newChamber: Chamber = {
//       id: uuidv4(),
//       name: chamberName,
//       status: 'Esperando inicio de calibración'
//     }
//     setChambers((prev) => [...prev, newChamber])
//     setPatternsByChamber((prev) => ({ ...prev, [newChamber.id]: [] })) // Inicializar patrones vacíos
//     setSelectedChamberId(newChamber.id) // Seleccionar la nueva cámara
//     setIsAddChamberModalOpen(false)
//     setIsSubmitting(false)
//     console.log('Nueva Cámara Agregada (simulado):', newChamber)
//   }

//   // Patrones
//   const handleAddPattern = async (chamberId: string, patternName: string) => {
//     if (!chamberId) return
//     setIsSubmitting(true) // Podríamos tener un loading state más granular
//     await new Promise((resolve) => setTimeout(resolve, 700))
//     const newPattern: Pattern = {
//       id: uuidv4(),
//       name: patternName,
//       chamberId,
//       sensors: []
//     }
//     setPatternsByChamber((prev) => ({
//       ...prev,
//       [chamberId]: [...(prev[chamberId] || []), newPattern]
//     }))
//     setIsSubmitting(false)
//     console.log(
//       'Nuevo Patrón Agregado (simulado):',
//       newPattern,
//       'a cámara:',
//       chamberId
//     )
//   }

//   const handleDeletePattern = async (patternId: string) => {
//     if (!selectedChamberId) return
//     // En una app real, tendrías que confirmar esta acción
//     console.log(
//       'Intentando eliminar patrón (simulado):',
//       patternId,
//       'de cámara:',
//       selectedChamberId
//     )
//     setIsSubmitting(true) // Usar un loading state específico si es necesario
//     await new Promise((resolve) => setTimeout(resolve, 500))
//     setPatternsByChamber((prev) => {
//       const chamberPatterns = (prev[selectedChamberId] || []).filter(
//         (p) => p.id !== patternId
//       )
//       return { ...prev, [selectedChamberId]: chamberPatterns }
//     })
//     setIsSubmitting(false)
//   }

//   // Sensores
//   const handleAddSensorToPattern = async (
//     patternId: string,
//     sensorData: { name: string; type: SensorType; showGraph: boolean }
//   ) => {
//     if (!selectedChamberId) return
//     setIsSubmitting(true)
//     await new Promise((resolve) => setTimeout(resolve, 700))
//     const newSensor: Sensor = {
//       id: uuidv4(),
//       ...sensorData,
//       patternId,
//       // Simular datos iniciales
//       currentTemperature: sensorData.type.includes('temperature')
//         ? 22.5
//         : undefined,
//       averageTemperature: sensorData.type.includes('temperature')
//         ? 22.5
//         : undefined,
//       currentHumidity: sensorData.type.includes('humidity') ? 55.0 : undefined,
//       averageHumidity: sensorData.type.includes('humidity') ? 55.0 : undefined,
//       historicalData: [] // Debería generarse o venir vacío
//     }

//     setPatternsByChamber((prev) => {
//       const chamberPatterns = (prev[selectedChamberId] || []).map((p) => {
//         if (p.id === patternId) {
//           return { ...p, sensors: [...p.sensors, newSensor] }
//         }
//         return p
//       })
//       return { ...prev, [selectedChamberId]: chamberPatterns }
//     })
//     setIsSubmitting(false)
//     console.log(
//       'Nuevo Sensor Agregado (simulado):',
//       newSensor,
//       'a patrón:',
//       patternId
//     )
//   }

//   const handleDeleteSensorFromPattern = async (
//     patternId: string,
//     sensorId: string
//   ) => {
//     if (!selectedChamberId) return
//     console.log(
//       'Intentando eliminar sensor (simulado):',
//       sensorId,
//       'de patrón:',
//       patternId
//     )
//     setIsSubmitting(true)
//     await new Promise((resolve) => setTimeout(resolve, 500))
//     setPatternsByChamber((prev) => {
//       const chamberPatterns = (prev[selectedChamberId] || []).map((p) => {
//         if (p.id === patternId) {
//           return { ...p, sensors: p.sensors.filter((s) => s.id !== sensorId) }
//         }
//         return p
//       })
//       return { ...prev, [selectedChamberId]: chamberPatterns }
//     })
//     setIsSubmitting(false)
//   }

//   // Iniciar Calibración
//   const handleStartCalibration = async (chamberIdToStart: string) => {
//     setIsSubmitting(true) // Podría ser un loading state específico
//     console.log('Iniciando calibración para (simulado):', chamberIdToStart)
//     await new Promise((resolve) => setTimeout(resolve, 1000))
//     setChambers((prevChambers) =>
//       prevChambers.map((c) =>
//         c.id === chamberIdToStart ? { ...c, status: 'Calibración Iniciada' } : c
//       )
//     )
//     setIsSubmitting(false)
//   }

//   // Datos derivados para los componentes hijos
//   const selectedChamber =
//     chambers.find((c) => c.id === selectedChamberId) || null
//   const currentPatterns = selectedChamberId
//     ? patternsByChamber[selectedChamberId] || []
//     : []
//   const currentSensorSummary = generateSensorSummary(currentPatterns)

//   if (isLoading) {
//     return (
//       <Container maxWidth='lg' sx={{ py: 4 }}>
//         <Box
//           display='flex'
//           justifyContent='center'
//           alignItems='center'
//           minHeight='60vh'
//         >
//           <CircularProgress size={60} />
//           <Typography variant='h6' sx={{ ml: 2 }}>
//             Cargando datos de cámaras...
//           </Typography>
//         </Box>
//       </Container>
//     )
//   }

//   return (
//     <Container maxWidth='xl' sx={{ py: 3 }}>
//       {' '}
//       {/* xl para más espacio como en las imágenes */}
//       <Grid container spacing={3}>
//         <Grid item xs={12}>
//           <Box
//             sx={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               alignItems: 'center',
//               mb: 2
//             }}
//           >
//             <Typography variant='h4' component='h1'>
//               Cámaras Ambientales
//             </Typography>
//             <Button
//               variant='contained'
//               startIcon={<AddCircleOutlineIcon />}
//               onClick={() => setIsAddChamberModalOpen(true)}
//             >
//               Agregar Cámara
//             </Button>
//           </Box>
//         </Grid>

//         <Grid item xs={12}>
//           {chambers.length > 0 ? (
//             <ChamberTabs
//               chambers={chambers}
//               selectedChamberId={selectedChamberId}
//               onChamberSelect={handleSelectChamber}
//             />
//           ) : (
//             !isLoading && (
//               <Alert severity='info' sx={{ mt: 2 }}>
//                 No hay cámaras configuradas. Empieza agregando una.
//               </Alert>
//             )
//           )}
//         </Grid>

//         <Grid item xs={12}>
//           {selectedChamber ? (
//             <ChamberDetails
//               chamber={selectedChamber}
//               patterns={currentPatterns}
//               sensorsSummary={currentSensorSummary}
//               onStartCalibration={handleStartCalibration}
//               onAddPattern={handleAddPattern}
//               onDeletePattern={handleDeletePattern}
//               onAddSensorToPattern={handleAddSensorToPattern}
//               onDeleteSensorFromPattern={handleDeleteSensorFromPattern}
//               // Pasar estados de carga simulados (puedes hacerlos más granulares)
//               isStartingCalibration={isSubmitting} // Ejemplo
//               isLoadingAddPattern={isSubmitting && false} // Ajustar según la operación
//               // etc. para otros loadings
//             />
//           ) : (
//             !isLoading &&
//             chambers.length > 0 && (
//               <Typography
//                 sx={{ textAlign: 'center', mt: 4 }}
//                 color='text.secondary'
//               >
//                 Seleccione una cámara de la lista superior para ver sus
//                 detalles.
//               </Typography>
//             )
//           )}
//         </Grid>
//       </Grid>
//       {/* Modales */}
//       <AddChamberModal
//         open={isAddChamberModalOpen}
//         onClose={() => setIsAddChamberModalOpen(false)}
//         onSubmit={handleAddChamber}
//         isLoading={isSubmitting}
//       />
//       {/* Aquí irían los otros modales (`AddPatternModal`, `AddSensorModal`)
//                 cuya visibilidad sería controlada por estados similares (ej. `isAddPatternModalOpen`)
//                 y se activarían desde `PatternSection` y `PatternItem` respectivamente.
//                 Para mantener este componente padre más limpio, la lógica de esos modales
//                 a menudo se maneja dentro de sus componentes activadores o a través de un contexto/estado global.
//                 Pero para la simulación, podrías añadir los estados aquí si prefieres.
//             */}
//     </Container>
//   )
// }

// export default CalibrationChamberView
