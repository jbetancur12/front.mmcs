// src/Components/LaboratoryMonitor/PatternItem.tsx
import React, { useState } from 'react'
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  List,
  Divider,
  CircularProgress
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
}

export const PatternItem: React.FC<PatternItemProps> = ({
  pattern,
  chamberStatus,
  onDeletePattern,
  onAddSensorToPattern,
  onDeleteSensorFromPattern,
  isLoadingDeletePattern = false,
  isLoadingAddSensor = false,
  isLoadingDeleteSensor = {}
}) => {
  const [isAddSensorModalOpen, setIsAddSensorModalOpen] = useState(false)

  const handleOpenAddSensorModal = () => setIsAddSensorModalOpen(true)
  const handleCloseAddSensorModal = () => setIsAddSensorModalOpen(false)

  const handleAddSensorSubmit = async (sensorData: {
    name: string
    type: SensorTypeValue
    showGraph: boolean
  }) => {
    await onAddSensorToPattern(pattern.id, sensorData)
    handleCloseAddSensorModal() // Cerrar si el submit es exitoso (controlado por el padre idealmente)
  }

  const handleDeleteSensor = (sensorId: string) => {
    onDeleteSensorFromPattern(sensorId)
  }

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography variant='h6' component='div'>
          {pattern.name}
        </Typography>
        <Box>
          <Button
            variant='outlined'
            size='small'
            startIcon={<AddIcon />}
            onClick={handleOpenAddSensorModal}
            sx={{ mr: 1 }}
            disabled={isLoadingAddSensor}
          >
            Sensor
          </Button>
          <IconButton
            aria-label='Eliminar patrón'
            onClick={() => onDeletePattern(pattern.id)}
            color='error'
            disabled={isLoadingDeletePattern}
          >
            {isLoadingDeletePattern ? (
              <CircularProgress size={20} color='inherit' />
            ) : (
              <DeleteIcon />
            )}
          </IconButton>
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />
      {pattern.sensors && pattern.sensors.length > 0 ? (
        <List disablePadding>
          {pattern.sensors
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((sensor) => (
              <SensorItem
                key={sensor.id}
                sensor={sensor}
                chamberStatus={chamberStatus}
                patternId={pattern.id}
                chamberId={pattern.chamberId}
                onDeleteSensor={() => handleDeleteSensor(sensor.id)}
                isLoadingDelete={isLoadingDeleteSensor[sensor.id]}
              />
            ))}
        </List>
      ) : (
        <Typography
          variant='body2'
          color='textSecondary'
          sx={{ textAlign: 'center', py: 2 }}
        >
          No hay sensores agregados a este patrón.
        </Typography>
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
