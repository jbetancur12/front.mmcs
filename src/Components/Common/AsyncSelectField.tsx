import { useEffect, useState } from 'react'
import { Autocomplete, CircularProgress, TextField } from '@mui/material'

export interface AsyncSelectOption {
  value: string | number
  label: string
  [extra: string]: any
}

interface AsyncSelectFieldProps<T extends AsyncSelectOption> {
  label: string
  value: T | null
  onChange: (option: T | null) => void
  /** Busca en el servidor lo que el usuario escribió. */
  loadOptions: (input: string) => Promise<T[]>
  /** Opciones que se ofrecen antes de escribir (recientes o la lista corta). */
  defaultOptions?: T[]
  required?: boolean
  disabled?: boolean
  helperText?: string
}

const SEARCH_DELAY_MS = 350

/**
 * Campo de búsqueda con opciones que vienen del servidor (clientes, equipos,
 * tipos). Mismo contorno y foco turquesa que los demás campos del
 * `FormDialog`; reemplaza al `react-select` asíncrono suelto.
 */
const AsyncSelectField = <T extends AsyncSelectOption>({
  label,
  value,
  onChange,
  loadOptions,
  defaultOptions = [],
  required = false,
  disabled = false,
  helperText
}: AsyncSelectFieldProps<T>) => {
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<T[]>(defaultOptions)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const term = inputValue.trim()
    // Sin texto, o con el texto de la opción ya elegida, se ofrecen las de siempre
    if (!term || term === value?.label) {
      setOptions(defaultOptions)
      return undefined
    }
    let cancelled = false
    const timer = setTimeout(() => {
      setLoading(true)
      loadOptions(term)
        .then((found) => {
          if (!cancelled) setOptions(found)
        })
        .catch(() => {
          if (!cancelled) setOptions([])
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, SEARCH_DELAY_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // defaultOptions cambia de identidad en cada render del padre
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue, value])

  return (
    <Autocomplete<T, false, false, false>
      options={options}
      value={value}
      onChange={(_event, option) => onChange(option)}
      inputValue={inputValue}
      onInputChange={(_event, text) => setInputValue(text)}
      // El servidor ya filtró: no volver a filtrar en el navegador
      filterOptions={(all) => all}
      isOptionEqualToValue={(a, b) => String(a.value) === String(b.value)}
      getOptionLabel={(option) => option.label}
      loading={loading}
      loadingText='Buscando…'
      noOptionsText='Sin resultados'
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? (
                  <CircularProgress color='inherit' size={18} />
                ) : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
        />
      )}
    />
  )
}

export default AsyncSelectField
