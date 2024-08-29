import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  TextField,
  Button,
  Grid,
  Typography,
  Container,
  Box,
  Stack,
  IconButton
} from '@mui/material'
import { Inspection, Trip, TripsResponse } from './types'
import { addTripWithInspection, updateTripWithInspection } from './tripUtils'
import InspectionComponent from './InspectionComponent'
import { bigToast } from '../ExcelManipulation/Utils'
import { ArrowBack } from '@mui/icons-material'

const NewTrip = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const { lastTrip } = location.state as TripsResponse
  const [trip, setTrip] = useState<Trip | null>(null)
  const [vehicleIsBusy, setVehicleIsBusy] = useState<boolean>(false)
  const [inspection, setInspection] = useState<Inspection | null>(null)

  useEffect(() => {
    if (lastTrip) {
      // Define vehicleIsBusy based on lastTrip.endDate
      setVehicleIsBusy(!lastTrip.endDate && !!lastTrip.startDate)
      setTrip(
        !lastTrip.endDate
          ? lastTrip
          : {
              ...lastTrip,
              startMileage: 0,
              endMileage: 0,
              startDate: '',
              endDate: '',
              driver: '',
              purpose: ''
            }
      )
    }
  }, [lastTrip])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (trip && inspection) {
      if (vehicleIsBusy) {
        updateTripWithInspection(trip, {
          ...inspection,
          inspectionType: 'Inspección de Entrada'
        })
        bigToast('Viaje Actualizado Exitosamente!', 'success')
      } else {
        addTripWithInspection(trip, {
          ...inspection,
          inspectionType: 'Inspección de Salida'
        })
        bigToast('Viaje Creado Exitosamente!', 'success')
      }

      navigate(-1)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0]
  }

  return (
    <Container>
      <Stack direction='row' spacing={2} mb={2}>
        <IconButton
          onClick={() => navigate('/fleet/' + trip?.vehicleId + '/trip')}
          sx={{ mr: 2 }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant='h4' gutterBottom>
          {vehicleIsBusy ? 'Edit Trip' : 'New Trip'}
        </Typography>
      </Stack>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label='Start Mileage'
              type='number'
              name='startMileage'
              fullWidth
              value={trip?.startMileage || ''}
              onChange={(e) =>
                setTrip((prev) => ({
                  ...prev!,
                  [e.target.name]: Number(e.target.value)
                }))
              }
              disabled={vehicleIsBusy} // Disable if editing existing trip
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='End Mileage'
              type='number'
              name='endMileage'
              fullWidth
              value={trip?.endMileage || ''}
              onChange={(e) =>
                setTrip((prev) => ({
                  ...prev!,
                  [e.target.name]: Number(e.target.value)
                }))
              }
              disabled={!vehicleIsBusy} // Disable if endDate is not provided
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Start Date'
              type='date'
              name='startDate'
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formatDate(trip?.startDate || '')}
              onChange={(e) =>
                setTrip((prev) => ({
                  ...prev!,
                  [e.target.name]: e.target.value
                }))
              }
              disabled={vehicleIsBusy} // Disable if editing existing trip
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='End Date'
              type='date'
              name='endDate'
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formatDate(trip?.endDate || '')}
              onChange={(e) =>
                setTrip((prev) => ({
                  ...prev!,
                  [e.target.name]: e.target.value
                }))
              }
              disabled={!vehicleIsBusy} // Disable if endDate is not provided
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Propósito'
              type='text'
              name='purpose'
              fullWidth
              value={trip?.purpose || ''}
              onChange={(e) =>
                setTrip((prev) => ({
                  ...prev!,
                  [e.target.name]: e.target.value
                }))
              }
              disabled={vehicleIsBusy} // Disable if endDate is not provided
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Conductor'
              name='driver'
              fullWidth
              value={trip?.driver || ''}
              onChange={(e) =>
                setTrip((prev) => ({
                  ...prev!!,
                  [e.target.name]: e.target.value
                }))
              }
              disabled={vehicleIsBusy}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
          <Typography variant='h5' sx={{ mb: 2, textAlign: 'center' }}>
            Inspección
          </Typography>
          <InspectionComponent
            inspection={inspection}
            setInspection={setInspection}
          />
          <Button
            type='submit'
            variant='contained'
            color='primary'
            sx={{ mt: 2 }}
          >
            {vehicleIsBusy ? 'Update Trip' : 'Create Trip'}
          </Button>
        </Box>
      </form>
    </Container>
  )
}

export default NewTrip
