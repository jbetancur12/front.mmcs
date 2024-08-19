import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  TextField,
  Button,
  Grid,
  Typography,
  Container,
  Box
} from '@mui/material'
import { Inspection, Trip, TripsResponse } from './types'
import {
  addTrip,
  addTripWithInspection,
  updateTrip,
  updateTripWithInspection
} from './tripUtils'
import InspectionComponent from './InspectionComponent'
import { bigToast } from '../ExcelManipulation/Utils'

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

  useEffect(() => {
    // Google Analytics
    console.log(location)
  }, [location])

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
      <Typography variant='h4' gutterBottom>
        {vehicleIsBusy ? 'Edit Trip' : 'New Trip'}
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              label='Start Mileage'
              type='number'
              fullWidth
              value={trip?.startMileage}
              onChange={(e) =>
                setTrip((prev) => ({
                  ...prev!,
                  startMileage: Number(e.target.value)
                }))
              }
              disabled={vehicleIsBusy} // Disable if editing existing trip
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='End Mileage'
              type='number'
              fullWidth
              value={trip?.endMileage || ''}
              onChange={(e) =>
                setTrip((prev) => ({
                  ...prev!,
                  endMileage: Number(e.target.value)
                }))
              }
              disabled={!vehicleIsBusy} // Disable if endDate is not provided
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Start Date'
              type='date'
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formatDate(trip?.startDate || '')}
              onChange={(e) =>
                setTrip((prev) => ({
                  ...prev!,
                  startDate: e.target.value
                }))
              }
              disabled={vehicleIsBusy} // Disable if editing existing trip
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='End Date'
              type='date'
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formatDate(trip?.endDate || '')}
              onChange={(e) =>
                setTrip((prev) => ({
                  ...prev!,
                  endDate: e.target.value
                }))
              }
              disabled={!vehicleIsBusy} // Disable if endDate is not provided
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Propósito'
              type='text'
              fullWidth
              value={trip?.purpose || ''}
              onChange={(e) =>
                setTrip((prev) => ({
                  ...prev!,
                  purpose: e.target.value
                }))
              }
              disabled={vehicleIsBusy} // Disable if endDate is not provided
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Conductor'
              fullWidth
              value={trip?.driver || ''}
              onChange={(e) =>
                setTrip((prev) => ({
                  ...prev!,
                  driver: e.target.value
                }))
              }
              disabled={vehicleIsBusy}
            />
          </Grid>
        </Grid>
        <Box sx={{ mt: 2 }}>
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
