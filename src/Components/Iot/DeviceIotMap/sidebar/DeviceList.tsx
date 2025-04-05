// components/DeviceIotMap/sidebar/DeviceList.tsx
import { List } from '@mui/material'

import DeviceListItem from './DeviceListItem'
import { DeviceIot } from '../../types'

export const DeviceList = ({
  devices,
  onSelectDevice,
  onViewDetails
}: {
  devices: DeviceIot[]
  onSelectDevice: (device: DeviceIot) => void
  onViewDetails: (device: DeviceIot) => void
}) => {
  return (
    <List sx={{ overflow: 'auto', maxHeight: '400px' }}>
      {devices.map((device) => (
        <DeviceListItem
          key={device.id}
          device={device}
          onSelect={onSelectDevice}
          onViewDetails={onViewDetails}
        />
      ))}
    </List>
  )
}
