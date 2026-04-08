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

export interface CalibrationServiceScheduleDialogValues {
  commitmentDate: string
  scheduledDate: string
  operationalResponsibleName: string
  operationalResponsibleRole: string
  programmingNotes: string
}

interface CalibrationServiceScheduleDialogProps {
  open: boolean
  serviceCode: string
  initialValues: CalibrationServiceScheduleDialogValues
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: CalibrationServiceScheduleDialogValues) => void | Promise<void>
}

const CalibrationServiceScheduleDialog = ({
  open,
  serviceCode,
  initialValues,
  isLoading = false,
  onClose,
  onSubmit
}: CalibrationServiceScheduleDialogProps) => {
  const [values, setValues] =
    useState<CalibrationServiceScheduleDialogValues>(initialValues)

  useEffect(() => {
    if (open) {
      setValues(initialValues)
    }
  }, [initialValues, open])

  const handleChange =
    (field: keyof CalibrationServiceScheduleDialogValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((currentValues) => ({
        ...currentValues,
        [field]: event.target.value
      }))
    }

  const handleSubmit = async () => {
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='md'>
      <DialogTitle>Programar servicio</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Typography variant='body2' color='text.secondary'>
            Define la fecha compromiso, la fecha programada y el responsable operativo para
            continuar con <strong>{serviceCode}</strong>.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type='date'
                label='Fecha compromiso'
                value={values.commitmentDate}
                onChange={handleChange('commitmentDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type='date'
                label='Fecha programada'
                value={values.scheduledDate}
                onChange={handleChange('scheduledDate')}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Responsable operativo'
                value={values.operationalResponsibleName}
                onChange={handleChange('operationalResponsibleName')}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Rol o cargo'
                value={values.operationalResponsibleRole}
                onChange={handleChange('operationalResponsibleRole')}
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
        <Button variant='contained' onClick={() => void handleSubmit()} disabled={isLoading}>
          Guardar programación
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceScheduleDialog
