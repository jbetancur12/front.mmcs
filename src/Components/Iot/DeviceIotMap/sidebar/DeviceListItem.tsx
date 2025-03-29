import { Box, Typography, Button, Paper, Tooltip } from '@mui/material'
import {
  MyLocation,
  Power,
  PowerOff,
  Thermostat,
  WaterDrop
} from '@mui/icons-material'
import { DeviceIot } from '../../types'
import { DeviceStatus, PowerSource } from '../constants'
import { format } from 'date-fns'

interface DeviceListItemProps {
  device: DeviceIot
  onSelect: (device: DeviceIot) => void
  handleShowDeviceGraph: (device: DeviceIot) => void
}

const DeviceListItem = ({
  device,
  onSelect,
  handleShowDeviceGraph
}: DeviceListItemProps) => {
  // Determine status color and icon
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
  const isOffline = device.status === DeviceStatus.OFFLINE

  const getPowerSourceIcon = () => {
    if (!device.src) return null
    return device.src === PowerSource.MAIN ? (
      <Tooltip title='Connected to Main Power'>
        <Power color='primary' fontSize='small' />
      </Tooltip>
    ) : (
      <Tooltip title='Running on Battery'>
        <PowerOff color='action' fontSize='small' />
      </Tooltip>
    )
  }

  return (
    <Paper
      className='device-item mb-2 p-3 rounded-lg'
      onClick={() => handleShowDeviceGraph(device)}
      elevation={1}
      sx={{
        transition: 'background-color 0.2s',
        '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.05)' },
        cursor: 'pointer'
      }}
    >
      <Box className='flex justify-between items-center'>
        <Box>
          <Typography
            variant='subtitle1'
            component='h3'
            className='font-medium'
          >
            {device.name}
          </Typography>
          {/* <Typography variant="body2" className="text-gray-600">
            {device.location}
          </Typography> */}
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

      <Box className='mt-2 flex justify-between'>
        <Box className='flex items-center'>
          <Thermostat
            className='mr-1'
            fontSize='small'
            color={isOffline ? 'disabled' : 'primary'}
          />
          <Typography
            variant='body2'
            color={isOffline ? 'textSecondary' : 'textPrimary'}
          >
            {device.sensorData && device.sensorData.t !== null
              ? `${device.sensorData.t}°C`
              : '--°C'}
          </Typography>
        </Box>

        <Box className='flex items-center'>
          <WaterDrop
            className='mr-1'
            fontSize='small'
            color={isOffline ? 'disabled' : 'primary'}
          />
          <Typography
            variant='body2'
            color={isOffline ? 'textSecondary' : 'textPrimary'}
          >
            {device.sensorData && device.sensorData.h !== null
              ? `${device.sensorData.h}%`
              : '--%'}
          </Typography>
        </Box>

        <Button
          startIcon={<MyLocation fontSize='small' />}
          onClick={(e) => {
            e.stopPropagation() // Prevenir propagación del evento
            onSelect(device)
          }}
          size='small'
          sx={{
            minWidth: 'auto',
            color: 'primary.main',
            '&:hover': { color: 'primary.dark' }
          }}
        >
          Center
        </Button>
      </Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mt: 0.5
        }}
      >
        <Box
          component='span'
          sx={{ color: 'text.secondary', fontSize: '0.75rem' }}
        >
          Last updated: {format(new Date(device.lastSeen), 'MMM dd, HH:mm')}
        </Box>
        {getPowerSourceIcon()}
      </Box>
    </Paper>
  )
}

export default DeviceListItem
