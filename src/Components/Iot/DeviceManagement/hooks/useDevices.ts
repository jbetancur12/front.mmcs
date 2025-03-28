import { useQuery } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { transformDevice } from '../utils/deviceTransformers'
import { DeviceIot } from '../../types'

export const useDevices = () => {
  const axiosPrivate = useAxiosPrivate()

  return useQuery<DeviceIot[]>('devices', async () => {
    const response = await axiosPrivate.get('/devicesIot')
    return response.data.map(transformDevice)
  })
}
