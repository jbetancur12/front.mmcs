import React from 'react'
import {
  Grid,
  MenuItem,
  Paper,
  Select,
  FormControl,
  InputLabel,
  Button,
  TextField,
  SelectChangeEvent
} from '@mui/material'
import { statusOptions } from './constants'
import { StatusKey } from './types'

interface StatusUpdateSectionProps {
  status: any
  handleStatus: (e: SelectChangeEvent) => void
  handleUpdateStatus: (e: React.MouseEvent) => void
  onStatusChange: (newStatus: any) => void // Nueva prop
}

export const StatusUpdateSection: React.FC<StatusUpdateSectionProps> = ({
  status,
  handleStatus,
  handleUpdateStatus,
  onStatusChange // Prop añadida
}) => (
  <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
    <Grid container spacing={2}>
      <Grid item xs={3}>
        <FormControl fullWidth>
          <InputLabel>Estado</InputLabel>
          <Select
            label='Estado'
            value={status.status}
            onChange={handleStatus}
            sx={{ mb: 2 }}
          >
            {Object.keys(statusOptions).map((key) => {
              const statusKey = key as StatusKey
              return (
                <MenuItem key={statusKey} value={statusKey}>
                  {statusOptions[statusKey]}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={9}>
        <TextField
          label='Observaciones'
          variant='outlined'
          multiline
          rows={1}
          value={status.comments}
          onChange={(e) =>
            onStatusChange({ ...status, comments: e.target.value })
          }
          fullWidth
          sx={{ mb: 2 }}
        />
      </Grid>
      <Grid
        item
        xs={3}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Button variant='contained' onClick={handleUpdateStatus}>
          Actualizar Estado
        </Button>
      </Grid>
    </Grid>
  </Paper>
)
