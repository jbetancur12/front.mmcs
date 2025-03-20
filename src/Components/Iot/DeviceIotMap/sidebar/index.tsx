// components/DeviceIotMap/sidebar/index.tsx
import { Drawer, Box, IconButton, Typography } from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'
import { Device, FilterState } from '../types'
import { SIDEBAR_WIDTH } from '../constants'
import { FilterPanel } from './FilterPanel'
import { DeviceList } from './DeviceList'
import { DeviceIot } from '../../types'

export const DeviceSidebar = ({
  isOpen,
  onClose,
  devices,
  filterState,
  onFilterChange,
  onSelectDevice,
  handleShowDeviceGraph
}: {
  isOpen: boolean
  onClose: () => void
  devices: DeviceIot[]
  filterState: FilterState
  onFilterChange: (type: keyof FilterState, value: any) => void
  onSelectDevice: (device: DeviceIot) => void
  handleShowDeviceGraph: (device: DeviceIot) => void
}) => (
  <Drawer
    variant='persistent'
    open={isOpen}
    sx={{
      width: SIDEBAR_WIDTH,
      '& .MuiDrawer-paper': {
        width: SIDEBAR_WIDTH,
        mt: 8
      }
    }}
  >
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant='h6'>Dispositivos</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <FilterPanel filterState={filterState} onFilterChange={onFilterChange} />

      <DeviceList
        devices={devices}
        onSelectDevice={onSelectDevice}
        handleShowDeviceGraph={handleShowDeviceGraph}
      />
    </Box>
  </Drawer>
)
