import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import TextField from '@mui/material/TextField';
import * as React from 'react';

interface SearchProps<T> {
  endpoint: string; // URL del endpoint de la API
  label: string; // Etiqueta del campo de entrada
  mapOption: (data: any) => T[]; // Función para mapear los datos de la API a opciones
  getOptionLabel: (option: T) => string; // Función para obtener la etiqueta de una opción
  onClientSelection: (option: T | null) => void;
}


export default function Asynchronous<T>({
  endpoint,
  label,
  mapOption,
  getOptionLabel,
  onClientSelection
}: SearchProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState<readonly T[]>([]);
  const [inputValue, setInputValue] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const debounceTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {

    let active = true;

    if (!open) {
      return undefined;
    }

    if (inputValue === '') {
      setOptions([]);
      return undefined;
    }

     // Cancelar el debounce anterior si existe
     if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    setLoading(true);

          // Establecer un nuevo debounce para la búsqueda
    debounceTimeoutRef.current = setTimeout(() => {
      fetch(`${endpoint}?q=${inputValue}`)
        .then((response) => response.json())
        .then((data) => {
          if (active) {
            const mappedOptions = mapOption(data);
            setOptions(mappedOptions);
            setLoading(false);
          }
        });
    }, 800); // Cambia el valor del tiempo de espera según tus necesidades


    return () => {
      active = false;
    };
  }, [inputValue, open, endpoint, mapOption]);

  return (
    <Autocomplete
      id="asynchronous-demo"
      sx={{ width: 300 }}
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      getOptionLabel={getOptionLabel}
      options={options}
      loading={loading}
      inputValue={inputValue}
      onInputChange={(_, newInputValue) => {
        setInputValue(newInputValue);
      }}
      onChange={(_, newValue) => {
        onClientSelection(newValue);
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
    />
  );
}
