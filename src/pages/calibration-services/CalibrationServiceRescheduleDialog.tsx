import { ChangeEvent, useEffect, useState } from 'react'
import { TextField } from '@mui/material'
import FormDialog, {
  FormDialogSection
} from '../../Components/Common/FormDialog'

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
  onSubmit: (
    values: CalibrationServiceRescheduleDialogValues
  ) => void | Promise<void>
}

const FULL_ROW = { gridColumn: { sm: '1 / -1' } }

/** Reprogramación formal de un servicio: nuevas fechas y motivo. */
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
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title='Reprogramar servicio'
      subtitle={serviceCode}
      submitLabel='Guardar reprogramación'
      onSubmit={() => void onSubmit(values)}
      loading={isLoading}
      maxWidth='md'
    >
      <FormDialogSection
        title='Nuevas fechas'
        description='Queda registrada como una reprogramación formal.'
      >
        <TextField
          type='date'
          label='Nueva fecha compromiso'
          value={values.commitmentDate}
          onChange={handleChange('commitmentDate')}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          type='date'
          label='Nueva fecha programada'
          value={values.scheduledDate}
          onChange={handleChange('scheduledDate')}
          InputLabelProps={{ shrink: true }}
        />
      </FormDialogSection>
      <FormDialogSection title='Motivo'>
        <TextField
          multiline
          minRows={3}
          label='Motivo de reprogramación'
          sx={FULL_ROW}
          value={values.reprogrammingReason}
          onChange={handleChange('reprogrammingReason')}
        />
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

export default CalibrationServiceRescheduleDialog
