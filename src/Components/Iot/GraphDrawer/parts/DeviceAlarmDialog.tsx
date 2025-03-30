import React from 'react'
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
  FormControlLabel,
  Switch,
  Box,
  FormHelperText
} from '@mui/material'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import Swal from 'sweetalert2'
import { useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

// Tipos y constantes
export type DeviceAlarm = {
  id: number
  deviceId: number
  name: string
  description?: string
  metric: string
  condition: string
  threshold: number
  enabled: boolean
  active: boolean
  severity: 'info' | 'warning' | 'critical'
  createdAt: Date
  lastTriggered?: Date | null
}

const ALARM_METRICS = ['temperature', 'humidity', 'battery'] as const
const ALARM_CONDITIONS = ['above', 'below', 'equal'] as const
const ALARM_SEVERITIES = ['info', 'warning', 'critical'] as const

interface DeviceAlarmDialogProps {
  open: boolean
  onClose: () => void
  deviceId: number
  alarm: DeviceAlarm | null
}

interface AlarmFormValues {
  name: string
  description: string
  metric: (typeof ALARM_METRICS)[number]
  condition: (typeof ALARM_CONDITIONS)[number]
  threshold: number
  enabled: boolean
  severity: (typeof ALARM_SEVERITIES)[number]
}

const validationSchema = Yup.object({
  name: Yup.string().required('El nombre es obligatorio'),
  description: Yup.string(),
  metric: Yup.string()
    .oneOf([...ALARM_METRICS])
    .required('Seleccione una métrica'),
  condition: Yup.string()
    .oneOf([...ALARM_CONDITIONS])
    .required('Seleccione una condición'),
  threshold: Yup.number()
    .min(0, 'Debe ser mayor o igual a 0')
    .required('Ingrese un umbral válido')
    .typeError('Debe ser un número válido'),
  enabled: Yup.boolean(),
  severity: Yup.string()
    .oneOf([...ALARM_SEVERITIES])
    .required('Seleccione una severidad')
})

const DeviceAlarmDialog: React.FC<DeviceAlarmDialogProps> = ({
  open,
  onClose,
  deviceId,
  alarm
}) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const isEditMode = !!alarm

  const isAlarmMetric = (
    value: string
  ): value is (typeof ALARM_METRICS)[number] => {
    return ALARM_METRICS.includes(value as any)
  }

  const isAlarmCondition = (
    value: string
  ): value is (typeof ALARM_CONDITIONS)[number] => {
    return ALARM_CONDITIONS.includes(value as any)
  }

  const initialValues: AlarmFormValues = {
    name: alarm?.name || '',
    description: alarm?.description || '',
    metric:
      alarm?.metric && isAlarmMetric(alarm.metric)
        ? alarm.metric
        : 'temperature',
    condition:
      alarm?.condition && isAlarmCondition(alarm.condition)
        ? alarm.condition
        : 'above',
    threshold: alarm?.threshold || 0,
    enabled: alarm?.enabled ?? true,
    severity: alarm?.severity || 'info'
  }

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values) => {
      try {
        const payload = {
          ...values,

          threshold: Number(values.threshold)
        }

        if (isEditMode) {
          await handleUpdate(payload)
        } else {
          await handleCreate(payload)
        }
      } catch (error) {
        console.error('Error en el formulario:', error)
      }
    },
    enableReinitialize: true
  })

  const createMutation = useMutation({
    mutationFn: async (data: AlarmFormValues) => {
      const response = await axiosPrivate.post(
        `/devicesIot/${deviceId}/alarms`,
        data
      )

      return response.data
    }
  })

  const updateMutation = useMutation({
    mutationFn: async (data: AlarmFormValues) => {
      const response = await axiosPrivate.put(
        `/devicesIot/${alarm?.id}/alarms`,
        data
      )

      return response.data
    }
  })

  const handleCreate = async (data: AlarmFormValues) => {
    try {
      await createMutation.mutateAsync(data)
      Swal.fire({
        title: '¡Alarma creada!',
        text: 'La alarma se ha creado exitosamente',
        icon: 'success'
      })
      invalidateQueries()
      onClose()
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Error al crear la alarma',
        icon: 'error'
      })
    }
  }

  const handleUpdate = async (data: AlarmFormValues) => {
    try {
      await updateMutation.mutateAsync(data)
      Swal.fire({
        title: '¡Alarma actualizada!',
        text: 'La alarma se ha actualizado exitosamente',
        icon: 'success'
      })
      invalidateQueries()
      onClose()
    } catch (error: any) {
      Swal.fire({
        title: 'Error',
        text: error.message || 'Error al actualizar la alarma',
        icon: 'error'
      })
    }
  }

  const invalidateQueries = () => {
    queryClient.invalidateQueries(['/devicesIot', deviceId, 'alarms'])
    queryClient.invalidateQueries(['activeAlarms', deviceId])
  }

  const handleClose = () => {
    formik.resetForm()
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth='sm' fullWidth>
      <DialogTitle>{isEditMode ? 'Editar Alarma' : 'Nueva Alarma'}</DialogTitle>

      <form onSubmit={formik.handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 2 }}>
            {/* Nombre */}
            <TextField
              name='name'
              label='Nombre de la alarma'
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              fullWidth
              variant='outlined'
            />

            {/* Descripción */}
            <TextField
              name='description'
              label='Descripción (opcional)'
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              multiline
              rows={3}
              fullWidth
              variant='outlined'
            />

            {/* Configuración de la alarma */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* Métrica */}
              <FormControl
                fullWidth
                error={formik.touched.metric && Boolean(formik.errors.metric)}
              >
                <InputLabel>Métrica</InputLabel>
                <Select
                  name='metric'
                  value={formik.values.metric}
                  label='Métrica'
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  {ALARM_METRICS.map((metric) => (
                    <MenuItem key={metric} value={metric}>
                      {metric.charAt(0).toUpperCase() + metric.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.metric && formik.errors.metric && (
                  <FormHelperText>{formik.errors.metric}</FormHelperText>
                )}
              </FormControl>

              {/* Condición */}
              <FormControl
                fullWidth
                error={
                  formik.touched.condition && Boolean(formik.errors.condition)
                }
              >
                <InputLabel>Condición</InputLabel>
                <Select
                  name='condition'
                  value={formik.values.condition}
                  label='Condición'
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  {ALARM_CONDITIONS.map((condition) => (
                    <MenuItem key={condition} value={condition}>
                      {condition === 'above'
                        ? 'Mayor que'
                        : condition === 'below'
                          ? 'Menor que'
                          : 'Igual a'}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.condition && formik.errors.condition && (
                  <FormHelperText>{formik.errors.condition}</FormHelperText>
                )}
              </FormControl>
            </Box>

            {/* Umbral y Severidad */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              {/* Umbral */}
              <TextField
                name='threshold'
                label='Valor umbral'
                type='number'
                value={formik.values.threshold}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.threshold && Boolean(formik.errors.threshold)
                }
                helperText={formik.touched.threshold && formik.errors.threshold}
                fullWidth
                inputProps={{ min: 0, step: '0.01' }}
                variant='outlined'
              />

              {/* Severidad */}
              <FormControl
                fullWidth
                error={
                  formik.touched.severity && Boolean(formik.errors.severity)
                }
              >
                <InputLabel>Severidad</InputLabel>
                <Select
                  name='severity'
                  value={formik.values.severity}
                  label='Severidad'
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                >
                  {ALARM_SEVERITIES.map((severity) => (
                    <MenuItem key={severity} value={severity}>
                      {severity.charAt(0).toUpperCase() + severity.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
                {formik.touched.severity && formik.errors.severity && (
                  <FormHelperText>{formik.errors.severity}</FormHelperText>
                )}
              </FormControl>
            </Box>

            {/* Habilitar/Deshabilitar */}
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.enabled}
                  onChange={(e) =>
                    formik.setFieldValue('enabled', e.target.checked)
                  }
                  name='enabled'
                  color='primary'
                />
              }
              label='Alarma habilitada'
              labelPlacement='start'
              sx={{ justifyContent: 'space-between', ml: 0 }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleClose} color='inherit' sx={{ mr: 2 }}>
            Cancelar
          </Button>
          <Button
            type='submit'
            variant='contained'
            color='primary'
            disabled={formik.isSubmitting}
          >
            {isEditMode ? 'Guardar cambios' : 'Crear alarma'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default DeviceAlarmDialog
