import { useQuery } from 'react-query'
import { axiosPrivate } from '@utils/api'
import type { CalibrationServiceCustomer } from '../../types/calibrationService'

export interface CalibrationCustomerOptionsResponse {
  customers: CalibrationServiceCustomer[]
}

/**
 * Primeros 100 clientes del alcance de calibración, para filtros y selectores.
 */
export const useCalibrationCustomerOptions = () =>
  useQuery({
    queryKey: ['calibration-service-analytics-customers'],
    queryFn: async () => {
      const response = await axiosPrivate.get<CalibrationCustomerOptionsResponse>('/customers', {
        params: {
          scope: 'calibration',
          page: 1,
          limit: 100
        }
      })
      return response.data
    },
    staleTime: 5 * 60 * 1000
  })

export default useCalibrationCustomerOptions
