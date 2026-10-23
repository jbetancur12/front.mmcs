import { ChangeEvent, useEffect, useState } from 'react'
import { MenuItem, TextField } from '@mui/material'
import FormDialog, {
  FormDialogSection
} from '../../Components/Common/FormDialog'

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

const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

/** Registra una recogida o entrega física de equipos de un servicio. */
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
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title='Registrar trazabilidad física'
      subtitle={serviceCode}
      submitLabel='Guardar movimiento'
      onSubmit={() => void onSubmit(values)}
      loading={isLoading}
      maxWidth='md'
    >
      <FormDialogSection
        title='Movimiento'
        description='Una recogida o una entrega física de los equipos.'
      >
        <TextField
          select
          label='Movimiento'
          value={values.movementType}
          onChange={handleChange('movementType')}
        >
          <MenuItem value='pickup'>Recogida</MenuItem>
          <MenuItem value='delivery'>Entrega</MenuItem>
        </TextField>
        <TextField
          type='datetime-local'
          label='Fecha y hora'
          value={values.occurredAt}
          onChange={handleChange('occurredAt')}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label='Ubicación'
          sx={FULL_ROW}
          value={values.location}
          onChange={handleChange('location')}
        />
      </FormDialogSection>
      <FormDialogSection title='Quién entrega o recibe'>
        <TextField
          label='Contacto'
          value={values.contactName}
          onChange={handleChange('contactName')}
        />
        <TextField
          label='Cargo o rol'
          value={values.contactRole}
          onChange={handleChange('contactRole')}
        />
        <TextField
          multiline
          minRows={3}
          label='Observaciones'
          sx={FULL_ROW}
          value={values.notes}
          onChange={handleChange('notes')}
        />
      </FormDialogSection>
    </FormDialog>
  )
}

export default CalibrationServicePhysicalTraceabilityDialog
