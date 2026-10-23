// src/components/Admin/PersonnelFormModal.tsx
import React, { useState, useEffect } from 'react'
import {
  Alert,
  FormControlLabel,
  Stack,
  Switch,
  TextField
} from '@mui/material'
import FormDialog from '../../Components/Common/FormDialog'
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

  const handleSubmit = () => {
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
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title={
        existingPersonnel ? 'Editar persona o cargo' : 'Agregar persona o cargo'
      }
      subtitle={existingPersonnel?.name}
      submitLabel={existingPersonnel ? 'Guardar cambios' : 'Agregar'}
      onSubmit={handleSubmit}
      loading={isLoading}
      submitDisabled={!formData.name.trim() || !formData.position.trim()}
    >
      <Stack spacing={2}>
        <TextField
          autoFocus
          name='name'
          label='Nombre completo'
          fullWidth
          required
          value={formData.name}
          onChange={handleChange}
          disabled={isLoading}
        />
        <TextField
          name='position'
          label='Cargo'
          fullWidth
          required
          value={formData.position}
          onChange={handleChange}
          disabled={isLoading}
        />
        <FormControlLabel
          control={
            <Switch
              checked={formData.isActive}
              onChange={handleChange}
              name='isActive'
              sx={{
                '& .Mui-checked': { color: '#00BFA5' },
                '& .Mui-checked + .MuiSwitch-track': { bgcolor: '#00BFA5' }
              }}
            />
          }
          label='Activo'
          disabled={isLoading}
        />
        {formError && <Alert severity='error'>{formError}</Alert>}
      </Stack>
    </FormDialog>
  )
}
export default PersonnelFormModal
