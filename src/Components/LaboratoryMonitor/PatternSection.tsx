// src/Components/LaboratoryMonitor/PatternSection.tsx
import React, { useState } from 'react'
import { Box, Typography, Button, CircularProgress } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import {
  ChamberStatus,
  Pattern as PatternType,
  SensorType as SensorTypeValue
} from './types' // Renombrar SensorType
import { PatternItem } from './PatternItem'
import { AddPatternModal } from './AddPatternModal'

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
  onConfigurePattern
}) => {
  const [isAddPatternModalOpen, setIsAddPatternModalOpen] = useState(false)

  const handleOpenAddPatternModal = () => setIsAddPatternModalOpen(true)
  const handleCloseAddPatternModal = () => setIsAddPatternModalOpen(false)

  const handleAddPatternSubmit = async (patternName: string) => {
    await onAddPattern(chamberId, patternName)
    handleCloseAddPatternModal() // Idealmente controlado por el padre/React Query
  }

  if (isLoadingPatterns) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ my: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography variant='h5'>Patrones</Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={handleOpenAddPatternModal}
          disabled={isLoadingAddPattern}
        >
          Agregar Patrón
        </Button>
      </Box>

      {patterns && patterns.length > 0 ? (
        patterns.map((pattern) => (
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
          />
        ))
      ) : (
        <Typography
          variant='body1'
          color='textSecondary'
          sx={{ textAlign: 'center', py: 3 }}
        >
          No hay patrones configurados para esta cámara. Comience agregando uno.
        </Typography>
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
