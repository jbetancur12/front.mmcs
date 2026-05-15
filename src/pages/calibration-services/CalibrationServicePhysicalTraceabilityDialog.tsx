import { ChangeEvent, useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material'

export interface CalibrationServicePhysicalTraceabilityDialogValues {
  movementType: 'pickup' | 'delivery'
  occurredAt: string
  contactName: string
  contactRole: string
  location: string
  notes: string
}

interface Props {
  open: boolean
  serviceCode: string
  initialValues: CalibrationServicePhysicalTraceabilityDialogValues
  isLoading?: boolean
  onClose: () => void
  onSubmit: (
    values: CalibrationServicePhysicalTraceabilityDialogValues
  ) => void | Promise<void>
}

const CalibrationServicePhysicalTraceabilityDialog = ({
  open,
  serviceCode,
  initialValues,
  isLoading = false,
  onClose,
  onSubmit
}: Props) => {
  const [values, setValues] = useState(initialValues)

  useEffect(() => {
    if (open) {
      setValues(initialValues)
    }
  }, [initialValues, open])

  const handleChange =
    (field: keyof CalibrationServicePhysicalTraceabilityDialogValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.target.value
      }))
    }

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='md'>
      <DialogTitle>Registrar trazabilidad física</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Typography variant='body2' color='text.secondary'>
            Registra una recogida o entrega física para <strong>{serviceCode}</strong>.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label='Movimiento'
                value={values.movementType}
                onChange={handleChange('movementType')}
              >
                <MenuItem value='pickup'>Recogida</MenuItem>
                <MenuItem value='delivery'>Entrega</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type='datetime-local'
                label='Fecha y hora'
                value={values.occurredAt}
                onChange={handleChange('occurredAt')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Contacto'
                value={values.contactName}
                onChange={handleChange('contactName')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Cargo o rol'
                value={values.contactRole}
                onChange={handleChange('contactRole')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Ubicación'
                value={values.location}
                onChange={handleChange('location')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label='Observaciones'
                value={values.notes}
                onChange={handleChange('notes')}
              />
            </Grid>
          </Grid>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={() => void onSubmit(values)} disabled={isLoading}>
          Guardar movimiento
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServicePhysicalTraceabilityDialog
