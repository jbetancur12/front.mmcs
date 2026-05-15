// components/DeviceGraphs/GraphDrawer/parts/SensorGauge.tsx
import { Paper, Typography, Box } from '@mui/material'

import { GaugeConfig } from '../types'
import SingleArcGauge from 'src/Components/Iot/Gauge'

interface SensorGaugeProps {
  value: number
  config?: GaugeConfig | null
  title: string
  defaults: {
    absoluteMin: number
    absoluteMax: number
    okMin: number
    okMax: number
  }
}

export const SensorGauge = ({
  value,
  config,
  title,
  defaults
}: SensorGaugeProps) => (
  <Paper sx={{ p: 2, textAlign: 'center', height: 320 }}>
    <Typography variant='h6' gutterBottom>
      {title}
    </Typography>
    <Box sx={{ height: 'calc(100% - 48px)' }}>
      <SingleArcGauge
        value={Number(value)}
        config={{
          absoluteMin: config?.absoluteMin || defaults.absoluteMin,
          absoluteMax: config?.absoluteMax || defaults.absoluteMax,
          okMin: config?.okMin || defaults.okMin,
          okMax: config?.okMax || defaults.okMax,
          alarmThresholds: config?.alarmThresholds || [],
          warningThresholds: config?.warningThresholds || [],
          sensorType: config?.sensorType || 'TEMPERATURA'
        }}
      />
    </Box>
  </Paper>
)
