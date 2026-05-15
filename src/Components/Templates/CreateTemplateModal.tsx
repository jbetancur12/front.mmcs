// Enhanced Create Template Modal with Modern Design
import React, { useState } from 'react'
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Alert,
  Box
} from '@mui/material'
import { TemplateData, TemplateValidationErrors } from './types'
import { ModernDialog, FieldGroup, ModernTextField } from './styles'
import {
  validateTemplateComprehensive,
  validateField,
  formatCellReference
} from './validation'

interface CreateTemplateModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (templateData: TemplateData) => void
}

const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  open,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<TemplateData>({
    name: '',
    description: '',
    password: '',
    city: '',
    location: '',
    sede: '',
    activoFijo: '',
    serie: '',
    solicitante: '',
    instrumento: '',
    calibrationDate: ''
  })

  const [validationErrors, setValidationErrors] =
    useState<TemplateValidationErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Comprehensive validation using validation schema
  const validateForm = (): boolean => {
    const errors = validateTemplateComprehensive(formData)
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle input changes with real-time validation
  const handleInputChange =
    (field: keyof TemplateData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value

      // Format cell references automatically for non-text fields
      if (
        field !== 'name' &&
        field !== 'description' &&
        field !== 'password' &&
        value
      ) {
        value = formatCellReference(value)
      }

      const updatedData = { ...formData, [field]: value }
      setFormData(updatedData)

      // Real-time validation for this field
      const fieldError = validateField(field, value, updatedData)
      setValidationErrors((prev) => {
        const newErrors = { ...prev }
        if (fieldError) {
          newErrors[field] = fieldError
        } else {
          delete newErrors[field]
        }
        return newErrors
      })
    }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      handleClose()
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle modal close
  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      password: '',
      city: '',
      location: '',
      sede: '',
      activoFijo: '',
      serie: '',
      solicitante: '',
      instrumento: '',
      calibrationDate: ''
    })
    setValidationErrors({})
    setIsSubmitting(false)
    onClose()
  }

  return (
    <ModernDialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>Crear Nueva Plantilla de Mapeo Excel</DialogTitle>

      <DialogContent>
        <Alert severity='info' sx={{ marginBottom: 4 }}>
          <Typography variant='body2'>
            <strong>¿Qué es una plantilla?</strong>
            <br />
            Una plantilla define las referencias de celdas de Excel donde se
            encuentran los datos específicos. Por ejemplo, si la ciudad está en
            la celda E45, ingresa "E45" en el campo Ciudad. Esto permite
            automatizar la lectura de archivos Excel con diferentes formatos.
          </Typography>
        </Alert>

        <form onSubmit={(e) => e.preventDefault()}>
          <Stack spacing={4}>
            {/* Basic Information Section */}
            <FieldGroup>
              <Box
                sx={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    backgroundColor: 'primary.50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 2
                  }}
                >
                  <Typography
                    variant='h6'
                    sx={{ color: 'primary.600', fontWeight: 'bold' }}
                  >
                    📝
                  </Typography>
                </Box>
                <Typography
                  variant='subtitle1'
                  sx={{ fontWeight: 600, color: 'text.primary' }}
                >
                  Información Básica
                </Typography>
              </Box>

              <Stack spacing={3}>
                <ModernTextField
                  fullWidth
                  label='Nombre de la Plantilla'
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={!!validationErrors.name}
                  helperText={validationErrors.name}
                  placeholder='Ej: Plantilla Calibración Equipos Médicos'
                  required
                />

                <ModernTextField
                  fullWidth
                  label='Descripción'
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  error={!!validationErrors.description}
                  helperText={validationErrors.description}
                  placeholder='Describe el propósito y uso de esta plantilla'
                  multiline
                  rows={3}
                  required
                />

                <ModernTextField
                  fullWidth
                  label='Contraseña'
                  type='password'
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  error={!!validationErrors.password}
                  helperText={validationErrors.password}
                  placeholder='Contraseña para proteger la plantilla'
                />
              </Stack>
            </FieldGroup>

            {/* Location Information Section */}
            <FieldGroup>
              <Box
                sx={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    backgroundColor: 'info.50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 2
                  }}
                >
                  <Typography
                    variant='h6'
                    sx={{ color: 'info.600', fontWeight: 'bold' }}
                  >
                    📍
                  </Typography>
                </Box>
                <Typography
                  variant='subtitle1'
                  sx={{ fontWeight: 600, color: 'text.primary' }}
                >
                  Referencias de Celdas - Ubicación
                </Typography>
              </Box>

              <Stack spacing={3}>
                <ModernTextField
                  fullWidth
                  label='Ciudad (Celda Excel)'
                  value={formData.city}
                  onChange={handleInputChange('city')}
                  error={!!validationErrors.city}
                  helperText={
                    validationErrors.city ||
                    'Referencia de celda donde se encuentra la ciudad'
                  }
                  placeholder='Ej: E45, B12, C7'
                  required
                />

                <ModernTextField
                  fullWidth
                  label='Ubicación (Celda Excel)'
                  value={formData.location}
                  onChange={handleInputChange('location')}
                  error={!!validationErrors.location}
                  helperText={
                    validationErrors.location ||
                    'Referencia de celda donde se encuentra la ubicación'
                  }
                  placeholder='Ej: F23, D15, A8'
                  required
                />

                <ModernTextField
                  fullWidth
                  label='Sede (Celda Excel)'
                  value={formData.sede}
                  onChange={handleInputChange('sede')}
                  error={!!validationErrors.sede}
                  helperText={
                    validationErrors.sede ||
                    'Referencia de celda donde se encuentra la sede'
                  }
                  placeholder='Ej: G12, H5, B20'
                  required
                />
              </Stack>
            </FieldGroup>

            {/* Equipment Information Section */}
            <FieldGroup>
              <Box
                sx={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    backgroundColor: 'warning.50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 2
                  }}
                >
                  <Typography
                    variant='h6'
                    sx={{ color: 'warning.600', fontWeight: 'bold' }}
                  >
                    🔧
                  </Typography>
                </Box>
                <Typography
                  variant='subtitle1'
                  sx={{ fontWeight: 600, color: 'text.primary' }}
                >
                  Referencias de Celdas - Equipo
                </Typography>
              </Box>

              <Stack spacing={3}>
                <ModernTextField
                  fullWidth
                  label='Activo Fijo (Celda Excel)'
                  value={formData.activoFijo}
                  onChange={handleInputChange('activoFijo')}
                  error={!!validationErrors.activoFijo}
                  helperText={
                    validationErrors.activoFijo ||
                    'Referencia de celda donde se encuentra el código del activo fijo'
                  }
                  placeholder='Ej: L14, M8, N22'
                />

                <ModernTextField
                  fullWidth
                  label='Serie (Celda Excel)'
                  value={formData.serie}
                  onChange={handleInputChange('serie')}
                  error={!!validationErrors.serie}
                  helperText={
                    validationErrors.serie ||
                    'Referencia de celda donde se encuentra el número de serie'
                  }
                  placeholder='Ej: K15, J9, O11'
                />

                <ModernTextField
                  fullWidth
                  label='Instrumento (Celda Excel)'
                  value={formData.instrumento}
                  onChange={handleInputChange('instrumento')}
                  error={!!validationErrors.instrumento}
                  helperText={
                    validationErrors.instrumento ||
                    'Referencia de celda donde se encuentra el tipo de instrumento'
                  }
                  placeholder='Ej: P7, Q13, R5'
                  required
                />
              </Stack>
            </FieldGroup>

            {/* Process Information Section */}
            <FieldGroup>
              <Box
                sx={{ display: 'flex', alignItems: 'center', marginBottom: 3 }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '8px',
                    backgroundColor: 'success.50',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 2
                  }}
                >
                  <Typography
                    variant='h6'
                    sx={{ color: 'success.600', fontWeight: 'bold' }}
                  >
                    ⚡
                  </Typography>
                </Box>
                <Typography
                  variant='subtitle1'
                  sx={{ fontWeight: 600, color: 'text.primary' }}
                >
                  Referencias de Celdas - Proceso
                </Typography>
              </Box>

              <Stack spacing={3}>
                <ModernTextField
                  fullWidth
                  label='Solicitante (Celda Excel)'
                  value={formData.solicitante}
                  onChange={handleInputChange('solicitante')}
                  error={!!validationErrors.solicitante}
                  helperText={
                    validationErrors.solicitante ||
                    'Referencia de celda donde se encuentra el nombre del solicitante'
                  }
                  placeholder='Ej: S10, T6, U18'
                  required
                />

                <ModernTextField
                  fullWidth
                  label='Fecha de Calibración (Celda Excel)'
                  value={formData.calibrationDate}
                  onChange={handleInputChange('calibrationDate')}
                  error={!!validationErrors.calibrationDate}
                  helperText={
                    validationErrors.calibrationDate ||
                    'Referencia de celda donde se encuentra la fecha de calibración'
                  }
                  placeholder='Ej: V12, W4, X25'
                />
              </Stack>
            </FieldGroup>

            {/* Show validation summary if there are errors */}
            {Object.keys(validationErrors).length > 0 && (
              <Alert severity='error'>
                Por favor, corrige los errores en el formulario antes de
                continuar.
              </Alert>
            )}
          </Stack>
        </form>
      </DialogContent>

      <DialogActions>
        <Button
          variant='outlined'
          onClick={handleClose}
          disabled={isSubmitting}
          sx={{ borderRadius: '12px' }}
        >
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmit}
          disabled={isSubmitting}
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            borderRadius: '12px',
            '&:hover': {
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
            }
          }}
        >
          {isSubmitting ? 'Creando...' : 'Crear Plantilla'}
        </Button>
      </DialogActions>
    </ModernDialog>
  )
}

export default CreateTemplateModal
