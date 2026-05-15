import React from 'react'
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
  FormControlLabel,
  FormHelperText,
  Avatar
} from '@mui/material'
import { FormikProps } from 'formik'

export interface FieldConfig {
  accessorKey: string
  header: string
  type: 'text' | 'number' | 'select' | 'checkbox' | 'image' | 'date' // Added 'image' type
  options?: string[]
}

interface GenericFormModalProps {
  open: boolean
  fields: FieldConfig[]
  onClose: () => void
  submitButtonText: string
  formik: FormikProps<any>
}

const GenericFormModal: React.FC<GenericFormModalProps> = ({
  open,
  fields,
  onClose,
  submitButtonText,
  formik
}) => {
  return (
    <Dialog open={open}>
      <form onSubmit={formik?.handleSubmit}>
        <DialogTitle textAlign='center'>Crear Vehiculo</DialogTitle>
        <DialogContent sx={{ width: '100%', padding: '1rem' }}>
          <Stack sx={{ gap: '1.5rem', width: '100%', minWidth: '300px' }}>
            {fields.map((field) => (
              <FormControl key={field.accessorKey} fullWidth>
                {field.type === 'text' || field.type === 'number' ? (
                  <TextField
                    label={field.header}
                    name={field.accessorKey}
                    type={field.type}
                    value={formik.values[field.accessorKey]}
                    onChange={formik.handleChange}
                    error={
                      formik.touched[field.accessorKey] &&
                      Boolean(formik.errors[field.accessorKey])
                    }
                    helperText={
                      formik.touched[field.accessorKey] &&
                      (formik.errors[field.accessorKey] as React.ReactNode)
                    }
                  />
                ) : field.type === 'select' ? (
                  <>
                    <InputLabel>{field.header}</InputLabel>
                    <Select
                      label={field.header}
                      name={field.accessorKey}
                      value={formik.values[field.accessorKey]}
                      onChange={formik.handleChange}
                      error={
                        formik.touched[field.accessorKey] &&
                        Boolean(formik.errors[field.accessorKey])
                      }
                    >
                      {field.options?.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText>
                      {formik.touched[field.accessorKey] &&
                        (formik.errors[field.accessorKey] as React.ReactNode)}
                    </FormHelperText>
                  </>
                ) : field.type === 'image' ? (
                  <>
                    <div className='flex items-center justify-center mb-4'>
                      <label htmlFor='avatarInput' className='cursor-pointer'>
                        <Avatar
                          alt='Foto de perfil'
                          src={
                            formik.values[field.accessorKey]
                              ? URL.createObjectURL(
                                  formik.values[field.accessorKey]
                                )
                              : '/images/no-img.jpg'
                          } // Mostramos la foto de perfil seleccionada
                          sx={{ width: 100, height: 100, mb: 2 }}
                        />
                      </label>
                      {/* {formik.touched[field.accessorKey] &&
                        formik.errors[field.accessorKey] && (
                          <FormHelperText error>
                            {
                              formik.errors[
                                field.accessorKey
                              ] as React.ReactNode
                            }
                          </FormHelperText>
                        )} */}
                      <input
                        id='avatarInput'
                        type='file'
                        accept='image/*'
                        onChange={(event) => {
                          const file = event.currentTarget.files?.[0]

                          if (file) {
                            formik.setFieldValue(field.accessorKey, file)
                          }
                        }}
                        className='hidden'
                      />
                    </div>
                  </>
                ) : field.type === 'date' ? (
                  <TextField
                    label={field.header}
                    name={field.accessorKey}
                    type={field.type}
                    value={formik.values[field.accessorKey]}
                    onChange={formik.handleChange}
                    error={
                      formik.touched[field.accessorKey] &&
                      Boolean(formik.errors[field.accessorKey])
                    }
                    helperText={
                      formik.touched[field.accessorKey] &&
                      (formik.errors[field.accessorKey] as React.ReactNode)
                    }
                  />
                ) : (
                  <FormControlLabel
                    control={
                      <Checkbox
                        name={field.accessorKey}
                        checked={formik.values[field.accessorKey]}
                        onChange={formik.handleChange}
                      />
                    }
                    label={field.header}
                  />
                )}
              </FormControl>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type='submit' variant='contained' color='primary'>
            {submitButtonText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default GenericFormModal
