import React, { useEffect, useState } from 'react'
import { Autocomplete, Box, TextField, Typography } from '@mui/material'
import { useReleaseServiceSearch } from 'src/hooks/releaseCertificates/useReleaseCertificates'
import { ReleaseServiceOption } from './ReleaseCertificates.types'

interface ReleaseServicePickerProps {
  value: ReleaseServiceOption | null
  onChange: (value: ReleaseServiceOption | null) => void
  /** Si se conoce el cliente, solo se ofrecen sus servicios. */
  customerId?: number | null
  disabled?: boolean
  helperText?: string
  /** Obligatorio: ya no dice «Opcional» y trae la lista sin escribir (el servidor la limita a las órdenes del usuario). */
  required?: boolean
}

const certificatesLabel = (option: ReleaseServiceOption) =>
  option.certificates.total === 0
    ? 'sin certificados'
    : `${option.certificates.released} de ${option.certificates.total} liberados`

/** Elige el servicio de calibración al que pertenece el certificado; se busca por el SCL, la ODS o la oferta. Es opcional. */
const ReleaseServicePicker: React.FC<ReleaseServicePickerProps> = ({
  value,
  onChange,
  customerId = null,
  disabled = false,
  helperText,
  required = false
}) => {
  const [input, setInput] = useState('')
  const [debounced, setDebounced] = useState('')
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(input.trim()), 300)
    return () => window.clearTimeout(timer)
  }, [input])

  const { data: options = [], isFetching } = useReleaseServiceSearch(
    customerId,
    debounced,
    required
  )
  // El valor actual siempre es una opción, aunque ya no salga en la búsqueda.
  const all =
    value && !options.some((option) => option.id === value.id)
      ? [value, ...options]
      : options

  return (
    <Autocomplete
      size='small'
      disabled={disabled}
      options={all}
      value={value}
      loading={isFetching}
      getOptionLabel={(option) => option.serviceCode}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      filterOptions={(list) => list}
      onChange={(_event, next) => onChange(next)}
      onInputChange={(_event, text, reason) => {
        if (reason === 'input') setInput(text)
      }}
      noOptionsText={
        customerId
          ? 'Este cliente no tiene servicios abiertos; escribe el SCL, la ODS o la oferta para buscar en todos'
          : 'Escribe el SCL, la ODS o la oferta'
      }
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Box>
            <Typography variant='body2' fontWeight={600}>
              {option.serviceCode}
            </Typography>
            <Typography
              variant='caption'
              color={
                option.sameCustomer === false
                  ? 'warning.main'
                  : 'text.secondary'
              }
            >
              {[
                option.odsCode ? `ODS ${option.odsCode}` : null,
                option.quoteCode ? `Oferta ${option.quoteCode}` : null,
                option.sameCustomer === false ? 'Otro cliente' : null,
                option.customerName,
                certificatesLabel(option)
              ]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
        </li>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label='Servicio (SCL, ODS u oferta)'
          required={required}
          placeholder={required ? 'Elige tu orden' : 'Opcional'}
          helperText={helperText}
        />
      )}
    />
  )
}

export default ReleaseServicePicker
