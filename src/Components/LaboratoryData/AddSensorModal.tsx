import React, { useState } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert' // Para mostrar errores de API
import CircularProgress from '@mui/material/CircularProgress' // Indicador de carga

import { useMutation, useQueryClient } from 'react-query' // Importar useMutation y useQueryClient
import useAxiosPrivate from '@utils/use-axios-private' // Tu hook de Axios privado

// Definir la interfaz para los datos que enviamos al backend para crear
interface CreateSensorData {
  name: string
  location?: string // Opcional al enviar
  color?: string // Opcional al enviar
}

// Definir la interfaz para la respuesta exitosa del backend (el objeto creado)
// Usamos la misma interfaz que ApiDeviceData ya que el backend devuelve el objeto completo
import { ApiDeviceData } from './LaboratoryMonitor' // Importar la interfaz desde el otro archivo

interface AddSensorModalProps {
  open: boolean
  onClose: () => void
  // Callback que se llama cuando el sensor se añade exitosamente,
  // pasando el objeto del sensor recién creado
  onSensorAdded: (newSensor: ApiDeviceData) => void
}

const AddSensorModal: React.FC<AddSensorModalProps> = ({
  open,
  onClose,
  onSensorAdded
}) => {
  const queryClient = useQueryClient() // Obtener el cliente de React Query
  const axiosPrivate = useAxiosPrivate() // Obtener la instancia de Axios
  const [formData, setFormData] = useState<CreateSensorData>({
    name: '',
    location: '',
    color: ''
  })
  const [formErrors, setFormErrors] = useState<{ name?: string }>({}) // Estado para errores de validación del formulario

  // --- Configurar la mutación con React Query ---
  const createSensorMutation = useMutation<
    ApiDeviceData,
    Error,
    CreateSensorData
  >(
    // La función de mutación que llama a la API POST
    (newSensorData) =>
      axiosPrivate
        .post('/laboratory/devices', newSensorData)
        .then((res) => res.data),
    {
      onSuccess: (newSensor) => {
        console.log('Sensor created successfully:', newSensor)
        // 1. Llamar al callback para notificar al componente padre
        onSensorAdded(newSensor)
        // 2. Limpiar el formulario
        setFormData({ name: '', location: '', color: '' })
        setFormErrors({})
        // 3. Cerrar el modal
        onClose()

        // Opcional: Invalidar la query de lista para refetchear o actualizar manualmente la caché
        // queryClient.invalidateQueries(['laboratoryDevices']); // Opción 1: Refetch
        // Opción 2: Actualizar manualmente la caché para añadir el nuevo sensor sin refetch completo
        queryClient.setQueryData<ApiDeviceData[]>(
          ['laboratoryDevices'],
          (oldData) => {
            // Asegurarse de que oldData sea un array y añadir el nuevo sensor
            return oldData ? [...oldData, newSensor] : [newSensor]
          }
        )
      },
      onError: (error: any) => {
        // El tipo 'any' es temporal, idealmente tipar el error de Axios
        console.error('Error creating sensor:', error)
        // Puedes intentar extraer un mensaje de error más amigable de la respuesta de Axios
        const apiErrorMessage =
          error.response?.data?.message ||
          error.message ||
          'Ocurrió un error al crear el sensor.'
        // Establecer un error genérico en el formulario o en un estado separado
        setFormErrors({ name: apiErrorMessage }) // Mostrarlo bajo el campo name o en otro lugar
      }
    }
  )
  // -----------------------------------------------

  // Handler para cambios en los inputs del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Limpiar el error de validación al escribir
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name as keyof typeof formErrors]: undefined
      }))
    }
  }

  // Handler para enviar el formulario
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validación básica del lado del cliente
    if (!formData.name.trim()) {
      setFormErrors({ name: 'El nombre es obligatorio.' })
      return
    }

    // Ejecutar la mutación con los datos del formulario
    createSensorMutation.mutate(formData)
  }

  // Handler para cerrar el modal y limpiar el formulario
  const handleClose = () => {
    setFormData({ name: '', location: '', color: '' }) // Limpiar al cerrar
    setFormErrors({}) // Limpiar errores al cerrar
    createSensorMutation.reset() // Resetear el estado de la mutación (errores, carga)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogTitle>Agregar Nuevo Sensor de Laboratorio</DialogTitle>
      <Box component='form' onSubmit={handleSubmit} noValidate>
        {' '}
        {/* Usar Box con component="form" para handleSubmit */}
        <DialogContent dividers>
          {' '}
          {/* divisors añade una línea */}
          {/* Mostrar error de API si existe */}
          {createSensorMutation.isError && formErrors.name && (
            <Alert severity='error' className='mb-4'>
              {formErrors.name}
            </Alert>
          )}
          <TextField
            autoFocus // Poner el foco en este campo al abrir el modal
            margin='dense'
            name='name'
            label='Nombre del Sensor *'
            type='text'
            fullWidth
            variant='outlined'
            value={formData.name}
            onChange={handleInputChange}
            error={!!formErrors.name} // Mostrar error si formErrors.name tiene valor
            helperText={formErrors.name} // Mostrar mensaje de error
            disabled={createSensorMutation.isLoading} // Deshabilitar inputs durante la carga
          />
          <TextField
            margin='dense'
            name='location'
            label='Ubicación'
            type='text'
            fullWidth
            variant='outlined'
            value={formData.location}
            onChange={handleInputChange}
            disabled={createSensorMutation.isLoading}
          />
          <TextField
            margin='dense'
            name='color'
            label='Color (ej: blue, red, #FF0000)'
            type='text'
            fullWidth
            variant='outlined'
            value={formData.color}
            onChange={handleInputChange}
            disabled={createSensorMutation.isLoading}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            disabled={createSensorMutation.isLoading}
          >
            Cancelar
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={createSensorMutation.isLoading}
          >
            {createSensorMutation.isLoading ? (
              <CircularProgress size={24} />
            ) : (
              'Guardar Sensor'
            )}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default AddSensorModal
