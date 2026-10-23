import { ChangeEvent, useEffect, useState } from 'react'
import { TextField } from '@mui/material'
import FormDialog from '../../Components/Common/FormDialog'

export interface CalibrationServicePauseDialogValues {
  notes: string
}

interface Props {
  open: boolean
  title: string
  subtitle: string
  fieldLabel: string
  actionLabel: string
  initialValues: CalibrationServicePauseDialogValues
  isLoading?: boolean
  onClose: () => void
  onSubmit: (
    values: CalibrationServicePauseDialogValues
  ) => void | Promise<void>
}

/** Pausar o reanudar un servicio, con una nota que explica el motivo. */
const CalibrationServicePauseDialog = ({
  open,
  title,
  subtitle,
  fieldLabel,
  actionLabel,
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

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValues({ notes: event.target.value })
  }

  return (
    <FormDialog
      open={open}
      onClose={isLoading ? () => undefined : onClose}
      title={title}
      subtitle={subtitle}
      submitLabel={actionLabel}
      onSubmit={() => void onSubmit(values)}
      loading={isLoading}
    >
      <TextField
        fullWidth
        multiline
        minRows={4}
        label={fieldLabel}
        value={values.notes}
        onChange={handleChange}
      />
    </FormDialog>
  )
}

export default CalibrationServicePauseDialog
