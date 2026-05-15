import { Grid } from '@mui/material'

import ModulesView from 'src/Components/Modules/components/ModulesView'

const Modules = () => {
  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={12}>
        <h1>
          <ModulesView />
        </h1>
      </Grid>
    </Grid>
  )
}

export default Modules
