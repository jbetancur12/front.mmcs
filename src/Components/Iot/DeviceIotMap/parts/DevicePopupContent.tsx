import { Paper, Typography, IconButton, Box, Divider } from '@mui/material'
import {
  Close,
  Thermostat,
  WaterDrop,
  Battery5Bar,
  Update
} from '@mui/icons-material'

import { format, formatDistanceToNow } from 'date-fns'
import { DeviceIot } from '../../types'
import { DeviceStatus } from '../constants'

interface DevicePopupProps {
  device: DeviceIot
}

const DevicePopup = ({ device }: DevicePopupProps) => {
  // Format the last update time
  const lastUpdateTime = formatDistanceToNow(new Date(device.lastSeen), {
    addSuffix: true
  })

  // Determine status color and text
  const getStatusInfo = (status: string) => {
    switch (status) {
      case DeviceStatus.ONLINE:
        return { color: '#4caf50', text: 'Online' }
      case DeviceStatus.OFFLINE:
        return { color: '#f44336', text: 'Offline' }
      case DeviceStatus.LOW_BATTERY:
        return { color: '#ff9800', text: 'Low Battery' }
      default:
        return { color: '#757575', text: 'Unknown' }
    }
  }

  const statusInfo = getStatusInfo(device.status)

  return (
    <Paper
      elevation={4}
      className='absolute z-20 bg-white rounded-lg p-4 w-64 left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2'
      sx={{
        position: 'absolute',
        zIndex: 1000,
        width: 270,
        maxWidth: '90vw'
      }}
    >
      <Box className='flex justify-between items-start'>
        <Typography variant='h6' component='h3' className='font-medium'>
          {device.name}
        </Typography>
        <IconButton size='small' className='text-gray-500 hover:text-gray-700'>
          <Close fontSize='small' />
        </IconButton>
      </Box>

      <Typography variant='body2' className='text-gray-600 mb-3'>
        Testst
      </Typography>

      <Paper
        className='p-3 rounded-lg mb-3'
        sx={{ bgcolor: 'primary.light', opacity: 0.3 }}
      >
        <Box className='flex justify-between mb-2'>
          <Box className='flex items-center'>
            <Thermostat color='secondary' className='mr-2' />
            {/* <Typography variant='body1' className='text-gray-800 font-medium'>
              Temperature
            </Typography> */}
          </Box>
          <Typography variant='h6' color='secondary' className='font-medium'>
            {device.sensorData && device.sensorData.t !== null
              ? `${device.sensorData.t}°C`
              : '--°C'}
          </Typography>
        </Box>

        <Box className='flex justify-between'>
          <Box className='flex items-center'>
            <WaterDrop color='secondary' className='mr-2' />
          </Box>
          <Typography variant='h6' color='secondary' className='font-medium'>
            {device.sensorData && device.sensorData.h !== null
              ? `${device.sensorData.h}%`
              : '--%'}
          </Typography>
        </Box>
      </Paper>

      <Box className='flex justify-between items-center'>
        <Box>
          <Box className='flex items-center'>
            <Battery5Bar fontSize='small' className='mr-1 text-gray-500' />
            <Typography variant='body2' className='text-gray-600'>
              Battery: 100%
            </Typography>
          </Box>
          <Box className='flex items-center mt-1'>
            <Update fontSize='small' className='mr-1 text-gray-500' />
            <Typography variant='body2' className='text-gray-600'>
              Last update: {lastUpdateTime}
            </Typography>
          </Box>
        </Box>

        <Box className='flex items-center'>
          <Box
            component='span'
            className='inline-block w-3 h-3 rounded-full mr-2'
            sx={{ bgcolor: statusInfo.color }}
          />
          <Typography variant='body2'>{statusInfo.text}</Typography>
        </Box>
      </Box>
    </Paper>
  )
}

export default DevicePopup
