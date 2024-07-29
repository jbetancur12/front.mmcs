import React, { useEffect, useState } from 'react'
import {
  TextField,
  Typography,
  Grid,
  Paper,
  Divider,
  Button,
  Box
} from '@mui/material'
import { useFormik } from 'formik'
import * as yup from 'yup'
import axios from 'axios'
import { api } from '../../config'
import { bigToast } from '../ExcelManipulation/Utils'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { InspectionHistoryData } from './InspectionMaintenance'

// Definir los tipos para los valores del formulario
export interface InspectionMaintenanceData {
  equipmentId: string
  date: string
  estadoCondicionesAmbientales: string
  estadoSuperficieExterna: string
  estadoConexionElectrica: string
  estadoCambioDePoder: string
  voltaje: string
  verificarFusibles: string
  tarjetasElectronicas: string
  conexionesYSoldaduras: string
  estadoValvulaAireComprimido: string
  limpiezaFiltros: string
  lubricacionRodamientos: string
  sujecionTornillos: string
  limpiezaSensoresOLentes: string
  bandasDeTraccionOMovimiento: string
  estadoManguerasDeAire: string
  funcionamientoSensores: string
  comprobacionOperacion: string
  conclusion: string
  comentarios: string
  elaboradoPor: string
}

// Definir los tipos para la información básica del equipo
interface EquipmentInfo {
  equipmentName: string
  internalCode: string
  brand: string
  model: string
  serviceType: string
  serialNumber: string
}

// Definir el esquema de validación con yup
const validationSchema = yup.object().shape({
  equipmentId: yup.number().required('ID del equipo es obligatorio'),
  date: yup.date().required('Fecha es obligatoria'),
  estadoCondicionesAmbientales: yup
    .string()
    .required('Estado condiciones ambientales es obligatorio'),
  estadoSuperficieExterna: yup
    .string()
    .required('Estado superficie externa es obligatorio'),
  estadoConexionElectrica: yup
    .string()
    .required('Estado de conexión eléctrica es obligatorio'),
  estadoCambioDePoder: yup
    .string()
    .required('Estado de cambio de poder es obligatorio'),
  voltaje: yup.string().required('Voltaje es obligatorio'),
  verificarFusibles: yup
    .string()
    .required('Verificación de fusibles es obligatoria'),
  tarjetasElectronicas: yup
    .string()
    .required('Tarjetas electrónicas es obligatorio'),
  conexionesYSoldaduras: yup
    .string()
    .required('Conexiones y soldaduras es obligatorio'),
  estadoValvulaAireComprimido: yup
    .string()
    .required('Estado válvula de aire comprimido es obligatorio'),
  limpiezaFiltros: yup.string().required('Limpieza de filtros es obligatoria'),
  lubricacionRodamientos: yup
    .string()
    .required('Lubricación de rodamientos es obligatoria'),
  sujecionTornillos: yup
    .string()
    .required('Sujeción de tornillos es obligatoria'),
  limpiezaSensoresOLentes: yup
    .string()
    .required('Limpieza de sensores o lentes es obligatoria'),
  bandasDeTraccionOMovimiento: yup
    .string()
    .required('Bandas de tracción o movimiento es obligatorio'),
  estadoManguerasDeAire: yup
    .string()
    .required('Estado mangueras de aire es obligatorio'),
  funcionamientoSensores: yup
    .string()
    .required('Funcionamiento de sensores es obligatorio'),
  comprobacionOperacion: yup
    .string()
    .required('Comprobación de operación es obligatorio'),
  conclusion: yup.string().required('Conclusión es obligatoria'),
  comentarios: yup.string().nullable(),
  elaboradoPor: yup.string().required('Elaborado por es obligatorio')
})

interface InspectionMaintenanceFormProps {
  tableData: InspectionHistoryData[]
  type: 'maintenance' | 'calibration'
}

const InspectionMaintenanceDataForm: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const apiUrl = api()
  const navigate = useNavigate()

  const { tableData, type } = location.state as InspectionMaintenanceFormProps

  console.log(tableData)

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
          serialNumber: response.data.serialNumber
        })
      } catch (error) {
        console.error('Error al obtener la información del equipo:', error)
      }
    }

    if (id) {
      fetchEquipmentInfo()
    }
  }, [id, apiUrl])

  const options = ['Bueno', 'Malo', 'Regular']

  const formik = useFormik<InspectionMaintenanceData>({
    initialValues: {
      equipmentId: id || '',
      date: '',
      estadoCondicionesAmbientales: '',
      estadoSuperficieExterna: '',
      estadoConexionElectrica: '',
      estadoCambioDePoder: '',
      voltaje: '',
      verificarFusibles: '',
      tarjetasElectronicas: '',
      conexionesYSoldaduras: '',
      estadoValvulaAireComprimido: '',
      limpiezaFiltros: '',
      lubricacionRodamientos: '',
      sujecionTornillos: '',
      limpiezaSensoresOLentes: '',
      bandasDeTraccionOMovimiento: '',
      estadoManguerasDeAire: '',
      funcionamientoSensores: '',
      comprobacionOperacion: '',
      conclusion: '',
      comentarios: '',
      elaboradoPor: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const response = await axios.post(
          `${apiUrl}/inspectionMaintenanceData`,
          values,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        )

        if (response.status >= 200 && response.status < 300) {
          bigToast('Mantenimiento/Inspección enviada correctamente', 'success')
          resetForm()
        } else {
          bigToast('Error al enviar mantenimiento/inspección', 'error')
        }
      } catch (error) {
        bigToast('Error al enviar mantenimiento/inspección', 'error')
        console.error('Error al enviar mantenimiento/inspección:', error)
      }
    }
  })

  return (
    <>
      <Paper elevation={3} sx={{ p: 4, mt: 4 }} style={{ width: '100%' }}>
        <Button
          variant='contained'
          color='secondary'
          onClick={() => navigate(-1)}
          sx={{ ml: 0, mb: 2 }}
        >
          Volver
        </Button>
        <Typography variant='h4' gutterBottom>
          Inspección y Mantenimiento
        </Typography>
        <Divider sx={{ mb: 4 }} />
        {equipmentInfo && (
          <Box mb={4}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography>
                  <strong>Nombre:</strong> {equipmentInfo.equipmentName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>
                  <strong>Marca:</strong> {equipmentInfo.serialNumber}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>
                  <strong>Marca:</strong> {equipmentInfo.brand}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>
                  <strong>Código Interno:</strong> {equipmentInfo.internalCode}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>
                  <strong>Modelo:</strong> {equipmentInfo.model}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography>
                  <strong>Tipo de Servicio:</strong> {equipmentInfo.serviceType}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
        <Box sx={{ p: 4, mt: 4 }} style={{ width: '100%', margin: 'auto' }}>
          <form onSubmit={formik.handleSubmit}>
            <Grid container spacing={3}>
              {/* Renderizar cada campo del formulario */}
              <Grid item xs={12} md={6}>
                <TextField
                  label='ID del equipo'
                  name='equipmentId'
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

              {/* Añadir campos específicos */}
              {[
                'estadoCondicionesAmbientales',
                'estadoSuperficieExterna',
                'estadoConexionElectrica',
                'estadoCambioDePoder',
                'voltaje',
                'verificarFusibles',
                'tarjetasElectronicas',
                'conexionesYSoldaduras',
                'estadoValvulaAireComprimido',
                'limpiezaFiltros',
                'lubricacionRodamientos',
                'sujecionTornillos',
                'limpiezaSensoresOLentes',
                'bandasDeTraccionOMovimiento',
                'estadoManguerasDeAire',
                'funcionamientoSensores',
                'comprobacionOperacion',
                'conclusion',
                'comentarios',
                'elaboradoPor'
              ].map((field) => (
                <Grid item xs={12} md={6} key={field}>
                  <TextField
                    label={field}
                    name={field}
                    value={
                      formik.values[field as keyof InspectionMaintenanceData]
                    }
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched[
                        field as keyof InspectionMaintenanceData
                      ] &&
                      Boolean(
                        formik.errors[field as keyof InspectionMaintenanceData]
                      )
                    }
                    helperText={
                      formik.touched[
                        field as keyof InspectionMaintenanceData
                      ] &&
                      formik.errors[field as keyof InspectionMaintenanceData]
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
      </Paper>
    </>
  )
}

export default InspectionMaintenanceDataForm
