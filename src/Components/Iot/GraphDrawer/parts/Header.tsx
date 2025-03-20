// components/DeviceGraphs/GraphDrawer/parts/Header.tsx
import { IconButton, Toolbar, Typography, Box, AppBar } from '@mui/material'
import { ArrowBack, Close as CloseIcon } from '@mui/icons-material'
import { GraphDrawerProps } from '../types'

export const DrawerHeader = ({
  deviceName,
  status,
  onClose
}: Pick<GraphDrawerProps, 'deviceName' | 'onClose'> & { status: string }) => (
  <AppBar position='static' color='default' sx={{ boxShadow: 'none' }}>
    <Toolbar>
      <IconButton edge='start' onClick={onClose} aria-label='volver'>
        <ArrowBack />
      </IconButton>

      <Box sx={{ flexGrow: 1, ml: 2 }}>
        <Typography variant='h6' component='span'>
          Sensor: "{deviceName}"
        </Typography>
        <Typography component='span' sx={{ ml: 2 }}>
          Estado: [
          <Box
            component='span'
            sx={{
              color: status === 'Online' ? 'success.main' : 'error.main',
              fontWeight: 'bold'
            }}
          >
            {status}
          </Box>
          ]
        </Typography>
      </Box>

      <IconButton onClick={onClose}>
        <CloseIcon />
      </IconButton>
    </Toolbar>
  </AppBar>
)
