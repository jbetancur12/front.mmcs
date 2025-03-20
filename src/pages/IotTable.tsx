import React, { useEffect, useState } from 'react'
import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { Button, IconButton, Stack } from '@mui/material'
import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AddDeviceModal from 'src/Components/Iot/AddDeviceIotModal'
import { DeviceIot } from 'src/Components/Iot/types'
import { loadDevices } from 'src/store/deviceIotStore'

const transformDevice = (device: any) => {
  const [lng, lat] = device.lastLocation.coordinates
  return {
    id: device.id.toString(), // o device.id si lo manejas como string
    imei: device.imei,
    name: device.name,
    lastLocation: { lat, lng },
    lastSeen: device.lastSeen,
    status: device.isOnline ? 'online' : 'offline',
    customer: device.customer
  }
}

const DeviceList: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  // Datos de ejemplo; en un caso real vendrían desde una API o estado global

  const [open, setOpen] = useState<boolean>(false)

  const { data: devices } = useQuery<DeviceIot[]>('devices', async () => {
    const response = await axiosPrivate.get('/devicesIot')
    return response.data.map(transformDevice)
  })

  useEffect(() => {
    if (devices) {
      loadDevices(devices)
    }
  }, [devices])

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const customers = [
    { id: 1, name: 'Cliente A' },
    { id: 2, name: 'Cliente B' }
  ]

  // Función para manejar la edición
  const handleEdit = (device: DeviceIot) => {
    console.log('Editar dispositivo', device)
    // Aquí podrías abrir un diálogo de edición o navegar a la ruta correspondiente
  }

  // Función para manejar la eliminación
  const handleDelete = (device: DeviceIot) => {
    console.log('Eliminar dispositivo', device)
    // Podrías confirmar la eliminación antes de actualizar el estado o llamar a la API
  }

  // Definición de columnas para la tabla
  const columns: MRT_ColumnDef<DeviceIot>[] = [
    {
      accessorKey: 'id',
      header: 'ID'
    },
    {
      accessorKey: 'imei',
      header: 'IMEI'
    },
    {
      accessorKey: 'name',
      header: 'Nombre'
    },
    {
      accessorKey: 'customer.nombre',
      header: 'Cliente',
      Cell: ({ cell }) => cell.getValue<string>() || 'Sin Cliente'
    },
    {
      accessorKey: 'isOnline',
      header: 'En Línea',
      Cell: ({ cell }) => (cell.getValue<boolean>() ? 'Sí' : 'No')
    },
    {
      accessorKey: 'lastSeen',
      header: 'Última Vez Visto',
      Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleString()
    }
  ]

  return (
    <div>
      <Stack direction='row' spacing={2} mb={2}>
        <Button variant='contained' color='primary' onClick={handleOpen}>
          Agregar Dispositivo
        </Button>
      </Stack>
      <MaterialReactTable
        columns={columns}
        data={devices || []}
        enableColumnFilters={false}
        enablePagination
        renderRowActions={({ row }) => (
          <Stack direction='row' spacing={1}>
            <IconButton
              color='primary'
              onClick={() => handleEdit(row.original)}
            >
              <EditIcon />
            </IconButton>
            <IconButton
              color='secondary'
              onClick={() => handleDelete(row.original)}
            >
              <DeleteIcon />
            </IconButton>
          </Stack>
        )}
        // Puedes agregar otras propiedades o personalizaciones aquí
      />
      <AddDeviceModal open={open} onClose={handleClose} customers={customers} />
    </div>
  )
}

export default DeviceList
