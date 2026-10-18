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
import { Stop, VolumeOff, VolumeUp } from '@mui/icons-material'
import { useVoiceAnnouncer } from '@hooks/useVoiceAnnouncer'
import {
  evaluateStabilityAlerts,
  isPatternStable,
  StabilityAlertState
} from './stability'

// Se reexporta para no cambiar los imports de PatternItem y PatternSection
export { isPatternStable }
export type { StabilityAlertState }

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
  const { announce, enabled, setEnabled, needsClick, supported, test } =
    useVoiceAnnouncer()
  const [stabilityAlerts, setStabilityAlerts] = useState<
    Record<string, StabilityAlertState>
  >({})
  // Fuente de verdad síncrona: evita avisar dos veces el mismo patrón
  const alertsRef = useRef<Record<string, StabilityAlertState>>({})

  const handleAcknowledgeStability = (patternId: string | number) => {
    const next = {
      ...alertsRef.current,
      [patternId]: { ...alertsRef.current[patternId], acknowledged: true }
    }
    alertsRef.current = next
    setStabilityAlerts(next)
  }

  useEffect(() => {
    if (!chamber || chamber.status !== CHAMBER_STATUS.CALIBRATING) {
      if (Object.keys(alertsRef.current).length > 0) {
        alertsRef.current = {}
        setStabilityAlerts({})
      }
      return
    }
    const result = evaluateStabilityAlerts(
      chamber.patterns || [],
      alertsRef.current,
      chamber.name,
      Date.now()
    )
    if (result.changed) {
      alertsRef.current = result.alerts
      setStabilityAlerts(result.alerts)
    }
    result.messages.forEach(announce)
  }, [chamber, announce])

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
            <Box
              sx={{
                mt: 0.75,
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 1
              }}
            >
              {isCalibrating ? (
                <StatusPill label='Calibración en curso' tone='live' pulse />
              ) : (
                <StatusPill
                  label='Esperando inicio de calibración'
                  tone='idle'
                />
              )}
              {isCalibrating && (
                <Tooltip
                  title={
                    !supported
                      ? 'Este navegador no tiene voz: se usa un pitido'
                      : needsClick
                        ? 'El navegador bloquea la voz hasta que hagas clic. Actívala aquí.'
                        : 'Avisa por voz cuando un patrón se estabiliza'
                  }
                >
                  <Button
                    size='small'
                    color={needsClick ? 'warning' : 'inherit'}
                    startIcon={
                      enabled && !needsClick ? <VolumeUp /> : <VolumeOff />
                    }
                    onClick={
                      needsClick || !enabled ? test : () => setEnabled(false)
                    }
                    sx={{ color: needsClick ? undefined : '#4b5563' }}
                  >
                    {needsClick
                      ? 'Activar avisos de voz'
                      : enabled
                        ? 'Avisos de voz activos'
                        : 'Avisos de voz silenciados'}
                  </Button>
                </Tooltip>
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
                    sx={{
                      color: '#4b5563',
                      '&:hover': { color: 'error.main' }
                    }}
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
