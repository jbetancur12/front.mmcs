import React from 'react'
import {
  TextField,
  Typography,
  Grid,
  Paper,
  Divider,
  Button,
  Switch,
  FormControlLabel
} from '@mui/material'
import { useFormik } from 'formik'
import * as yup from 'yup'

import { bigToast } from '../ExcelManipulation/Utils'
import useAxiosPrivate from '@utils/use-axios-private'

// Definir el esquema de validación con yup
const validationSchema = yup.object({
  pictureUrl: yup
    .string()
    .url('Ingrese una URL válida')
    .required('URL de la imagen es obligatoria'),
  internalCode: yup.string().required('Código interno es obligatorio'),
  equipmentName: yup.string().required('Nombre del equipo es obligatorio'),
  brand: yup.string().required('Marca es obligatoria'),
  model: yup.string().required('Modelo es obligatorio'),
  serialNumber: yup.string().required('Número de serie es obligatorio'),
  supplier: yup.string().required('Proveedor es obligatorio'),
  manual: yup.boolean().required('Este campo es obligatorio'),
  magnitude: yup.string().required('Magnitud es obligatoria'),
  units: yup.string().required('Unidades son obligatorias'),
  receivedDate: yup.date().required('Fecha de recepción es obligatoria'),
  inServiceDate: yup.date().required('Fecha en servicio es obligatoria'),
  location: yup.string().required('Ubicación es obligatoria'),
  serviceType: yup.string().required('Tipo de servicio es obligatorio'),
  equipmentStatus: yup.string().required('Estado del equipo es obligatorio'),
  operationRange: yup.string().required('Rango de operación es obligatorio'),
  accuracy: yup.string().required('Exactitud es obligatoria'),
  resolution: yup.string().required('Resolución es obligatoria'),
  softwareFirmware: yup.string().required('Software/Firmware es obligatorio'),
  storageTemperature: yup
    .string()
    .required('Temperatura de almacenamiento es obligatoria'),
  storageHumidity: yup
    .string()
    .required('Humedad de almacenamiento es obligatoria'),
  operationTemperature: yup
    .string()
    .required('Temperatura de operación es obligatoria'),
  operationHumidity: yup
    .string()
    .required('Humedad de operación es obligatoria'),
  storageOperationComment: yup
    .string()
    .required('Comentario de almacenamiento/operación es obligatorio'),
  transportConditionsComment: yup
    .string()
    .required('Comentario de condiciones de transporte es obligatorio'),
  insuredValue: yup.number().required('Valor asegurado es obligatorio'),
  maintenanceProvider: yup
    .string()
    .required('Proveedor de mantenimiento es obligatorio'),
  maintenanceCycle: yup
    .number()
    .required('Ciclo de mantenimiento es obligatorio'),
  calibrationProvider: yup
    .string()
    .required('Proveedor de calibración es obligatorio'),
  calibrationCycle: yup.number().required('Ciclo de calibración es obligatorio')
})

const EquipmentLifeCycleForm: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const formik = useFormik({
    initialValues: {
      pictureUrl: '',
      internalCode: '',
      equipmentName: '',
      brand: '',
      model: '',
      serialNumber: '',
      supplier: '',
      manual: false,
      magnitude: '',
      units: '',
      receivedDate: '',
      inServiceDate: '',
      location: '',
      serviceType: '',
      equipmentStatus: '',
      operationRange: '',
      accuracy: '',
      resolution: '',
      softwareFirmware: '',
      storageTemperature: '',
      storageHumidity: '',
      operationTemperature: '',
      operationHumidity: '',
      storageOperationComment: '',
      transportConditionsComment: '',
      insuredValue: '',
      maintenanceProvider: '',
      maintenanceCycle: '',
      calibrationProvider: '',
      calibrationCycle: ''
    },
    validationSchema: validationSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        const response = await axiosPrivate.post(`/dataSheet`, values, {})

        if (response.status >= 200 && response.status < 300) {
          // Se ha enviado correctamente la hoja de vida
          bigToast('Hoja de vida enviada correctamente', 'success')
          resetForm()
        } else {
          // Ha ocurrido un error al enviar la hoja de vida
          bigToast('Error al enviar la hoja de vida', 'error')
        }
      } catch (error) {
        // Ha ocurrido un error al enviar la hoja de vida
        bigToast('Error al enviar la hoja de vida', 'error')
        console.error('Error al enviar la hoja de vida:', error)
      }
      // Aquí se manejaría el envío de datos al backend
    }
  })

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
      <Typography variant='h4' gutterBottom>
        Hoja de Vida de Equipos
      </Typography>
      <Divider sx={{ mb: 4 }} />
      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label='URL de la Imagen'
              name='pictureUrl'
              value={formik.values.pictureUrl}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.pictureUrl && Boolean(formik.errors.pictureUrl)
              }
              helperText={formik.touched.pictureUrl && formik.errors.pictureUrl}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Código Interno'
              name='internalCode'
              value={formik.values.internalCode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.internalCode &&
                Boolean(formik.errors.internalCode)
              }
              helperText={
                formik.touched.internalCode && formik.errors.internalCode
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Nombre del Equipo'
              name='equipmentName'
              value={formik.values.equipmentName}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.equipmentName &&
                Boolean(formik.errors.equipmentName)
              }
              helperText={
                formik.touched.equipmentName && formik.errors.equipmentName
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Marca'
              name='brand'
              value={formik.values.brand}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.brand && Boolean(formik.errors.brand)}
              helperText={formik.touched.brand && formik.errors.brand}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Modelo'
              name='model'
              value={formik.values.model}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.model && Boolean(formik.errors.model)}
              helperText={formik.touched.model && formik.errors.model}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Número de Serie'
              name='serialNumber'
              value={formik.values.serialNumber}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.serialNumber &&
                Boolean(formik.errors.serialNumber)
              }
              helperText={
                formik.touched.serialNumber && formik.errors.serialNumber
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Proveedor'
              name='supplier'
              value={formik.values.supplier}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.supplier && Boolean(formik.errors.supplier)}
              helperText={formik.touched.supplier && formik.errors.supplier}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControlLabel
              control={
                <Switch
                  checked={formik.values.manual}
                  onChange={formik.handleChange}
                  name='manual'
                  onBlur={formik.handleBlur}
                  color='primary'
                />
              }
              label='Tiene Manual'
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Magnitud'
              name='magnitude'
              value={formik.values.magnitude}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.magnitude && Boolean(formik.errors.magnitude)
              }
              helperText={formik.touched.magnitude && formik.errors.magnitude}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Unidades'
              name='units'
              value={formik.values.units}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.units && Boolean(formik.errors.units)}
              helperText={formik.touched.units && formik.errors.units}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Fecha de Recepción'
              type='date'
              name='receivedDate'
              value={formik.values.receivedDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.receivedDate &&
                Boolean(formik.errors.receivedDate)
              }
              helperText={
                formik.touched.receivedDate && formik.errors.receivedDate
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Fecha de En Servicio'
              type='date'
              name='inServiceDate'
              value={formik.values.inServiceDate}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.inServiceDate &&
                Boolean(formik.errors.inServiceDate)
              }
              helperText={
                formik.touched.inServiceDate && formik.errors.inServiceDate
              }
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Ubicación'
              name='location'
              value={formik.values.location}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.location && Boolean(formik.errors.location)}
              helperText={formik.touched.location && formik.errors.location}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Tipo de Servicio'
              name='serviceType'
              value={formik.values.serviceType}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.serviceType && Boolean(formik.errors.serviceType)
              }
              helperText={
                formik.touched.serviceType && formik.errors.serviceType
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Estado del Equipo'
              name='equipmentStatus'
              value={formik.values.equipmentStatus}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.equipmentStatus &&
                Boolean(formik.errors.equipmentStatus)
              }
              helperText={
                formik.touched.equipmentStatus && formik.errors.equipmentStatus
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Rango de Operación'
              name='operationRange'
              value={formik.values.operationRange}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.operationRange &&
                Boolean(formik.errors.operationRange)
              }
              helperText={
                formik.touched.operationRange && formik.errors.operationRange
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Exactitud'
              name='accuracy'
              value={formik.values.accuracy}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.accuracy && Boolean(formik.errors.accuracy)}
              helperText={formik.touched.accuracy && formik.errors.accuracy}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Resolución'
              name='resolution'
              value={formik.values.resolution}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.resolution && Boolean(formik.errors.resolution)
              }
              helperText={formik.touched.resolution && formik.errors.resolution}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Software/Firmware'
              name='softwareFirmware'
              value={formik.values.softwareFirmware}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.softwareFirmware &&
                Boolean(formik.errors.softwareFirmware)
              }
              helperText={
                formik.touched.softwareFirmware &&
                formik.errors.softwareFirmware
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Temperatura de Almacenamiento'
              name='storageTemperature'
              value={formik.values.storageTemperature}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.storageTemperature &&
                Boolean(formik.errors.storageTemperature)
              }
              helperText={
                formik.touched.storageTemperature &&
                formik.errors.storageTemperature
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Humedad de Almacenamiento'
              name='storageHumidity'
              value={formik.values.storageHumidity}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.storageHumidity &&
                Boolean(formik.errors.storageHumidity)
              }
              helperText={
                formik.touched.storageHumidity && formik.errors.storageHumidity
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Temperatura de Operación'
              name='operationTemperature'
              value={formik.values.operationTemperature}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.operationTemperature &&
                Boolean(formik.errors.operationTemperature)
              }
              helperText={
                formik.touched.operationTemperature &&
                formik.errors.operationTemperature
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Humedad de Operación'
              name='operationHumidity'
              value={formik.values.operationHumidity}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.operationHumidity &&
                Boolean(formik.errors.operationHumidity)
              }
              helperText={
                formik.touched.operationHumidity &&
                formik.errors.operationHumidity
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Comentario de Almacenamiento/Operación'
              name='storageOperationComment'
              value={formik.values.storageOperationComment}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.storageOperationComment &&
                Boolean(formik.errors.storageOperationComment)
              }
              helperText={
                formik.touched.storageOperationComment &&
                formik.errors.storageOperationComment
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Comentario de Condiciones de Transporte'
              name='transportConditionsComment'
              value={formik.values.transportConditionsComment}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.transportConditionsComment &&
                Boolean(formik.errors.transportConditionsComment)
              }
              helperText={
                formik.touched.transportConditionsComment &&
                formik.errors.transportConditionsComment
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Valor Asegurado'
              name='insuredValue'
              value={formik.values.insuredValue}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.insuredValue &&
                Boolean(formik.errors.insuredValue)
              }
              helperText={
                formik.touched.insuredValue && formik.errors.insuredValue
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Proveedor de Mantenimiento'
              name='maintenanceProvider'
              value={formik.values.maintenanceProvider}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.maintenanceProvider &&
                Boolean(formik.errors.maintenanceProvider)
              }
              helperText={
                formik.touched.maintenanceProvider &&
                formik.errors.maintenanceProvider
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Ciclo de Mantenimiento'
              name='maintenanceCycle'
              value={formik.values.maintenanceCycle}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.maintenanceCycle &&
                Boolean(formik.errors.maintenanceCycle)
              }
              helperText={
                formik.touched.maintenanceCycle &&
                formik.errors.maintenanceCycle
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Proveedor de Calibración'
              name='calibrationProvider'
              value={formik.values.calibrationProvider}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.calibrationProvider &&
                Boolean(formik.errors.calibrationProvider)
              }
              helperText={
                formik.touched.calibrationProvider &&
                formik.errors.calibrationProvider
              }
              fullWidth
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Ciclo de Calibración'
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
            />
          </Grid>
          <Grid item xs={12}>
            <Button variant='contained' color='primary' type='submit'>
              Guardar
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  )
}

export default EquipmentLifeCycleForm
