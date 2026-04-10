import { ChangeEvent, useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from '@mui/material'

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
  onSubmit: (values: CalibrationServicePauseDialogValues) => void | Promise<void>
}

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
    <Dialog open={open} onClose={isLoading ? undefined : onClose} fullWidth maxWidth='sm'>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          <Typography variant='body2' color='text.secondary'>
            {subtitle}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={4}
            label={fieldLabel}
            value={values.notes}
            onChange={handleChange}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancelar
        </Button>
        <Button variant='contained' onClick={() => void onSubmit(values)} disabled={isLoading}>
          {actionLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default CalibrationServicePauseDialog
