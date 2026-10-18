// src/Components/LaboratoryMonitor/AddSensorModal.tsx
import React, { useEffect, useState } from 'react'
import {
  TextField,
  FormControl,
  FormControlLabel,
  FormLabel,
  FormHelperText,
  Radio,
  RadioGroup,
  Checkbox,
  Stack
} from '@mui/material'
import FormDialog from 'src/Components/Common/FormDialog'
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
    await onSubmit({ name: sensorName.trim(), type: sensorType, showGraph })
  }

  const resetState = () => {
    setSensorName('')
    setSensorType('temperature_humidity')
    setShowGraph(true)
    setNameError('')
  }

  // Cada apertura empieza limpia (el modal también se cierra desde el padre)
  useEffect(() => {
    if (open) resetState()
  }, [open])

  const handleClose = () => {
    resetState()
    onClose()
  }

  return (
    <FormDialog
      open={open}
      onClose={handleClose}
      title='Agregar sensor'
      subtitle={patternName ? `En ${patternName}` : undefined}
      submitLabel='Agregar sensor'
      onSubmit={handleSubmit}
      loading={isLoading}
    >
      <Stack spacing={2.5}>
        <TextField
          autoFocus
          id='sensorName'
          label='Nombre del sensor'
          fullWidth
          value={sensorName}
          onChange={(e) => {
            setSensorName(e.target.value)
            if (nameError) setNameError('')
          }}
          error={!!nameError}
          helperText={
            nameError ||
            'Igual al que envía el dispositivo; único en todo el laboratorio. Sin /, + ni #.'
          }
          disabled={isLoading}
        />
        <FormControl component='fieldset' disabled={isLoading}>
          <FormLabel component='legend'>Qué mide</FormLabel>
          <RadioGroup
            aria-label='Qué mide el sensor'
            name='sensorType'
            value={sensorType}
            onChange={(e) => setSensorType(e.target.value as SensorType)}
          >
            <FormControlLabel
              value='temperature_humidity'
              control={<Radio />}
              label='Temperatura y humedad'
            />
            <FormControlLabel
              value='temperature_only'
              control={<Radio />}
              label='Solo temperatura'
            />
          </RadioGroup>
        </FormControl>
        <FormControl disabled={isLoading}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showGraph}
                onChange={(e) => setShowGraph(e.target.checked)}
                name='showGraph'
                sx={{ '&.Mui-checked': { color: '#00897B' } }}
              />
            }
            label='Mostrar gráfica'
          />
          <FormHelperText sx={{ ml: 4, mt: -0.5 }}>
            La gráfica y la tabla se ven mientras la cámara calibra.
          </FormHelperText>
        </FormControl>
      </Stack>
    </FormDialog>
  )
}
