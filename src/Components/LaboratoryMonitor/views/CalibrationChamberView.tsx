import SignalLoader from 'src/Components/Common/SignalLoader'
import React, { useState, useEffect, useMemo } from 'react'
import { AcUnit, PauseCircleOutline, Speed } from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import {
  Typography,
  Button,
  Container,
  Grid,
  Alert,
  Paper,
} from '@mui/material'
import EmptyState from 'src/Components/Common/EmptyState'
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
import { StabilitySimulator } from '../StabilitySimulator'

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
import { getApiErrorMessage } from '@utils/apiError'
import { PatternConfigModal } from '../PatternConfigModal'
import { useDeviceNotifications } from '@utils/useDeviceNotifications'
import LaboratoryMqttGuide from 'src/Components/LaboratoryMqttGuide'
import { useStabilityAlerts } from '@hooks/useStabilityAlerts'
import { notify } from 'src/utils/notify'
import { notify as appNotify } from 'src/utils/notify'
import { confirmDialog } from 'src/utils/confirm'

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
        averageHumidity: undefined,
        lastSeen: sensor.lastSeen
      })
    })
  })
  return summary
}

const CalibrationChamberView: React.FC = () => {
  const canManage = useCan(PERMISSIONS.LABORATORY_CALIBRATION_MANAGE)
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  useCalibrationRealtimeUpdates()
  useDeviceNotifications()

  const [selectedChamberId, setSelectedChamberId] = useState<
    string | number | null
  >(null) // ID puede ser string o number
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingChamber, setEditingChamber] = useState<Chamber | null>(null)


  // Estados para manejar IDs activos para mutaciones específicas (para los Record<string, boolean>)
  const [activePatternForSensorAddition, setActivePatternForSensorAddition] =
    useState<string | number | null>(null)
  const [activePatternForDeletion, setActivePatternForDeletion] = useState<
    string | number | null
  >(null)
  const [activeSensorForDeletion, setActiveSensorForDeletion] = useState<
    string | number | null
  >(null)

  const [isPatternConfigModalOpen, setIsPatternConfigModalOpen] =
    useState(false)
  const [configuringPattern, setConfiguringPattern] = useState<Pattern | null>(
    null
  )

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

  // Avisos de estabilidad de todas las cámaras en calibración, se vean o no
  const stability = useStabilityAlerts(chambers)

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

  const updatePatternConfigMutation = useMutation(
    ({
      patternId,
      configData
    }: {
      patternId: string | number
      configData: {
        dataMode: string
        dataValue: number
        samplingRateSeconds: number
      } // <-- Añadir nuevo campo
    }) =>
      axiosPrivate.patch(
        `laboratory-calibration/patterns/${patternId}/config`,
        configData
      ),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(chambersQueryKey) // ¡Crucial para refrescar los datos!
        notify.success('Configuración del patrón actualizada.')
        handleClosePatternConfigModal()
      },
      onError: (error: Error) => {
        notify.error(getApiErrorMessage(error, 'Error al guardar configuración.'))
      }
    }
  )

  const createChamberMutation = useMutation(
    (chamberName: string) =>
      apiCreateChamber(axiosPrivate, { name: chamberName }),
    {
      onSuccess: (newChamber) => {
        queryClient.invalidateQueries(chambersQueryKey)
        setSelectedChamberId(newChamber.id)
        setIsModalOpen(false)
        notify.success(`Cámara "${newChamber.name}" creada.`)
      },
      onError: (error: Error) => {
        notify.error(getApiErrorMessage(error, 'Error al crear cámara.'))
      }
    }
  )

  const updateChamberStatusMutation = useMutation(
    ({ chamberId, status }: { chamberId: string | number; status: string }) =>
      apiUpdateChamber(axiosPrivate, chamberId, { status }),
    {
      onSuccess: (updatedChamber) => {
        queryClient.invalidateQueries(chambersQueryKey)
        notify.success(`Cámara "${updatedChamber.name}" actualizada a "${updatedChamber.status}".`)
      },
      onError: (error: Error) => {
        notify.error(getApiErrorMessage(error, 'Error al actualizar estado.'))
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
        notify.success('Patrón creado.')
      },
      onError: (error: Error) => {
        notify.error(getApiErrorMessage(error, 'Error al crear patrón.'))
      }
    }
  )

  const updateChamberMutation = useMutation(
    ({ chamberId, name }: { chamberId: string | number; name: string }) =>
      apiUpdateChamber(axiosPrivate, chamberId, { name }), // Asume que solo se actualiza el nombre
    {
      onSuccess: (updatedChamber) => {
        queryClient.invalidateQueries(chambersQueryKey)
        notify.success(`Cámara "${updatedChamber.name}" actualizada.`)
        setIsModalOpen(false) // Cierra el modal de edición
      },
      onError: (error: Error) => {
        notify.error(getApiErrorMessage(error, 'Error al actualizar cámara.'))
      }
    }
  )

  const deleteChamberMutation = useMutation(
    (chamberId: string | number) => apiDeleteChamber(axiosPrivate, chamberId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(chambersQueryKey)
        notify.success('Cámara eliminada exitosamente.')
        // setSelectedChamberId(null) se manejará en el useEffect que depende de 'chambers'
      },
      onError: (error: Error) => {
        notify.error(getApiErrorMessage(error, 'Error al eliminar cámara.'))
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
        notify.success('Patrón eliminado.')
      },
      onError: (error: Error) => {
        notify.error(getApiErrorMessage(error, 'Error al eliminar patrón.'))
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
        notify.success('Sensor creado.')
      },
      onError: (error: Error) => {
        notify.error(getApiErrorMessage(error, 'Error al crear sensor.'))
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
        appNotify.success('¡Eliminado!', 'El sensor ha sido eliminado.')
      },
      onError: (error: Error) => {
        appNotify.error('Error al eliminar sensor', getApiErrorMessage(error, 'No se pudo eliminar el sensor.'))
      },
      onSettled: () => {
        setActiveSensorForDeletion(null)
      }
    }
  )

  // --- MANEJADORES DE EVENTOS ---

  const handleOpenPatternConfigModal = (pattern: Pattern) => {
    setConfiguringPattern(pattern)
    setIsPatternConfigModalOpen(true)
  }

  const handleClosePatternConfigModal = () => {
    setIsPatternConfigModalOpen(false)
    setTimeout(() => setConfiguringPattern(null), 300)
  }

  const handleSavePatternConfig = (configData: {
    dataMode: 'LAST_MINUTES' | 'LAST_POINTS'
    dataValue: number
    samplingRateSeconds: number
  }) => {
    if (configuringPattern) {
      updatePatternConfigMutation.mutate({
        patternId: configuringPattern.id,
        configData
      })
    }
  }

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
    // Al detener, el backend borra todas las lecturas de calibración de la cámara
    confirmDialog({ title: '¿Detener la calibración?', text: 'Se borrarán las lecturas de calibración registradas en esta cámara. No podrás recuperarlas.', confirmLabel: 'Sí, detener', cancelLabel: 'Cancelar', tone: 'danger' }).then((result) => {
      if (result.isConfirmed) {
        updateChamberStatusMutation.mutate({
          chamberId: chamberIdToStop,
          status: CHAMBER_STATUS.IDLE
        })
      }
    })
  }

  // mutateAsync: el modal se cierra solo si el patrón se creó
  const handleAddPattern = async (
    chamberId: string | number,
    patternName: string
  ) => {
    await createPatternMutation.mutateAsync({ chamberId, patternName })
  }
  const handleDeletePattern = (patternId: string | number) => {
    confirmDialog({ title: '¿Eliminar este patrón?', text: 'Se eliminarán también todos sus sensores y lecturas. No podrás revertirlo.', confirmLabel: 'Sí, ¡eliminar!', cancelLabel: 'Cancelar', tone: 'danger' }).then((result) => {
      if (result.isConfirmed) {
        deletePatternMutation.mutate(patternId)
      }
    })
  }
  const handleAddSensorToPattern = async (
    patternId: string | number,
    sensorData: { name: string; type: SensorType; showGraph: boolean }
  ) => {
    await createSensorMutation.mutateAsync({ patternId, sensorData })
  }
  const handleDeleteSensorFromPattern = (sensorId: string | number) => {
    confirmDialog({ title: '¿Estás seguro de eliminar este sensor?', text: 'Esta acción no se puede revertir.', confirmLabel: 'Sí, ¡eliminar!', cancelLabel: 'Cancelar', tone: 'danger' }).then((result) => {
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
    confirmDialog({ title: '¿Estás seguro?', text: '¡Esta acción eliminará la cámara y todos sus patrones y sensores asociados! No podrás revertirlo.', confirmLabel: 'Sí, ¡eliminar!', cancelLabel: 'Cancelar', tone: 'danger' }).then((result) => {
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
        <SignalLoader message='Cargando datos de cámaras...' />
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
          <LmsPageHeader
            title='Cámaras Ambientales'
            subtitle='Cámaras, patrones y sensores asociados a cada calibración'
            icon={<AcUnit />}
            actions={
              canManage ? (
                <Button
                  variant='contained'
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleOpenCreateModal}
                  disabled={createChamberMutation.isLoading}
                  sx={{
                    bgcolor: '#00BFA5',
                    whiteSpace: 'nowrap',
                    '&:hover': { bgcolor: '#00ACC1' }
                  }}
                >
                  {createChamberMutation.isLoading
                    ? 'Agregando...'
                    : 'Agregar cámara'}
                </Button>
              ) : undefined
            }
          />
        </Grid>

        <Grid item xs={12}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <LmsStatCard variant='quiet'
                label='Cámaras'
                value={chambers.length}
                icon={<AcUnit />}
                tone='teal'
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <LmsStatCard variant='quiet'
                label='En calibración'
                value={
                  chambers.filter(
                    (c) => c.status === CHAMBER_STATUS.CALIBRATING
                  ).length
                }
                icon={<Speed />}
                tone='orange'
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <LmsStatCard variant='quiet'
                label='En reposo'
                value={
                  chambers.filter(
                    (c) => c.status !== CHAMBER_STATUS.CALIBRATING
                  ).length
                }
                icon={<PauseCircleOutline />}
                tone='blue'
              />
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <LaboratoryMqttGuide variant='patterns' />
        </Grid>

        {import.meta.env.DEV && selectedChamber && (
          <Grid item xs={12}>
            <StabilitySimulator chamber={selectedChamber} />
          </Grid>
        )}

        <Grid item xs={12}>
          {chambers.length > 0 ? (
            <ChamberTabs
              chambers={chambers}
              selectedChamberId={selectedChamberId}
              onChamberSelect={handleSelectChamber}
            />
          ) : (
            <Paper
              variant='outlined'
              sx={{ borderRadius: '12px', borderColor: '#e5e7eb' }}
            >
              <EmptyState
                icon={<AcUnit />}
                title='Aún no hay cámaras configuradas'
                hint='Una cámara agrupa los patrones que se calibran juntos. Agrega la primera para empezar.'
                action={
                  canManage ? (
                    <Button
                      variant='outlined'
                      startIcon={<AddCircleOutlineIcon />}
                      onClick={handleOpenCreateModal}
                      sx={{ color: '#00897B', borderColor: '#00BFA5' }}
                    >
                      Agregar cámara
                    </Button>
                  ) : undefined
                }
              />
            </Paper>
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
              onConfigurePattern={handleOpenPatternConfigModal} // <--- NUEVA PROP
              stabilityAlerts={stability.alerts}
              onAcknowledgeStability={stability.acknowledge}
              voice={stability.voice}
              desktop={stability.desktop}
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
      {configuringPattern && (
        <PatternConfigModal
          open={isPatternConfigModalOpen}
          onClose={handleClosePatternConfigModal}
          onSave={handleSavePatternConfig}
          pattern={configuringPattern}
          isLoading={updatePatternConfigMutation.isLoading}
        />
      )}

    </Container>
  )
}

export default CalibrationChamberView
