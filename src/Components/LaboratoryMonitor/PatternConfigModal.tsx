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
  Box
} from '@mui/material'
import { Save, Cancel, Close as CloseIcon } from '@mui/icons-material'
import { Pattern } from './types' // Ajusta la ruta a tus tipos

interface PatternConfigModalProps {
  open: boolean
  onClose: () => void
  onSave: (config: {
    dataMode: 'LAST_MINUTES' | 'LAST_POINTS'
    dataValue: number
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

  useEffect(() => {
    if (open) {
      setDataMode(pattern.dataMode)
      setDataValue(pattern.dataValue)
    }
  }, [open, pattern])

  const handleSave = () => {
    if (dataValue > 0) {
      onSave({ dataMode, dataValue: Number(dataValue) })
    }
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
          {isLoading ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
