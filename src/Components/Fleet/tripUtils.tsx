import axios from 'axios'
import { api } from '../../config'
import { Trip } from './types'

const apiUrl = api()

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  // Verifica si el valor es una fecha válida y no es una cadena vacía
  return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : ''
}

// Add Trip
export const addTrip = async (trip: Trip) => {
  await axios.post(`${apiUrl}/trip`, trip, {
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  })
}

// Update Trip
export const updateTrip = async (trip: Trip) => {
  await axios.put(`${apiUrl}/trip/${trip.id}`, trip, {
    headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
  })
}

export const addTripWithInspection = async (trip: Trip, inspection: any) => {
  try {
    const formattedStartDate = trip.startDate
      ? formatDate(trip.startDate)
      : null
    const formattedEndDate = trip.endDate ? formatDate(trip.endDate) : null
    const { driver, startMileage, endMileage, purpose, vehicleId } = trip

    const response = await axios.post(
      `${apiUrl}/trip/with-inspection`,
      {
        tripData: {
          driver,
          startMileage,
          endMileage,
          purpose,
          vehicleId,
          startDate: formattedStartDate,
          endDate: formattedEndDate
        },
        inspectionData: {
          ...inspection,
          vehicleId: trip.vehicleId,
          inspectorName: trip.driver,
          inspectionDate: formattedStartDate
        }
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      }
    )

    return response // Devuelve la respuesta para poder manejarla en el componente
  } catch (error) {
    // Maneja el error de manera adecuada
    if (axios.isAxiosError(error)) {
      console.error('Error response:', error.response?.data)
      return Promise.reject(error.response?.data || 'An error occurred')
    } else {
      console.error('Unexpected error:', error)
      return Promise.reject('An unexpected error occurred')
    }
  }
}

// Update Trip with Inspection
export const updateTripWithInspection = async (trip: Trip, inspection: any) => {
  const formattedStartDate = trip.startDate ? formatDate(trip.startDate) : null
  const formattedEndDate = trip.endDate ? formatDate(trip.endDate) : null
  const { driver, startMileage, endMileage, purpose, vehicleId } = trip
  try {
    const response = await axios.put(
      `${apiUrl}/trip/${trip.id}/with-inspection`,
      {
        tripData: {
          id: trip.id,
          driver,
          startMileage,
          endMileage,
          purpose,
          vehicleId,
          startDate: formattedStartDate,
          endDate: formattedEndDate
        },
        inspectionData: {
          ...inspection,
          vehicleId: trip.vehicleId,
          inspectorName: trip.driver,
          inspectionDate: formattedEndDate
        }
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`
        }
      }
    )

    return response
  } catch (error) {
    // Maneja el error de manera adecuada
    if (axios.isAxiosError(error)) {
      console.error('Error response:', error.response?.data)
      return Promise.reject(error.response?.data || 'An error occurred')
    } else {
      console.error('Unexpected error:', error)
      return Promise.reject('An unexpected error occurred')
    }
  }
}
