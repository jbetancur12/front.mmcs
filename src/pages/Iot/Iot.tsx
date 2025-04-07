import { Grid } from '@mui/material'
import { WebSocketProvider } from '@utils/use-websockets'

// import DeviceIotMap from 'src/Components/Iot/DeviceMap'
import DeviceIotMap from 'src/Components/Iot/DeviceIotMap/index'

const Iot = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={12}>
        <WebSocketProvider>
          <DeviceIotMap />
        </WebSocketProvider>
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
