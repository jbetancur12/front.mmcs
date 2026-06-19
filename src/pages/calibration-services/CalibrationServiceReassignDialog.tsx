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

export interface CalibrationServiceReassignDialogValues {
  assignedMetrologistUserIds: string[]
  operationalResponsibleName: string
  operationalResponsibleRole: string
  reassignmentReason: string
}

interface Props {
  open: boolean
  serviceCode: string
  initialValues: CalibrationServiceReassignDialogValues
  metrologists: CalibrationServiceUserSummary[]
  isLoading?: boolean
  onClose: () => void
  onSubmit: (values: CalibrationServiceReassignDialogValues) => void | Promise<void>
}

const CalibrationServiceReassignDialog = ({
  open,
  serviceCode,
  initialValues,
  metrologists,
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
    (field: keyof CalibrationServiceReassignDialogValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.target.value
      }))
    }

  const selectedMetrologists = metrologists.filter((m) =>
    values.assignedMetrologistUserIds.includes(String(m.id))
  )

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='md'>
      <DialogTitle>Asignar metrólogos</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Typography variant='body2' color='text.secondary'>
            Asigna uno o más metrólogos responsables de <strong>{serviceCode}</strong>.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={metrologists}
                value={selectedMetrologists}
                getOptionLabel={(option) =>
                  `${option.nombre}${option.email ? ` · ${option.email}` : ''}${option.active === false ? ' · cuenta sin activar' : ''}`
                }
                onChange={(_, newValue) => {
                  setValues((current) => ({
                    ...current,
                    assignedMetrologistUserIds: newValue.map((m) => String(m.id)),
                    operationalResponsibleName:
                      newValue.length > 0
                        ? newValue[0].nombre
                        : current.operationalResponsibleName,
                    operationalResponsibleRole:
                      newValue.length > 0 ? 'Metrologo' : current.operationalResponsibleRole
                  }))
                }}
                renderInput={(params) => (
                  <TextField {...params} label='Metrólogos asignados' placeholder='Selecciona metrólogos' />
                )}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label='Responsable operativo visible'
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
                label='Motivo de asignación'
                value={values.reassignmentReason}
                onChange={handleChange('reassignmentReason')}
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
          Guardar
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceReassignDialog