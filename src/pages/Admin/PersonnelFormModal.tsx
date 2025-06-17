// src/components/Admin/PersonnelFormModal.tsx
import React, { useState, useEffect, FormEvent } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Box,
  IconButton,
  Alert,
  Switch,
  FormControlLabel
} from '@mui/material'
import { Save, Cancel, Close as CloseIcon } from '@mui/icons-material'
import { Personnel } from './PersonnelManagementPage' // Asumiendo que el tipo está en la página

interface PersonnelFormModalProps {
  open: boolean
  onClose: () => void
  onSave: (person: Omit<Personnel, 'id'> | Personnel) => void
  existingPersonnel?: Personnel | null
  isLoading?: boolean
}

const PersonnelFormModal: React.FC<PersonnelFormModalProps> = ({
  open,
  onClose,
  onSave,
  existingPersonnel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<Omit<Personnel, 'id'>>({
    name: '',
    position: '',
    email: '',
    phone: '',
    isActive: true
  })
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setFormError(null)
      if (existingPersonnel) {
        setFormData({
          name: existingPersonnel.name,
          position: existingPersonnel.position,
          email: existingPersonnel.email || '',
          phone: existingPersonnel.phone || '',
          isActive: existingPersonnel.isActive
        })
      } else {
        setFormData({
          name: '',
          position: '',
          email: '',
          phone: '',
          isActive: true
        })
      }
    }
  }, [open, existingPersonnel])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.position.trim()) {
      setFormError('El nombre y el cargo son obligatorios.')
      return
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFormError('Por favor, ingrese un correo electrónico válido.')
      return
    }
    onSave({ ...(existingPersonnel || {}), ...formData })
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      PaperProps={{ component: 'form', onSubmit: handleSubmit }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        {existingPersonnel ? 'Editar Persona/Cargo' : 'Agregar Persona/Cargo'}
        <IconButton aria-label='close' onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                margin='dense'
                name='name'
                label='Nombre Completo *'
                fullWidth
                required
                value={formData.name}
                onChange={handleChange}
                disabled={isLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin='dense'
                name='position'
                label='Cargo *'
                fullWidth
                required
                value={formData.position}
                onChange={handleChange}
                disabled={isLoading}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleChange}
                    name='isActive'
                  />
                }
                label='Activo'
                disabled={isLoading}
              />
            </Grid>
          </Grid>
          {formError && (
            <Alert severity='error' sx={{ mt: 2 }}>
              {formError}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: '16px 24px' }}>
        <Button
          onClick={onClose}
          startIcon={<Cancel />}
          color='inherit'
          disabled={isLoading}
        >
          Cancelar
        </Button>
        <Button
          type='submit'
          variant='contained'
          startIcon={
            isLoading ? (
              <CircularProgress size={20} color='inherit' />
            ) : (
              <Save />
            )
          }
          disabled={isLoading || !formData.name || !formData.position}
        >
          {isLoading
            ? 'Guardando...'
            : existingPersonnel
              ? 'Guardar Cambios'
              : 'Agregar'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
export default PersonnelFormModal
