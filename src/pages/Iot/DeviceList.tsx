import { Grid } from '@mui/material'
import DeviceList from 'src/Components/Iot/DeviceManagement/components/DeviceList'

const Iot = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={12}>
        <DeviceList />
      </Grid>
    </Grid>
  )
}

export default Iot
