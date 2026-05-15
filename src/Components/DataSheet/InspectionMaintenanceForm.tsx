import React, { useEffect, useState } from 'react'
import {
  TextField,
  Typography,
  Grid,
  Paper,
  Divider,
  Button,
  Box,
  MenuItem,
  Select,
  FormHelperText,
  InputLabel,
  FormControl
} from '@mui/material'
import { useFormik } from 'formik'
import * as yup from 'yup'

import { bigToast } from '../ExcelManipulation/Utils'
import { useLocation, useNavigate } from 'react-router-dom'

import AsyncSelect from 'react-select/async'
import Profile from '../../pages/Profile'
import { loadOptions, mapOptions } from '../../utils/loadOptions'
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'
import withReactContent from 'sweetalert2-react-content'

// Definir los tipos para los valores del formulario
export interface InspectionMaintenanceData {
  equipmentId: string | number
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
export interface EquipmentInfo {
  equipmentName: string
  internalCode: string
  brand: string
  model: string
  serviceType: string
  serialNumber: string
  calibrationCycle: string
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

const InspectionMaintenanceDataForm: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const location = useLocation()

  const navigate = useNavigate()

  const [equipmentInfo, setEquipmentInfo] = useState<EquipmentInfo | null>(null)

  const MySwal = withReactContent(Swal)
  const isEdit = Boolean(location.state && location.state.edit)
  const [editId, setEditId] = useState<number | null>(null)
  const equipoId = isEdit ? location.state.data.equipmentId : location.state?.id

  useEffect(() => {
    let equipoId: any = null
    if (
      isEdit &&
      location.state &&
      location.state.data &&
      location.state.data.equipmentId
    ) {
      equipoId = location.state.data.equipmentId
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
  }, [isEdit, location.state])

  useEffect(() => {
    if (location.state && location.state.edit && location.state.id) {
      // Si solo tenemos el id, pedimos los datos al backend
      const fetchEditData = async () => {
        try {
          const response = await axiosPrivate.get(
            `/inspectionMaintenance/${location.state.id}`
          )
          const data = response.data
          setEditId(data.id)
          formik.setValues({
            ...data,
            equipmentId: data.equipmentId,
            date: data.date.split('T')[0],
            comentarios: data.comments || '',
            elaboradoPor: data.verifiedBy || ''
          })
        } catch (error) {
          console.error('Error al obtener datos de edición:', error)
        }
      }
      fetchEditData()
    }
  }, [location.state])

  const options = ['Bueno', 'Malo', 'No Aplica']

  const today = new Date()
  const formattedDate = today.toISOString().split('T')[0]

  const formik = useFormik<InspectionMaintenanceData>({
    initialValues: {
      equipmentId: equipoId || '',
      date: formattedDate,
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
        let response
        if (isEdit && editId) {
          response = await axiosPrivate.put(
            `/inspectionMaintenance/${editId}`,
            { ...values, name: 'Mantenimiento' },
            {}
          )
        } else {
          response = await axiosPrivate.post(
            `/inspectionMaintenance`,
            { ...values, name: 'Mantenimiento' },
            {}
          )
        }
        if (response.status >= 200 && response.status < 300) {
          bigToast(
            isEdit
              ? 'Mantenimiento actualizado correctamente'
              : 'Mantenimiento/Inspección enviada correctamente',
            'success'
          )
          resetForm()
          navigate(`/datasheets/${equipoId}/inspection-maintenance`)
        } else {
          bigToast('Error al enviar mantenimiento/inspección', 'error')
        }
      } catch (error) {
        bigToast('Error al enviar mantenimiento/inspección', 'error')
        console.error('Error al enviar mantenimiento/inspección:', error)
      }
    }
  })

  const handleDelete = async () => {
    if (!editId) return
    const result = await MySwal.fire({
      title: '¿Está seguro que desea eliminar este mantenimiento?',
      text: 'No podrá recuperar esta información una vez eliminada',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      icon: 'warning'
    })
    if (result.isConfirmed) {
      try {
        const response = await axiosPrivate.delete(
          `/inspectionMaintenance/${editId}`
        )
        if (response.status === 204 || response.status === 200) {
          bigToast('Mantenimiento eliminado correctamente', 'success')
          navigate(-1)
        } else {
          bigToast('Error al eliminar', 'error')
        }
      } catch (error) {
        bigToast('Error al eliminar', 'error')
      }
    }
  }

  const fieldLabels: { [key in keyof InspectionMaintenanceData]: string } = {
    equipmentId: 'ID del equipo',
    date: 'Fecha',
    estadoCondicionesAmbientales: 'Estado de Condiciones Ambientales',
    estadoSuperficieExterna: 'Estado de Superficie Externa',
    estadoConexionElectrica: 'Estado de Conexión Eléctrica',
    estadoCambioDePoder: 'Estado de Cambio de Poder',
    voltaje: 'Voltaje',
    verificarFusibles: 'Verificar Fusibles',
    tarjetasElectronicas: 'Tarjetas Electrónicas',
    conexionesYSoldaduras: 'Conexiones y Soldaduras',
    estadoValvulaAireComprimido: 'Estado de Válvula de Aire Comprimido',
    limpiezaFiltros: 'Limpieza de Filtros',
    lubricacionRodamientos: 'Lubricación de Rodamientos',
    sujecionTornillos: 'Sujeción de Tornillos',
    limpiezaSensoresOLentes: 'Limpieza de Sensores o Lentes',
    bandasDeTraccionOMovimiento: 'Bandas de Tracción o Movimiento',
    estadoManguerasDeAire: 'Estado de Mangueras de Aire',
    funcionamientoSensores: 'Funcionamiento de Sensores',
    comprobacionOperacion: 'Comprobación de Operación',
    conclusion: 'Conclusión',
    comentarios: 'Comentarios',
    elaboradoPor: 'Elaborado Por'
  }

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
                'comprobacionOperacion'
              ].map((field) => (
                <Grid item xs={12} md={6} key={field}>
                  <FormControl
                    fullWidth
                    error={
                      formik.touched[
                        field as keyof InspectionMaintenanceData
                      ] &&
                      Boolean(
                        formik.errors[field as keyof InspectionMaintenanceData]
                      )
                    }
                  >
                    <InputLabel>
                      {fieldLabels[field as keyof InspectionMaintenanceData]}
                    </InputLabel>
                    <Select
                      label={
                        fieldLabels[field as keyof InspectionMaintenanceData]
                      }
                      name={field}
                      value={
                        formik.values[field as keyof InspectionMaintenanceData]
                      }
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                    >
                      {options.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {formik.touched[
                        field as keyof InspectionMaintenanceData
                      ] &&
                        formik.errors[field as keyof InspectionMaintenanceData]}
                    </FormHelperText>
                  </FormControl>
                </Grid>
              ))}

              {['conclusion', 'comentarios', 'elaboradoPor'].map((field) => {
                if (field === 'elaboradoPor') {
                  return (
                    <Grid item xs={12} md={6} key={field}>
                      <AsyncSelect
                        cacheOptions
                        defaultOptions
                        placeholder='Elaborado por'
                        loadOptions={(inputValue) =>
                          loadOptions<Profile>(inputValue, 'profiles', (item) =>
                            mapOptions(item, 'id', 'name')
                          )
                        }
                        onChange={(selectedOption: any) => {
                          formik.setFieldValue(
                            'elaboradoPor',
                            selectedOption ? selectedOption.label : ''
                          )
                        }}
                        value={
                          formik.values.elaboradoPor
                            ? {
                                value: formik.values.elaboradoPor,
                                label: formik.values.elaboradoPor
                              }
                            : null
                        }
                        styles={{
                          control: (provided: any) => ({
                            ...provided,
                            minHeight: '40px',
                            height: '55px',
                            borderColor:
                              formik.touched.elaboradoPor &&
                              formik.errors.elaboradoPor
                                ? 'red'
                                : provided.borderColor
                          })
                        }}
                        onBlur={() =>
                          formik.setFieldTouched('elaboradoPor', true)
                        }
                      />
                      {formik.touched.elaboradoPor &&
                        formik.errors.elaboradoPor && (
                          <div
                            style={{ color: 'red', fontSize: 12, marginTop: 4 }}
                          >
                            {formik.errors.elaboradoPor}
                          </div>
                        )}
                    </Grid>
                  )
                }
                return (
                  <Grid item xs={12} md={6} key={field}>
                    <TextField
                      label={
                        fieldLabels[field as keyof InspectionMaintenanceData]
                      }
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
                          formik.errors[
                            field as keyof InspectionMaintenanceData
                          ]
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
                )
              })}

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
      </Paper>
    </>
  )
}

export default InspectionMaintenanceDataForm
