// src/Components/LaboratoryMonitor/ChamberDetails.tsx
import React, { useEffect, useRef, useState } from 'react'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import {
  Box,
  Typography,
  Button,
  Paper,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material'
import StatusPill from 'src/Components/Common/StatusPill'
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
  const canManage = useCan(PERMISSIONS.LABORATORY_CALIBRATION_MANAGE)
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
    <Box>
      <Paper
        variant='outlined'
        sx={{
          p: { xs: 2, md: 2.5 },
          mb: 3,
          borderRadius: '12px',
          borderColor: isCalibrating ? '#00BFA5' : '#e5e7eb',
          bgcolor: isCalibrating ? '#F4FCFA' : 'background.paper'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='h5' component='h2' fontWeight={700}>
              {chamber.name}
            </Typography>
            <Box sx={{ mt: 0.75 }}>
              {isCalibrating ? (
                <StatusPill label='Calibración en curso' tone='live' pulse />
              ) : (
                <StatusPill label='Esperando inicio de calibración' tone='idle' />
              )}
            </Box>
          </Box>
          {/* Iniciar/Detener exigen permiso de gestión en el backend */}
          {canManage && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title='Editar nombre'>
                <IconButton
                  aria-label='Editar nombre de la cámara'
                  onClick={onEditChamber}
                  sx={{ color: '#4b5563' }}
                >
                  <EditIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title='Eliminar cámara'>
                <span>
                  <IconButton
                    aria-label='Eliminar cámara'
                    onClick={() => onDeleteChamber(chamber.id)}
                    disabled={isDeletingChamber}
                    sx={{ color: '#4b5563', '&:hover': { color: 'error.main' } }}
                  >
                    {isDeletingChamber ? (
                      <CircularProgress size={22} color='inherit' />
                    ) : (
                      <DeleteIcon />
                    )}
                  </IconButton>
                </span>
              </Tooltip>
              {isIdle && (
                <Button
                  variant='contained'
                  startIcon={
                    isStartingCalibration ? (
                      <CircularProgress size={18} color='inherit' />
                    ) : (
                      <PlayArrowIcon />
                    )
                  }
                  onClick={() => onStartCalibration(chamber.id)}
                  disabled={isStartingCalibration}
                  sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
                >
                  Iniciar calibración
                </Button>
              )}
              {isCalibrating && (
                <Button
                  variant='outlined'
                  color='error'
                  startIcon={
                    isStoppingCalibration ? (
                      <CircularProgress size={18} color='inherit' />
                    ) : (
                      <Stop />
                    )
                  }
                  onClick={() => onStopCalibration(chamber.id)}
                  disabled={isStoppingCalibration}
                >
                  Detener calibración
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Paper>

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
    </Box>
  )
}
