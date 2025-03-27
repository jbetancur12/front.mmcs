// components/DeviceGraphs/GraphDrawer/tabs/SummaryTab.tsx
import { Grid, Paper, Typography } from '@mui/material'
import { SensorGauge } from '../parts/SensorGauge'

import { GaugeConfig } from '../types'
import TemperatureChart from 'src/Components/Iot/TemperatureChart'

interface SummaryTabProps {
  realTimeDataFlat: any[]
  lastEntry?: any
  tempConfig?: GaugeConfig | null
  humConfig?: GaugeConfig | null
  lastTemperature: number | string
  lastHumidity: number | string
}

export const SummaryTab = ({
  realTimeDataFlat,
  lastEntry,
  tempConfig,
  humConfig,
  lastTemperature,
  lastHumidity
}: SummaryTabProps) => (
  <Grid container spacing={3}>
    <Grid item xs={12} md={4}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <SensorGauge
            value={Number(lastTemperature)}
            config={tempConfig}
            title='Temperatura'
            defaults={{
              absoluteMin: 20,
              absoluteMax: 30,
              okMin: 20,
              okMax: 25
            }}
          />
        </Grid>
        <Grid item xs={12}>
          <SensorGauge
            value={Number(lastHumidity)}
            config={humConfig}
            title='Humedad'
            defaults={{
              absoluteMin: 50,
              absoluteMax: 80,
              okMin: 50,
              okMax: 60
            }}
          />
        </Grid>
      </Grid>
    </Grid>

    <Grid item xs={12} md={8}>
      <Grid container spacing={2} sx={{ height: '100%' }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant='h6' gutterBottom>
              Variación Temporal - Temperatura (°C)
            </Typography>
            <TemperatureChart type='temperature' data={realTimeDataFlat} />
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2, height: 320 }}>
            <Typography variant='h6' gutterBottom>
              Variación Temporal - Humedad (%)
            </Typography>
            <TemperatureChart type='humidity' data={realTimeDataFlat} />
          </Paper>
        </Grid>
      </Grid>
    </Grid>

    <Grid item xs={12}>
      <Typography variant='body2' color='text.secondary' align='left'>
        Última actualización:{' '}
        {new Date(lastEntry?.timestamp).toLocaleTimeString()}
      </Typography>
    </Grid>
  </Grid>
)
