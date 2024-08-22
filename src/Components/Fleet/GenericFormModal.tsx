import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel
} from '@mui/material'

export interface FieldConfig {
  accessorKey: string
  header: string
  type: 'text' | 'number' | 'select' | 'checkbox' // Added 'checkbox' type
  options?: string[]
}

interface GenericFormModalProps {
  open: boolean
  fields: FieldConfig[]
  onClose: () => void
  onSubmit: (values: Record<string, any>) => void
  submitButtonText: string
  initialValues?: Record<string, any>
}

const GenericFormModal: React.FC<GenericFormModalProps> = ({
  open,
  fields,
  onClose,
  onSubmit,
  submitButtonText,
  initialValues = {}
}) => {
  // const initialValues = useMemo(
  //   () =>
  //     fields.reduce(
  //       (acc, field) => ({
  //         ...acc,
  //         [field.accessorKey]: field.type === 'checkbox' ? false : ''
  //       }),
  //       {}
  //     ),
  //   [fields]
  // )

  const [values, setValues] = useState<Record<string, any>>(initialValues)

  useEffect(() => {
    if (JSON.stringify(values) !== JSON.stringify(initialValues)) {
      setValues(initialValues)
    }
  }, [initialValues])

  const handleSubmit = async () => {
    try {
      await onSubmit(values)
      onClose()
    } catch (error) {
      console.error('Error al enviar el formulario:', error)
    }
  }

  return (
    <Dialog open={open}>
      <DialogTitle textAlign='center'>Formulario</DialogTitle>
      <DialogContent>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack sx={{ gap: '1.5rem', width: '100%', minWidth: '300px' }}>
            {fields.map((field) => (
              <FormControl key={field.accessorKey} fullWidth>
                {field.type === 'select' ? (
                  <>
                    <InputLabel>{field.header}</InputLabel>
                    <Select
                      value={values[field.accessorKey] || ''}
                      onChange={(e) =>
                        setValues({
                          ...values,
                          [field.accessorKey]: e.target.value
                        })
                      }
                    >
                      {field.options?.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </>
                ) : field.type === 'checkbox' ? (
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={values[field.accessorKey] || false}
                        onChange={(e) =>
                          setValues({
                            ...values,
                            [field.accessorKey]: e.target.checked
                          })
                        }
                      />
                    }
                    label={field.header}
                  />
                ) : (
                  <TextField
                    label={field.header}
                    type={field.type}
                    value={values[field.accessorKey] || ''}
                    onChange={(e) =>
                      setValues({
                        ...values,
                        [field.accessorKey]: e.target.value
                      })
                    }
                  />
                )}
              </FormControl>
            ))}
          </Stack>
        </form>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <Button onClick={onClose}>Cancelar</Button>
        <Button color='secondary' onClick={handleSubmit} variant='contained'>
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default GenericFormModal
