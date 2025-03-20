// components/DeviceIotMap/sidebar/DeviceListItem.tsx
import { ListItem, ListItemText, IconButton, Box } from '@mui/material'
import { MyLocation, BarChart } from '@mui/icons-material'
import { Device } from '../types'
import { DeviceIot } from '../../types'

export const DeviceListItem = ({
  device,
  onSelect,
  handleShowDeviceGraph
}: {
  device: DeviceIot
  onSelect: (device: DeviceIot) => void
  handleShowDeviceGraph: (device: DeviceIot) => void
}) => (
  <ListItem button>
    <ListItemText
      primary={device.name}
      secondary={`Última actualización: ${device.lastSeen.toLocaleString()}`}
    />
    <Box sx={{ display: 'flex', gap: 1 }}>
      <IconButton onClick={() => onSelect(device)}>
        <MyLocation />
      </IconButton>
      <IconButton onClick={() => handleShowDeviceGraph(device)}>
        <BarChart />
      </IconButton>
    </Box>
  </ListItem>
)
