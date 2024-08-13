import * as yup from 'yup'
import { api } from '../../config'
import { InspectionHistoryData } from './InspectionMaintenance'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'
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

export interface CalibrationData {
  equipmentId: string | number
  date: string
  calibrationDate: string
  nextCalibrationDate: string
  certificateNumber: string
  comments: string
  elaboratedBy: string
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
  elaboratedBy: yup.string().required('Elaborado por es obligatorio')
})

const apiUrl = api()

const CalibrationForm = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { id } = location.state as CalibrationFormProps

  const [equipmentInfo, setEquipmentInfo] = useState<EquipmentInfo | null>(null)

  useEffect(() => {
    // Obtener la información básica del equipo
    const fetchEquipmentInfo = async () => {
      try {
        const response = await axios.get(`${apiUrl}/dataSheet/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('accessToken')}`
          }
        })
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

    if (id) {
      fetchEquipmentInfo()
    }
  }, [id, apiUrl])

  const formik = useFormik<CalibrationData>({
    initialValues: {
      equipmentId: id || '',
      date: '',
      calibrationDate: '',
      nextCalibrationDate: '',
      comments: '',
      elaboratedBy: '',
      certificateNumber: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      console.log('Calibracion')
      try {
        const response = await axios.post(
          `${apiUrl}/calibration`,
          { ...values, name: 'Calibración' },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        )

        if (response.status >= 200 && response.status < 300) {
          // Se ha enviado correctamente la hoja de vida
          bigToast('Calibración enviada correctamente', 'success')
          resetForm()
        } else {
          // Ha ocurrido un error al enviar la hoja de vida
          bigToast('Error al enviar la calibración', 'error')
        }
      } catch (error) {
        // Ha ocurrido un error al enviar la hoja de vida
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
    elaboratedBy: 'Elaborado por'
  }

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4 }} style={{ width: '100%' }}>
      <Button
        variant='contained'
        color='secondary'
        onClick={() => navigate(`/datasheets/${id}/inspection-maintenance`)}
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
                      ? addMonths(new Date(formik.values.calibrationDate), 12)
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
                  Guardar
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      )}
    </Paper>
  )
}

export default CalibrationForm
