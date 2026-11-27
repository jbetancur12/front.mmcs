import { Alert, Box, Checkbox, FormControlLabel } from '@mui/material'

/** «Es un lote nuevo» del formato de ingreso: otra visita, sin mover el ingreso anterior. */
const NewBatchField = ({
  checked,
  onChange
}: {
  checked: boolean
  onChange: (checked: boolean) => void
}) => (
  <Box>
    <FormControlLabel
      control={
        <Checkbox
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
        />
      }
      label='Es un lote nuevo (llegaron más equipos)'
    />
    {checked && (
      <Alert severity='info'>
        Escribe la fecha en que llegó este lote y sus equipos. La ficha guarda
        solo el último lote: genera antes el PDF del anterior si lo necesitas.
      </Alert>
    )}
  </Box>
)

export default NewBatchField
