import React, { useState } from 'react'
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Grid,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
  Divider
} from '@mui/material'
import { Build, CheckCircle, Send, Error } from '@mui/icons-material'
import { useFormik } from 'formik'
import * as Yup from 'yup'
import {
  MaintenanceCreateRequest,
  MaintenancePriority
} from '../../types/maintenance'
import { useCreateMaintenanceTicket } from '../../hooks/useMaintenance'
import MaintenanceFileUpload from '../../Components/Maintenance/MaintenanceFileUpload'
import MaintenanceErrorBoundary from '../../Components/Maintenance/MaintenanceErrorBoundary'

const validationSchema = Yup.object({
  customerName: Yup.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .required('El nombre es requerido'),
  customerEmail: Yup.string()
    .email('Email inválido')
    .required('El email es requerido'),
  customerPhone: Yup.string()
    .min(10, 'El teléfono debe tener al menos 10 dígitos')
    .required('El teléfono es requerido'),
  equipmentType: Yup.string().required('El tipo de equipo es requerido'),
  equipmentBrand: Yup.string().required('La marca es requerida'),
  equipmentModel: Yup.string().required('El modelo es requerido'),
  equipmentSerial: Yup.string().required('El número de serie es requerido'),
  issueDescription: Yup.string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .required('La descripción del problema es requerida'),
  location: Yup.string().required('La ubicación es requerida')
})

const steps = [
  'Información Personal',
  'Datos del Equipo',
  'Descripción del Problema',
  'Confirmación'
]

const equipmentTypes = [
  'Monitor de Signos Vitales',
  'Ventilador Mecánico',
  'Desfibrilador',
  'Electrocardiografo',
  'Bomba de Infusión',
  'Oxímetro de Pulso',
  'Aspirador',
  'Autoclave',
  'Microscopio',
  'Centrífuga',
  'Incubadora',
  'Lámpara Quirúrgica',
  'Mesa Quirúrgica',
  'Equipo de Rayos X',
  'Ecógrafo',
  'Otro'
]

/**
 * MaintenanceReport component provides a public form for creating maintenance requests
 * This is accessible without authentication for customers to report equipment issues
 */
const MaintenanceReport: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0)
  const [files, setFiles] = useState<File[]>([])
  const [submissionResult, setSubmissionResult] = useState<{
    success: boolean
    ticketNumber?: string
    message: string
  } | null>(null)

  const createTicketMutation = useCreateMaintenanceTicket()

  const formik = useFormik<MaintenanceCreateRequest>({
    initialValues: {
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      equipmentType: '',
      equipmentBrand: '',
      equipmentModel: '',
      equipmentSerial: '',
      issueDescription: '',
      location: '',
      files: []
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const submitData = {
          ...values,
          priority: MaintenancePriority.MEDIUM,
          files: files
        }

        const result = await createTicketMutation.mutateAsync(submitData)

        setSubmissionResult({
          success: true,
          ticketNumber:
            result?.ticketNumber || result?.ticket?.ticketCode || 'Sin número',
          message:
            'Solicitud enviada exitosamente. Su ticket ha sido creado y está pendiente de asignación. Recibirá una confirmación por email.'
        })

        // Reset form
        formik.resetForm()
        setFiles([])
        setActiveStep(0)
      } catch (error: any) {
        console.error('Maintenance form submission error:', error)
        let errorMessage = 'Error al enviar la solicitud. Intente nuevamente.'

        if (error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error
        } else if (error.message) {
          errorMessage = error.message
        }

        setSubmissionResult({
          success: false,
          message: errorMessage
        })
      }
    }
  })

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1)
    }
  }

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1)
    }
  }

  const handleFilesChange = (newFiles: File[]) => {
    setFiles((prev) => [...prev, ...newFiles])
  }

  const handleFileRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return (
          !formik.errors.customerName &&
          !formik.errors.customerEmail &&
          !formik.errors.customerPhone &&
          formik.values.customerName &&
          formik.values.customerEmail &&
          formik.values.customerPhone
        )
      case 1:
        return (
          !formik.errors.equipmentType &&
          !formik.errors.equipmentBrand &&
          !formik.errors.equipmentModel &&
          !formik.errors.equipmentSerial &&
          formik.values.equipmentType &&
          formik.values.equipmentBrand &&
          formik.values.equipmentModel &&
          formik.values.equipmentSerial
        )
      case 2:
        return (
          !formik.errors.issueDescription &&
          !formik.errors.location &&
          formik.values.issueDescription &&
          formik.values.location
        )
      case 3:
        return true
      default:
        return false
    }
  }

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom>
                Información de Contacto
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name='customerName'
                label='Nombre Completo'
                value={formik.values.customerName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.customerName &&
                  Boolean(formik.errors.customerName)
                }
                helperText={
                  formik.touched.customerName && formik.errors.customerName
                }
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name='customerEmail'
                label='Email'
                type='email'
                value={formik.values.customerEmail}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.customerEmail &&
                  Boolean(formik.errors.customerEmail)
                }
                helperText={
                  formik.touched.customerEmail && formik.errors.customerEmail
                }
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name='customerPhone'
                label='Teléfono'
                value={formik.values.customerPhone}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.customerPhone &&
                  Boolean(formik.errors.customerPhone)
                }
                helperText={
                  formik.touched.customerPhone && formik.errors.customerPhone
                }
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name='location'
                label='Ubicación del Equipo'
                value={formik.values.location}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.location && Boolean(formik.errors.location)
                }
                helperText={formik.touched.location && formik.errors.location}
                required
              />
            </Grid>
          </Grid>
        )

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom>
                Información del Equipo
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Tipo de Equipo</InputLabel>
                <Select
                  name='equipmentType'
                  value={formik.values.equipmentType}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.equipmentType &&
                    Boolean(formik.errors.equipmentType)
                  }
                  label='Tipo de Equipo'
                >
                  {equipmentTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name='equipmentBrand'
                label='Marca'
                value={formik.values.equipmentBrand}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.equipmentBrand &&
                  Boolean(formik.errors.equipmentBrand)
                }
                helperText={
                  formik.touched.equipmentBrand && formik.errors.equipmentBrand
                }
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name='equipmentModel'
                label='Modelo'
                value={formik.values.equipmentModel}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.equipmentModel &&
                  Boolean(formik.errors.equipmentModel)
                }
                helperText={
                  formik.touched.equipmentModel && formik.errors.equipmentModel
                }
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                name='equipmentSerial'
                label='Número de Serie'
                value={formik.values.equipmentSerial}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.equipmentSerial &&
                  Boolean(formik.errors.equipmentSerial)
                }
                helperText={
                  formik.touched.equipmentSerial &&
                  formik.errors.equipmentSerial
                }
                required
              />
            </Grid>
          </Grid>
        )

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom>
                Descripción del Problema
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                name='issueDescription'
                label='Describa el problema detalladamente'
                value={formik.values.issueDescription}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.issueDescription &&
                  Boolean(formik.errors.issueDescription)
                }
                helperText={
                  formik.touched.issueDescription &&
                  formik.errors.issueDescription
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant='subtitle2' gutterBottom>
                Archivos Adjuntos (Opcional)
              </Typography>
              <MaintenanceFileUpload
                files={files.map((file, index) => ({
                  id: index.toString(),
                  ticketId: '',
                  fileName: file.name,
                  originalName: file.name,
                  fileType: file.type,
                  fileSize: file.size,
                  filePath: '',
                  uploadedBy: '',
                  uploadedAt: '',
                  isImage: file.type.startsWith('image/'),
                  isVideo: file.type.startsWith('video/')
                }))}
                onFilesChange={handleFilesChange}
                onFileRemove={(fileId) => handleFileRemove(parseInt(fileId))}
                maxFiles={5}
                maxSizeInMB={10}
              />
            </Grid>
          </Grid>
        )

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant='h6' gutterBottom>
                Confirmación de Datos
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Card variant='outlined'>
                <CardContent>
                  <Typography variant='subtitle1' gutterBottom>
                    Información de Contacto
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    <strong>Nombre:</strong> {formik.values.customerName}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    <strong>Email:</strong> {formik.values.customerEmail}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    <strong>Teléfono:</strong> {formik.values.customerPhone}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    <strong>Ubicación:</strong> {formik.values.location}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant='subtitle1' gutterBottom>
                    Información del Equipo
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    <strong>Tipo:</strong> {formik.values.equipmentType}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    <strong>Marca:</strong> {formik.values.equipmentBrand}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    <strong>Modelo:</strong> {formik.values.equipmentModel}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    <strong>Serie:</strong> {formik.values.equipmentSerial}
                  </Typography>

                  <Divider sx={{ my: 2 }} />

                  <Typography variant='subtitle1' gutterBottom>
                    Problema Reportado
                  </Typography>
                  <Typography variant='body2' color='text.secondary' paragraph>
                    {formik.values.issueDescription}
                  </Typography>

                  {files.length > 0 && (
                    <>
                      <Divider sx={{ my: 2 }} />
                      <Typography variant='subtitle1' gutterBottom>
                        Archivos Adjuntos
                      </Typography>
                      <Box display='flex' flexWrap='wrap' gap={1}>
                        {files.map((file, index) => (
                          <Chip
                            key={index}
                            label={file.name}
                            size='small'
                            variant='outlined'
                            color='primary'
                          />
                        ))}
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )

      default:
        return null
    }
  }

  if (submissionResult) {
    return (
      <Container maxWidth='md' sx={{ py: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Box textAlign='center'>
            {submissionResult.success ? (
              <>
                <CheckCircle color='success' sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant='h4' gutterBottom color='success.main'>
                  ¡Solicitud Enviada!
                </Typography>
                <Typography variant='h6' gutterBottom>
                  Número de Ticket:{' '}
                  <strong>{submissionResult.ticketNumber}</strong>
                </Typography>
                <Typography variant='body1' color='text.secondary' paragraph>
                  {submissionResult.message}
                </Typography>
                <Typography variant='body2' color='text.secondary' paragraph>
                  Puede hacer seguimiento de su solicitud usando el número de
                  ticket en la página de seguimiento.
                </Typography>
                <Box mt={3}>
                  <Button
                    variant='contained'
                    onClick={() =>
                      (window.location.href = '/maintenance/tracking')
                    }
                    sx={{ mr: 2 }}
                  >
                    Hacer Seguimiento
                  </Button>
                  <Button
                    variant='outlined'
                    onClick={() => setSubmissionResult(null)}
                  >
                    Nueva Solicitud
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Error color='error' sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant='h4' gutterBottom color='error.main'>
                  Error al Enviar
                </Typography>
                <Typography variant='body1' color='text.secondary' paragraph>
                  {submissionResult.message}
                </Typography>
                <Button
                  variant='contained'
                  onClick={() => setSubmissionResult(null)}
                >
                  Intentar Nuevamente
                </Button>
              </>
            )}
          </Box>
        </Paper>
      </Container>
    )
  }

  return (
    <MaintenanceErrorBoundary>
      <Container maxWidth='md' sx={{ py: 4 }}>
        {/* @ts-ignore - Material-UI Paper type compatibility issue */}
        <Paper elevation={3} sx={{ p: 4 }}>
          {/* Header */}
          <Box textAlign='center' mb={4}>
            <Build color='primary' sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant='h4' gutterBottom>
              Solicitud de Mantenimiento
            </Typography>
            <Typography variant='body1' color='text.secondary'>
              Complete el siguiente formulario para reportar un problema con su
              equipo médico
            </Typography>
          </Box>

          {/* Stepper */}
          <Box sx={{ mb: 4 }}>
            <Stepper activeStep={activeStep}>
              {steps.map(
                (label: string, index: number): React.JSX.Element => (
                  <Step key={`step-${index}`}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                )
              )}
            </Stepper>
          </Box>

          {/* Loading indicator */}
          {createTicketMutation.isLoading && (
            <Box mb={2}>
              <LinearProgress />
              <Typography variant='body2' textAlign='center' mt={1}>
                Enviando solicitud...
              </Typography>
            </Box>
          )}

          {/* Error display */}
          {!!createTicketMutation.error && (
            <Alert severity='error' sx={{ mb: 2 }}>
              Error al enviar la solicitud. Verifique los datos e intente
              nuevamente.
            </Alert>
          )}

          {/* Form content */}
          <form onSubmit={formik.handleSubmit}>
            <Box mb={4}>{renderStepContent(activeStep)}</Box>

            {/* Navigation buttons */}
            <Box display='flex' justifyContent='space-between'>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant='outlined'
              >
                Anterior
              </Button>

              {activeStep === steps.length - 1 ? (
                <Button
                  type='submit'
                  variant='contained'
                  disabled={!formik.isValid || createTicketMutation.isLoading}
                  endIcon={<Send />}
                >
                  Enviar Solicitud
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  variant='contained'
                  disabled={!isStepValid(activeStep)}
                >
                  Siguiente
                </Button>
              )}
            </Box>
          </form>
        </Paper>
      </Container>
    </MaintenanceErrorBoundary>
  )
}

export default MaintenanceReport
