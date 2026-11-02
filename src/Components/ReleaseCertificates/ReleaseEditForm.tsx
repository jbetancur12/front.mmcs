import React, { useState } from 'react'
import {
  Autocomplete,
  Box,
  Button,
  Grid,
  MenuItem,
  TextField
} from '@mui/material'
import {
  ReleaseCorrections,
  useReleaseCustomerSearch
} from 'src/hooks/releaseCertificates/useReleaseCertificates'
import {
  RELEASE_KIND_LABELS,
  ReleaseCertificateDetail,
  ReleaseKind
} from './ReleaseCertificates.types'

interface ReleaseEditFormProps {
  certificate: ReleaseCertificateDetail
  saving: boolean
  onSave: (data: ReleaseCorrections) => void
  onCancel: () => void
}

type TextKey =
  | 'documentNumber'
  | 'instrument'
  | 'magnitude'
  | 'manufacturer'
  | 'model'
  | 'serie'
  | 'activoFijo'
  | 'location'
  | 'calibrationDate'
  | 'issueDate'

const TEXT_FIELDS: {
  key: TextKey
  label: string
  xs: number
  date?: boolean
}[] = [
  { key: 'documentNumber', label: 'Número del documento', xs: 12 },
  { key: 'instrument', label: 'Instrumento', xs: 6 },
  { key: 'magnitude', label: 'Magnitud', xs: 6 },
  { key: 'manufacturer', label: 'Fabricante', xs: 6 },
  { key: 'model', label: 'Modelo', xs: 6 },
  { key: 'serie', label: 'Serie', xs: 6 },
  { key: 'activoFijo', label: 'Activo fijo (código interno)', xs: 6 },
  { key: 'location', label: 'Ubicación', xs: 12 },
  { key: 'calibrationDate', label: 'Fecha de calibración', xs: 6, date: true },
  { key: 'issueDate', label: 'Fecha de emisión', xs: 6, date: true }
]

/** La analista confirma o corrige lo que el sistema leyó del PDF. */
const ReleaseEditForm: React.FC<ReleaseEditFormProps> = ({
  certificate,
  saving,
  onSave,
  onCancel
}) => {
  const [values, setValues] = useState<Record<TextKey, string>>(
    () =>
      Object.fromEntries(
        TEXT_FIELDS.map(({ key }) => [key, certificate[key] ?? ''])
      ) as Record<TextKey, string>
  )
  const [kind, setKind] = useState<ReleaseKind>(certificate.kind)
  const [customer, setCustomer] = useState<{
    id: number
    nombre: string
  } | null>(certificate.customer ?? null)
  const [customerSearch, setCustomerSearch] = useState(
    certificate.customerName ?? ''
  )
  const { data: options = [], isFetching } =
    useReleaseCustomerSearch(customerSearch)

  const submit = () =>
    onSave({
      ...Object.fromEntries(
        TEXT_FIELDS.map(({ key }) => [key, values[key].trim() || null])
      ),
      kind,
      customerId: customer?.id ?? null
    })

  return (
    <Box component='form' onSubmit={(event) => event.preventDefault()}>
      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid item xs={12}>
          <Autocomplete
            size='small'
            options={options}
            value={customer}
            loading={isFetching}
            getOptionLabel={(option) => option.nombre}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={(all) => all}
            onChange={(_event, value) => setCustomer(value)}
            onInputChange={(_event, value, reason) => {
              if (reason === 'input') setCustomerSearch(value)
            }}
            noOptionsText='Escriba al menos 2 letras del nombre'
            renderInput={(params) => (
              <TextField
                {...params}
                label='Cliente en la plataforma'
                helperText={`Leído del PDF: ${certificate.customerName ?? 'sin dato'}`}
              />
            )}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            select
            fullWidth
            size='small'
            label='Tipo de documento'
            value={kind}
            onChange={(event) => setKind(event.target.value as ReleaseKind)}
          >
            {(Object.keys(RELEASE_KIND_LABELS) as ReleaseKind[]).map(
              (value) => (
                <MenuItem key={value} value={value}>
                  {RELEASE_KIND_LABELS[value]}
                </MenuItem>
              )
            )}
          </TextField>
        </Grid>
        {TEXT_FIELDS.map(({ key, label, xs, date }) => (
          <Grid item xs={xs} key={key}>
            <TextField
              fullWidth
              size='small'
              label={label}
              type={date ? 'date' : 'text'}
              InputLabelProps={date ? { shrink: true } : undefined}
              value={values[key]}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  [key]: event.target.value
                }))
              }
            />
          </Grid>
        ))}
        <Grid
          item
          xs={12}
          sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}
        >
          <Button onClick={onCancel} disabled={saving}>
            Cancelar
          </Button>
          <Button
            variant='contained'
            onClick={submit}
            disabled={saving}
            sx={{ bgcolor: '#00BFA5', '&:hover': { bgcolor: '#00897B' } }}
          >
            Guardar cambios
          </Button>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ReleaseEditForm
