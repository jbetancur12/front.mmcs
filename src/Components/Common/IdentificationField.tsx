import { useEffect, useState } from 'react'
import { InputAdornment, TextField } from '@mui/material'
import { useCustomerIdentificationCheck } from 'src/hooks/customers/useCustomerIdentificationCheck'
import { neutral } from 'src/theme/designTokens'
import {
  MAX_IDENTIFICATION_DIGITS,
  formatIdentification,
  identificationDigits,
  normalizeIdentification,
  parseIdentification
} from 'src/utils/identification'

interface IdentificationFieldProps {
  /** Valor canónico que guarda el formulario: "900123456-7". */
  value: string
  onChange: (value: string) => void
  label?: string
  required?: boolean
  autoFocus?: boolean
  /** Cliente que se está editando: no se compara contra sí mismo. */
  excludeCustomerId?: number | null
  /** Avisa al formulario cuando ya existe otro cliente con esa identificación. */
  onDuplicateChange?: (duplicate: boolean) => void
  /** Error externo, por ejemplo el campo obligatorio vacío al enviar. */
  errorText?: string
  /** Texto de apoyo cuando aún no hay dígitos. */
  helperText?: string
}

/**
 * Campo de NIT o cédula: solo acepta dígitos, muestra el dígito de
 * verificación calculado y avisa si la identificación ya está registrada en
 * otro cliente. El valor que entrega al formulario es "base-DV".
 */
const IdentificationField = ({
  value,
  onChange,
  label = 'NIT / identificación',
  required = false,
  autoFocus = false,
  excludeCustomerId,
  onDuplicateChange,
  errorText,
  helperText
}: IdentificationFieldProps) => {
  const { base, checkDigit } = parseIdentification(value)
  const { match, duplicate } = useCustomerIdentificationCheck(
    value,
    excludeCustomerId
  )
  // Texto visible sin DV. Se guarda aparte para que una letra escrita no quede
  // en el campo cuando la base de dígitos no cambia.
  const [displayValue, setDisplayValue] = useState(base)

  useEffect(() => {
    setDisplayValue(base)
  }, [base])

  useEffect(() => {
    onDuplicateChange?.(duplicate)
  }, [duplicate, onDuplicateChange])

  const handleChange = (nextValue: string) => {
    const digits = identificationDigits(nextValue)
    setDisplayValue(digits)
    onChange(digits ? normalizeIdentification(digits) : '')
  }

  const duplicateText = match
    ? `Ya existe un cliente con esta identificación: ${match.nombre}.`
    : ''
  const supportText = base
    ? `Se guardará como ${formatIdentification(base)}. Solo números.`
    : helperText ||
      'Solo números. El dígito de verificación se calcula automáticamente.'

  return (
    <TextField
      required={required}
      autoFocus={autoFocus}
      fullWidth
      label={label}
      value={displayValue}
      onChange={(event) => handleChange(event.target.value)}
      error={Boolean(errorText || duplicate)}
      helperText={errorText || duplicateText || supportText}
      inputProps={{
        inputMode: 'numeric',
        pattern: '[0-9]*',
        maxLength: MAX_IDENTIFICATION_DIGITS,
        'aria-label': label
      }}
      InputProps={{
        endAdornment:
          checkDigit === null ? undefined : (
            <InputAdornment position='end' sx={{ color: neutral.textMuted }}>
              -{checkDigit}
            </InputAdornment>
          )
      }}
    />
  )
}

export default IdentificationField
