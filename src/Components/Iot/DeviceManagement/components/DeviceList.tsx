import React, { useEffect } from 'react'
import { Button, Container, Grid, Paper } from '@mui/material'
import { Add, Map as MapIcon, Sensors, Wifi, WifiOff } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { useDevices } from '../hooks/useDevices'
import { DeviceTable } from '../parts/DeviceTable'

import AddDeviceModal from './AddDeviceModal'
import { loadDevices } from 'src/store/deviceIotStore'
import { DeviceIot } from '../../types'
import { useDeleteDevice } from '../hooks/useDeviceMutations'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import { notify } from 'src/utils/notify'
import { confirmDialog } from 'src/utils/confirm'

const DeviceList = () => {
  const { data: devices } = useDevices()
  const [open, setOpen] = React.useState(false)
  const [selectedDevice, setSelectedDevice] = React.useState<DeviceIot | null>(
    null
  )
  const deleteDevice = useDeleteDevice()
  const navigate = useNavigate()
  const canManage = useCan(PERMISSIONS.IOT_DEVICE_MANAGE)

  useEffect(() => {
    if (devices) loadDevices(devices)
  }, [devices])

  const handleEdit = (device: DeviceIot) => {
    setSelectedDevice(device)
    setOpen(true)
  }

  const handleDelete = (device: DeviceIot) => {
    confirmDialog({ title: '¿Estás seguro?', text: '¡No podrás revertir esta acción!', confirmLabel: 'Sí, eliminar!', tone: 'danger' }).then((result) => {
      if (result.isConfirmed) {
        deleteDevice.mutate(device.id, {
          onSuccess: () => {
            notify.success('Eliminado!', 'El dispositivo ha sido eliminado.')
          }
        })
      }
    })
  }

  const list = devices || []
  const onlineCount = list.filter((d) => d.status === 'online').length

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Dispositivos IoT'
        subtitle='Sensores conectados, su cliente asignado y su última conexión'
        icon={<Sensors />}
        actions={
          <>
            <Button variant='outlined' startIcon={<MapIcon />} onClick={() => navigate('/iot/map')} sx={{ color: '#00897B', borderColor: '#00BFA5', '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' } }}>
              Ver mapa
            </Button>
            {canManage && (
              <Button variant='contained' startIcon={<Add />} onClick={() => setOpen(true)} sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}>
                Agregar dispositivo
              </Button>
            )}
          </>
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Dispositivos' value={list.length} icon={<Sensors />} tone='teal' />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='En línea' value={onlineCount} icon={<Wifi />} tone='green' />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Sin conexión' value={list.length - onlineCount} icon={<WifiOff />} tone={list.length - onlineCount > 0 ? 'orange' : 'green'} />
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <DeviceTable
          data={list}
          onEdit={handleEdit}
          onDelete={handleDelete}
          canManage={canManage}
        />
      </Paper>

      <AddDeviceModal
        open={open}
        onClose={() => {
          setOpen(false)
          setSelectedDevice(null)
        }}
        device={selectedDevice}
      />
    </Container>
  )
}

export default DeviceList
