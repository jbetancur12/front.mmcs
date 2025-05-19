import React from 'react'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import Box from '@mui/material/Box' // Importar Box para centrar el spinner

import { useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private' // Tu hook de Axios privado

// Importar la interfaz ApiDeviceData para la actualización de caché
import { ApiDeviceData } from './LaboratoryMonitor'

interface DeleteConfirmDialogProps {
  open: boolean
  onClose: () => void
  // Pasar el ID del sensor a eliminar (number según ApiDeviceData)
  sensorId: number | null
  // Callback que se llama cuando la eliminación es exitosa
  onSensorDeleted: (deletedSensorId: number) => void
  // Opcional: pasar el nombre del sensor para mostrar en el mensaje de confirmación
  sensorName?: string | null
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  open,
  onClose,
  sensorId,
  onSensorDeleted,
  sensorName
}) => {
  const queryClient = useQueryClient()
  const axiosPrivate = useAxiosPrivate()

  // --- Configurar la mutación de eliminación con React Query ---
  // La mutación no devuelve datos en onSuccess (void), recibe el ID (number) en mutate
  const deleteSensorMutation = useMutation<void, Error, number>(
    // La función de mutación toma el ID y llama a la API DELETE
    (id) =>
      axiosPrivate.delete(`/laboratory/devices/${id}`).then((res) => res.data),
    {
      // onSuccess recibe el resultado de la mutación (void en este caso) y la variable que pasaste a mutate (el ID)
      onSuccess: (_, deletedId) => {
        console.log(`Sensor with ID ${deletedId} deleted successfully.`)
        // 1. Llamar al callback para notificar al padre
        onSensorDeleted(deletedId)
        // 2. Cerrar el diálogo
        onClose() // Esto también limpia el estado sensorToDeleteId en el padre

        // 3. Actualizar manualmente la caché de React Query para eliminar el sensor
        queryClient.setQueryData<ApiDeviceData[]>(
          ['laboratoryDevices'],
          (oldData) => {
            // Si hay datos antiguos, filtrar la lista para remover el sensor eliminado por su ID
            return oldData
              ? oldData.filter((sensor) => sensor.id !== deletedId)
              : []
          }
        )
      },
      onError: (error: any) => {
        // El tipo 'any' es temporal
        console.error(`Error deleting sensor with ID ${sensorId}:`, error)
        const apiErrorMessage =
          error.response?.data?.message ||
          error.message ||
          'Ocurrió un error al eliminar el sensor.'
        // Mostrar el error en el diálogo mismo
        // Puedes usar un estado local para mostrar este error si quieres.
        // Por ahora, solo lo logueamos y mostramos un alert simple.
        alert(`Error al eliminar: ${apiErrorMessage}`)
        // No cerramos automáticamente en caso de error para que el usuario vea el mensaje si se implementa en UI
      }
    }
  )
  // -------------------------------------------

  // Handler para confirmar la eliminación
  const handleConfirmDelete = () => {
    // Asegurarse de que tenemos un ID válido antes de mutar
    if (sensorId !== null) {
      // Comprobar si no es null
      deleteSensorMutation.mutate(sensorId) // Ejecutar la mutación con el ID (number)
    } else {
      console.warn('Attempted to confirm delete with null sensorId.')
      // Opcional: mostrar un error al usuario si el ID es null
    }
  }

  // El diálogo solo debe renderizarse si open es true Y tenemos un sensorId
  if (!open || sensorId === null) return null

  return (
    // El onClose del Dialog llama al handleClose del padre, que a su vez llama a nuestro handleClose interno
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirmar Eliminación</DialogTitle>
      <DialogContent>
        {/* Mostrar error de API si existe */}
        {deleteSensorMutation.isError && (
          <Alert severity='error' className='mb-4'>
            Error al eliminar.
            {/* Detalles del error si los quieres mostrar: {deleteSensorMutation.error?.message} */}
          </Alert>
        )}
        <DialogContentText>
          ¿Estás seguro de que deseas eliminar el sensor
          {sensorName
            ? ` "${sensorName}" (ID: ${sensorId})`
            : ` con ID "${sensorId}"`}
          ? Esta acción no se puede deshacer.
        </DialogContentText>
        {/* Mostrar spinner durante la carga */}
        {deleteSensorMutation.isLoading && (
          <Box className='flex justify-center mt-4'>
            <CircularProgress size={24} />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        {/* El botón Cancelar llama a onClose del padre */}
        <Button onClick={onClose} disabled={deleteSensorMutation.isLoading}>
          Cancelar
        </Button>
        {/* El botón Eliminar llama a handleConfirmDelete */}
        <Button
          onClick={handleConfirmDelete}
          color='error'
          variant='contained'
          disabled={deleteSensorMutation.isLoading}
        >
          Eliminar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default DeleteConfirmDialog
