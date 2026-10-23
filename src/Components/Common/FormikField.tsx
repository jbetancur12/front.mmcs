import React from 'react'
import {
  Checkbox,
  FormControlLabel,
  MenuItem,
  TextField,
  type TextFieldProps
} from '@mui/material'
import type { FormikProps } from 'formik'

type Option = string | { label: string; value: string | number }

type FormikFieldProps<T> = Omit<
  TextFieldProps,
  'name' | 'value' | 'onChange' | 'error' | 'select'
> & {
  formik: FormikProps<T>
  name: keyof T & string
  /** Si se pasa, el campo es un selector con estas opciones. */
  options?: Option[]
  /** Texto largo: 2 filas y crece al escribir. */
  multiline?: boolean
}

/**
 * Campo de texto, número o selector enlazado a Formik. Resuelve solo
 * `value`, `onChange`, `error` y `helperText` (el ayuda se reemplaza por el
 * error cuando lo hay), de modo que ningún campo se quede sin mostrar su
 * validación.
 */
function FormikField<T>({
  formik,
  name,
  options,
  helperText,
  multiline,
  ...rest
}: FormikFieldProps<T>): React.ReactElement {
  const touched = (formik.touched as Record<string, unknown>)[name]
  const err = (formik.errors as Record<string, unknown>)[name]
  const showError = Boolean(touched && err)
  const value = (formik.values as Record<string, unknown>)[name]

  return (
    <TextField
      fullWidth
      {...rest}
      select={Boolean(options)}
      multiline={multiline}
      minRows={multiline ? 2 : undefined}
      name={name}
      value={value ?? ''}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={showError}
      helperText={showError ? String(err) : helperText}
    >
      {options?.map((opt) => {
        const o = typeof opt === 'string' ? { label: opt, value: opt } : opt
        return (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        )
      })}
    </TextField>
  )
}

export default FormikField

interface FormCheckboxFieldProps<T> {
  formik: FormikProps<T>
  name: keyof T & string
  label: string
}

/** Casilla de sí/no enlazada a Formik, alineada con los campos de la cuadrícula. */
export function FormCheckboxField<T>({
  formik,
  name,
  label
}: FormCheckboxFieldProps<T>): React.ReactElement {
  return (
    <FormControlLabel
      label={label}
      control={
        <Checkbox
          name={name}
          checked={Boolean((formik.values as Record<string, unknown>)[name])}
          onChange={formik.handleChange}
          sx={{ '&.Mui-checked': { color: '#00BFA5' } }}
        />
      }
    />
  )
}
