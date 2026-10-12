import React, { useEffect } from 'react'
import { Button, Stack } from '@mui/material'
import { useDevices } from '../hooks/useDevices'
import { DeviceTable } from '../parts/DeviceTable'

import AddDeviceModal from './AddDeviceModal'
import { loadDevices } from 'src/store/deviceIotStore'
import { DeviceIot } from '../../types'
import { useDeleteDevice } from '../hooks/useDeviceMutations'
import Swal from 'sweetalert2'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'

const DeviceList = () => {
  const { data: devices } = useDevices()
  const [open, setOpen] = React.useState(false)
  const [selectedDevice, setSelectedDevice] = React.useState<DeviceIot | null>(
    null
  )
  const deleteDevice = useDeleteDevice()
  const canManage = useCan(PERMISSIONS.IOT_DEVICE_MANAGE)

  useEffect(() => {
    if (devices) loadDevices(devices)
  }, [devices])

  const handleEdit = (device: DeviceIot) => {
    setSelectedDevice(device)
    setOpen(true)
  }

  const handleDelete = (device: DeviceIot) => {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esta acción!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar!'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteDevice.mutate(device.id, {
          onSuccess: () => {
            Swal.fire(
              'Eliminado!',
              'El dispositivo ha sido eliminado.',
              'success'
            )
          }
        })
      }
    })
  }

  return (
    <div>
      <Stack direction='row' spacing={2} mb={2}>
        {canManage && (
          <Button variant='contained' onClick={() => setOpen(true)}>
            Agregar Dispositivo
          </Button>
        )}
      </Stack>

      <DeviceTable
        data={devices || []}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canManage={canManage}
      />

      <AddDeviceModal
        open={open}
        onClose={() => {
          setOpen(false)
          setSelectedDevice(null)
        }}
        device={selectedDevice}
      />
    </div>
  )
}

export default DeviceList
