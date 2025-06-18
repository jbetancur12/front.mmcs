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
import { ReactQueryDevtools } from 'react-query/devtools'

import {
  Chamber,
  Pattern,
  SensorType,
  SensorSummaryViewData,
  CHAMBER_STATUS
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
  deleteChamber as apiDeleteChamber, // Descomenta si implementas la función de eliminar cámara
  createPattern as apiCreatePattern,
  deletePattern as apiDeletePattern,
  createSensor as apiCreateSensor,
  deleteSensor as apiDeleteSensor
} from '../services/calibrationApi'
import useAxiosPrivate from '@utils/use-axios-private'
import { useCalibrationRealtimeUpdates } from '@utils/useCalibrationRealtimeUpdates'
import Swal from 'sweetalert2'

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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChamber, setEditingChamber] = useState<Chamber | null>(null)

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
        setIsModalOpen(false)
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

  const updateChamberMutation = useMutation(
    ({ chamberId, name }: { chamberId: string | number; name: string }) =>
      apiUpdateChamber(axiosPrivate, chamberId, { name }), // Asume que solo se actualiza el nombre
    {
      onSuccess: (updatedChamber) => {
        queryClient.invalidateQueries(chambersQueryKey)
        setSnackbar({
          open: true,
          message: `Cámara "${updatedChamber.name}" actualizada.`,
          severity: 'success'
        })
        setIsModalOpen(false) // Cierra el modal de edición
      },
      onError: (error: Error) => {
        setSnackbar({
          open: true,
          message: `Error al actualizar cámara: ${error.message}`,
          severity: 'error'
        })
      }
    }
  )

  const deleteChamberMutation = useMutation(
    (chamberId: string | number) => apiDeleteChamber(axiosPrivate, chamberId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(chambersQueryKey)
        setSnackbar({
          open: true,
          message: 'Cámara eliminada exitosamente.',
          severity: 'success'
        })
        // setSelectedChamberId(null) se manejará en el useEffect que depende de 'chambers'
      },
      onError: (error: Error) => {
        setSnackbar({
          open: true,
          message: `Error al eliminar cámara: ${error.message}`,
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
        Swal.fire('¡Eliminado!', 'El sensor ha sido eliminado.', 'success')
      },
      onError: (error: Error) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar sensor',
          text: error.message || 'Error desconocido al eliminar el sensor.'
        })
      },
      onSettled: () => {
        setActiveSensorForDeletion(null)
      }
    }
  )

  // --- MANEJADORES DE EVENTOS ---

  const handleOpenCreateModal = () => {
    setEditingChamber(null) // Asegurarse de que no hay datos de edición
    setIsModalOpen(true)
  }

  const handleOpenEditModal = () => {
    if (selectedChamber) {
      setEditingChamber(selectedChamber) // Guardar la cámara a editar
      setIsModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    // Es buena práctica esperar un poco para limpiar los datos y que no se vea el cambio antes de que cierre la animación
    setTimeout(() => {
      setEditingChamber(null)
    }, 300)
  }

  const handleSelectChamber = (chamberId: string | number) => {
    setSelectedChamberId(chamberId)
  }

  const handleAddChamberSubmit = (chamberName: string) => {
    createChamberMutation.mutate(chamberName)
  }

  const handleStartCalibration = (chamberIdToStart: string | number) => {
    updateChamberStatusMutation.mutate({
      chamberId: chamberIdToStart,
      status: CHAMBER_STATUS.CALIBRATING
    })
  }

  const handleStopCalibration = (chamberIdToStop: string | number) => {
    updateChamberStatusMutation.mutate({
      chamberId: chamberIdToStop,
      status: CHAMBER_STATUS.IDLE // <= Usar constante para volver al estado inicial/detenido
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
  const handleDeleteSensorFromPattern = (sensorId: string | number) => {
    Swal.fire({
      title: '¿Estás seguro de eliminar este sensor?',
      text: 'Esta acción no se puede revertir.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, ¡eliminar!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      // Si el usuario confirma la acción
      if (result.isConfirmed) {
        // Llamar a la mutación para eliminar el sensor
        deleteSensorMutation.mutate(sensorId)
      }
    })
  }

  const handleUpdateChamber = (newName: string) => {
    if (selectedChamberId && newName.trim()) {
      updateChamberMutation.mutate({
        chamberId: selectedChamberId,
        name: newName.trim()
      })
    }
  }

  const handleDeleteChamber = (chamberId: string | number) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡Esta acción eliminará la cámara y todos sus patrones y sensores asociados! No podrás revertirlo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, ¡eliminar!',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteChamberMutation.mutate(chamberId)
      }
    })
  }

  const handleSaveChamber = (chamberName: string) => {
    if (editingChamber) {
      // Si hay una cámara en edición, actualiza
      handleUpdateChamber(chamberName)
    } else {
      // Si no, crea
      handleAddChamberSubmit(chamberName)
    }
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
      <ReactQueryDevtools initialIsOpen={false} />
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
              onClick={handleOpenCreateModal}
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
              onStopCalibration={handleStopCalibration}
              isStartingCalibration={
                updateChamberStatusMutation.isLoading &&
                updateChamberStatusMutation.variables?.status ===
                  CHAMBER_STATUS.CALIBRATING
              }
              isStoppingCalibration={
                updateChamberStatusMutation.isLoading &&
                updateChamberStatusMutation.variables?.status ===
                  CHAMBER_STATUS.IDLE
              }
              onAddPattern={handleAddPattern}
              isLoadingAddPattern={createPatternMutation.isLoading} // Global para "Agregar Patrón"
              onDeletePattern={handleDeletePattern}
              isLoadingDeletePattern={isLoadingDeletePatternRecord} // Record para borrado individual
              onAddSensorToPattern={handleAddSensorToPattern}
              isLoadingAddSensorToPattern={isLoadingAddSensorToPatternRecord} // Record para adición individual
              onDeleteSensorFromPattern={handleDeleteSensorFromPattern}
              isLoadingDeleteSensor={isLoadingDeleteSensorRecord} // Record para borrado individual
              onEditChamber={handleOpenEditModal}
              onDeleteChamber={handleDeleteChamber}
              isDeletingChamber={
                deleteChamberMutation.isLoading &&
                deleteChamberMutation.variables === selectedChamber.id
              }
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
        open={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSaveChamber}
        isLoading={
          createChamberMutation.isLoading || updateChamberMutation.isLoading
        }
        isEditMode={!!editingChamber} // true si editingChamber NO es null
        initialValue={editingChamber ? editingChamber.name : ''} // Valor inicial si se edita
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
