import { Edit } from '@mui/icons-material'
import Autocomplete from '@mui/material/Autocomplete'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import * as React from 'react'
import { IconButton } from '@mui/material'

interface SearchProps<T> extends React.ComponentProps<typeof TextField> {
  endpoint: string // URL del endpoint de la API
  label: string // Etiqueta del campo de entrada
  mapOption: (data: any) => T[] // Función para mapear los datos de la API a opciones
  getOptionLabel: (option: T) => string // Función para obtener la etiqueta de una opción
  onClientSelection: (option: T | null) => void
  token: string | null
  value?: string
  isEdit?: boolean
}

export default function Asynchronous<T>({
  endpoint,
  label,
  mapOption,
  getOptionLabel,
  onClientSelection,
  token,
  sx,
  value,
  isEdit
}: SearchProps<T>) {
  const [open, setOpen] = React.useState(false)
  const [options, setOptions] = React.useState<readonly T[]>([])
  const [inputValue, setInputValue] = React.useState(value)
  const [loading, setLoading] = React.useState(false)
  const [editMode, setEditMode] = React.useState(isEdit)

  const debounceTimeoutRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    let active = true
    console.log('===>', value)

    if (!open) {
      return undefined
    }

    if (inputValue === '') {
      setOptions([])
      return undefined
    }

    // Cancelar el debounce anterior si existe
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    setLoading(true)

    // Establecer un nuevo debounce para la búsqueda
    //@ts-ignore
    debounceTimeoutRef.current = setTimeout(() => {
      const requestOptions = {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}` // Usa la prop "token" aquí
        }
      }

      fetch(`${endpoint}?q=${inputValue}`, requestOptions)
        .then((response) => response.json())
        .then((data) => {
          if (active) {
            const mappedOptions = mapOption(data)
            setOptions(mappedOptions)
            setLoading(false)
          }
        })
    }, 500) // Cambia el valor del tiempo de espera según tus necesidades

    return () => {
      active = false
    }
  }, [inputValue, open, endpoint, mapOption, token])

  const handleToggleEditMode = () => {
    setEditMode((prevEditMode) => !prevEditMode)
  }

  return (
    <>
      {!editMode ? (
        <Autocomplete
          onLoad={(e) => console.log(e)}
          id='asynchronous-demo'
          sx={{ ...sx }}
          // fullWidth
          open={open}
          onOpen={() => {
            setOpen(true)
          }}
          onClose={() => {
            setOpen(false)
          }}
          getOptionLabel={getOptionLabel}
          options={options}
          loading={loading}
          inputValue={inputValue}
          onInputChange={(_, newInputValue) => {
            setInputValue(newInputValue)
          }}
          onChange={(_, newValue) => {
            onClientSelection(newValue)
          }}
          renderInput={(params) => {
            return (
              <TextField
                {...params}
                label={label}
                // fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {loading ? (
                        <CircularProgress color='inherit' size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </React.Fragment>
                  )
                }}
              />
            )
          }}
        />
      ) : (
        <TextField
          sx={{ ...sx }}
          label={label}
          value={value}
          fullWidth
          InputProps={{
            readOnly: true,
            endAdornment: (
              <IconButton onClick={handleToggleEditMode} size='small'>
                <Edit />
              </IconButton>
            )
          }}
        />
      )}
    </>
  )
}
