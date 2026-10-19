import { AxiosInstance } from 'axios'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

/**
 * Catálogo de equipos (`/devices`). La clave base es `device-catalog`
 * para no chocar con `['devices']`, que usa el módulo IoT (`/devicesIot`).
 */
export const DEVICE_QUERY_KEYS = {
  all: ['device-catalog'] as const,
  lists: () => [...DEVICE_QUERY_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown> = {}) =>
    [...DEVICE_QUERY_KEYS.lists(), params] as const
}

export interface DeviceCatalogItem {
  id: number
  name: string
  magnitude?: string
  repository?: { id: number; name: string }
  certificateTemplate?: { id: number; name: string }
  [key: string]: unknown
}

export const fetchDevices = async (
  axiosPrivate: AxiosInstance,
  params?: Record<string, unknown>
): Promise<DeviceCatalogItem[]> => {
  const response = await axiosPrivate.get('/devices', params ? { params } : {})
  return Array.isArray(response.data) ? response.data : []
}

/** Listado del catálogo de equipos. */
export const useDevices = (
  params?: Record<string, unknown>,
  options: { enabled?: boolean } = {}
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    DEVICE_QUERY_KEYS.list(params),
    () => fetchDevices(axiosPrivate, params),
    { enabled: options.enabled ?? true }
  )
}

/**
 * Devuelve una función que obtiene el catálogo siempre fresco desde la API
 * (para flujos imperativos, p. ej. selects dentro de SweetAlert) y deja el
 * resultado en la caché compartida.
 */
export const useFetchDevicesNow = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return () =>
    queryClient.fetchQuery(
      DEVICE_QUERY_KEYS.list(),
      () => fetchDevices(axiosPrivate),
      { staleTime: 0 }
    )
}

const useInvalidateDevices = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries(DEVICE_QUERY_KEYS.all)
}

export const useCreateDevice = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateDevices()
  return useMutation(
    (payload: Record<string, unknown>) => axiosPrivate.post('/devices', payload, {}),
    { onSuccess: () => invalidate() }
  )
}

export const useUpdateDevice = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateDevices()
  return useMutation(
    ({ id, payload }: { id: number | string; payload: Record<string, unknown> }) =>
      axiosPrivate.put(`/devices/${id}`, payload, {}),
    { onSuccess: () => invalidate() }
  )
}

export const useDeleteDevice = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateDevices()
  return useMutation(
    (id: number | string) => axiosPrivate.delete(`/devices/${id}`, {}),
    { onSuccess: () => invalidate() }
  )
}
