import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
  Box,
  Divider,
  Typography,
  Chip
} from '@mui/material'
import { Save, Cancel, Close as CloseIcon } from '@mui/icons-material'
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth='xs' fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        Configurar Patrón: {pattern.name}
        <IconButton aria-label='close' onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id='data-mode-label'>
                  Modo de Visualización
                </InputLabel>
                <Select
                  labelId='data-mode-label'
                  label='Modo de Visualización'
                  value={dataMode}
                  onChange={(e) => setDataMode(e.target.value as any)}
                >
                  <MenuItem value='LAST_MINUTES'>Últimos Minutos</MenuItem>
                  <MenuItem value='LAST_POINTS'>Últimos Puntos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={
                  dataMode === 'LAST_MINUTES'
                    ? 'Cantidad de Minutos'
                    : 'Cantidad de Puntos'
                }
                type='number'
                value={dataValue}
                onChange={(e) => setDataValue(Number(e.target.value))}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 1 }}>
                <Chip
                  label='Configuración del Dispositivo (ESP32)'
                  size='small'
                />
              </Divider>
            </Grid>
            <Grid item xs={12}>
              {' '}
              <Typography variant='subtitle1'>
                Frecuencia de Muestreo
              </Typography>{' '}
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Intervalo de Tiempo'
                type='number'
                value={samplingValue}
                onChange={(e) => setSamplingValue(Number(e.target.value))}
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Unidad</InputLabel>
                <Select
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
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button onClick={onClose} disabled={isLoading} startIcon={<Cancel />}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant='contained'
          disabled={isLoading}
          startIcon={<Save />}
        >
          {isLoading ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
