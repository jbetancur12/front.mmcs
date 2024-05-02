import { Grid, Paper, TextField } from '@mui/material'
import AsyncSelect from 'react-select/async'
import { loadOptions, styles } from '../Utils'
import { ComponentsCertificateProps, ResourceOptionDevice } from '../Types'

const Header = ({
  handleChange,
  formData,
  setFormData,
  error
}: ComponentsCertificateProps) => {
  return (
    <Paper
      elevation={3}
      style={{
        padding: 20,
        display: 'flex',
        justifyContent: 'center',
        alignContent: 'center',
        alignItems: 'center'
      }}
    >
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            error={error && formData.name === ''}
            variant='outlined'
            label='Nombre Certificado'
            name='name'
            value={formData.name}
            onChange={handleChange}
          />
        </Grid>
        <Grid item xs={6}>
          <AsyncSelect
            cacheOptions
            // defaultOptions
            loadOptions={(inputValue) =>
              loadOptions(inputValue, 'certificateTypes', mapDevices)
            }
            onChange={(selectedOption: any) =>
              setFormData({
                ...formData,
                typeOfCertificate: {
                  value: selectedOption.value,
                  label: selectedOption.label
                }
              })
            }
            placeholder='Buscar Tipo de Certificado'
            defaultValue={{
              value: formData.typeOfCertificate?.value,
              label: formData.typeOfCertificate?.label
            }}
            styles={styles(!(error && formData.typeOfCertificate === null))}
          />
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

export default Header
