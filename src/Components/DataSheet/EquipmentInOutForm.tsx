import React, { useEffect, useState } from 'react'
import {
  Button,
  TextField,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  Box,
  Typography,
  Paper,
  IconButton
} from '@mui/material'

import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'

import { useNavigate, useParams } from 'react-router-dom'

import { ArrowBack, Download, TableChart } from '@mui/icons-material'
import AsyncSelect from 'react-select/async'
import { loadOptions, mapOptions } from '../../utils/loadOptions'

import { Profile } from '../../pages/Profiles'
import axios from 'axios'
import useAxiosPrivate from '@utils/use-axios-private'

// Interfaz para los valores del formulario
interface EquipmentFormValues {
  outReason: string
  outDate: Date | null
  inDate: Date | null
  visualOutInspection: string
  visualInInspection: string
  operationalOutTest: string
  operationalInTest: string
  observationsIn: string
  observationsOut: string
  registeredBy: string
}

// Esquema de validación para Formik
const validationSchema = Yup.object({
  outReason: Yup.string().required('El motivo de salida es obligatorio'),
  outDate: Yup.date().required('La fecha de salida es obligatoria'),
  inDate: Yup.date().required('La fecha de entrada es obligatoria'),
  visualOutInspection: Yup.string().required(
    'La inspección visual de salida es obligatoria'
  ),
  visualInInspection: Yup.string().required(
    'La inspección visual de entrada es obligatoria'
  ),
  operationalOutTest: Yup.string().required(
    'La prueba operativa de salida es obligatoria'
  ),
  operationalInTest: Yup.string().required(
    'La prueba operativa de entrada es obligatoria'
  ),
  observationsOut: Yup.string(),
  observationsIn: Yup.string(),
  registeredBy: Yup.string().required('El registro por es obligatorio')
})

const EquipmentForm: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [isEquipmentOut, setIsEquipmentOut] = useState<boolean>(false)
  const [lastRecord, setLastRecord] = useState<Record<any, any>>({})

  const fetchEquipmentStatus = async () => {
    try {
      const response = await axiosPrivate.get(`/dataSheet/${id}/status`, {})

      if (response.statusText === 'OK') {
        if (response.data.status === 'busy') {
          setIsEquipmentOut(true)
          setLastRecord(response.data.lastRecord[0])
        }

        if (response.data.status === 'available') {
          setIsEquipmentOut(false)
          setLastRecord(response.data.lastRecord[0])
        }
      }
    } catch (error) {
      console.error('Error fetching equipment status:', error)
    }
  }

  useEffect(() => {
    fetchEquipmentStatus()
  }, [id])

  const handleSubmit = async (values: EquipmentFormValues) => {
    try {
      const endpoint = `/equipmentInOut`
      const method = !isEquipmentOut ? 'post' : 'put'
      setIsEquipmentOut(!isEquipmentOut)

      const response = await axiosPrivate({
        method,
        url: endpoint,
        data: {
          ...values,
          equipmentId: id
        }
      })

      if (method === 'post' && response.status === 201) {
        setLastRecord(response.data)
      }
    } catch (error) {
      console.error('Error al enviar el formulario:', error)
    }
  }

  return (
    <Paper elevation={3} sx={{ p: 4, mt: 4 }} style={{ width: '100%' }}>
      <Box
        sx={{
          display: 'flex', // Hace que los íconos se dispongan en una fila
          alignItems: 'center', // Alinea verticalmente en el centro
          justifyContent: 'space-between', // Alinea horizontalmente en el centro
          mb: 2 // Margen inferior
        }}
      >
        <IconButton onClick={() => navigate('/datasheets')}>
          <ArrowBack />
        </IconButton>
        <div>
          <IconButton
            onClick={() => navigate('/dataSheets/' + id + '/in-out-table')}
          >
            <TableChart />
          </IconButton>
          <IconButton
            onClick={() => navigate('/dataSheets/' + id + '/in-out-report')}
          >
            <Download />
          </IconButton>
        </div>
      </Box>
      <Typography variant='h4' gutterBottom>
        {!isEquipmentOut ? 'Salida de Equipo' : 'Entrada de Equipo'}
      </Typography>
      <Formik
        initialValues={{
          outReason: '',
          outDate: new Date(),
          inDate: new Date(),
          visualOutInspection: '',
          visualInInspection: '',
          operationalOutTest: '',
          operationalInTest: '',
          observationsIn: '',
          observationsOut: '',
          registeredBy: ''
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({
          values,
          errors,
          touched,
          handleChange,
          handleBlur,
          setFieldValue
        }) => (
          <Form>
            <Grid container spacing={2}>
              {/* Campo: Motivo de Salida */}
              {!isEquipmentOut && (
                <Grid item xs={12} sm={6}>
                  <FormControl
                    fullWidth
                    error={Boolean(touched.outReason && errors.outReason)}
                  >
                    <InputLabel id='outReason-label'>
                      Motivo de Salida
                    </InputLabel>
                    <Field
                      name='outReason'
                      as={Select}
                      labelId='outReason-label'
                      label='Motivo de Salida'
                      value={values.outReason}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    >
                      <MenuItem value='Servicio de Calibracion'>
                        Servicio de Calibración
                      </MenuItem>
                      <MenuItem value='Calibracion Clientes'>
                        Calibración Clientes
                      </MenuItem>
                      <MenuItem value='Mantenimiento'>Mantenimiento</MenuItem>
                      <MenuItem value='Reparacion'>Reparación</MenuItem>
                    </Field>
                    <FormHelperText>
                      {touched.outReason && errors.outReason}
                    </FormHelperText>
                  </FormControl>
                </Grid>
              )}

              {/* Campos relacionados con la salida */}
              {!isEquipmentOut && (
                <>
                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label='Fecha de salida'
                      value={values.outDate}
                      onChange={(newValue) =>
                        setFieldValue('outDate', newValue)
                      }
                      slotProps={{
                        textField: {
                          error: Boolean(touched.outDate && errors.outDate),
                          helperText:
                            touched.outDate && errors.outDate
                              ? String(errors.outDate)
                              : null
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl
                      fullWidth
                      error={Boolean(
                        touched.visualOutInspection &&
                          errors.visualOutInspection
                      )}
                    >
                      <InputLabel id='visualOutInspection-label'>
                        Inspección Visual de Salida
                      </InputLabel>
                      <Field
                        name='visualOutInspection'
                        as={Select}
                        labelId='visualOutInspection-label'
                        label='Inspección Visual de Salida'
                        value={values.visualOutInspection}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <MenuItem value='Bueno'>Bueno</MenuItem>
                        <MenuItem value='Malo'>Malo</MenuItem>
                      </Field>
                      <FormHelperText>
                        {touched.visualOutInspection &&
                          errors.visualOutInspection}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl
                      fullWidth
                      error={Boolean(
                        touched.operationalOutTest && errors.operationalOutTest
                      )}
                    >
                      <InputLabel id='operationalOutTest-label'>
                        Prueba Operativa de Salida
                      </InputLabel>
                      <Field
                        name='operationalOutTest'
                        as={Select}
                        labelId='operationalOutTest-label'
                        label='Prueba Operativa de Salida'
                        value={values.operationalOutTest}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <MenuItem value='Funciona'>Funciona</MenuItem>
                        <MenuItem value='No Funciona'>No Funciona</MenuItem>
                        <MenuItem value='No Aplica'>No Aplica</MenuItem>
                      </Field>
                      <FormHelperText>
                        {touched.operationalOutTest &&
                          errors.operationalOutTest}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      name='observationsOut'
                      as={TextField}
                      label='Observaciones de Salida'
                      variant='outlined'
                      multiline
                      rows={4}
                      fullWidth
                      error={Boolean(
                        touched.observationsOut && errors.observationsOut
                      )}
                      helperText={
                        touched.observationsOut && errors.observationsOut
                      }
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <AsyncSelect
                      cacheOptions
                      defaultOptions
                      placeholder='Buscar Perfil'
                      loadOptions={(inputValue) =>
                        loadOptions<Profile>(inputValue, 'profiles', (item) =>
                          mapOptions(item, 'id', 'name')
                        )
                      }
                      onChange={(selectedOption: any) => {
                        console.log(selectedOption)
                        // Actualiza el valor de registeredBy en Formik
                        setFieldValue(
                          'registeredBy',
                          selectedOption ? selectedOption.label : ''
                        )
                      }}
                      // onBlur={() => setFieldTouched('registeredBy', true)}
                      value={
                        values.registeredBy
                          ? {
                              value: values.registeredBy,
                              label: values.registeredBy
                            }
                          : null
                      }
                    />
                    {touched.registeredBy && errors.registeredBy ? (
                      <FormHelperText error>
                        {errors.registeredBy}
                      </FormHelperText>
                    ) : null}
                  </Grid>
                </>
              )}

              {/* Campos relacionados con la entrada */}
              {isEquipmentOut && (
                <>
                  <Grid item xs={12} sm={12}>
                    <DatePicker
                      label='Fecha de entrada'
                      value={values.inDate}
                      onChange={(newValue) => setFieldValue('inDate', newValue)}
                      slotProps={{
                        textField: {
                          error: Boolean(touched.outDate && errors.outDate),
                          helperText:
                            touched.outDate && errors.outDate
                              ? String(errors.outDate)
                              : null
                        }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl
                      fullWidth
                      error={Boolean(
                        touched.visualInInspection && errors.visualInInspection
                      )}
                    >
                      <InputLabel id='visualInInspection-label'>
                        Inspección Visual de Entrada
                      </InputLabel>
                      <Field
                        name='visualInInspection'
                        as={Select}
                        labelId='visualInInspection-label'
                        label='Inspección Visual de Entrada'
                        value={values.visualInInspection}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <MenuItem value='Bueno'>Bueno</MenuItem>
                        <MenuItem value='Malo'>Malo</MenuItem>
                      </Field>
                      <FormHelperText>
                        {touched.visualInInspection &&
                          errors.visualInInspection}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl
                      fullWidth
                      error={Boolean(
                        touched.operationalInTest && errors.operationalInTest
                      )}
                    >
                      <InputLabel id='operationalInTest-label'>
                        Prueba Operativa de Entrada
                      </InputLabel>
                      <Field
                        name='operationalInTest'
                        as={Select}
                        labelId='operationalInTest-label'
                        label='Prueba Operativa de Entrada'
                        value={values.operationalInTest}
                        onChange={handleChange}
                        onBlur={handleBlur}
                      >
                        <MenuItem value='Funciona'>Funciona</MenuItem>
                        <MenuItem value='No Funciona'>No Funciona</MenuItem>
                        <MenuItem value='No Aplica'>No Aplica</MenuItem>
                      </Field>
                      <FormHelperText>
                        {touched.operationalInTest && errors.operationalInTest}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <Field
                      name='observationsIn'
                      as={TextField}
                      label='Observaciones de Entrada'
                      variant='outlined'
                      multiline
                      rows={4}
                      fullWidth
                      error={Boolean(
                        touched.observationsIn && errors.observationsIn
                      )}
                      helperText={
                        touched.observationsIn && errors.observationsIn
                      }
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                  </Grid>
                </>
              )}

              {/* Otros campos */}

              <Grid item xs={12}>
                <Button
                  type='button'
                  variant='outlined'
                  onClick={() => handleSubmit(values)}
                >
                  {!isEquipmentOut ? 'Registrar Salida' : 'Registrar Entrada'}
                </Button>
              </Grid>
            </Grid>
          </Form>
        )}
      </Formik>
      {isEquipmentOut && lastRecord && (
        <Grid item xs={12} mt={2}>
          <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography variant='h5' gutterBottom>
              Información de Salida
            </Typography>
            <>
              <Typography variant='body1'>
                <strong>Fecha de Salida:</strong>{' '}
                {new Date(lastRecord.outDate).toLocaleDateString()}
              </Typography>
              <Typography variant='body2'>
                <strong>Motivo de Salida:</strong> {lastRecord.outReason}
              </Typography>
              <Typography variant='body1'>
                <strong>Inspeccion Visual:</strong>{' '}
                {lastRecord.visualOutInspection}
              </Typography>
              <Typography variant='body2'>
                <strong>Prueba de Operación:</strong>{' '}
                {lastRecord.operationalOutTest}
              </Typography>
              <Typography variant='body1'>
                <strong>Observaciones de salida:</strong>{' '}
                {lastRecord.observationsOut}
              </Typography>
              <Typography variant='body2'>
                <strong>Registrado Por:</strong> {lastRecord.registeredBy}
              </Typography>
            </>
          </Box>
        </Grid>
      )}
      {!lastRecord && (
        <Grid item xs={12} mt={2}>
          <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography variant='h5' gutterBottom>
              Información Ultima Entrada
            </Typography>
            <Typography variant='body1'>
              <strong>Fecha de Entrada:</strong> Sin Información
            </Typography>
            <Typography variant='body1'>
              <strong>Motivo de Salida:</strong> Sin Información
            </Typography>
            <Typography variant='body1'>
              <strong>Inspeccion Visual:</strong> Sin Información
            </Typography>
          </Box>
        </Grid>
      )}
      {!isEquipmentOut && lastRecord && (
        <Grid item xs={12} mt={2}>
          <Box sx={{ p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
            <Typography variant='h5' gutterBottom>
              Información Ultima Entrada
            </Typography>
            <>
              <Typography variant='body1'>
                <strong>Fecha de Entrada:</strong>{' '}
                {new Date(lastRecord.inDate).toLocaleDateString()}
              </Typography>
              <Typography>
                <strong>Motivo de Salida:</strong> {lastRecord.outReason}
              </Typography>
              <Typography>
                <strong>Inspeccion Visual:</strong>{' '}
                {lastRecord.visualInInspection}
              </Typography>
              <Typography>
                <strong>Prueba de Operación:</strong>{' '}
                {lastRecord.operationalInTest}
              </Typography>
              <Typography>
                <strong>Observaciones de entrada:</strong>{' '}
                {lastRecord.observationsIn}
              </Typography>
              <Typography>
                <strong>Registrado Por:</strong> {lastRecord.registeredBy}
              </Typography>
            </>
          </Box>
        </Grid>
      )}
    </Paper>
  )
}

export default EquipmentForm
