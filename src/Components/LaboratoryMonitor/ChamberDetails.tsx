// src/Components/LaboratoryMonitor/ChamberDetails.tsx
import React, { useEffect, useRef, useState } from 'react'
import { Box, Typography, Button, Paper, CircularProgress } from '@mui/material'
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
import PlayArrowIcon from '@mui/icons-material/PlayArrow'
import {
  Chamber,
  Pattern,
  SensorType as SensorTypeValue,
  SensorSummaryViewData,
  CHAMBER_STATUS
} from './types'
import { PatternSection } from './PatternSection'
import { SensorsSummaryTable } from './SensorsSummaryTable'
import { Stop } from '@mui/icons-material'

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>()
  useEffect(() => {
    ref.current = value
  })
  return ref.current
}

export interface StabilityAlertState {
  count: number // Cuántas veces se ha notificado por voz
  timestamp: number // Cuándo se hizo la primera notificación
  acknowledged: boolean // Si el usuario ya la reconoció
}

interface ChamberDetailsProps {
  chamber: Chamber | null // Puede ser null si no hay ninguna seleccionada o está cargando
  patterns: Pattern[] // Los patrones específicos de esta cámara
  sensorsSummary: SensorSummaryViewData[] // Datos aplanados para la tabla resumen
  onStartCalibration: (chamberId: string | number) => void
  onStopCalibration: (chamberId: string | number) => void
  // Callbacks para PatternSection
  onAddPattern: (chamberId: string, patternName: string) => Promise<void> | void
  onDeletePattern: (patternId: string) => Promise<void> | void
  onAddSensorToPattern: (
    patternId: string,
    sensorData: { name: string; type: SensorTypeValue; showGraph: boolean }
  ) => Promise<void> | void
  onDeleteSensorFromPattern: (sensorId: string) => Promise<void> | void
  // Loading States
  isLoadingChamberData?: boolean
  isStartingCalibration?: boolean
  isStoppingCalibration?: boolean
  isLoadingPatterns?: boolean
  isLoadingAddPattern?: boolean
  isLoadingDeletePattern?: Record<string, boolean>
  isLoadingAddSensorToPattern?: Record<string, boolean>
  isLoadingDeleteSensor?: Record<string, boolean>
  isLoadingSummary?: boolean
  onEditChamber: () => void // NUEVA PROP
  onDeleteChamber: (chamberId: string | number) => void // NUEVA PROP
  isDeletingChamber?: boolean
  onConfigurePattern: (pattern: Pattern) => void // <--- NUEVA PROP
}

export const isPatternStable = (pattern: Pattern): boolean => {
  if (!pattern || !pattern.sensors || pattern.sensors.length === 0) {
    return false // No es estable si no tiene sensores
  }
  // 'every' se asegura de que TODOS los sensores del patrón cumplan la condición
  return pattern.sensors.every((sensor) => {
    const status = sensor.stabilityStatus || {
      temperatureStable: false,
      humidityStable: false
    }
    // Lógica corregida para evitar el error de tipos
    if (sensor.type === 'temperature_humidity') {
      return status.temperatureStable && status.humidityStable
    }
    if (sensor.type === 'temperature_only') {
      return status.temperatureStable
    }
    if (sensor.type === 'humidity_only') {
      return status.humidityStable
    }
    return false // Por defecto, si el tipo no es conocido, no es estable
  })
}

export const ChamberDetails: React.FC<ChamberDetailsProps> = ({
  chamber,
  patterns,
  sensorsSummary,
  onStartCalibration,
  onStopCalibration,
  onAddPattern,
  onDeletePattern,
  onAddSensorToPattern,
  onDeleteSensorFromPattern,
  isLoadingChamberData = false,
  isStartingCalibration = false,
  isStoppingCalibration = false,
  isLoadingPatterns = false,
  isLoadingAddPattern = false,
  isLoadingDeletePattern = {},
  isLoadingAddSensorToPattern = {},
  isLoadingDeleteSensor = {},
  isLoadingSummary = false,
  onEditChamber,
  onDeleteChamber,
  isDeletingChamber = false,
  onConfigurePattern
}) => {
  const speak = (message: string) => {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(message)
    utterance.lang = 'es-ES '
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }

  const prevChamberState = usePrevious(chamber)
  const [stabilityAlerts, setStabilityAlerts] = useState<
    Record<string, StabilityAlertState>
  >({})

  const handleAcknowledgeStability = (patternId: string | number) => {
    setStabilityAlerts((prev) => ({
      ...prev,
      [patternId]: {
        ...prev[patternId], // Mantener count y timestamp por si quieres usarlos
        acknowledged: true // Marcar como reconocida para silenciar futuras alertas de voz
      }
    }))
  }

  useEffect(() => {
    if (!prevChamberState || chamber?.status !== CHAMBER_STATUS.CALIBRATING) {
      return
    }

    const now = Date.now()
    const oneMinuteInMs = 60 * 1000
    const MAX_VOICE_ALERTS = 2 // Definir el número máximo de notificaciones de voz

    ;(chamber.patterns || []).forEach((currentPattern) => {
      const prevPattern = (prevChamberState.patterns || []).find(
        (p) => p.id === currentPattern.id
      )
      if (!prevPattern) return

      const wasStable = isPatternStable(prevPattern)
      const isNowStable = isPatternStable(currentPattern)
      const alertStatus = stabilityAlerts[currentPattern.id]

      // --- LÓGICA DE NOTIFICACIÓN ---

      // 1. SI ACABA DE VOLVERSE ESTABLE: Notificar por primera vez
      if (!wasStable && isNowStable) {
        speak(
          `Atención. El patrón ${currentPattern.name} en la cámara ${chamber.name} ha alcanzado la estabilidad.`
        )
        setStabilityAlerts((prev) => ({
          ...prev,
          [currentPattern.id]: { count: 1, timestamp: now, acknowledged: false }
        }))
      }
      // 2. SI SIGUE ESTABLE: Comprobar si se debe repetir la notificación
      else if (isNowStable && alertStatus) {
        // Solo notificar si NO ha sido reconocida Y no hemos alcanzado el límite
        if (!alertStatus.acknowledged && alertStatus.count < MAX_VOICE_ALERTS) {
          // Y si ha pasado más de un minuto
          if (now - alertStatus.timestamp > oneMinuteInMs) {
            speak(
              `Recordatorio: El patrón ${currentPattern.name} se mantiene estable.`
            )
            setStabilityAlerts((prev) => ({
              ...prev,
              [currentPattern.id]: {
                ...prev[currentPattern.id],
                count: alertStatus.count + 1,
                timestamp: now
              }
            }))
          }
        }
      }
      // 3. SI ACABA DE VOLVERSE INESTABLE: Resetear el estado de la alerta
      else if (wasStable && !isNowStable) {
        setStabilityAlerts((prev) => {
          const newState = { ...prev }
          delete newState[currentPattern.id]
          return newState
        })
      }
    })
  }, [chamber, prevChamberState, stabilityAlerts])

  if (isLoadingChamberData) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px'
        }}
      >
        <CircularProgress />
      </Box>
    )
  }

  if (!chamber) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant='h6' color='textSecondary'>
          Seleccione una cámara para ver sus detalles.
        </Typography>
      </Box>
    )
  }

  const isCalibrating = chamber?.status === CHAMBER_STATUS.CALIBRATING
  const isIdle = chamber?.status === CHAMBER_STATUS.IDLE // O como sea tu estado "detenido"

  return (
    <Paper elevation={0} sx={{ p: { xs: 2, md: 3 } }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          flexWrap: 'wrap'
        }}
      >
        <Typography variant='h5' component='div'>
          Detalles de la Cámara: <strong>{chamber.name}</strong>
        </Typography>
        {/* <Button onClick={() => speak(chamber.name)}>Click</Button> */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant='outlined'
            size='small'
            onClick={onEditChamber}
            startIcon={<EditIcon />}
          >
            Editar Nombre
          </Button>
          <Button
            variant='outlined'
            color='error'
            size='small'
            onClick={() => onDeleteChamber(chamber.id)}
            startIcon={
              isDeletingChamber ? (
                <CircularProgress size={16} color='inherit' />
              ) : (
                <DeleteIcon />
              )
            }
            disabled={isDeletingChamber}
          >
            {isDeletingChamber ? 'Eliminando...' : 'Eliminar Cámara'}
          </Button>
        </Box>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2,
          flexWrap: 'wrap'
        }}
      >
        <Box>
          <Typography variant='h4' component='h2' gutterBottom>
            {chamber.name}
          </Typography>
          <Typography variant='subtitle1' color='textSecondary' gutterBottom>
            {chamber.status === CHAMBER_STATUS.IDLE
              ? 'Esperando Inicio de Calibración'
              : chamber.status === CHAMBER_STATUS.CALIBRATING
                ? 'Calibración en curso'
                : 'Estado no definido'}
          </Typography>
        </Box>
        {isIdle && ( // Mostrar botón "Iniciar" si está inactiva
          <Button
            variant='contained'
            color='primary'
            startIcon={<PlayArrowIcon />}
            onClick={() => onStartCalibration(chamber.id)}
            disabled={isStartingCalibration}
            sx={{ mt: { xs: 2, sm: 0 } }}
          >
            {isStartingCalibration ? (
              <CircularProgress size={24} color='inherit' />
            ) : (
              'Iniciar Calibración'
            )}
          </Button>
        )}
        {isCalibrating && ( // Mostrar botón "Detener" si está calibrando
          <Button
            variant='contained'
            color='secondary' // O 'error'
            startIcon={<Stop />}
            onClick={() => onStopCalibration(chamber.id)}
            disabled={isStoppingCalibration}
            sx={{ mt: { xs: 2, sm: 0 } }}
          >
            {isStoppingCalibration ? (
              <CircularProgress size={24} color='inherit' />
            ) : (
              'Detener Calibración'
            )}
          </Button>
        )}
      </Box>

      <PatternSection
        chamberId={chamber.id}
        chamberName={chamber.name}
        chamberStatus={chamber.status}
        patterns={patterns}
        onAddPattern={onAddPattern}
        onDeletePattern={onDeletePattern}
        onAddSensorToPattern={onAddSensorToPattern}
        onDeleteSensorFromPattern={onDeleteSensorFromPattern}
        isLoadingPatterns={isLoadingPatterns}
        isLoadingAddPattern={isLoadingAddPattern}
        isLoadingDeletePattern={isLoadingDeletePattern}
        isLoadingAddSensorToPattern={isLoadingAddSensorToPattern}
        isLoadingDeleteSensor={isLoadingDeleteSensor}
        onConfigurePattern={onConfigurePattern}
        stabilityAlerts={stabilityAlerts}
        onAcknowledgeStability={handleAcknowledgeStability}
      />

      <SensorsSummaryTable
        summaryData={sensorsSummary}
        isLoading={isLoadingSummary}
      />
    </Paper>
  )
}
