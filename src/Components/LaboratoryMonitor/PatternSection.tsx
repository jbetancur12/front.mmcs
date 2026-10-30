// src/Components/LaboratoryMonitor/PatternSection.tsx
import SignalLoader from 'src/Components/Common/SignalLoader'
import React, { useState } from 'react'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { Box, Button, Paper, Stack } from '@mui/material'
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined'
import SectionHeader from 'src/Components/Common/SectionHeader'
import EmptyState from 'src/Components/Common/EmptyState'
import AddIcon from '@mui/icons-material/Add'
import {
  ChamberStatus,
  Pattern as PatternType,
  SensorType as SensorTypeValue
} from './types' // Renombrar SensorType
import { PatternItem } from './PatternItem'
import { AddPatternModal } from './AddPatternModal'
import { StabilityAlertState } from './ChamberDetails'

interface PatternSectionProps {
  chamberId: string
  chamberName?: string // Para el título del modal
  chamberStatus: ChamberStatus
  patterns: PatternType[]
  onAddPattern: (chamberId: string, patternName: string) => Promise<void> | void
  onDeletePattern: (patternId: string) => Promise<void> | void
  onAddSensorToPattern: (
    patternId: string,
    sensorData: { name: string; type: SensorTypeValue; showGraph: boolean }
  ) => Promise<void> | void
  onDeleteSensorFromPattern: (sensorId: string) => Promise<void> | void
  // Loading states
  isLoadingPatterns?: boolean
  isLoadingAddPattern?: boolean
  isLoadingDeletePattern?: Record<string, boolean>
  isLoadingAddSensorToPattern?: Record<string, boolean> // patternId como key
  isLoadingDeleteSensor?: Record<string, boolean> // sensorId como key (o patternId_sensorId)
  onConfigurePattern: (pattern: PatternType) => void // Nueva prop para configurar el patrón
  stabilityAlerts: Record<string, StabilityAlertState> // <--- NUEVA PROP
  onAcknowledgeStability: (patternId: string | number) => void // <--- NUEVA PROP
}

export const PatternSection: React.FC<PatternSectionProps> = ({
  chamberId,
  chamberName,
  chamberStatus,
  patterns,
  onAddPattern,
  onDeletePattern,
  onAddSensorToPattern,
  onDeleteSensorFromPattern,
  isLoadingPatterns = false,
  isLoadingAddPattern = false,
  isLoadingDeletePattern = {},
  isLoadingAddSensorToPattern = {},
  isLoadingDeleteSensor = {},
  onConfigurePattern,
  stabilityAlerts,
  onAcknowledgeStability
}) => {
  const canManage = useCan(PERMISSIONS.LABORATORY_CALIBRATION_MANAGE)
  const [isAddPatternModalOpen, setIsAddPatternModalOpen] = useState(false)

  const handleOpenAddPatternModal = () => setIsAddPatternModalOpen(true)
  const handleCloseAddPatternModal = () => setIsAddPatternModalOpen(false)

  const handleAddPatternSubmit = async (patternName: string) => {
    try {
      await onAddPattern(chamberId, patternName)
      handleCloseAddPatternModal()
    } catch {
      // El error ya se notifica en la vista; el modal sigue abierto con el nombre
    }
  }

  if (isLoadingPatterns) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <SignalLoader />
      </Box>
    )
  }

  return (
    <Box sx={{ mb: 4 }}>
      <SectionHeader
        title='Patrones'
        count={patterns?.length ?? 0}
        description='Equipos de referencia y los sensores que los miden.'
        actions={
          canManage ? (
            <Button
              variant='contained'
              startIcon={<AddIcon />}
              onClick={handleOpenAddPatternModal}
              disabled={isLoadingAddPattern}
              sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
            >
              Agregar patrón
            </Button>
          ) : undefined
        }
      />

      {patterns && patterns.length > 0 ? (
        <Stack spacing={2}>
          {patterns.map((pattern) => (
            <PatternItem
              key={pattern.id}
              pattern={pattern}
              chamberStatus={chamberStatus}
              onDeletePattern={() => onDeletePattern(pattern.id)}
              onAddSensorToPattern={onAddSensorToPattern}
              onDeleteSensorFromPattern={onDeleteSensorFromPattern}
              isLoadingDeletePattern={isLoadingDeletePattern[pattern.id]}
              isLoadingAddSensor={isLoadingAddSensorToPattern[pattern.id]}
              isLoadingDeleteSensor={isLoadingDeleteSensor} // Pasa el objeto completo
              onConfigurePattern={onConfigurePattern}
              alertStatus={stabilityAlerts[pattern.id]} // <-- Pasar el estado de alerta para este patrón
              onAcknowledge={() => onAcknowledgeStability(pattern.id)} // <-- Pasar el handler
            />
          ))}
        </Stack>
      ) : (
        <Paper
          variant='outlined'
          sx={{ borderRadius: '12px', borderColor: '#e5e7eb' }}
        >
          <EmptyState
            icon={<Inventory2Outlined />}
            title='Esta cámara aún no tiene patrones'
            hint='Un patrón agrupa los sensores del equipo que se calibra. Agrega el primero para empezar a recibir lecturas.'
            action={
              canManage ? (
                <Button
                  variant='outlined'
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddPatternModal}
                  sx={{ color: '#00897B', borderColor: '#00BFA5' }}
                >
                  Agregar patrón
                </Button>
              ) : undefined
            }
          />
        </Paper>
      )}

      <AddPatternModal
        open={isAddPatternModalOpen}
        onClose={handleCloseAddPatternModal}
        onSubmit={handleAddPatternSubmit}
        isLoading={isLoadingAddPattern}
        chamberName={chamberName}
      />
    </Box>
  )
}
