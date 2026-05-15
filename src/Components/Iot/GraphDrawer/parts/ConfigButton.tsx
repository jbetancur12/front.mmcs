// components/DeviceGraphs/GraphDrawer/parts/ConfigButton.tsx
import { Button, Typography, Grid, Box } from '@mui/material'
import { ModuleConfig, SensorType } from '../types'

interface ConfigButtonProps {
  sensorType: SensorType
  existingConfig?: ModuleConfig
  onClick: (sensorType: SensorType) => void
}

export const ConfigButton = ({
  sensorType,
  existingConfig,
  onClick
}: ConfigButtonProps) => (
  <Grid item xs={6} md={3} key={sensorType}>
    <Button
      fullWidth
      variant={existingConfig ? 'contained' : 'outlined'}
      color={existingConfig ? 'secondary' : 'primary'}
      onClick={() => onClick(sensorType)}
      sx={{ height: 80 }}
    >
      <Box>
        <Typography variant='body1'>{sensorType}</Typography>
        <Typography variant='caption'>
          {existingConfig ? 'Configurado' : 'Nueva configuración'}
        </Typography>
      </Box>
    </Button>
  </Grid>
)
