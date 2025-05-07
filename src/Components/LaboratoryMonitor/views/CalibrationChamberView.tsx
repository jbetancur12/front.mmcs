// src/features/calibrationMonitor/views/CalibrationChamberView.tsx
import React, { useState, useEffect, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import { v4 as uuidv4 } from 'uuid'

import {
  Chamber,
  Pattern,
  Sensor,
  SensorType,
  SensorSummaryViewData
} from '../types'
import { ChamberTabs } from '../ChamberTabs'
import { ChamberDetails } from '../ChamberDetails'
import { AddChamberModal } from '../AddChamberModal'
// Importar MOCK_CHAMBERS, MOCK_PATTERNS_BY_CHAMBER y generateSensorSummary desde mockData.ts
import {
  MOCK_CHAMBERS as INITIAL_MOCK_CHAMBERS,
  MOCK_PATTERNS_BY_CHAMBER as INITIAL_MOCK_PATTERNS,
  generateSensorSummary
} from './mockData' // Ajusta la ruta si es necesario

const CalibrationChamberView: React.FC = () => {
  // Estados principales
  const [chambers, setChambers] = useState<Chamber[]>([])
  const [patternsByChamber, setPatternsByChamber] = useState<
    Record<string, Pattern[]>
  >({})
  const [selectedChamberId, setSelectedChamberId] = useState<string | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(true) // Simular carga inicial

  // Estados para modales
  const [isAddChamberModalOpen, setIsAddChamberModalOpen] = useState(false)

  // Estados de carga para operaciones CRUD (simulados)
  const [isSubmitting, setIsSubmitting] = useState(false) // Genérico para submits de modales

  // Simular carga inicial de datos
  useEffect(() => {
    setIsLoading(true)
    setTimeout(() => {
      setChambers(INITIAL_MOCK_CHAMBERS)
      setPatternsByChamber(INITIAL_MOCK_PATTERNS)
      if (INITIAL_MOCK_CHAMBERS.length > 0) {
        setSelectedChamberId(INITIAL_MOCK_CHAMBERS[0].id)
      }
      setIsLoading(false)
    }, 1000) // Simula delay de red
  }, [])

  // --- MANEJADORES DE ESTADO Y CRUD (SIMULADOS) ---

  const handleSelectChamber = (chamberId: string) => {
    setSelectedChamberId(chamberId)
  }

  // Cámaras
  const handleAddChamber = async (chamberName: string) => {
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 700)) // Simular delay
    const newChamber: Chamber = {
      id: uuidv4(),
      name: chamberName,
      status: 'Esperando inicio de calibración'
    }
    setChambers((prev) => [...prev, newChamber])
    setPatternsByChamber((prev) => ({ ...prev, [newChamber.id]: [] })) // Inicializar patrones vacíos
    setSelectedChamberId(newChamber.id) // Seleccionar la nueva cámara
    setIsAddChamberModalOpen(false)
    setIsSubmitting(false)
    console.log('Nueva Cámara Agregada (simulado):', newChamber)
  }

  // Patrones
  const handleAddPattern = async (chamberId: string, patternName: string) => {
    if (!chamberId) return
    setIsSubmitting(true) // Podríamos tener un loading state más granular
    await new Promise((resolve) => setTimeout(resolve, 700))
    const newPattern: Pattern = {
      id: uuidv4(),
      name: patternName,
      chamberId,
      sensors: []
    }
    setPatternsByChamber((prev) => ({
      ...prev,
      [chamberId]: [...(prev[chamberId] || []), newPattern]
    }))
    setIsSubmitting(false)
    console.log(
      'Nuevo Patrón Agregado (simulado):',
      newPattern,
      'a cámara:',
      chamberId
    )
  }

  const handleDeletePattern = async (patternId: string) => {
    if (!selectedChamberId) return
    // En una app real, tendrías que confirmar esta acción
    console.log(
      'Intentando eliminar patrón (simulado):',
      patternId,
      'de cámara:',
      selectedChamberId
    )
    setIsSubmitting(true) // Usar un loading state específico si es necesario
    await new Promise((resolve) => setTimeout(resolve, 500))
    setPatternsByChamber((prev) => {
      const chamberPatterns = (prev[selectedChamberId] || []).filter(
        (p) => p.id !== patternId
      )
      return { ...prev, [selectedChamberId]: chamberPatterns }
    })
    setIsSubmitting(false)
  }

  // Sensores
  const handleAddSensorToPattern = async (
    patternId: string,
    sensorData: { name: string; type: SensorType; showGraph: boolean }
  ) => {
    if (!selectedChamberId) return
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 700))
    const newSensor: Sensor = {
      id: uuidv4(),
      ...sensorData,
      patternId,
      // Simular datos iniciales
      currentTemperature: sensorData.type.includes('temperature')
        ? 22.5
        : undefined,
      averageTemperature: sensorData.type.includes('temperature')
        ? 22.5
        : undefined,
      currentHumidity: sensorData.type.includes('humidity') ? 55.0 : undefined,
      averageHumidity: sensorData.type.includes('humidity') ? 55.0 : undefined,
      historicalData: [] // Debería generarse o venir vacío
    }

    setPatternsByChamber((prev) => {
      const chamberPatterns = (prev[selectedChamberId] || []).map((p) => {
        if (p.id === patternId) {
          return { ...p, sensors: [...p.sensors, newSensor] }
        }
        return p
      })
      return { ...prev, [selectedChamberId]: chamberPatterns }
    })
    setIsSubmitting(false)
    console.log(
      'Nuevo Sensor Agregado (simulado):',
      newSensor,
      'a patrón:',
      patternId
    )
  }

  const handleDeleteSensorFromPattern = async (
    patternId: string,
    sensorId: string
  ) => {
    if (!selectedChamberId) return
    console.log(
      'Intentando eliminar sensor (simulado):',
      sensorId,
      'de patrón:',
      patternId
    )
    setIsSubmitting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    setPatternsByChamber((prev) => {
      const chamberPatterns = (prev[selectedChamberId] || []).map((p) => {
        if (p.id === patternId) {
          return { ...p, sensors: p.sensors.filter((s) => s.id !== sensorId) }
        }
        return p
      })
      return { ...prev, [selectedChamberId]: chamberPatterns }
    })
    setIsSubmitting(false)
  }

  // Iniciar Calibración
  const handleStartCalibration = async (chamberIdToStart: string) => {
    setIsSubmitting(true) // Podría ser un loading state específico
    console.log('Iniciando calibración para (simulado):', chamberIdToStart)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setChambers((prevChambers) =>
      prevChambers.map((c) =>
        c.id === chamberIdToStart ? { ...c, status: 'Calibración Iniciada' } : c
      )
    )
    setIsSubmitting(false)
  }

  // Datos derivados para los componentes hijos
  const selectedChamber =
    chambers.find((c) => c.id === selectedChamberId) || null
  const currentPatterns = selectedChamberId
    ? patternsByChamber[selectedChamberId] || []
    : []
  const currentSensorSummary = generateSensorSummary(currentPatterns)

  if (isLoading) {
    return (
      <Container maxWidth='lg' sx={{ py: 4 }}>
        <Box
          display='flex'
          justifyContent='center'
          alignItems='center'
          minHeight='60vh'
        >
          <CircularProgress size={60} />
          <Typography variant='h6' sx={{ ml: 2 }}>
            Cargando datos de cámaras...
          </Typography>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      {' '}
      {/* xl para más espacio como en las imágenes */}
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
            >
              Agregar Cámara
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
            !isLoading && (
              <Alert severity='info' sx={{ mt: 2 }}>
                No hay cámaras configuradas. Empieza agregando una.
              </Alert>
            )
          )}
        </Grid>

        <Grid item xs={12}>
          {selectedChamber ? (
            <ChamberDetails
              chamber={selectedChamber}
              patterns={currentPatterns}
              sensorsSummary={currentSensorSummary}
              onStartCalibration={handleStartCalibration}
              onAddPattern={handleAddPattern}
              onDeletePattern={handleDeletePattern}
              onAddSensorToPattern={handleAddSensorToPattern}
              onDeleteSensorFromPattern={handleDeleteSensorFromPattern}
              // Pasar estados de carga simulados (puedes hacerlos más granulares)
              isStartingCalibration={isSubmitting} // Ejemplo
              isLoadingAddPattern={isSubmitting && false} // Ajustar según la operación
              // etc. para otros loadings
            />
          ) : (
            !isLoading &&
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
      {/* Modales */}
      <AddChamberModal
        open={isAddChamberModalOpen}
        onClose={() => setIsAddChamberModalOpen(false)}
        onSubmit={handleAddChamber}
        isLoading={isSubmitting}
      />
      {/* Aquí irían los otros modales (`AddPatternModal`, `AddSensorModal`)
                cuya visibilidad sería controlada por estados similares (ej. `isAddPatternModalOpen`)
                y se activarían desde `PatternSection` y `PatternItem` respectivamente.
                Para mantener este componente padre más limpio, la lógica de esos modales
                a menudo se maneja dentro de sus componentes activadores o a través de un contexto/estado global.
                Pero para la simulación, podrías añadir los estados aquí si prefieres.
            */}
    </Container>
  )
}

export default CalibrationChamberView
