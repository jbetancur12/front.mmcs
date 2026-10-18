import React, { useState, useEffect } from 'react'
import {
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Box,
  Stack,
  Typography
} from '@mui/material'
import FormDialog from 'src/Components/Common/FormDialog'
import { Pattern } from './types' // Ajusta la ruta a tus tipos

interface PatternConfigModalProps {
  open: boolean
  onClose: () => void
  onSave: (config: {
    dataMode: 'LAST_MINUTES' | 'LAST_POINTS'
    dataValue: number
    samplingRateSeconds: number
  }) => void
  pattern: Pattern
  isLoading?: boolean
}

export const PatternConfigModal: React.FC<PatternConfigModalProps> = ({
  open,
  onClose,
  onSave,
  pattern,
  isLoading = false
}) => {
  const [dataMode, setDataMode] = useState(pattern.dataMode)
  const [dataValue, setDataValue] = useState(pattern.dataValue)

  const [samplingValue, setSamplingValue] = useState(60)
  const [samplingUnit, setSamplingUnit] = useState<'seconds' | 'minutes'>(
    'seconds'
  )

  useEffect(() => {
    if (open && pattern) {
      setDataMode(pattern.dataMode)
      setDataValue(pattern.dataValue)
      const seconds = pattern.samplingRateSeconds || 60
      if (seconds >= 60 && seconds % 60 === 0) {
        setSamplingUnit('minutes')
        setSamplingValue(seconds / 60)
      } else {
        setSamplingUnit('seconds')
        setSamplingValue(seconds)
      }
    }
  }, [open, pattern])

  const handleSave = () => {
    if (dataValue <= 0 || samplingValue <= 0) {
      // Añadir validación si es necesario
      return
    }

    // --- NUEVO: Convertir el tiempo de muestreo a segundos antes de guardar ---
    const totalSeconds =
      samplingUnit === 'minutes' ? samplingValue * 60 : samplingValue

    onSave({
      dataMode,
      dataValue: Number(dataValue),
      samplingRateSeconds: totalSeconds // Enviar el valor total en segundos
    })
  }

  const invalidData = dataValue <= 0
  const invalidSampling = samplingValue <= 0

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title='Configurar patrón'
      subtitle={pattern.name}
      submitLabel='Guardar'
      onSubmit={handleSave}
      loading={isLoading}
      submitDisabled={invalidData || invalidSampling}
    >
      <Stack spacing={3}>
        <Box>
          <Typography variant='subtitle2' fontWeight={700}>
            Qué se ve en la gráfica
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Cuántas lecturas recientes se muestran de cada sensor.
          </Typography>
          <Stack spacing={2}>
            <FormControl fullWidth>
              <InputLabel id='data-mode-label'>Mostrar</InputLabel>
              <Select
                labelId='data-mode-label'
                label='Mostrar'
                value={dataMode}
                onChange={(e) =>
                  setDataMode(e.target.value as Pattern['dataMode'])
                }
              >
                <MenuItem value='LAST_MINUTES'>Los últimos minutos</MenuItem>
                <MenuItem value='LAST_POINTS'>Los últimos puntos</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label={
                dataMode === 'LAST_MINUTES'
                  ? 'Cantidad de minutos'
                  : 'Cantidad de puntos'
              }
              type='number'
              value={dataValue}
              onChange={(e) => setDataValue(Number(e.target.value))}
              error={invalidData}
              helperText={invalidData ? 'Debe ser mayor que 0' : undefined}
              InputProps={{ inputProps: { min: 1 } }}
            />
          </Stack>
        </Box>
        <Box>
          <Typography variant='subtitle2' fontWeight={700}>
            Frecuencia de muestreo
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            Cada cuánto envía una lectura el dispositivo (ESP32).
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Cada'
                type='number'
                value={samplingValue}
                onChange={(e) => setSamplingValue(Number(e.target.value))}
                error={invalidSampling}
                helperText={
                  invalidSampling ? 'Debe ser mayor que 0' : undefined
                }
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id='sampling-unit-label'>Unidad</InputLabel>
                <Select
                  labelId='sampling-unit-label'
                  label='Unidad'
                  value={samplingUnit}
                  onChange={(e) =>
                    setSamplingUnit(e.target.value as 'seconds' | 'minutes')
                  }
                >
                  <MenuItem value='seconds'>Segundos</MenuItem>
                  <MenuItem value='minutes'>Minutos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </FormDialog>
  )
}
