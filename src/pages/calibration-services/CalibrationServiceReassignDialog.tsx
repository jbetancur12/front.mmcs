import { useEffect, useState } from 'react'
import { Autocomplete, TextField } from '@mui/material'
import FormDialog, {
  FormDialogSection
} from '../../Components/Common/FormDialog'
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
  onSubmit: (
    values: CalibrationServiceReassignDialogValues
  ) => void | Promise<void>
}

const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

/** Asigna uno o más metrólogos responsables de un servicio. */
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
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title='Asignar metrólogos'
      subtitle={serviceCode}
      submitLabel='Guardar asignación'
      onSubmit={() => void onSubmit(values)}
      loading={isLoading}
      maxWidth='md'
    >
      <FormDialogSection
        title='Responsables'
        description='Asigna uno o más metrólogos al servicio.'
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
            setValues((current) => ({
              ...current,
              assignedMetrologistUserIds: newValue.map((m) => String(m.id)),
              operationalResponsibleName:
                newValue.length > 0
                  ? newValue[0].nombre
                  : current.operationalResponsibleName,
              operationalResponsibleRole:
                newValue.length > 0
                  ? 'Metrologo'
                  : current.operationalResponsibleRole
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
          label='Responsable operativo visible'
          value={values.operationalResponsibleName}
          onChange={handleChange('operationalResponsibleName')}
        />
        <TextField
          label='Rol o cargo'
          value={values.operationalResponsibleRole}
          onChange={handleChange('operationalResponsibleRole')}
        />
      </FormDialogSection>
      <FormDialogSection title='Motivo'>
        <TextField
          multiline
          minRows={3}
          label='Motivo de asignación'
          sx={FULL_ROW}
          value={values.reassignmentReason}
          onChange={handleChange('reassignmentReason')}
        />
      </FormDialogSection>
    </FormDialog>
  )
}

export default CalibrationServiceReassignDialog
