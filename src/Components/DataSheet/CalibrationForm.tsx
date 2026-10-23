import * as yup from 'yup'

import { InspectionHistoryData } from './InspectionMaintenance'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { useEffect, useMemo, useRef, useState } from 'react'
import { EquipmentInfo } from './InspectionMaintenanceForm'
import { bigToast } from '../ExcelManipulation/Utils'
import { useFormik } from 'formik'
import {
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography
} from '@mui/material'
import { addMonths } from 'date-fns'
import {
  useCalibrationRecord,
  useDataSheet,
  useDeleteDataSheetRecord,
  useSaveCalibration
} from '@hooks/dataSheets/useDataSheets'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

export interface CalibrationData {
  equipmentId: string | number
  date: string
  calibrationDate: string
  nextCalibrationDate: string
  certificateNumber: string
  comments: string
  elaboratedBy: string
  calibrationCycle: string | null
}

interface CalibrationRecord extends CalibrationData {
  id: number
  verifiedBy?: string
}

interface CalibrationFormProps {
  tableData: InspectionHistoryData[]
  type: 'maintenance' | 'calibration'
  id: string | number
}

const validationSchema = yup.object().shape({
  equipmentId: yup.number().required('ID del equipo es obligatorio'),
  date: yup.date().required('Fecha es obligatoria'),
  calibrationDate: yup.date().required('Fecha de calibración es obligatoria'),
  nextCalibrationDate: yup
    .date()
    .required('Fecha de próxima calibración es obligatoria'),
  certificateNumber: yup
    .string()
    .required('Número de certificado es obligatorio'),
  comments: yup.string().nullable(),
  elaboratedBy: yup.string().required('Elaborado por es obligatorio'),
  calibrationCycle: yup
    .number()
    .typeError('El ciclo debe ser un número')
    .required('Ciclo de calibración es requerido')
    .min(1, 'El ciclo debe ser al menos 1 mes')
})

const MySwal = withReactContent(Swal)

const CalibrationForm = () => {
  const location = useLocation()
  const navigate = useNavigate()
  // El equipo sale del estado de la navegación o, si se entra por enlace directo, de la ruta
  const { id: routeId } = useParams()
  const id = (location.state as CalibrationFormProps | null)?.id ?? routeId

  const isEdit = Boolean(location.state && location.state.edit)
  const [editId, setEditId] = useState<number | null>(null)
  const equipoId = isEdit ? location.state.data.equipmentId : id

  const calibrationHistoryId: number | undefined =
    isEdit && location.state && location.state.data
      ? location.state.data.calibrationId
      : undefined
  const { data: calibrationData } =
    useCalibrationRecord<CalibrationRecord>(calibrationHistoryId)
  const prefilledCalibrationId = useRef<number | null>(null)
  const saveCalibrationMutation = useSaveCalibration()
  const deleteCalibrationMutation = useDeleteDataSheetRecord()

  useEffect(() => {
    if (!calibrationData) return
    // Solo precarga una vez por registro para no pisar lo que se esté editando
    if (prefilledCalibrationId.current === calibrationData.id) return
    prefilledCalibrationId.current = calibrationData.id
    const data = calibrationData
    setEditId(data.id)
    formik.setValues({
      ...data,
      equipmentId: data.equipmentId,
      date: data.date.split('T')[0],
      comments: data.comments || '',
      elaboratedBy: data.elaboratedBy || data.verifiedBy || ''
    })
  }, [calibrationData])

  // Fetch equipo: en edición usa calibrationData.equipmentId, en creación usa location.state.id
  const equipmentQueryId =
    isEdit && calibrationData && calibrationData.equipmentId
      ? calibrationData.equipmentId
      : !isEdit && id
        ? id
        : null
  const { data: equipmentData } = useDataSheet<EquipmentInfo>(
    equipmentQueryId,
    { refetchOnWindowFocus: false }
  )
  const equipmentInfo = useMemo<EquipmentInfo | null>(
    () =>
      equipmentData
        ? {
            equipmentName: equipmentData.equipmentName,
            internalCode: equipmentData.internalCode,
            brand: equipmentData.brand,
            model: equipmentData.model,
            serviceType: equipmentData.serviceType,
            serialNumber: equipmentData.serialNumber,
            calibrationCycle: equipmentData.calibrationCycle
          }
        : null,
    [equipmentData]
  )

  // Actualizar valores del formulario cuando cambia equipmentInfo
  useEffect(() => {
    if (equipmentInfo) {
      formik.setFieldValue(
        'calibrationCycle',
        equipmentInfo.calibrationCycle || ''
      )
    }
  }, [equipmentInfo])

  const formik = useFormik<CalibrationData>({
    initialValues: {
      equipmentId: id || '',
      date: '',
      calibrationDate: '',
      nextCalibrationDate: '',
      comments: '',
      elaboratedBy: '',
      certificateNumber: '',
      calibrationCycle: equipmentInfo?.calibrationCycle || ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const response = await saveCalibrationMutation.mutateAsync({
          id: isEdit && editId ? editId : null,
          payload: { ...values, name: 'Calibración' }
        })
        if (response.status >= 200 && response.status < 300) {
          bigToast(
            isEdit
              ? 'Calibración actualizada correctamente'
              : 'Calibración enviada correctamente',
            'success'
          )
          resetForm()
          navigate(`/datasheets/${equipoId}/inspection-maintenance`)
        } else {
          bigToast('Error al enviar la calibración', 'error')
        }
      } catch (error) {
        bigToast('Error al enviar la calibración', 'error')
        console.error('Error al enviar la calibración:', error)
      }
    }
  })

  const fieldLabels: { [key in keyof CalibrationData]: string } = {
    equipmentId: 'ID del equipo',
    date: 'Fecha',
    calibrationDate: 'Fecha de calibración',
    nextCalibrationDate: 'Fecha de próxima calibración',
    certificateNumber: 'Número de Certificado',
    comments: 'Comentarios',
    elaboratedBy: 'Elaborado por',
    calibrationCycle: 'Ciclo de calibración'
  }

  useEffect(() => {
    if (formik.values.calibrationDate && equipmentInfo?.calibrationCycle) {
      const parsedDate = new Date(formik.values.calibrationDate)
      if (!isNaN(parsedDate.getTime())) {
        const cycleMonths = Number(equipmentInfo.calibrationCycle)
        formik.setFieldValue(
          'nextCalibrationDate',
          addMonths(parsedDate, cycleMonths).toISOString()
        )
      }
    }
  }, [formik.values.calibrationDate, equipmentInfo?.calibrationCycle])

  const handleDelete = async () => {
    if (!editId) return
    const result = await MySwal.fire({
      title: '¿Está seguro que desea eliminar esta calibración?',
      text: 'No podrá recuperar esta información una vez eliminada',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      icon: 'warning'
    })
    if (result.isConfirmed) {
      try {
        const response = await deleteCalibrationMutation.mutateAsync(
          `/calibration/${editId}`
        )
        if (response.status === 204 || response.status === 200) {
          bigToast('Calibración eliminada correctamente', 'success')
          navigate(-1)
        } else {
          bigToast('Error al eliminar', 'error')
        }
      } catch (error) {
        bigToast('Error al eliminar', 'error')
      }
    }
  }

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4 }} style={{ width: '100%' }}>
      <Button
        variant='contained'
        color='secondary'
        onClick={() =>
          navigate(`/datasheets/${equipoId}/inspection-maintenance`)
        }
        sx={{ ml: 0, mb: 2 }}
      >
        Volver
      </Button>
      <Typography variant='h4' gutterBottom>
        Calibración
      </Typography>
      <Divider sx={{ mb: 4 }} />
      {equipmentInfo && (
        <Box mb={4}>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  label='ID del equipo'
                  name='equipmentId'
                  disabled={true}
                  value={formik.values.equipmentId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.equipmentId &&
                    Boolean(formik.errors.equipmentId)
                  }
                  helperText={
                    formik.touched.equipmentId && formik.errors.equipmentId
                  }
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label='Fecha'
                  type='date'
                  name='date'
                  value={formik.values.date}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.date && Boolean(formik.errors.date)}
                  helperText={formik.touched.date && formik.errors.date}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  label='Fecha de Calibración'
                  type='date'
                  name='calibrationDate'
                  value={formik.values.calibrationDate}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.date && Boolean(formik.errors.date)}
                  helperText={formik.touched.date && formik.errors.date}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label='Próxima Fecha de Calibración'
                  type='date'
                  name='nextCalibrationDate'
                  value={
                    formik.values.calibrationDate
                      ? addMonths(
                          new Date(formik.values.calibrationDate),
                          Number(equipmentInfo.calibrationCycle)
                        )
                          .toISOString()
                          .split('T')[0]
                      : ''
                  }
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.date && Boolean(formik.errors.date)}
                  helperText={formik.touched.date && formik.errors.date}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label='Nª de Certificado'
                  type='text'
                  name='certificateNumber'
                  value={formik.values.certificateNumber}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.date && Boolean(formik.errors.date)}
                  helperText={formik.touched.date && formik.errors.date}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label='Ciclo de Calibración'
                  type='number'
                  name='calibrationCycle'
                  value={formik.values.calibrationCycle}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.calibrationCycle &&
                    Boolean(formik.errors.calibrationCycle)
                  }
                  helperText={
                    formik.touched.calibrationCycle &&
                    formik.errors.calibrationCycle
                  }
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  disabled // Si es un campo de solo lectura
                />
              </Grid>
              {['comments', 'elaboratedBy'].map((field) => (
                <Grid item xs={12} md={6} key={field}>
                  <TextField
                    label={fieldLabels[field as keyof CalibrationData]}
                    name={field}
                    value={formik.values[field as keyof CalibrationData]}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched[field as keyof CalibrationData] &&
                      Boolean(formik.errors[field as keyof CalibrationData])
                    }
                    helperText={
                      formik.touched[field as keyof CalibrationData] &&
                      formik.errors[field as keyof CalibrationData]
                    }
                    fullWidth
                  />
                </Grid>
              ))}
              <Grid item xs={12}>
                <Button variant='contained' color='primary' type='submit'>
                  {isEdit ? 'Actualizar' : 'Guardar'}
                </Button>
                {isEdit && (
                  <Button
                    variant='outlined'
                    color='error'
                    onClick={handleDelete}
                    sx={{ ml: 2 }}
                  >
                    Eliminar
                  </Button>
                )}
              </Grid>
            </Grid>
          </form>
        </Box>
      )}
    </Paper>
  )
}

export default CalibrationForm
