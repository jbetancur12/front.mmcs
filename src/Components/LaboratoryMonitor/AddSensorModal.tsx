// src/Components/LaboratoryMonitor/AddSensorModal.tsx
import React, { useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Checkbox,
  CircularProgress,
  Box
} from '@mui/material'
import { SensorType } from './types' // Asegúrate que la ruta sea correcta

interface AddSensorModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (sensorData: {
    name: string
    type: SensorType
    showGraph: boolean
  }) => Promise<void> | void
  isLoading?: boolean
  patternName?: string // Opcional, para mostrar en el título
}

export const AddSensorModal: React.FC<AddSensorModalProps> = ({
  open,
  onClose,
  onSubmit,
  isLoading = false,
  patternName
}) => {
  const [sensorName, setSensorName] = useState('')
  const [sensorType, setSensorType] = useState<SensorType>(
    'temperature_humidity'
  )
  const [showGraph, setShowGraph] = useState(true)
  const [nameError, setNameError] = useState('')

  const handleSubmit = async () => {
    if (!sensorName.trim()) {
      setNameError('El nombre del sensor es requerido.')
      return
    }
    setNameError('')
    await onSubmit({ name: sensorName, type: sensorType, showGraph })
    // resetState(); // Opcional, si se quiere limpiar al cerrar o tras submit exitoso
  }

  const resetState = () => {
    setSensorName('')
    setSensorType('temperature_humidity')
    setShowGraph(true)
    setNameError('')
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>
        Agregar Nuevo Sensor {patternName ? `a ${patternName}` : ''}
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          autoFocus
          margin='dense'
          id='sensorName'
          label='Nombre del Sensor'
          type='text'
          fullWidth
          variant='outlined'
          value={sensorName}
          onChange={(e) => setSensorName(e.target.value)}
          error={!!nameError}
          helperText={nameError || 'Ej: Sensor 1'}
          disabled={isLoading}
          sx={{ mb: 2 }}
        />
        <FormControl component='fieldset' margin='normal' disabled={isLoading}>
          <FormLabel component='legend'>Tipo de Sensor</FormLabel>
          <RadioGroup
            row
            aria-label='tipo de sensor'
            name='sensorType'
            value={sensorType}
            onChange={(e) => setSensorType(e.target.value as SensorType)}
          >
            <FormControlLabel
              value='temperature_humidity'
              control={<Radio />}
              label='Temperatura y Humedad'
            />
            <FormControlLabel
              value='temperature_only'
              control={<Radio />}
              label='Solo Temperatura'
            />
          </RadioGroup>
        </FormControl>
        <Box mt={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showGraph}
                onChange={(e) => setShowGraph(e.target.checked)}
                name='showGraph'
                color='primary'
                disabled={isLoading}
              />
            }
            label='Mostrar gráfica para este sensor'
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color='secondary' disabled={isLoading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          color='primary'
          variant='contained'
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={24} color='inherit' />
          ) : (
            'Agregar'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
