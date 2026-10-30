import { Trip } from './types'
import { isAxiosError, type AxiosInstance } from 'axios'

import { logger } from 'src/utils/logger'
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  // Verifica si el valor es una fecha válida y no es una cadena vacía
  return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : ''
}

// Add Trip
export const addTrip = async (axiosPrivate: AxiosInstance, trip: Trip) => {
  await axiosPrivate.post(`/trip`, trip)
}

// Update Trip
export const updateTrip = async (axiosPrivate: AxiosInstance, trip: Trip) => {
  await axiosPrivate.put(`/trip/${trip.id}`, trip)
}

export const addTripWithInspection = async (
  axiosPrivate: AxiosInstance,
  trip: Trip,
  inspection: any
) => {
  try {
    const formattedStartDate = trip.startDate
      ? formatDate(trip.startDate)
      : null
    const formattedEndDate = trip.endDate ? formatDate(trip.endDate) : null
    const { driver, startMileage, endMileage, purpose, vehicleId } = trip

    const response = await axiosPrivate.post(`/trip/with-inspection`, {
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
        vehicleId,
        inspectorName: driver,
        inspectionDate: formattedStartDate
      }
    })

    return response.data // Devuelve solo los datos de la respuesta
  } catch (error) {
    // Maneja el error de manera adecuada
    if (isAxiosError(error)) {
      logger.error('Error response:', error.response?.data)
      return Promise.reject(error.response?.data || 'An error occurred')
    } else if (error instanceof Error) {
      logger.error('Unexpected error:', error.message)
      return Promise.reject(error.message || 'An unexpected error occurred')
    } else {
      logger.error('Unexpected non-error:', error)
      return Promise.reject('An unexpected error occurred')
    }
  }
}

// Update Trip with Inspection
export const updateTripWithInspection = async (
  axiosPrivate: AxiosInstance,
  trip: Trip,
  inspection: any
) => {
  const formattedStartDate = trip.startDate ? formatDate(trip.startDate) : null
  const formattedEndDate = trip.endDate ? formatDate(trip.endDate) : null
  const { driver, startMileage, endMileage, purpose, vehicleId } = trip
  try {
    const response = await axiosPrivate.put(
      `/trip/${trip.id}/with-inspection`,
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
      {}
    )

    return response
  } catch (error) {
    // Maneja el error de manera adecuada
    if (isAxiosError(error)) {
      logger.error('Error response:', error.response?.data)
      return Promise.reject(error.response?.data || 'An error occurred')
    } else if (error instanceof Error) {
      logger.error('Unexpected error:', error.message)
      return Promise.reject(error.message || 'An unexpected error occurred')
    } else {
      logger.error('Unexpected non-error:', error)
      return Promise.reject('An unexpected error occurred')
    }
  }
}
