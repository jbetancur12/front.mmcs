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

export interface CalibrationServiceReassignDialogValues {
  assignedMetrologistUserId: string
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
    (event: ChangeEvent<HTMLInputElement>) => {
      setValues((current) => ({
        ...current,
        [field]: event.target.value
      }))
    }

  const handleMetrologistChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextId = event.target.value
    const selected = metrologists.find((item) => String(item.id) === nextId)

    setValues((current) => ({
      ...current,
      assignedMetrologistUserId: nextId,
      operationalResponsibleName: selected?.nombre || current.operationalResponsibleName,
      operationalResponsibleRole: selected ? 'Metrologo' : current.operationalResponsibleRole
    }))
  }

  return (
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='md'>
      <DialogTitle>Reasignar metrólogo</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          <Typography variant='body2' color='text.secondary'>
            Cambia el metrólogo responsable de <strong>{serviceCode}</strong> y deja
            trazabilidad del motivo.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label='Nuevo metrólogo asignado'
                value={values.assignedMetrologistUserId}
                onChange={handleMetrologistChange}
              >
                <MenuItem value=''>Selecciona un metrólogo</MenuItem>
                {metrologists.map((metrologist) => (
                  <MenuItem key={metrologist.id} value={String(metrologist.id)}>
                    {metrologist.nombre}
                    {metrologist.email ? ` · ${metrologist.email}` : ''}
                    {metrologist.active === false ? ' · cuenta sin activar' : ''}
                  </MenuItem>
                ))}
              </TextField>
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
                label='Motivo de reasignación'
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
          Guardar reasignación
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServiceReassignDialog
