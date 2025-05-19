import React, { useState } from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  TextField,
  Collapse
} from '@mui/material'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'

interface Device {
  id: string | number
  name: string
  status: string
  lastLocation: { lat: number; lng: number }
  lastSeen: Date
}

interface DeviceIotListSidebarProps {
  devices: Device[]
  onSelectDevice: (device: Device) => void
}

const DeviceIotListSidebar: React.FC<DeviceIotListSidebarProps> = ({
  devices,
  onSelectDevice
}) => {
  const [open, setOpen] = useState(true)
  const [filterText, setFilterText] = useState('')

  // Filtrar dispositivos por nombre (ignora mayúsculas/minúsculas)
  const filteredDevices = devices.filter((device) =>
    device.name.toLowerCase().includes(filterText.toLowerCase())
  )

  return (
    <Box width='300px' overflow='auto' p={2} borderRight='1px solid #ccc'>
      <Box display='flex' alignItems='center' justifyContent='space-between'>
        <Typography variant='h6' gutterBottom>
          Lista de Dispositivos
        </Typography>
        <IconButton onClick={() => setOpen(!open)}>
          {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>
      <Collapse in={open}>
        <TextField
          fullWidth
          placeholder='Buscar dispositivo...'
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          margin='normal'
          variant='outlined'
        />
        <List>
          {filteredDevices.map((device) => (
            <React.Fragment key={device.id}>
              <ListItem button onClick={() => onSelectDevice(device)}>
                <ListItemText
                  primary={device.name}
                  secondary={`Estado: ${device.status}`}
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Collapse>
    </Box>
  )
}

export default DeviceIotListSidebar
