// Edit Template Modal Component with Modern Styling
import React, { useState, useEffect } from 'react'
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Grid,
  Box
} from '@mui/material'
import { TemplatesData, TemplateData } from './types'
import {
  ModernDialog,
  ModernTextField,
  PrimaryFormButton,
  SecondaryButton,
  FormSection,
  FieldGroup
} from './styles'

interface EditTemplateModalProps {
  open: boolean
  template: TemplatesData | null
  onClose: () => void
  onSubmit: (templateData: TemplateData) => Promise<boolean>
}

const EditTemplateModal: React.FC<EditTemplateModalProps> = ({
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
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (template) {
      setFormData({
        name: template.name || '',
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
  }, [template])

  const handleChange =
    (field: keyof TemplateData) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: event.target.value
      }))
    }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    try {
      const success = await onSubmit(formData)
      if (success) {
        onClose()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      onClose()
    }
  }

  return (
    <ModernDialog open={open} onClose={handleClose} maxWidth='md' fullWidth>
      <DialogTitle>Editar Plantilla: {template?.name}</DialogTitle>

      <DialogContent>
        <Box component='form' onSubmit={handleSubmit}>
          <FormSection>
            <Typography variant='h6' gutterBottom>
              Información General
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <ModernTextField
                  fullWidth
                  label='Nombre de la Plantilla'
                  value={formData.name}
                  onChange={handleChange('name')}
                  required
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <ModernTextField
                  fullWidth
                  label='Contraseña'
                  type='password'
                  value={formData.password}
                  onChange={handleChange('password')}
                  disabled={loading}
                />
              </Grid>
              <Grid item xs={12}>
                <ModernTextField
                  fullWidth
                  label='Descripción'
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleChange('description')}
                  disabled={loading}
                />
              </Grid>
            </Grid>
          </FormSection>

          <FormSection>
            <FieldGroup>
              <Typography variant='h6'>Información de Ubicación</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                  <ModernTextField
                    fullWidth
                    label='Ciudad'
                    value={formData.city}
                    onChange={handleChange('city')}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <ModernTextField
                    fullWidth
                    label='Ubicación'
                    value={formData.location}
                    onChange={handleChange('location')}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <ModernTextField
                    fullWidth
                    label='Sede'
                    value={formData.sede}
                    onChange={handleChange('sede')}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </FieldGroup>
          </FormSection>

          <FormSection>
            <FieldGroup>
              <Typography variant='h6'>Información del Equipo</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <ModernTextField
                    fullWidth
                    label='Activo Fijo'
                    value={formData.activoFijo}
                    onChange={handleChange('activoFijo')}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ModernTextField
                    fullWidth
                    label='Serie'
                    value={formData.serie}
                    onChange={handleChange('serie')}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ModernTextField
                    fullWidth
                    label='Instrumento'
                    value={formData.instrumento}
                    onChange={handleChange('instrumento')}
                    disabled={loading}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <ModernTextField
                    fullWidth
                    label='Solicitante'
                    value={formData.solicitante}
                    onChange={handleChange('solicitante')}
                    disabled={loading}
                  />
                </Grid>
              </Grid>
            </FieldGroup>
          </FormSection>

          <FormSection>
            <ModernTextField
              fullWidth
              label='Fecha de Calibración (Celda Excel)'
              value={formData.calibrationDate}
              onChange={handleChange('calibrationDate')}
              placeholder='Ej: V12, W4, X25'
              helperText='Referencia de celda donde se encuentra la fecha de calibración'
              disabled={loading}
            />
          </FormSection>
        </Box>
      </DialogContent>

      <DialogActions>
        <SecondaryButton onClick={handleClose} disabled={loading}>
          Cancelar
        </SecondaryButton>
        <PrimaryFormButton onClick={handleSubmit} disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar Cambios'}
        </PrimaryFormButton>
      </DialogActions>
    </ModernDialog>
  )
}

export default EditTemplateModal
