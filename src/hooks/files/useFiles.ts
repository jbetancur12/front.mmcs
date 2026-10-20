import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { CERTIFICATE_HISTORY_QUERY_KEYS } from '@hooks/certificates/useCertificateHistory'

/**
 * Archivos/certificados de calibración (`/files`).
 * `list(params)` deja los params dentro de la clave para cuando se agregue
 * paginación en servidor.
 */
export const FILE_QUERY_KEYS = {
  all: ['files'] as const,
  lists: () => [...FILE_QUERY_KEYS.all, 'list'] as const,
  list: (params: Record<string, unknown> = {}) =>
    [...FILE_QUERY_KEYS.lists(), params] as const,
  details: () => [...FILE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: number | string | undefined) =>
    [...FILE_QUERY_KEYS.details(), String(id ?? '')] as const
}

export const useFiles = <T = unknown>(params?: Record<string, unknown>) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(FILE_QUERY_KEYS.list(params), async () => {
    const response = await axiosPrivate.get('/files', params ? { params } : {})
    return (Array.isArray(response.data) ? response.data : []) as T[]
  })
}

export const useFile = <T = unknown>(id: number | string | undefined) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    FILE_QUERY_KEYS.detail(id),
    async () => {
      const response = await axiosPrivate.get(`/files/${id}`, {})
      return response.data as T
    },
    { enabled: id !== undefined && id !== '' }
  )
}

const useInvalidateFiles = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries(FILE_QUERY_KEYS.all)
}

export const useCreateFile = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateFiles()
  return useMutation(
    (payload: unknown) =>
      axiosPrivate.post('/files', payload, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }),
    { onSuccess: () => invalidate() }
  )
}

export const useUpdateFile = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateFiles()
  return useMutation(
    ({
      id,
      payload,
      config
    }: {
      id: number | string
      payload: unknown
      config?: Record<string, unknown>
    }) =>
      config
        ? axiosPrivate.put(`/files/${id}`, payload, config)
        : axiosPrivate.put(`/files/${id}`, payload),
    { onSuccess: () => invalidate() }
  )
}

export const useDeleteFile = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateFiles()
  return useMutation(
    (id: number | string) => axiosPrivate.delete(`/files/${id}`, {}),
    { onSuccess: () => invalidate() }
  )
}

export interface BulkDeviceReassignmentPayload {
  sourceDeviceId: number
  targetDeviceId: number
  customerId?: number
}

/** Aplica la reasignación masiva de equipo en los certificados de un cliente. */
export const useBulkReassignFileDevice = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    (payload: BulkDeviceReassignmentPayload) =>
      axiosPrivate.post('/files/bulk/device-reassignment', payload),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(FILE_QUERY_KEYS.all)
        queryClient.invalidateQueries(CERTIFICATE_HISTORY_QUERY_KEYS.all)
      }
    }
  )
}
