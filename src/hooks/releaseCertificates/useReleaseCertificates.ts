import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  ReleaseCatalogs,
  ReleaseCertificateDetail,
  ReleaseEquipmentMatches,
  ReleaseTarget,
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

export interface ReleaseCorrections {
  customerId?: number | null
  kind?: string
  documentNumber?: string | null
  magnitude?: string | null
  instrument?: string | null
  manufacturer?: string | null
  model?: string | null
  serie?: string | null
  activoFijo?: string | null
  location?: string | null
  calibrationDate?: string | null
  issueDate?: string | null
}

export type ReleaseReviewAction =
  | { type: 'correct'; id: number; data: ReleaseCorrections }
  | { type: 'verify'; id: number }
  | { type: 'adjustments'; id: number; observation: string }
  | { type: 'version'; id: number; file: File }
  | {
      type: 'release'
      id: number
      target?: ReleaseTarget
      saveEquivalence?: boolean
    }

/** Acciones de la revisión; todas responden con el certificado actualizado. */
export const useReleaseReview = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    (action: ReleaseReviewAction) => {
      const base = `/release-certificates/${action.id}`
      switch (action.type) {
        case 'correct':
          return axiosPrivate.put(base, action.data)
        case 'verify':
          return axiosPrivate.post(`${base}/verify`)
        case 'adjustments':
          return axiosPrivate.post(`${base}/request-adjustments`, {
            observation: action.observation
          })
        case 'release':
          return axiosPrivate.post(`${base}/release`, {
            confirm: true,
            target: action.target,
            saveEquivalence: action.saveEquivalence
          })
        default: {
          const data = new FormData()
          data.append('files', action.file)
          return axiosPrivate.post(`${base}/versions`, data)
        }
      }
    },
    { onSuccess: () => queryClient.invalidateQueries(RELEASE_QUERY_KEYS.all) }
  )
}

/** Clientes de la plataforma para identificar el del certificado. */
export const useReleaseCustomerSearch = (search: string) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<{ id: number; nombre: string }[]>(
    ['releaseCertificates', 'customers', search],
    () =>
      axiosPrivate
        .get('/release-certificates/customers', { params: { search } })
        .then((response) => response.data),
    { enabled: search.trim().length >= 2, keepPreviousData: true }
  )
}

/** Equipos del cliente que coinciden con el certificado (serie, activo fijo o ubicación). */
export const useReleaseMatches = (id: number | null) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<ReleaseEquipmentMatches>(
    ['releaseCertificates', 'matches', id],
    () =>
      axiosPrivate
        .get(`/release-certificates/${id}/equipment-matches`)
        .then((response) => response.data),
    { enabled: id !== null, cacheTime: 0 }
  )
}

export const useReleaseCatalogs = (enabled: boolean) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<ReleaseCatalogs>(
    ['releaseCertificates', 'catalogs'],
    () =>
      axiosPrivate
        .get('/release-certificates/catalogs')
        .then((response) => response.data),
    { enabled, staleTime: 5 * 60 * 1000 }
  )
}

/** Firma por documento o varios seleccionados; devuelve el resultado de cada uno. */
export const useSignReleaseCertificates = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    async (
      ids: number[]
    ): Promise<{ id: number; ok: boolean; error?: string }[]> =>
      (await axiosPrivate.post('/release-certificates/sign', { ids })).data
        .results,
    { onSuccess: () => queryClient.invalidateQueries(RELEASE_QUERY_KEYS.all) }
  )
}

/** ¿El usuario ya cargó la imagen de su firma? Se necesita para firmar. */
export const useMySignature = (enabled: boolean) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<{ configured: boolean }>(
    ['releaseCertificates', 'signature'],
    () =>
      axiosPrivate
        .get('/release-certificates/signature')
        .then((response) => response.data),
    { enabled }
  )
}

export const useSaveMySignature = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    (file: File) => {
      const data = new FormData()
      data.append('signature', file)
      return axiosPrivate.put('/release-certificates/signature', data)
    },
    {
      onSuccess: () =>
        queryClient.invalidateQueries(['releaseCertificates', 'signature'])
    }
  )
}
