import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Grid
} from '@mui/material'
import {
  Clear,
  Person,
  Email,
  LocationOn,
  Edit
} from '@mui/icons-material'

interface CustomerData {
  id?: number
  nombre: string
  identificacion: string
  direccion: string
  email: string
  telefono: string
  ciudad: string
  departamento: string
  pais: string
  active: boolean
  rol: string
}

interface EditCustomerModalProps {
  open: boolean
  customer: CustomerData | null
  onClose: () => void
  onSubmit: (customerData: CustomerData) => void
}

const EditCustomerModal: React.FC<EditCustomerModalProps> = ({
  open,
  customer,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<CustomerData>({
    nombre: '',
    identificacion: '',
    direccion: '',
    email: '',
    telefono: '',
    ciudad: '',
    departamento: '',
    pais: 'Colombia',
    active: true,
    rol: 'customer'
  })

  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Cargar datos del cliente cuando se abre el modal
  useEffect(() => {
    if (customer && open) {
      setFormData({
        ...customer
      })
    }
  }, [customer, open])

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido'
    if (!formData.identificacion.trim()) newErrors.identificacion = 'La identificación es requerida'
    if (!formData.email.trim()) newErrors.email = 'El email es requerido'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido'
    if (!formData.telefono.trim()) newErrors.telefono = 'El teléfono es requerido'
    if (!formData.direccion.trim()) newErrors.direccion = 'La dirección es requerida'
    if (!formData.ciudad.trim()) newErrors.ciudad = 'La ciudad es requerida'
    if (!formData.departamento.trim()) newErrors.departamento = 'El departamento es requerido'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData)
      handleClose()
    }
  }

  const handleClose = () => {
    setErrors({})
    onClose()
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, overflow: 'hidden' }
      }}
    >
      {/* Header colorido */}
      <Box
        sx={{
          bgcolor: '#1976d2',
          color: 'white',
          p: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Edit sx={{ fontSize: 28 }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Editar Cliente
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Modifica la información del cliente
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{ color: 'white' }}
        >
          <Clear />
        </IconButton>
      </Box>
      
      <DialogContent sx={{ 
        p: 3, 
        maxHeight: '70vh', 
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#1976d2',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: '#1565c0',
        },
      }}>
        {/* Información Personal */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Person sx={{ color: '#1976d2', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Información Personal
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre completo"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                error={!!errors.nombre}
                helperText={errors.nombre}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa'
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Identificación"
                name="identificacion"
                value={formData.identificacion}
                onChange={handleInputChange}
                error={!!errors.identificacion}
                helperText={errors.identificacion}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa'
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Información de Contacto */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Email sx={{ color: '#1976d2', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Información de Contacto
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa'
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Teléfono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                error={!!errors.telefono}
                helperText={errors.telefono}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa'
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Dirección"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                error={!!errors.direccion}
                helperText={errors.direccion}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa'
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>

        {/* Ubicación */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LocationOn sx={{ color: '#1976d2', fontSize: 20 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              Ubicación
            </Typography>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Ciudad"
                name="ciudad"
                value={formData.ciudad}
                onChange={handleInputChange}
                error={!!errors.ciudad}
                helperText={errors.ciudad}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa'
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Departamento"
                name="departamento"
                value={formData.departamento}
                onChange={handleInputChange}
                error={!!errors.departamento}
                helperText={errors.departamento}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa'
                  }
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="País"
                name="pais"
                value={formData.pais}
                onChange={handleInputChange}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    bgcolor: '#f8f9fa'
                  }
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 0, gap: 2, justifyContent: 'flex-end' }}>
        <Button 
          onClick={handleClose}
          sx={{ 
            borderRadius: 2,
            px: 3,
            py: 1,
            color: '#666',
            '&:hover': {
              bgcolor: '#f5f5f5'
            }
          }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained"
          startIcon={<Edit />}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1,
            bgcolor: '#1976d2',
            '&:hover': {
              bgcolor: '#1565c0'
            }
          }}
        >
          Actualizar Cliente
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default EditCustomerModal