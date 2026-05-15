import { ChangeEvent, useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Stack,
  TextField,
  Typography
} from '@mui/material'

export interface CalibrationServiceRescheduleDialogValues {
  commitmentDate: string
  scheduledDate: string
  reprogrammingReason: string
  programmingNotes: string
}

interface Props {
  open: boolean
  serviceCode: string
  initialValues: CalibrationServiceRescheduleDialogValues
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: CalibrationServiceRescheduleDialogValues) => void | Promise<void>
}

const CalibrationServiceRescheduleDialog = ({
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
    (field: keyof CalibrationServiceRescheduleDialogValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.target.value
      }))
    }

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='md'>
      <DialogTitle>Reprogramar servicio</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Typography variant='body2' color='text.secondary'>
            Registra una reprogramación formal para <strong>{serviceCode}</strong> con
            nuevas fechas y un motivo claro.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type='date'
                label='Nueva fecha compromiso'
                value={values.commitmentDate}
                onChange={handleChange('commitmentDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type='date'
                label='Nueva fecha programada'
                value={values.scheduledDate}
                onChange={handleChange('scheduledDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label='Motivo de reprogramación'
                value={values.reprogrammingReason}
                onChange={handleChange('reprogrammingReason')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                minRows={3}
                label='Notas de programación'
                value={values.programmingNotes}
                onChange={handleChange('programmingNotes')}
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
          Guardar reprogramación
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceRescheduleDialog
