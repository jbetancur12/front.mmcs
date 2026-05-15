import * as yup from 'yup'

import { InspectionHistoryData } from './InspectionMaintenance'
import { useLocation, useNavigate } from 'react-router-dom'

import { useEffect, useState } from 'react'
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
import useAxiosPrivate from '@utils/use-axios-private'
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
  const axiosPrivate = useAxiosPrivate()
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = location.state as CalibrationFormProps

  const [equipmentInfo, setEquipmentInfo] = useState<EquipmentInfo | null>(null)
  const [calibrationData, setCalibrationData] = useState<any>(null)

  const isEdit = Boolean(location.state && location.state.edit)
  const [editId, setEditId] = useState<number | null>(null)
  const equipoId = isEdit ? location.state.data.equipmentId : location.state?.id

  useEffect(() => {
    if (isEdit && location.state && location.state.data) {
      const calibrationHistoryId = location.state.data.calibrationId
      if (calibrationHistoryId) {
        const fetchEditData = async () => {
          try {
            const response = await axiosPrivate.get(
              `/calibration/${calibrationHistoryId}`
            )
            const data = response.data
            setCalibrationData(data)
            setEditId(data.id)
            formik.setValues({
              ...data,
              equipmentId: data.equipmentId,
              date: data.date.split('T')[0],
              comments: data.comments || '',
              elaboratedBy: data.elaboratedBy || data.verifiedBy || ''
            })
          } catch (error) {
            console.error('Error al obtener datos de edición:', error)
          }
        }
        fetchEditData()
      }
    }
  }, [location.state])

  // Fetch equipo: en edición usa calibrationData.equipmentId, en creación usa location.state.id
  useEffect(() => {
    let equipoId: any = null
    if (isEdit && calibrationData && calibrationData.equipmentId) {
      equipoId = calibrationData.equipmentId
    } else if (!isEdit && location.state && location.state.id) {
      equipoId = location.state.id
    }
    if (equipoId) {
      const fetchEquipmentInfo = async () => {
        try {
          const response = await axiosPrivate.get(`/dataSheet/${equipoId}`)
          setEquipmentInfo({
            equipmentName: response.data.equipmentName,
            internalCode: response.data.internalCode,
            brand: response.data.brand,
            model: response.data.model,
            serviceType: response.data.serviceType,
            serialNumber: response.data.serialNumber,
            calibrationCycle: response.data.calibrationCycle
          })
        } catch (error) {
          console.error('Error al obtener la información del equipo:', error)
        }
      }
      fetchEquipmentInfo()
    }
  }, [isEdit, calibrationData, location.state])

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
        let response
        if (isEdit && editId) {
          response = await axiosPrivate.put(
            `/calibration/${editId}`,
            { ...values, name: 'Calibración' },
            {}
          )
        } else {
          response = await axiosPrivate.post(
            `/calibration`,
            { ...values, name: 'Calibración' },
            {}
          )
        }
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
        const response = await axiosPrivate.delete(`/calibration/${editId}`)
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
