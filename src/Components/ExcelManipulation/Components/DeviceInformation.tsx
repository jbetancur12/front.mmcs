import { Grid, Paper, Stack, TextField, Typography } from '@mui/material'
import AsyncSelect from 'react-select/async'
import { loadOptions, mask, styles } from '../Utils'
import { ComponentsCertificateProps, ResourceOptionDevice } from '../Types'
import { TextMaskCustom } from '../../NumericFormatCustom'

const DeviceInformation = ({
  handleChange,
  setFormData,
  formData,
  error
}: ComponentsCertificateProps) => {
  return (
    <Paper elevation={3} style={{ padding: 20 }}>
      <Typography variant='h6'>Información Del Equipo</Typography>
      <Grid container spacing={2}>
        <Grid item xs={4}>
          <Stack spacing={2}>
            <AsyncSelect
              cacheOptions
              // defaultOptions
              loadOptions={(inputValue) =>
                loadOptions(inputValue, 'devices', mapDevices)
              }
              onChange={(optionSelected: any) => {
                setFormData({
                  ...formData,
                  device: optionSelected,
                  magnitude: optionSelected.magnitude,
                  unit: optionSelected.unit,
                  format: optionSelected.repositoryPath
                })
              }}
              value={formData.device}
              placeholder='Buscar Equipo'
              styles={styles(!(error && formData.device === null))}
            />
            <TextField
              error={error && formData.magnitude === ''}
              variant='outlined'
              label='Magnitud'
              name='magnitude'
              value={formData.magnitude}
              onChange={handleChange}
            />
            <TextField
              error={error && formData.brand === ''}
              variant='outlined'
              label='Fabricante'
              name='brand'
              value={formData.brand}
              onChange={handleChange}
            />
            <TextField
              error={error && formData.model === ''}
              variant='outlined'
              label='Modelo'
              name='model'
              value={formData.model}
              onChange={handleChange}
            />
          </Stack>
        </Grid>
        <Grid item xs={4}>
          <Stack spacing={2}>
            <TextField
              error={error && formData.serie === ''}
              variant='outlined'
              label='Serial'
              name='serie'
              value={formData.serie}
              onChange={handleChange}
            />
            <TextField
              error={error && formData.activoFijo === ''}
              variant='outlined'
              label='Codigo Interno'
              name='activoFijo'
              value={formData.activoFijo}
              onChange={handleChange}
            />
            <TextField
              error={error && formData.location === ''}
              variant='outlined'
              label='Ubicacion'
              name='location'
              value={formData.location}
              onChange={handleChange}
            />
          </Stack>
        </Grid>
        <Grid item xs={4}>
          <Stack spacing={2}>
            <TextField
              error={error && formData.unit === ''}
              variant='outlined'
              label='Unidad de Medida'
              name='unit'
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
            />

            <TextField
              error={
                (error && formData.measurementRange === '') ||
                (error && formData.measurementRange === '0-0')
              }
              variant='outlined'
              label='Rango de Medida'
              name='measurementRange'
              value={formData.measurementRange}
              onChange={handleChange}
              InputProps={{
                inputComponent: TextMaskCustom as any
              }}
              inputProps={{
                mask: `(${mask(formData.decimalPlaces)} - ${mask(
                  formData.decimalPlaces
                )}) ${formData.unit}`, // enable number mask
                lazy: false, // format number while typing
                placeholderChar: '0',
                min: -100,
                max: 1000
              }}
            />
            <TextField
              error={
                error &&
                (formData.measurementOperation === '0-0' ||
                  formData.measurementOperation === '')
              }
              variant='outlined'
              label='Rango de Operación'
              name='measurementOperation'
              value={formData.measurementOperation}
              onChange={handleChange}
              InputProps={{
                inputComponent: TextMaskCustom as any
              }}
              inputProps={{
                mask: `(${mask(formData.decimalPlaces)} - ${mask(
                  formData.decimalPlaces
                )}) ${formData.unit}`, // enable number mask
                lazy: false, // format number while typing
                placeholderChar: '0',
                min: -100,
                max: 1000
                // autofix: true,
              }}
            />
          </Stack>
        </Grid>
      </Grid>
    </Paper>
  )
}

const mapDevices = (option: any): ResourceOptionDevice => ({
  value: option.id,
  label: option.name,
  repositoryPath: option.repository,
  magnitude: option.magnitude,
  unit: option.unit
})

export default DeviceInformation
