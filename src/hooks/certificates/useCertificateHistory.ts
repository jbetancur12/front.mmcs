import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

/**
 * Historial de certificados de calibración de un archivo/equipo
 * (`/certificateHistory`). No usa la raíz `certificates`, reservada a LMS.
 */
export const CERTIFICATE_HISTORY_QUERY_KEYS = {
  all: ['certificate-history'] as const,
  byFile: (fileId: number | string | undefined) =>
    [...CERTIFICATE_HISTORY_QUERY_KEYS.all, 'file', String(fileId ?? '')] as const
}

export interface CertificateHistoryItem {
  id: number
  calibrationDate: string
  filePath: string
}

export const useCertificateHistory = (fileId: number | string | undefined) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    CERTIFICATE_HISTORY_QUERY_KEYS.byFile(fileId),
    async () => {
      const response = await axiosPrivate.get<CertificateHistoryItem[]>(
        `/certificateHistory/certificate/${fileId}`,
        {}
      )
      return Array.isArray(response.data) ? response.data : []
    },
    { enabled: fileId !== undefined && fileId !== '' }
  )
}

export const useDeleteCertificateHistory = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    (id: number) => axiosPrivate.delete(`/certificateHistory/${id}`, {}),
    {
      onSuccess: (_response, id) => {
        queryClient.setQueriesData<CertificateHistoryItem[] | undefined>(
          CERTIFICATE_HISTORY_QUERY_KEYS.all,
          (prev) => prev?.filter((certificate) => certificate.id !== id)
        )
        queryClient.invalidateQueries(CERTIFICATE_HISTORY_QUERY_KEYS.all)
      }
    }
  )
}
