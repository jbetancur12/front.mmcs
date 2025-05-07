import React, { useState, useEffect } from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'

import { useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private' // Tu hook de Axios privado

// Importar la interfaz ApiDeviceData desde LaboratoryMonitor
import { ApiDeviceData } from './LaboratoryMonitor'

// Interfaz para los datos que enviamos al backend para actualizar
// name es obligatorio, location y color son opcionales al enviar
interface UpdateSensorData {
  name: string // Nombre es obligatorio según tu controlador
  location?: string | null // Puede ser null o undefined si no se cambia o se vacía
  color?: string | null // Puede ser null o undefined si no se cambia o se vacía
}

interface EditSensorModalProps {
  open: boolean
  onClose: () => void
  // Pasar los datos del sensor a editar. Será ApiDeviceData o null.
  sensorData: ApiDeviceData | null
  // Callback que se llama cuando el sensor se actualiza exitosamente
  onSensorUpdated: (updatedSensor: ApiDeviceData) => void
}

const EditSensorModal: React.FC<EditSensorModalProps> = ({
  open,
  onClose,
  sensorData,
  onSensorUpdated
}) => {
  const queryClient = useQueryClient()
  const axiosPrivate = useAxiosPrivate()
  // Estado del formulario, inicializado con los datos del sensorData
  // Usamos un estado local para el formulario
  const [formData, setFormData] = useState<UpdateSensorData>({
    name: '',
    location: null,
    color: null
  })
  // Estado para errores de validación del formulario o errores de la API
  const [formErrors, setFormErrors] = useState<{
    name?: string
    apiError?: string
  }>({})

  // --- Efecto para inicializar el formulario cuando los datos del sensor cambian o el modal se abre ---
  useEffect(() => {
    if (sensorData) {
      // Inicializar el estado del formulario con los datos del sensor a editar
      setFormData({
        name: sensorData.name,
        location: sensorData.location, // Puede ser null
        color: sensorData.color // Puede ser null
      })
      // Limpiar errores al abrir con nuevos datos
      setFormErrors({})
    } else {
      // Limpiar el formulario si sensorData es null (cuando el modal se cierra)
      setFormData({ name: '', location: null, color: null })
      setFormErrors({})
    }
    // Resetear también el estado de la mutación (errores, carga)
    updateSensorMutation.reset()
  }, [sensorData]) // Depende de sensorData. Se ejecuta cuando sensorData cambia.

  // --- Configurar la mutación de actualización con React Query ---
  const updateSensorMutation = useMutation<
    ApiDeviceData,
    Error,
    UpdateSensorData
  >(
    // La función de mutación necesita el ID y los datos para enviar
    async (updatedData) => {
      // Asegurarse de que tenemos un sensorData válido con ID antes de mutar
      if (!sensorData?.id) {
        // Esto no debería pasar si el botón de editar solo se activa con sensorData válido,
        // pero es una buena práctica defensiva.
        throw new Error('No sensor ID provided for update.')
      }
      // Llamada a la API PUT/PATCH. Asegúrate de la ruta correcta.
      const response = await axiosPrivate.put(
        `/laboratory/devices/${sensorData.id}`,
        updatedData
      ) // Usar PUT o PATCH según tu backend
      return response.data // El backend debe devolver el objeto actualizado
    },
    {
      onSuccess: (updatedSensor) => {
        console.log('Sensor updated successfully:', updatedSensor)
        // 1. Llamar al callback para notificar al componente padre
        onSensorUpdated(updatedSensor)
        // 2. Cerrar el modal
        onClose() // Esto también limpia el estado del formulario gracias al useEffect

        // 3. Actualizar manualmente la caché de React Query para reflejar el cambio inmediatamente
        queryClient.setQueryData<ApiDeviceData[]>(
          ['laboratoryDevices'],
          (oldData) => {
            // Si hay datos antiguos, mapear para reemplazar el sensor actualizado por su ID
            return oldData
              ? oldData.map((sensor) =>
                  sensor.id === updatedSensor.id ? updatedSensor : sensor
                )
              : [] // Si no hay datos antiguos, devolver un array vacío (o manejar según tu lógica)
          }
        )
      },
      onError: (error: any) => {
        // El tipo 'any' es temporal, idealmente tipar el error de Axios
        console.error('Error updating sensor:', error)
        // Intentar extraer un mensaje de error más amigable de la respuesta de Axios
        const apiErrorMessage =
          error.response?.data?.message ||
          error.message ||
          'Ocurrió un error al actualizar el sensor.'
        // Establecer el error de la API en el estado de errores
        setFormErrors((prev) => ({ ...prev, apiError: apiErrorMessage }))
        // Si el error es de validación específico del campo 'name'
        if (
          error.response?.data?.message?.includes('nombre') ||
          error.response?.data?.error?.includes('UniqueConstraintError')
        ) {
          setFormErrors((prev) => ({ ...prev, name: apiErrorMessage }))
        }
      }
    }
  )
  // ---------------------------------------------

  // Handler para cambios en los inputs del formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    // Para 'location' y 'color', si el valor es cadena vacía, guardamos null
    const finalValue =
      (name === 'location' || name === 'color') && value === '' ? null : value
    setFormData((prev) => ({ ...prev, [name]: finalValue }))
    // Limpiar el error de validación específico del campo al escribir
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name as keyof typeof formErrors]: undefined
      }))
    }
    // Limpiar el error general de la API al empezar a editar
    if (formErrors.apiError) {
      setFormErrors((prev) => ({ ...prev, apiError: undefined }))
    }
  }

  // Handler para enviar el formulario de edición
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validación básica del lado del cliente para el nombre
    if (!formData.name || formData.name.trim() === '') {
      setFormErrors((prev) => ({ ...prev, name: 'El nombre es obligatorio.' }))
      return
    }

    // Preparar los datos para enviar.
    // Enviamos name (trimed), location y color (que ya pueden ser null)
    const dataToSend: UpdateSensorData = {
      name: formData.name.trim(),
      location: formData.location,
      color: formData.color
    }

    // Ejecutar la mutación de actualización
    updateSensorMutation.mutate(dataToSend)
  }

  // El modal solo debe renderizarse si open es true (controlado por LaboratoryMonitor)
  // sensorData también debe estar presente para inicializar el formulario
  if (!open || !sensorData) return null

  return (
    // El onClose del Dialog llama al handleClose del padre, que a su vez llama a nuestro handleClose interno
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Editar Sensor: {sensorData.name}</DialogTitle>
      {/* Usar Box con component="form" para que handleSubmit funcione */}
      <Box component='form' onSubmit={handleSubmit} noValidate>
        {/* dividers añade una línea */}
        <DialogContent dividers>
          {/* Mostrar error general de API si existe */}
          {updateSensorMutation.isError &&
            formErrors.apiError &&
            !formErrors.name && (
              <Alert severity='error' className='mb-4'>
                {formErrors.apiError}
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
            // Usar || '' para que el valor del TextField no sea null/undefined
            value={formData.name || ''}
            onChange={handleInputChange}
            // Mostrar error si hay un error específico del campo 'name'
            error={!!formErrors.name}
            helperText={formErrors.name}
            // Deshabilitar inputs durante la carga de la mutación
            disabled={updateSensorMutation.isLoading}
          />
          <TextField
            margin='dense'
            name='location'
            label='Ubicación'
            type='text'
            fullWidth
            variant='outlined'
            // Usar || '' para manejar null/undefined
            value={formData.location || ''}
            onChange={handleInputChange}
            disabled={updateSensorMutation.isLoading}
          />
          <TextField
            margin='dense'
            name='color'
            label='Color (ej: blue, red, #FF0000)'
            type='text'
            fullWidth
            variant='outlined'
            // Usar || '' para manejar null/undefined
            value={formData.color || ''}
            onChange={handleInputChange}
            disabled={updateSensorMutation.isLoading}
          />
          {/* No se editan lastTemperature, lastHumidity, lastSeen aquí */}
        </DialogContent>
        <DialogActions>
          {/* El botón Cancelar llama a onClose del padre */}
          <Button onClick={onClose} disabled={updateSensorMutation.isLoading}>
            Cancelar
          </Button>
          {/* El botón Guardar envía el formulario */}
          <Button
            type='submit'
            variant='contained'
            disabled={updateSensorMutation.isLoading}
          >
            {updateSensorMutation.isLoading ? (
              <CircularProgress size={24} />
            ) : (
              'Guardar Cambios'
            )}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

export default EditSensorModal
