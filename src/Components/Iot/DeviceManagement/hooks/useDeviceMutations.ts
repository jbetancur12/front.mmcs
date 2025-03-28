import { useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

export const useCreateDevice = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  return useMutation(
    (newDevice: { imei: string; name: string; customerId?: number }) =>
      axiosPrivate.post('/devicesIot', newDevice),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('devices')
      }
    }
  )
}
