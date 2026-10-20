import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

/**
 * Plantillas de mapeo Excel de certificados de calibración (`/templates`).
 * No usa `queryKeys.certificates.templates()`, que es de LMS.
 */
export const TEMPLATE_QUERY_KEYS = {
  all: ['calibration-templates'] as const,
  list: () => [...TEMPLATE_QUERY_KEYS.all, 'list'] as const
}

export const useTemplates = <T = unknown>() => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(TEMPLATE_QUERY_KEYS.list(), async () => {
    const response = await axiosPrivate.get('/templates')
    return (Array.isArray(response.data) ? response.data : []) as T[]
  })
}

const useInvalidateTemplates = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries(TEMPLATE_QUERY_KEYS.all)
}

export const useCreateTemplate = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateTemplates()
  return useMutation(
    (payload: object) => axiosPrivate.post('/templates', payload),
    { onSuccess: () => invalidate() }
  )
}

export const useUpdateTemplate = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateTemplates()
  return useMutation(
    ({ id, payload }: { id: number | string; payload: object }) =>
      axiosPrivate.put(`/templates/${id}`, payload),
    { onSuccess: () => invalidate() }
  )
}

export const useDeleteTemplate = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateTemplates()
  return useMutation(
    (id: number | string) => axiosPrivate.delete(`/templates/${id}`),
    { onSuccess: () => invalidate() }
  )
}
