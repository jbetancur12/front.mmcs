import React, { useEffect } from 'react'
import { Button, Stack } from '@mui/material'
import { useDevices } from '../hooks/useDevices'
import { DeviceTable } from '../parts/DeviceTable'

import AddDeviceModal from './AddDeviceModal'
import { loadDevices } from 'src/store/deviceIotStore'
import { DeviceIot } from '../../types'

const DeviceList = () => {
  const { data: devices } = useDevices()
  const [open, setOpen] = React.useState(false)

  useEffect(() => {
    if (devices) loadDevices(devices)
  }, [devices])

  const handleEdit = (device: DeviceIot) => console.log('Editar', device)
  const handleDelete = (device: DeviceIot) => console.log('Eliminar', device)

  return (
    <div>
      <Stack direction='row' spacing={2} mb={2}>
        <Button variant='contained' onClick={() => setOpen(true)}>
          Agregar Dispositivo
        </Button>
      </Stack>

      <DeviceTable
        data={devices || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <AddDeviceModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}

export default DeviceList
