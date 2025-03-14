import { Grid } from '@mui/material'
import { useStore } from '@nanostores/react'
import useWebSocket from '@utils/useWebSocket'
import DeviceIotMap from 'src/Components/Iot/DeviceMap'
import TemperatureChart from 'src/Components/Iot/TemperatureChart'
import { $devicesIot, $realTimeData } from 'src/store/deviceIotStore'
import DeviceList from './IotTable'

const Iot = () => {
  useWebSocket()
  const devices = useStore($devicesIot)
  const realTimeData = useStore($realTimeData)

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={12}>
        <DeviceIotMap />
      </Grid>

      {/* <Grid item xs={12} md={12}>
        <TemperatureChart
          data={Object.values(realTimeData)
            .flat()
            .map((payload) => payload.data)}
        />
      </Grid>  */}

      {/* <Grid item xs={12}>
          <DataTable />
        </Grid> */}
    </Grid>
  )
}

export default Iot
