import React, { useState } from 'react'
import { AxiosError } from 'axios'
import {
  Button,
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Paper,
  Typography,
  IconButton,
  Box,
  FormControlLabel,
  Switch
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import useAxiosPrivate from '@utils/use-axios-private'
import { useMutation, useQueryClient } from 'react-query'

interface AlarmThreshold {
  min?: number
  max?: number
  enabled: boolean
  type: 'BELOW' | 'ABOVE' | 'RANGE'
}

export interface ModuleConfig {
  deviceIotId: number
  sensorType: 'TEMPERATURA' | 'HUMEDAD' | 'PRESION' | 'OTRO'
  absoluteMin: number
  absoluteMax: number
  okMin: number
  okMax: number
  alarmThresholds: AlarmThreshold[]
  warningThresholds: AlarmThreshold[]
}

interface ErrorResponse {
  message: string
  errors?: string[]
}

const AlarmThresholdInput: React.FC<{
  threshold: AlarmThreshold
  index: number
  onUpdate: (index: number, threshold: AlarmThreshold) => void
  onRemove: () => void
}> = ({ threshold, index, onUpdate, onRemove }) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
      <Select
        value={threshold.type}
        onChange={(e) =>
          onUpdate(index, { ...threshold, type: e.target.value as any })
        }
        sx={{ minWidth: 120 }}
      >
        <MenuItem value='BELOW'>Debajo de</MenuItem>
        <MenuItem value='ABOVE'>Encima de</MenuItem>
        <MenuItem value='RANGE'>Rango</MenuItem>
      </Select>

      {threshold.type === 'BELOW' && (
        <TextField
          label='Valor máximo'
          type='number'
          value={threshold.max || ''}
          onChange={(e) =>
            onUpdate(index, { ...threshold, max: Number(e.target.value) })
          }
        />
      )}

      {threshold.type === 'ABOVE' && (
        <TextField
          label='Valor mínimo'
          type='number'
          value={threshold.min || ''}
          onChange={(e) =>
            onUpdate(index, { ...threshold, min: Number(e.target.value) })
          }
        />
      )}

      {threshold.type === 'RANGE' && (
        <>
          <TextField
            label='Mínimo'
            type='number'
            value={threshold.min || ''}
            onChange={(e) =>
              onUpdate(index, { ...threshold, min: Number(e.target.value) })
            }
          />
          <TextField
            label='Máximo'
            type='number'
            value={threshold.max || ''}
            onChange={(e) =>
              onUpdate(index, { ...threshold, max: Number(e.target.value) })
            }
          />
        </>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={threshold.enabled}
            onChange={(e) =>
              onUpdate(index, { ...threshold, enabled: e.target.checked })
            }
          />
        }
        label='Habilitado'
      />

      <IconButton onClick={onRemove} color='error'>
        <DeleteIcon />
      </IconButton>
    </Box>
  )
}

const ModuleConfigForm: React.FC<{
  deviceIotId: number
  initialData?: ModuleConfig | null
  onSuccess?: () => void
}> = ({ deviceIotId, initialData, onSuccess }) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const [formErrors, setFormErrors] = useState<string[]>([])
  const [formData, setFormData] = useState<ModuleConfig>({
    deviceIotId,
    sensorType: 'TEMPERATURA',
    absoluteMin: initialData?.absoluteMin || -10,
    absoluteMax: initialData?.absoluteMax || 50,
    okMin: initialData?.okMin || 0,
    okMax: initialData?.okMax || 40,
    alarmThresholds: initialData?.alarmThresholds || [],
    warningThresholds: initialData?.warningThresholds || [],
    ...initialData
  })

  // const [formData, setFormData] = useState<ModuleConfig>({
  //   deviceIotId,
  //   sensorType: 'TEMPERATURA',
  //   absoluteMin: -10,
  //   absoluteMax: 50,
  //   okMin: 0,
  //   okMax: 40,
  //   alarmThresholds: [],
  //   warningThresholds: [],
  //   ...initialData
  // })

  const mutation = useMutation<
    ModuleConfig,
    AxiosError<ErrorResponse>,
    ModuleConfig
  >({
    mutationFn: async (config) => {
      const response = await axiosPrivate.post(
        '/devicesIot/module-config',
        config
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iotConfigs', deviceIotId] })
      if (onSuccess) onSuccess()
    }
  })

  const validateForm = (): boolean => {
    const errors: string[] = []

    if (formData.absoluteMin >= formData.absoluteMax) {
      errors.push('El rango absoluto mínimo debe ser menor al máximo')
    }

    if (
      formData.okMin < formData.absoluteMin ||
      formData.okMax > formData.absoluteMax
    ) {
      errors.push('El rango OK debe estar dentro del rango absoluto')
    }

    if (formData.okMin >= formData.okMax) {
      errors.push('El rango OK mínimo debe ser menor al máximo')
    }

    formData.alarmThresholds.forEach((threshold, index) => {
      if (threshold.enabled) {
        if (threshold.type === 'RANGE' && (!threshold.min || !threshold.max)) {
          errors.push(`Alarma ${index + 1}: Rango incompleto`)
        }
        if (threshold.type !== 'RANGE' && !threshold.min && !threshold.max) {
          errors.push(`Alarma ${index + 1}: Valor requerido`)
        }
      }
    })

    formData.warningThresholds.forEach((threshold, index) => {
      if (threshold.enabled) {
        if (threshold.type === 'RANGE' && (!threshold.min || !threshold.max)) {
          errors.push(`Advertencia ${index + 1}: Rango incompleto`)
        }
        if (threshold.type !== 'RANGE' && !threshold.min && !threshold.max) {
          errors.push(`Advertencia ${index + 1}: Valor requerido`)
        }
      }
    })

    setFormErrors(errors)
    return errors.length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      mutation.mutate(formData)
    }
  }

  const handleThresholdChange = (
    type: 'alarm' | 'warning',
    index: number,
    threshold: AlarmThreshold
  ) => {
    const newThresholds = [...formData[`${type}Thresholds`]]
    newThresholds[index] = threshold
    setFormData({ ...formData, [`${type}Thresholds`]: newThresholds })
  }

  const addThreshold = (type: 'alarm' | 'warning') => {
    const newThreshold: AlarmThreshold = {
      type: 'ABOVE',
      enabled: true,
      min: undefined,
      max: undefined
    }
    setFormData({
      ...formData,
      [`${type}Thresholds`]: [...formData[`${type}Thresholds`], newThreshold]
    })
  }

  const removeThreshold = (type: 'alarm' | 'warning', index: number) => {
    const newThresholds = formData[`${type}Thresholds`].filter(
      (_, i) => i !== index
    )
    setFormData({ ...formData, [`${type}Thresholds`]: newThresholds })
  }

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, margin: 'auto' }}>
      <Typography variant='h6' gutterBottom>
        Configuración de Sensor
      </Typography>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Sección de errores */}
          {formErrors.length > 0 && (
            <Grid item xs={12}>
              <Alert severity='error'>
                {formErrors.map((error, index) => (
                  <div key={index}>{error}</div>
                ))}
              </Alert>
            </Grid>
          )}

          {mutation.isError && (
            <Grid item xs={12}>
              <Alert severity='error'>
                {mutation.error.response?.data.message || 'Error desconocido'}
                {mutation.error.response?.data.errors?.map((e, i) => (
                  <div key={i}>{e}</div>
                ))}
              </Alert>
            </Grid>
          )}

          {/* Selector de tipo de sensor */}
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Sensor</InputLabel>
              <Select
                value={formData.sensorType}
                label='Tipo de Sensor'
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sensorType: e.target.value as any
                  })
                }
                disabled={!!initialData} // Deshabilitar si estamos editando
              >
                <MenuItem value='TEMPERATURA'>Temperatura</MenuItem>
                <MenuItem value='HUMEDAD'>Humedad</MenuItem>
                <MenuItem value='PRESION'>Presión</MenuItem>
                <MenuItem value='OTRO'>Otro</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Rango absoluto */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              label='Rango Absoluto Mínimo'
              type='number'
              value={formData.absoluteMin}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  absoluteMin: Number(e.target.value)
                })
              }
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label='Rango Absoluto Máximo'
              type='number'
              value={formData.absoluteMax}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  absoluteMax: Number(e.target.value)
                })
              }
              required
            />
          </Grid>

          {/* Rango OK */}
          <Grid item xs={6}>
            <TextField
              fullWidth
              label='Rango OK Mínimo'
              type='number'
              value={formData.okMin}
              onChange={(e) =>
                setFormData({ ...formData, okMin: Number(e.target.value) })
              }
              required
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label='Rango OK Máximo'
              type='number'
              value={formData.okMax}
              onChange={(e) =>
                setFormData({ ...formData, okMax: Number(e.target.value) })
              }
              required
            />
          </Grid>

          {/* Umbrales de Alarma */}
          <Grid item xs={12}>
            <Typography variant='subtitle1' gutterBottom>
              Umbrales de Alarma
            </Typography>
            {formData.alarmThresholds.map((threshold, index) => (
              <AlarmThresholdInput
                key={`alarm-${index}`}
                threshold={threshold}
                index={index}
                onUpdate={(i, t) => handleThresholdChange('alarm', i, t)}
                onRemove={() => removeThreshold('alarm', index)}
              />
            ))}
            <Button
              variant='outlined'
              startIcon={<AddIcon />}
              onClick={() => addThreshold('alarm')}
            >
              Agregar Alarma
            </Button>
          </Grid>

          {/* Umbrales de Advertencia */}
          <Grid item xs={12}>
            <Typography variant='subtitle1' gutterBottom>
              Umbrales de Advertencia
            </Typography>
            {formData.warningThresholds.map((threshold, index) => (
              <AlarmThresholdInput
                key={`warning-${index}`}
                threshold={threshold}
                index={index}
                onUpdate={(i, t) => handleThresholdChange('warning', i, t)}
                onRemove={() => removeThreshold('warning', index)}
              />
            ))}
            <Button
              variant='outlined'
              startIcon={<AddIcon />}
              onClick={() => addThreshold('warning')}
            >
              Agregar Advertencia
            </Button>
          </Grid>

          {/* Botón de envío */}
          <Grid item xs={12}>
            <Button
              type='submit'
              variant='contained'
              color='primary'
              disabled={mutation.isLoading}
              startIcon={
                mutation.isLoading ? <CircularProgress size={20} /> : null
              }
            >
              {initialData
                ? 'Actualizar Configuración'
                : 'Guardar Configuración'}
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  )
}

export default ModuleConfigForm
