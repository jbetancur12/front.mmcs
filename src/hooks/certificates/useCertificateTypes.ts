import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

/** Tipos de certificado de calibración (`/certificateTypes`). */
export const CERTIFICATE_TYPE_QUERY_KEYS = {
  all: ['certificate-types'] as const,
  list: () => [...CERTIFICATE_TYPE_QUERY_KEYS.all, 'list'] as const
}

export interface CertificateTypeItem {
  id: number
  name: string
}

export const useCertificateTypes = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(CERTIFICATE_TYPE_QUERY_KEYS.list(), async () => {
    const response = await axiosPrivate.get('/certificateTypes', {})
    return (Array.isArray(response.data)
      ? response.data
      : []) as CertificateTypeItem[]
  })
}

const useInvalidateCertificateTypes = () => {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries(CERTIFICATE_TYPE_QUERY_KEYS.all)
}

export const useCreateCertificateType = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateCertificateTypes()
  return useMutation(
    (payload: { name: string }) =>
      axiosPrivate.post('/certificateTypes', payload, {}),
    { onSuccess: () => invalidate() }
  )
}

export const useUpdateCertificateType = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateCertificateTypes()
  return useMutation(
    ({ id, payload }: { id: number | string; payload: object }) =>
      axiosPrivate.put(`/certificateTypes/${id}`, payload, {}),
    { onSuccess: () => invalidate() }
  )
}

export const useDeleteCertificateType = () => {
  const axiosPrivate = useAxiosPrivate()
  const invalidate = useInvalidateCertificateTypes()
  return useMutation(
    (id: number | string) => axiosPrivate.delete(`/certificateTypes/${id}`, {}),
    { onSuccess: () => invalidate() }
  )
}
