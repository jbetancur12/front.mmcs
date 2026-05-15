// components/DeviceGraphs/GraphDrawer/parts/Header.tsx
import {
  IconButton,
  Toolbar,
  Typography,
  Box,
  AppBar,
  Chip
} from '@mui/material'
import { ArrowBack, Close as CloseIcon, Warning } from '@mui/icons-material'
import { GraphDrawerProps } from '../types'

export const DrawerHeader = ({
  deviceName,
  status,
  onClose,
  isInAlarm
}: Pick<GraphDrawerProps, 'deviceName' | 'onClose' | 'isInAlarm'> & {
  status: string
}) => (
  <AppBar position='static' color='default' sx={{ boxShadow: 'none' }}>
    <Toolbar>
      <IconButton edge='start' onClick={onClose} aria-label='volver'>
        <ArrowBack />
      </IconButton>

      <Box sx={{ flexGrow: 1, ml: 2 }}>
        <Typography variant='h6' component='span'>
          Sensor: "{deviceName}"
        </Typography>
        <Chip
          label={isInAlarm ? 'ALARMA' : status}
          variant='filled'
          size='medium'
          icon={isInAlarm ? <Warning color='inherit' /> : undefined}
          sx={{
            ml: 2,
            fontWeight: 'bold',
            color: isInAlarm
              ? '#fff'
              : status === 'Online'
                ? '#fff'
                : 'error.main',
            backgroundColor: isInAlarm
              ? 'error.main'
              : status === 'Online'
                ? 'success.main'
                : 'error.main',
            ...(isInAlarm && {
              animation: 'blink 1s infinite',
              '@keyframes blink': {
                '0%': { opacity: 0.6 },
                '50%': { opacity: 1 },
                '100%': { opacity: 0.6 }
              }
            })
          }}
        />
      </Box>

      <IconButton onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </Toolbar>
  </AppBar>
)
