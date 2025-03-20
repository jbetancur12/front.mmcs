// components/DeviceIotMap/sidebar/DeviceList.tsx
import { List, Box } from '@mui/material'

import { Device } from '../types'
import { DeviceListItem } from './DeviceListItem'
import { DeviceIot } from '../../types'

interface DeviceListProps {
  devices: DeviceIot[]
  onCenterDevice: (device: DeviceIot) => void
  onShowDeviceGraph: (device: DeviceIot) => void
}

export const DeviceList = ({
  devices,
  onSelectDevice,
  handleShowDeviceGraph
}: {
  devices: DeviceIot[]
  onSelectDevice: (device: DeviceIot) => void
  handleShowDeviceGraph: (device: DeviceIot) => void
}) => (
  <List sx={{ overflow: 'auto', maxHeight: '400px' }}>
    {devices.map((device) => (
      <DeviceListItem
        key={device.id}
        device={device}
        onSelect={onSelectDevice}
        handleShowDeviceGraph={handleShowDeviceGraph}
      />
    ))}
  </List>
)
