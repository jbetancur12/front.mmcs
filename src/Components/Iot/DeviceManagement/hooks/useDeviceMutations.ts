import { useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { DeviceIot } from '../../types'

export type UpdateDevicePayload = Pick<
  DeviceIot,
  'id' | 'imei' | 'name' | 'location'
> & {
  customerId?: string | number | null
}

export const useCreateDevice = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    (newDevice: {
      imei: string
      name: string
      customerId?: number
      location: string
    }) => axiosPrivate.post('/devicesIot', newDevice),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('devices')
      }
    }
  )
}

export const useUpdateDevice = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (device: UpdateDevicePayload) => {
      const payload = {
        ...device,
        customerId: device.customerId ?? undefined
      }
      const { data } = await axiosPrivate.put(
        `/devicesIot/${device.id}`,
        payload
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    }
  })
}

export const useDeleteDevice = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number | string) => {
      await axiosPrivate.delete(`/devicesIot/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] })
    }
  })
}
