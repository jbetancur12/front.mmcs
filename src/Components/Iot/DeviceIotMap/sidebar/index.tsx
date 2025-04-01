// components/DeviceIotMap/sidebar/index.tsx
import { Drawer, Box, IconButton, Typography, useTheme } from '@mui/material'
import { ChevronLeft } from '@mui/icons-material'
import { FilterState } from '../types'
import { SIDEBAR_WIDTH } from '../constants'
import { FilterPanel } from './FilterPanel'
import { DeviceList } from './DeviceList'
import { DeviceIot } from '../../types'

export const DeviceSidebar = ({
  isOpen,
  onClose,
  filteredDevices,
  filterState,
  onFilterChange,
  onSelectDevice,
  handleShowDeviceGraph
}: {
  isOpen: boolean
  onClose: () => void
  filteredDevices: DeviceIot[]
  filterState: FilterState
  onFilterChange: (type: keyof FilterState, value: any) => void
  onSelectDevice: (device: DeviceIot) => void
  handleShowDeviceGraph: (device: DeviceIot) => void
}) => {
  const theme = useTheme()
  return (
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
      <Box className='h-full flex flex-col bg-white'>
        <Box className='p-4 border-b border-gray-200'>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: theme.spacing(1, 2),
              backgroundColor: 'primary.main',
              color: 'primary.contrastText'
            }}
          >
            <Typography variant='h6' sx={{ fontWeight: 'bold' }}>
              IoT Devices
            </Typography>
            <IconButton color='inherit' onClick={onClose} edge='end'>
              <ChevronLeft />
            </IconButton>
          </Box>

          <FilterPanel
            filterState={filterState}
            onFilterChange={onFilterChange}
          />

          <DeviceList
            devices={filteredDevices}
            onSelectDevice={onSelectDevice}
            handleShowDeviceGraph={handleShowDeviceGraph}
          />
        </Box>
      </Box>
    </Drawer>
  )
}
