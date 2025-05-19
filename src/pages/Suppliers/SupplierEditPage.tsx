import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Paper,
  Grid,
  Button,
  Box,
  CircularProgress,
  Alert,
  TextField,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { Save, Cancel } from '@mui/icons-material'
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { isAxiosError } from 'axios'
import { SelectChangeEvent } from '@mui/material/Select'

// Asumiendo que tienes una interfaz similar a esta para el proveedor
interface Supplier {
  id: number
  name: string
  taxId: string
  typePerson: 0 | 1 // 0 Jurídico, 1 Natural
  contactName: string
  email: string
  phone: string
  applyRetention?: boolean
  // No necesitamos los documentos aquí para la edición de datos principales
}

const SupplierEditPage: React.FC = () => {
  const { supplierId } = useParams<{ supplierId: string }>()
  const navigate = useNavigate()
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  // Estado para los datos del formulario
  const [formData, setFormData] = useState<Partial<Supplier>>({})

  // Fetch supplier details using useQuery
  const {
    data: supplier,
    isLoading: isLoadingSupplier,
    error: supplierError
  } = useQuery<Supplier, Error>(
    ['supplierDetails', supplierId], // Misma key que en la página de detalles para compartir cache
    async () => {
      const response = await axiosPrivate.get<Supplier>(
        `/suppliers/${supplierId}`
      )
      return response.data
    },
    {
      enabled: !!supplierId, // Solo ejecutar si supplierId existe
      onSuccess: (data) => {
        // Cuando los datos se cargan, inicializa el estado del formulario
        setFormData(data)
      },
      onError: (err) => {
        console.error('Error fetching supplier details for edit:', err)
        // Opcional: Mostrar un error al usuario
        Swal.fire(
          'Error',
          'No se pudieron cargar los datos del proveedor para editar.',
          'error'
        )
      }
    }
  )

  // Mutation for updating supplier details
  const updateSupplierMutation = useMutation(
    async (updatedData: Partial<Supplier>) => {
      // Asume un endpoint PATCH o PUT para actualizar el proveedor
      const response = await axiosPrivate.patch(
        `/suppliers/${supplierId}`,
        updatedData
      )
      return response.data
    },
    {
      onSuccess: () => {
        Swal.fire('Éxito', 'Proveedor actualizado correctamente.', 'success')
        // Invalida la query de detalles para que se refresque en la página de detalles
        queryClient.invalidateQueries(['supplierDetails', supplierId])
        // Navega de vuelta a la página de detalles
        navigate(`/purchases/suppliers/details/${supplierId}`)
      },
      onError: (error) => {
        console.error('Error updating supplier:', error)
        let errorMessage = 'Error al actualizar el proveedor.'
        if (isAxiosError(error) && error.response?.data?.message) {
          errorMessage = error.response.data.message
        } else if (error instanceof Error) {
          errorMessage = error.message
        }
        Swal.fire('Error', errorMessage, 'error')
      }
    }
  )

  // Manejar cambios en los inputs de texto y email/phone
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }))
  }

  // Manejar cambio en el Select (typePerson)
  const handleSelectChange = (event: SelectChangeEvent<number>) => {
    const { name, value } = event.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: value as number // Castear a number
    }))
  }

  // Manejar cambio en el Switch (applyRetention)
  const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = event.target
    setFormData((prevData) => ({
      ...prevData,
      [name]: checked
    }))
  }

  // Manejar el envío del formulario
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    // Aquí podrías añadir validación antes de mutar
    if (supplierId && formData) {
      updateSupplierMutation.mutate(formData)
    } else {
      console.error('Cannot submit: supplierId or formData missing', {
        supplierId,
        formData
      })
      Swal.fire('Advertencia', 'Datos incompletos para guardar.', 'warning')
    }
  }

  // Mostrar estado de carga inicial
  if (isLoadingSupplier) {
    return (
      <Container sx={{ textAlign: 'center', mt: 5 }}>
        <CircularProgress />
        <Typography>Cargando datos del proveedor para editar...</Typography>
      </Container>
    )
  }

  // Mostrar error si falla la carga inicial
  if (supplierError) {
    return (
      <Alert severity='error'>
        Error al cargar los datos del proveedor: {supplierError.message}
      </Alert>
    )
  }

  // Si no hay proveedor (ej. ID inválido), aunque useQuery con enabled debería evitarlo
  if (!supplier || !formData.id) {
    // Si formData.id no existe después de cargar, algo salió mal
    return (
      <Alert severity='warning'>
        No se pudieron cargar los datos del proveedor.
      </Alert>
    )
  }

  // Renderizar el formulario de edición
  return (
    <Container maxWidth='sm' sx={{ mt: 4, mb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography variant='h4' gutterBottom>
          Editar Proveedor
        </Typography>
        <Button
          onClick={() => navigate(`/purchases/suppliers/details/${supplierId}`)}
          startIcon={<Cancel />}
        >
          Cancelar
        </Button>
      </Box>
      <Paper elevation={3} sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label='Nombre'
                name='name'
                value={formData.name || ''}
                onChange={handleInputChange}
                fullWidth
                required
                margin='normal'
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='NIT/CC'
                name='taxId'
                value={formData.taxId || ''}
                onChange={handleInputChange}
                fullWidth
                required
                margin='normal'
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth margin='normal' required>
                <InputLabel id='typePerson-label'>Tipo de Persona</InputLabel>
                <Select
                  labelId='typePerson-label'
                  id='typePerson'
                  name='typePerson'
                  value={formData.typePerson ?? ''} // Usar ?? '' para manejar 0 correctamente
                  label='Tipo de Persona'
                  onChange={handleSelectChange}
                >
                  <MenuItem value={0}>Jurídico</MenuItem>
                  <MenuItem value={1}>Natural</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* El campo Contacto puede ser el nombre si es persona natural */}
            <Grid item xs={12}>
              <TextField
                label={
                  formData.typePerson === 1
                    ? 'Nombre Completo'
                    : 'Nombre de Contacto'
                }
                name='contactName'
                value={formData.contactName || ''}
                onChange={handleInputChange}
                fullWidth
                required
                margin='normal'
                // Si es persona natural, el contacto es el mismo nombre, podrías deshabilitarlo o hacerlo readOnly
                // readOnly={formData.typePerson === 1}
                // disabled={formData.typePerson === 1}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Email'
                name='email'
                type='email' // Usa type="email" para validación básica del navegador
                value={formData.email || ''}
                onChange={handleInputChange}
                fullWidth
                required
                margin='normal'
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Teléfono'
                name='phone'
                value={formData.phone || ''}
                onChange={handleInputChange}
                fullWidth
                margin='normal'
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.applyRetention ?? false} // Usar ?? false para manejar undefined
                    onChange={handleSwitchChange}
                    name='applyRetention'
                    color='primary'
                  />
                }
                label='Aplicar Retención en Fuente'
              />
            </Grid>
            <Grid item xs={12}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 2,
                  mt: 2
                }}
              >
                <Button
                  variant='contained'
                  color='primary'
                  startIcon={<Save />}
                  type='submit' // Importante: tipo submit para el formulario
                  disabled={updateSupplierMutation.isLoading} // Deshabilitar mientras se guarda
                >
                  {updateSupplierMutation.isLoading
                    ? 'Guardando...'
                    : 'Guardar Cambios'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  )
}

export default SupplierEditPage
