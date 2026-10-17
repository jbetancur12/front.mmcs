import { useQuery } from 'react-query'
import { axiosPrivate } from '@utils/api'
import { CalibrationServiceStatus } from 'src/types/calibrationService'
import { CustomerServicesResponse } from 'src/types/customerIndicators'

export const useCustomerServices = (
  customerId: number | string | undefined,
  year: number | null,
  status: CalibrationServiceStatus | null,
  enabled = true
) =>
  useQuery<CustomerServicesResponse>(
    ['customerServices', customerId, year, status],
    async () => {
      const { data } = await axiosPrivate.get(
        `/customers/${customerId}/calibration-services`,
        { params: { year: year || undefined, status: status || undefined } }
      )
      return data
    },
    { enabled: enabled && !!customerId, keepPreviousData: true }
  )
