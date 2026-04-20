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
import { CalibrationServiceUserSummary } from '../../types/calibrationService'

export interface CalibrationServiceScheduleDialogValues {
  commitmentDate: string
  scheduledDate: string
  assignedMetrologistUserId: string
  operationalResponsibleName: string
  operationalResponsibleRole: string
  programmingNotes: string
}

interface CalibrationServiceScheduleDialogProps {
  open: boolean
  serviceCode: string
  initialValues: CalibrationServiceScheduleDialogValues
  metrologists: CalibrationServiceUserSummary[]
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: CalibrationServiceScheduleDialogValues) => void | Promise<void>
}

const CalibrationServiceScheduleDialog = ({
  open,
  serviceCode,
  initialValues,
  metrologists,
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

  const handleMetrologistChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextAssignedMetrologistUserId = event.target.value
    const selectedMetrologist = metrologists.find(
      (metrologist) => String(metrologist.id) === nextAssignedMetrologistUserId
    )

    setValues((currentValues) => ({
      ...currentValues,
      assignedMetrologistUserId: nextAssignedMetrologistUserId,
      operationalResponsibleName:
        selectedMetrologist?.nombre || currentValues.operationalResponsibleName,
      operationalResponsibleRole: selectedMetrologist ? 'Metrologo' : ''
    }))
  }

  const handleSubmit = async () => {
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='md' PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>Programar servicio</DialogTitle>
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
                select
                label='Metrólogo asignado'
                value={values.assignedMetrologistUserId}
                onChange={handleMetrologistChange}
                helperText='Selecciona el metrólogo interno que quedará a cargo del servicio.'
              >
                <MenuItem value=''>
                  Selecciona un metrólogo
                </MenuItem>
                {metrologists.map((metrologist) => (
                  <MenuItem key={metrologist.id} value={String(metrologist.id)}>
                    {metrologist.nombre}
                    {metrologist.email ? ` · ${metrologist.email}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Responsable operativo'
                value={values.operationalResponsibleName}
                onChange={handleChange('operationalResponsibleName')}
                helperText='Se completa con el metrólogo asignado y puedes ajustarlo si necesitas una etiqueta operativa más específica.'
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Rol o cargo'
                value={values.operationalResponsibleRole}
                onChange={handleChange('operationalResponsibleRole')}
                helperText='Puedes conservar “Metrologo” o ajustar el cargo operativo visible.'
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
        <Button onClick={onClose} disabled={isLoading} sx={{ borderRadius: 2 }}>
          Cancelar
        </Button>
        <Button variant='contained' disableElevation sx={{ borderRadius: 2 }} onClick={() => void handleSubmit()} disabled={isLoading}>
          Guardar programación
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceScheduleDialog
