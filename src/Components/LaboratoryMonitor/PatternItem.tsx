// src/Components/LaboratoryMonitor/PatternItem.tsx
import React, { useState } from 'react'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  Stack,
  CircularProgress,
  Tooltip,
  Alert,
  AlertTitle
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import {
  ChamberStatus,
  Pattern as PatternType,
  SensorType as SensorTypeValue
} from './types' // Renombrar SensorType para evitar conflicto
import { SensorItem } from './SensorItem'
import { AddSensorModal } from './AddSensorModal' // Para abrir el modal de agregar sensor
import { CheckCircle, Settings, Sensors } from '@mui/icons-material'
import StatusPill from 'src/Components/Common/StatusPill'
import EmptyState from 'src/Components/Common/EmptyState'
import { isPatternStable, StabilityAlertState } from './ChamberDetails'

interface PatternItemProps {
  pattern: PatternType
  chamberStatus: ChamberStatus
  onDeletePattern: (patternId: string) => Promise<void> | void
  onAddSensorToPattern: (
    patternId: string,
    sensorData: { name: string; type: SensorTypeValue; showGraph: boolean }
  ) => Promise<void> | void
  onDeleteSensorFromPattern: (sensorId: string) => Promise<void> | void
  isLoadingDeletePattern?: boolean
  isLoadingAddSensor?: boolean
  isLoadingDeleteSensor?: Record<string, boolean> // Para manejar loading por sensor
  onConfigurePattern: (pattern: PatternType) => void // Nueva prop para configurar el patrón
  alertStatus?: StabilityAlertState // <-- NUEVA PROP
  onAcknowledge: () => void // <-- NUEVA PROP
}

export const PatternItem: React.FC<PatternItemProps> = ({
  pattern,
  chamberStatus,
  onDeletePattern,
  onAddSensorToPattern,
  onDeleteSensorFromPattern,
  isLoadingDeletePattern = false,
  isLoadingAddSensor = false,
  isLoadingDeleteSensor = {},
  onConfigurePattern,
  alertStatus,
  onAcknowledge
}) => {
  const canManage = useCan(PERMISSIONS.LABORATORY_CALIBRATION_MANAGE)
  const [isAddSensorModalOpen, setIsAddSensorModalOpen] = useState(false)

  const handleOpenAddSensorModal = () => setIsAddSensorModalOpen(true)
  const handleCloseAddSensorModal = () => setIsAddSensorModalOpen(false)

  const handleAddSensorSubmit = async (sensorData: {
    name: string
    type: SensorTypeValue
    showGraph: boolean
  }) => {
    try {
      await onAddSensorToPattern(pattern.id, sensorData)
      handleCloseAddSensorModal()
    } catch {
      // El error ya se notifica en la vista; el modal sigue abierto con los datos
    }
  }

  const handleDeleteSensor = (sensorId: string) => {
    onDeleteSensorFromPattern(sensorId)
  }

  const isStable = isPatternStable(pattern)

  const sensorCount = pattern.sensors?.length ?? 0

  return (
    <Paper
      variant='outlined'
      sx={{
        p: { xs: 1.5, md: 2 },
        borderRadius: '12px',
        borderColor: '#e5e7eb'
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
          mb: 1.5
        }}
      >
        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='subtitle1' component='h3' fontWeight={700}>
              {pattern.name}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {sensorCount === 1 ? '1 sensor' : `${sensorCount} sensores`}
            </Typography>
          </Box>
          {isStable && (
            <StatusPill label='Estable' tone='success' size='small' />
          )}
        </Box>
        {canManage && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Button
              variant='outlined'
              size='small'
              startIcon={<AddIcon />}
              onClick={handleOpenAddSensorModal}
              disabled={isLoadingAddSensor}
              sx={{ color: '#00897B', borderColor: '#00BFA5', mr: 0.5 }}
            >
              Sensor
            </Button>
            <Tooltip title='Configurar visualización de datos'>
              <IconButton
                aria-label='Configurar visualización de datos'
                onClick={() => onConfigurePattern(pattern)}
                size='small'
                sx={{ color: '#4b5563' }}
              >
                <Settings />
              </IconButton>
            </Tooltip>
            <Tooltip title='Eliminar patrón'>
              <span>
                <IconButton
                  aria-label='Eliminar patrón'
                  onClick={() => onDeletePattern(pattern.id)}
                  size='small'
                  disabled={isLoadingDeletePattern}
                  sx={{ color: '#4b5563', '&:hover': { color: 'error.main' } }}
                >
                  {isLoadingDeletePattern ? (
                    <CircularProgress size={20} color='inherit' />
                  ) : (
                    <DeleteIcon />
                  )}
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        )}
      </Box>
      {isStable && !alertStatus?.acknowledged && (
        <Alert
          severity='success'
          sx={{ mb: 1.5, borderRadius: '8px' }}
          action={
            <Button
              color='inherit'
              size='small'
              onClick={onAcknowledge}
              startIcon={<CheckCircle />}
            >
              Reconocer
            </Button>
          }
        >
          <AlertTitle>Patrón estable</AlertTitle>
          La temperatura y la humedad se estabilizaron. Al reconocer, se
          silencian los avisos de voz.
        </Alert>
      )}
      {sensorCount > 0 ? (
        <Stack spacing={1}>
          {/* Copia: ordenar en sitio mutaría el caché de react-query */}
          {[...pattern.sensors]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((sensor) => (
              <SensorItem
                key={sensor.id}
                sensor={sensor}
                chamberStatus={chamberStatus}
                pattern={pattern}
                onDeleteSensor={() => handleDeleteSensor(sensor.id)}
                isLoadingDelete={isLoadingDeleteSensor[sensor.id]}
              />
            ))}
        </Stack>
      ) : (
        <EmptyState
          compact
          icon={<Sensors />}
          title='Este patrón no tiene sensores'
          hint='Agrega un sensor con el mismo nombre que envía el dispositivo.'
        />
      )}

      <AddSensorModal
        open={isAddSensorModalOpen}
        onClose={handleCloseAddSensorModal}
        onSubmit={handleAddSensorSubmit}
        isLoading={isLoadingAddSensor}
        patternName={pattern.name}
      />
    </Paper>
  )
}
