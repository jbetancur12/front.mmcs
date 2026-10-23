import React from 'react'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import esLocale from 'date-fns/locale/es'
import { format, isValid, parse } from 'date-fns'

interface FormDateFieldProps {
  label: string
  name: string
  /** Fecha como `yyyy-MM-dd` o vacío. */
  value: string
  onChange: (value: string) => void
  error?: string | false
  disabled?: boolean
}

const toDate = (value: string): Date | null => {
  if (!value) return null
  const parsed = parse(value.slice(0, 10), 'yyyy-MM-dd', new Date())
  return isValid(parsed) ? parsed : null
}

/**
 * Campo de fecha en español para formularios. Trabaja con texto
 * `yyyy-MM-dd` en hora local (sin el desfase de `toISOString`) y muestra el
 * error que recibe.
 */
const FormDateField: React.FC<FormDateFieldProps> = ({
  label,
  name,
  value,
  onChange,
  error,
  disabled
}) => (
  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={esLocale}>
    <DatePicker
      label={label}
      value={toDate(value)}
      disabled={disabled}
      onChange={(date) =>
        onChange(date && isValid(date) ? format(date, 'yyyy-MM-dd') : '')
      }
      slotProps={{
        textField: {
          fullWidth: true,
          name,
          error: Boolean(error),
          helperText: error || undefined,
          InputLabelProps: { shrink: true }
        }
      }}
    />
  </LocalizationProvider>
)

export default FormDateField
