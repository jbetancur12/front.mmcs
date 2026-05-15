import React, { useState, FormEvent } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Button
} from '@mui/material'
import { useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

interface Customer {
  id: number
  name: string
}

interface AddDeviceModalProps {
  open: boolean
  onClose: () => void
  customers?: Customer[]
}

const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  open,
  onClose,
  customers = []
}) => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  const [imei, setImei] = useState<string>('')
  const [name, setName] = useState<string>('')
  const [customerId, setCustomerId] = useState<number | ''>('')

  const mutation = useMutation(
    (newDevice: { imei: string; name: string; customerId?: number }) =>
      axiosPrivate.post('/devicesIot', newDevice),
    {
      onSuccess: () => {
        // Actualiza la tabla invalidando la query 'devices'
        queryClient.invalidateQueries('devices')
        onClose()
      },
      onError: (error) => {
        console.error('Error agregando el dispositivo:', error)
      }
    }
  )

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!imei || !name) {
      alert('El IMEI y el nombre son obligatorios.')
      return
    }

    mutation.mutate({
      imei,
      name,
      customerId: customerId === '' ? undefined : customerId
    })

    // Reiniciar campos (opcional)
    setImei('')
    setName('')
    setCustomerId('')
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Agregar Nuevo Dispositivo</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            label='IMEI'
            variant='outlined'
            required
            fullWidth
            value={imei}
            onChange={(e) => setImei(e.target.value)}
            margin='normal'
          />

          <TextField
            label='Nombre'
            variant='outlined'
            required
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            margin='normal'
          />

          <TextField
            select
            label='Cliente (opcional)'
            variant='outlined'
            fullWidth
            value={customerId}
            onChange={(e) => setCustomerId(Number(e.target.value))}
            margin='normal'
            helperText='Selecciona un cliente si es necesario'
          >
            <MenuItem value=''>Ninguno</MenuItem>
            {customers.map((customer) => (
              <MenuItem key={customer.id} value={customer.id}>
                {customer.name}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type='submit' variant='contained' color='primary'>
            Agregar Dispositivo
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default AddDeviceModal
