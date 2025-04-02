// components/DeviceIotMap/sidebar/index.tsx
import { Drawer, Box, IconButton, Typography, useTheme } from '@mui/material'
import { ChevronLeft } from '@mui/icons-material'
import { FilterState } from '../types'
import { SIDEBAR_WIDTH } from '../constants'
import { FilterPanel } from './FilterPanel'
import { DeviceList } from './DeviceList'
import { DeviceIot } from '../../types'
import Logo from '/images/sense.png'

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
              background: 'linear-gradient(135deg, #1E40AF 30%, #3B82F6 100%)', // Gradiente para mayor impacto visual
              boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.15)',
              borderRadius: '12px',
              color: 'white'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                sx={{
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  padding: '8px', // Padding más grande para destacar más el logo
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0px 3px 8px rgba(0, 0, 0, 0.25)'
                }}
              >
                <img src={Logo} alt='SenseWave Logo' style={{ height: 42 }} />
              </Box>
              <Typography
                variant='h6'
                sx={{
                  fontWeight: 'bold',
                  marginLeft: theme.spacing(2), // Mayor separación para mejor equilibrio visual
                  letterSpacing: '0.5px' // Pequeño ajuste de espaciado en letras
                }}
              >
                SenseWave
              </Typography>
            </Box>
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
