import { useEffect, useState } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import FormDialog, {
  FormDialogSection
} from '../../Components/Common/FormDialog'
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
  onSubmit: (
    values: CalibrationServiceScheduleDialogValues
  ) => void | Promise<void>
}

const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

/** Programa un servicio: fechas, metrólogos responsables y notas. */
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

  return (
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title='Programar servicio'
      subtitle={serviceCode}
      submitLabel='Guardar programación'
      onSubmit={() => void onSubmit(values)}
      loading={isLoading}
      maxWidth='md'
    >
      <FormDialogSection title='Fechas'>
        <TextField
          type='date'
          label='Fecha compromiso'
          value={values.commitmentDate}
          onChange={handleChange('commitmentDate')}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type='date'
          label='Fecha programada'
          value={values.scheduledDate}
          onChange={handleChange('scheduledDate')}
          InputLabelProps={{ shrink: true }}
        />
      </FormDialogSection>
      <FormDialogSection
        title='Responsables'
        description='Los metrólogos internos que quedarán a cargo del servicio.'
      >
        <Autocomplete
          multiple
          sx={FULL_ROW}
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
                newValue.length > 0
                  ? 'Metrologo'
                  : currentValues.operationalResponsibleRole
            }))
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label='Metrólogos asignados'
              placeholder='Selecciona metrólogos'
            />
          )}
        />
        <TextField
          label='Responsable operativo'
          value={values.operationalResponsibleName}
          onChange={handleChange('operationalResponsibleName')}
          helperText='Se completa con el primer metrólogo; puedes cambiarlo.'
        />
        <TextField
          label='Rol o cargo'
          value={values.operationalResponsibleRole}
          onChange={handleChange('operationalResponsibleRole')}
          helperText='Puedes dejar “Metrologo” o poner otro cargo visible.'
        />
      </FormDialogSection>
      <FormDialogSection title='Notas'>
        <TextField
          multiline
          minRows={3}
          label='Notas de programación'
          sx={FULL_ROW}
          value={values.programmingNotes}
          onChange={handleChange('programmingNotes')}
        />
      </FormDialogSection>
    </FormDialog>
  )
}

export default CalibrationServiceScheduleDialog
