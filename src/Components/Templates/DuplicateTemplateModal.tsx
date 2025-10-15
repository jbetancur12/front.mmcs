// Duplicate Template Modal Component
import React, { useState, useEffect } from 'react'
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Alert
} from '@mui/material'
import { TemplateData, TemplatesData, TemplateValidationErrors } from './types'
import { ModernDialog, FieldGroup, ModernTextField } from './styles'
import {
  validateTemplateComprehensive,
  validateField,
  formatCellReference
} from './validation'

interface DuplicateTemplateModalProps {
  open: boolean
  template: TemplatesData
  onClose: () => void
  onSubmit: (templateData: TemplateData) => void
  existingTemplates?: TemplatesData[]
}

// Generate unique duplicate name with " - Copia" suffix and number if needed
const generateDuplicateName = (
  originalName: string,
  existingTemplates: TemplatesData[] = []
): string => {
  const baseName = `${originalName} - Copia`
  const existingNames = existingTemplates.map(
    (t) => t.name?.toLowerCase() || ''
  )

  // If base name doesn't exist, use it
  if (!existingNames.includes(baseName.toLowerCase())) {
    return baseName
  }

  // Find the next available number
  let counter = 2
  let candidateName = `${baseName} ${counter}`

  while (existingNames.includes(candidateName.toLowerCase())) {
    counter++
    candidateName = `${baseName} ${counter}`
  }

  return candidateName
}

const DuplicateTemplateModal: React.FC<DuplicateTemplateModalProps> = ({
  open,
  template,
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

  // Pre-fill form with template data when modal opens
  useEffect(() => {
    if (open && template) {
      setFormData({
        name: generateDuplicateName(template.name || ''),
        description: template.description || '',
        password: template.password || '',
        city: template.city || '',
        location: template.location || '',
        sede: template.sede || '',
        activoFijo: template.activoFijo || '',
        serie: template.serie || '',
        solicitante: template.solicitante || '',
        instrumento: template.instrumento || '',
        calibrationDate: template.calibrationDate || ''
      })
    }
  }, [open, template])

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
    setValidationErrors({})
    setIsSubmitting(false)
    onClose()
  }

  return (
    <ModernDialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>
        Duplicar Plantilla de Mapeo Excel: {template?.name}
      </DialogTitle>

      <DialogContent>
        <Alert severity='info' sx={{ marginBottom: 3 }}>
          Se creará una copia de la plantilla "{template?.name}" con todas sus
          referencias de celdas Excel. Puedes modificar las referencias de
          celdas antes de guardar la nueva plantilla.
        </Alert>

        <form onSubmit={(e) => e.preventDefault()}>
          <Stack spacing={4}>
            {/* Basic Information Section */}
            <FieldGroup>
              <Typography
                variant='subtitle1'
                gutterBottom
                sx={{ marginBottom: 3 }}
              >
                Información Básica
              </Typography>

              <Stack spacing={3}>
                <ModernTextField
                  fullWidth
                  label='Nombre de la Plantilla'
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  error={!!validationErrors.name}
                  helperText={
                    validationErrors.name ||
                    'Se ha agregado " - Copia" al nombre original'
                  }
                  placeholder='Ej: Plantilla Calibración Equipos Médicos - Copia'
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
              <Typography variant='subtitle1' gutterBottom>
                Información de Ubicación
              </Typography>

              <ModernTextField
                fullWidth
                label='Ciudad'
                value={formData.city}
                onChange={handleInputChange('city')}
                error={!!validationErrors.city}
                helperText={validationErrors.city}
                placeholder='Ej: Bogotá'
                required
              />

              <ModernTextField
                fullWidth
                label='Ubicación'
                value={formData.location}
                onChange={handleInputChange('location')}
                error={!!validationErrors.location}
                helperText={validationErrors.location}
                placeholder='Ej: Zona Norte'
                required
              />

              <ModernTextField
                fullWidth
                label='Sede'
                value={formData.sede}
                onChange={handleInputChange('sede')}
                error={!!validationErrors.sede}
                helperText={validationErrors.sede}
                placeholder='Ej: Sede Principal'
                required
              />
            </FieldGroup>

            {/* Equipment Information Section */}
            <FieldGroup>
              <Typography variant='subtitle1' gutterBottom>
                Información del Equipo
              </Typography>

              <ModernTextField
                fullWidth
                label='Activo Fijo'
                value={formData.activoFijo}
                onChange={handleInputChange('activoFijo')}
                error={!!validationErrors.activoFijo}
                helperText={validationErrors.activoFijo}
                placeholder='Código del activo fijo'
              />

              <ModernTextField
                fullWidth
                label='Serie'
                value={formData.serie}
                onChange={handleInputChange('serie')}
                error={!!validationErrors.serie}
                helperText={validationErrors.serie}
                placeholder='Número de serie del equipo'
              />

              <ModernTextField
                fullWidth
                label='Instrumento'
                value={formData.instrumento}
                onChange={handleInputChange('instrumento')}
                error={!!validationErrors.instrumento}
                helperText={validationErrors.instrumento}
                placeholder='Tipo de instrumento o equipo'
                required
              />
            </FieldGroup>

            {/* Process Information Section */}
            <FieldGroup>
              <Typography variant='subtitle1' gutterBottom>
                Información del Proceso
              </Typography>

              <ModernTextField
                fullWidth
                label='Solicitante'
                value={formData.solicitante}
                onChange={handleInputChange('solicitante')}
                error={!!validationErrors.solicitante}
                helperText={validationErrors.solicitante}
                placeholder='Nombre del solicitante'
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
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            borderRadius: '12px',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
            }
          }}
        >
          {isSubmitting ? 'Duplicando...' : 'Duplicar Plantilla'}
        </Button>
      </DialogActions>
    </ModernDialog>
  )
}

export default DuplicateTemplateModal
