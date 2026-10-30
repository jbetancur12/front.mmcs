import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

import { logger } from 'src/utils/logger'
export const customerCalibrationScheduleKey = (
  customerId: number | string | undefined
) => ['calibration', 'customerSchedule', customerId] as const

/** Cronograma de calibraciones de un cliente (`/files/customer/:id/schedule`) */
export const useCustomerCalibrationSchedule = <T>(
  customerId?: number | string
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    customerCalibrationScheduleKey(customerId),
    async (): Promise<T> => {
      const response = await axiosPrivate.get<T>(
        `/files/customer/${customerId}/schedule`,
        {}
      )
      return response.data
    },
    {
      enabled: !!customerId,
      // Depende de certificados que cambian fuera de esta pantalla
      staleTime: 0,
      keepPreviousData: false,
      onError: (error) => {
        logger.error('Error fetching data:', error)
      }
    }
  )
}
