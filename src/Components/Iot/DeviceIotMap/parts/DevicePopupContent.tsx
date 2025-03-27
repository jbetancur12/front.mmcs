// components/DeviceIotMap/parts/DevicePopupContent.tsx
import { Card, CardContent, Typography, Box } from '@mui/material'

import { DeviceIot } from '../../types'

export const DevicePopupContent = ({ device }: { device: DeviceIot }) => (
  <Card sx={{ minWidth: 200 }}>
    <CardContent>
      <Typography variant='h6' gutterBottom>
        {device.name}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        Última actualización: {device.lastSeen.toLocaleString()}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        Estado: {device.isOnline ? 'Online' : 'Offline'}
      </Typography>
      <Box mt={1}>
        <Typography variant='body2' color='text.secondary'>
          Temperatura: {device.sensorData?.t || 0} °C
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Humedad: {device.sensorData?.h || 0} %
        </Typography>
      </Box>
    </CardContent>
  </Card>
)
