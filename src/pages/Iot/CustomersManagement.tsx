import { Grid } from '@mui/material'
import CustomersManagement from 'src/Components/Iot/CustomerManagament'

const Iot = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={12}>
        <CustomersManagement />
      </Grid>
    </Grid>
  )
}

export default Iot
