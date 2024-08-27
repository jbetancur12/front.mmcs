import React from 'react'
import { TextField, MenuItem, Grid } from '@mui/material'
import { Inspection } from './types'

interface InspectionComponentProps {
  inspection: Inspection | null
  setInspection: React.Dispatch<React.SetStateAction<Inspection | null>>
}

const InspectionComponent: React.FC<InspectionComponentProps> = ({
  inspection,
  setInspection
}) => {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          select
          label='Condición de Llantas'
          value={inspection?.tireCondition || ''}
          onChange={(e) =>
            setInspection((prev) => ({
              ...prev!,
              tireCondition: e.target.value
            }))
          }
        >
          <MenuItem value='Good'>Good</MenuItem>
          <MenuItem value='Fair'>Fair</MenuItem>
          <MenuItem value='Poor'>Poor</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          select
          label='Condición de Brazos'
          value={inspection?.brakeCondition || ''}
          onChange={(e) =>
            setInspection((prev) => ({
              ...prev!,
              brakeCondition: e.target.value
            }))
          }
        >
          <MenuItem value='Good'>Good</MenuItem>
          <MenuItem value='Fair'>Fair</MenuItem>
          <MenuItem value='Poor'>Poor</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          select
          label='Condición de Líquidos'
          value={inspection?.fluidLevels || ''}
          onChange={(e) =>
            setInspection((prev) => ({
              ...prev!,
              fluidLevels: e.target.value
            }))
          }
        >
          <MenuItem value='Good'>Good</MenuItem>
          <MenuItem value='Fair'>Fair</MenuItem>
          <MenuItem value='Low'>Low</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          select
          label='Condición de Luces'
          value={inspection?.lightsCondition || ''}
          onChange={(e) =>
            setInspection((prev) => ({
              ...prev!,
              lightsCondition: e.target.value
            }))
          }
        >
          <MenuItem value='Good'>Good</MenuItem>
          <MenuItem value='Fair'>Fair</MenuItem>
          <MenuItem value='Poor'>Poor</MenuItem>
        </TextField>
      </Grid>
      <Grid item xs={12}>
        <TextField
          fullWidth
          label='Comentarios'
          multiline
          rows={3}
          value={inspection?.comments || ''}
          onChange={(e) =>
            setInspection((prev) => ({
              ...prev!,
              comments: e.target.value
            }))
          }
        />
      </Grid>
    </Grid>
  )
}

export default InspectionComponent
