import { Grid } from '@mui/material'

import useWebSocket from '@utils/useWebSocket'
// import DeviceIotMap from 'src/Components/Iot/DeviceMap'
import DeviceIotMap from 'src/Components/Iot/DeviceIotMap/index'

const Iot = () => {
  useWebSocket()

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
