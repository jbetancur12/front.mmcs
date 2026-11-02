import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  ReleaseCertificateDetail,
  ReleaseFilters,
  ReleaseListResponse,
  ReleaseUploadResult
} from 'src/Components/ReleaseCertificates/ReleaseCertificates.types'

export const RELEASE_QUERY_KEYS = {
  all: ['releaseCertificates'] as const,
  list: (filters: ReleaseFilters) =>
    ['releaseCertificates', 'list', filters] as const,
  detail: (id: number) => ['releaseCertificates', 'detail', id] as const
}

export const releaseFileUrl = (id: number, versionId?: number) =>
  `/release-certificates/${id}/file${versionId ? `?versionId=${versionId}` : ''}`

/** Bandeja con filtros, paginada en el servidor, y el conteo por estado. */
export const useReleaseCertificates = (filters: ReleaseFilters) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<ReleaseListResponse>(
    RELEASE_QUERY_KEYS.list(filters),
    () =>
      axiosPrivate
        .get('/release-certificates', {
          params: {
            page: filters.page,
            limit: filters.limit,
            status: filters.status || undefined,
            kind: filters.kind || undefined,
            search: filters.search || undefined,
            withAnomalies: filters.withAnomalies ? 'true' : undefined
          }
        })
        .then((response) => response.data),
    { keepPreviousData: true }
  )
}

export const useReleaseCertificate = (id: number | null) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<ReleaseCertificateDetail>(
    RELEASE_QUERY_KEYS.detail(id ?? 0),
    () =>
      axiosPrivate
        .get(`/release-certificates/${id}`)
        .then((response) => response.data),
    { enabled: id !== null }
  )
}

/** Carga masiva: devuelve el resultado de cada PDF (uno inválido no detiene el lote). */
export const useUploadReleaseCertificates = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    async (files: File[]): Promise<ReleaseUploadResult[]> => {
      const data = new FormData()
      files.forEach((file) => data.append('files', file))
      const response = await axiosPrivate.post('/release-certificates', data)
      return response.data.results
    },
    { onSuccess: () => queryClient.invalidateQueries(RELEASE_QUERY_KEYS.all) }
  )
}
