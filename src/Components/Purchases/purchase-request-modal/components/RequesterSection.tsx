// components/RequesterSection.tsx
import React from 'react'
import { Grid, TextField, Autocomplete, CircularProgress } from '@mui/material'
import {
  RequesterSectionProps,
  RequesterUser
} from '../types/PurchaseRequestTypes'

const RequesterSection: React.FC<RequesterSectionProps> = ({
  selectedRequester,
  setSelectedRequester,
  requesterOptions,
  loadingRequesters,
  formData,
  setFormData,
  existingRequest
}) => {
  const handleRequesterChange = (
    _event: React.SyntheticEvent,
    newValue: RequesterUser | null
  ) => {
    setSelectedRequester(newValue)
    if (newValue) {
      setFormData((prev) => ({
        ...prev,
        applicantName: newValue.name,
        applicantPosition: newValue.position,
        applicantId: newValue.id
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        applicantName: '',
        applicantPosition: '',
        applicantId: undefined
      }))
    }
  }

  return (
    <>
      <Grid item xs={12} md={6}>
        <Autocomplete
          options={requesterOptions}
          getOptionLabel={(option) => option.name || ''}
          value={selectedRequester}
          onChange={handleRequesterChange}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          loading={loadingRequesters}
          loadingText='Cargando...'
          noOptionsText='No se encontraron solicitantes'
          disabled={!!existingRequest}
          renderInput={(params) => (
            <TextField
              {...params}
              label='Nombre del Solicitante *'
              required={!selectedRequester}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <>
                    {loadingRequesters ? (
                      <CircularProgress color='inherit' size={20} />
                    ) : null}
                    {params.InputProps.endAdornment}
                  </>
                )
              }}
            />
          )}
        />
      </Grid>

      <Grid item xs={12} md={6}>
        <TextField
          fullWidth
          label='Cargo del Solicitante *'
          value={formData.applicantPosition || ''}
          InputProps={{
            readOnly: true
          }}
          InputLabelProps={{ shrink: !!formData.applicantPosition }}
          required
        />
      </Grid>
    </>
  )
}

export default RequesterSection
