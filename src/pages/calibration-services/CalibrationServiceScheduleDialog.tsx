import { useEffect, useState } from 'react'
import {
  Autocomplete,
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
import { CalibrationServiceUserSummary } from '../../types/calibrationService'

export interface CalibrationServiceScheduleDialogValues {
  commitmentDate: string
  scheduledDate: string
  assignedMetrologistUserIds: string[]
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
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((currentValues) => ({
        ...currentValues,
        [field]: event.target.value
      }))
    }

  const selectedMetrologists = metrologists.filter((m) =>
    values.assignedMetrologistUserIds.includes(String(m.id))
  )

  const handleSubmit = async () => {
    await onSubmit(values)
  }

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='md' PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>Programar servicio</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Typography variant='body2' color='text.secondary'>
            Define la fecha compromiso, la fecha programada y los metrólogos responsables para
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
              <Autocomplete
                multiple
                options={metrologists}
                value={selectedMetrologists}
                getOptionLabel={(option) =>
                  `${option.nombre}${option.email ? ` · ${option.email}` : ''}${option.active === false ? ' · cuenta sin activar' : ''}`
                }
                onChange={(_, newValue) => {
                  setValues((currentValues) => ({
                    ...currentValues,
                    assignedMetrologistUserIds: newValue.map((m) => String(m.id)),
                    operationalResponsibleName:
                      newValue.length > 0
                        ? newValue[0].nombre
                        : currentValues.operationalResponsibleName,
                    operationalResponsibleRole:
                      newValue.length > 0 ? 'Metrologo' : currentValues.operationalResponsibleRole
                  }))
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label='Metrólogos asignados'
                    placeholder='Selecciona metrólogos'
                    helperText='Selecciona uno o más metrólogos internos que quedarán a cargo del servicio.'
                  />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Responsable operativo'
                value={values.operationalResponsibleName}
                onChange={handleChange('operationalResponsibleName')}
                helperText='Se completa con el primer metrólogo asignado y puedes ajustarlo si necesitas una etiqueta operativa más específica.'
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