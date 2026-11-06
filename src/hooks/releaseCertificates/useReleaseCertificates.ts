import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  ReleaseCatalogs,
  ReleaseEquipmentCandidate,
  ReleaseCertificateDetail,
  ReleaseEquipmentMatches,
  ReleaseTarget,
  ReleaseFilters,
  ReleaseListResponse,
  ReleasePlacement,
  ReleaseSignatory,
  ReleaseSignPlan,
  ReleaseServiceOption,
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
            customerId: filters.customerId || undefined,
            withoutCustomer: filters.withoutCustomer ? 'true' : undefined,
            uploadedBy: filters.uploadedBy || undefined,
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
    async ({
      files,
      serviceId,
      cutId
    }: {
      files: File[]
      serviceId?: number | null
      cutId?: number | null
      confirmOtherCustomer?: boolean
    }): Promise<ReleaseUploadResult[]> => {
      const data = new FormData()
      // El servicio va antes de los archivos: el API lo lee del cuerpo del formulario.
      if (serviceId) data.append('serviceId', String(serviceId))
      if (serviceId && cutId) data.append('cutId', String(cutId))
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
  | {
      type: 'service'
      id: number
      serviceId: number | null
      cutId?: number | null
      confirmOtherCustomer?: boolean
    }
  | {
      type: 'adjustments'
      id: number
      observation: string
      reasons?: string[]
    }
  | { type: 'version'; id: number; file: File }
  | { type: 'drive-retry'; id: number }
  | {
      type: 'discard' | 'reopen' | 'revert'
      id: number
      observation: string
      reasons?: string[]
    }
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
        case 'service':
          return axiosPrivate.put(`${base}/service`, {
            serviceId: action.serviceId,
            cutId: action.cutId ?? null,
            confirmOtherCustomer: action.confirmOtherCustomer === true
          })
        case 'adjustments':
          return axiosPrivate.post(`${base}/request-adjustments`, {
            observation: action.observation,
            reasons: action.reasons
          })
        case 'discard':
        case 'reopen':
        case 'revert':
          return axiosPrivate.post(`${base}/${action.type}`, {
            observation: action.observation,
            reasons: action.reasons
          })
        case 'drive-retry':
          return axiosPrivate.post(`${base}/drive-retry`)
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

/** Servicios abiertos para ligar un certificado: por cliente y/o por código de la ODS. */
export const useReleaseServiceSearch = (
  customerId: number | null,
  search: string
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<ReleaseServiceOption[]>(
    ['releaseCertificates', 'services', customerId, search],
    () =>
      axiosPrivate
        .get('/release-certificates/services', {
          params: {
            customerId: customerId || undefined,
            search: search || undefined
          }
        })
        .then((response) => response.data),
    {
      enabled: Boolean(customerId) || search.length >= 2,
      keepPreviousData: true
    }
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

/** Firma uno o varios certificados con las firmas y el sello colocados; devuelve el resultado de cada uno. */
export const useSignReleaseCertificates = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    async (payload: {
      ids: number[]
      placements: ReleasePlacement[]
      remember: boolean
    }): Promise<{ id: number; ok: boolean; error?: string }[]> =>
      (await axiosPrivate.post('/release-certificates/sign', payload)).data
        .results,
    {
      onSuccess: () => {
        queryClient.invalidateQueries(RELEASE_QUERY_KEYS.all)
        queryClient.invalidateQueries(['releaseCertificates', 'sign-plan'])
      }
    }
  )
}

/** Registro de firmas del laboratorio (con las inactivas si `all`). */
export const useSignatories = (enabled: boolean, all = false) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<ReleaseSignatory[]>(
    ['releaseCertificates', 'signatories', all],
    () =>
      axiosPrivate
        .get('/release-certificates/signatories', {
          params: all ? { all: 'true' } : undefined
        })
        .then((response) => response.data),
    { enabled }
  )
}

/** Agrega una firma al registro o cambia una existente (nombre, cargo, estado o imagen). */
export const useSaveSignatory = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    (input: {
      id?: number
      name: string
      role: string
      active?: boolean
      file?: File
    }) => {
      const data = new FormData()
      data.append('name', input.name)
      data.append('role', input.role)
      if (input.active !== undefined)
        data.append('active', String(input.active))
      if (input.file) data.append('signature', input.file)
      return input.id
        ? axiosPrivate.put(
            `/release-certificates/signatories/${input.id}`,
            data
          )
        : axiosPrivate.post('/release-certificates/signatories', data)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['releaseCertificates', 'signatories'])
        queryClient.invalidateQueries([
          'releaseCertificates',
          'signatory-image'
        ])
        queryClient.invalidateQueries(['releaseCertificates', 'sign-plan'])
      }
    }
  )
}

/** Qué se propone para firmar un certificado: páginas, firmas del registro y posición propuesta. */
export const useSignPlan = (id: number | null) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<ReleaseSignPlan>(
    ['releaseCertificates', 'sign-plan', id],
    () =>
      axiosPrivate
        .get(`/release-certificates/${id}/sign-plan`)
        .then((response) => response.data),
    { enabled: id !== null, cacheTime: 0 }
  )
}

/** Imagen del sello «Firmado digitalmente» del laboratorio, como URL local. */
export const useSealImage = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<string>(
    ['releaseCertificates', 'seal-image'],
    () =>
      axiosPrivate
        .get('/release-certificates/seal-image', { responseType: 'blob' })
        .then((response) => window.URL.createObjectURL(response.data)),
    { staleTime: Infinity, cacheTime: Infinity }
  )
}

/** Imagen de una firma del registro como URL local; se descarga con la sesión. */
export const useSignatoryImage = (id: number) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<string>(
    ['releaseCertificates', 'signatory-image', id],
    () =>
      axiosPrivate
        .get(`/release-certificates/signatories/${id}/image`, {
          responseType: 'blob'
        })
        .then((response) => window.URL.createObjectURL(response.data)),
    { staleTime: Infinity, cacheTime: Infinity }
  )
}

export type DriveLevel = 'categoria' | 'cliente' | 'anio'

/** Estructuras de carpetas ofrecidas; la regla es configurable, no está fija en el código. */
export const DRIVE_LEVEL_PRESETS: { label: string; levels: DriveLevel[] }[] = [
  {
    label: 'Categoría / Cliente / Año',
    levels: ['categoria', 'cliente', 'anio']
  },
  {
    label: 'Cliente / Año / Categoría',
    levels: ['cliente', 'anio', 'categoria']
  },
  { label: 'Cliente / Categoría', levels: ['cliente', 'categoria'] },
  { label: 'Año / Cliente', levels: ['anio', 'cliente'] }
]

export interface DriveStatus {
  encryptionReady: boolean
  configured: boolean
  mode: 'oauth' | 'service_account' | null
  awaitingAuthorization: boolean
  redirectUri: string | null
  clientEmail: string | null
  rootFolderId: string | null
  levels: DriveLevel[]
  lastTestAt: string | null
  lastTestOk: boolean | null
  lastTestMessage: string | null
}

export const useDriveStatus = (enabled: boolean) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<DriveStatus>(
    ['releaseCertificates', 'drive'],
    () =>
      axiosPrivate
        .get('/release-certificates/drive')
        .then((response) => response.data),
    { enabled, cacheTime: 0 }
  )
}

export const useDriveActions = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const refresh = () =>
    queryClient.invalidateQueries(['releaseCertificates', 'drive'])
  return {
    save: useMutation(
      async (data: {
        credentials?: string
        rootFolderId: string
        levels: DriveLevel[]
      }): Promise<DriveStatus> =>
        (await axiosPrivate.put('/release-certificates/drive', data)).data,
      { onSuccess: refresh }
    ),
    startOAuth: useMutation(
      async (data: {
        clientId: string
        clientSecret: string
        rootFolderId: string
        levels: DriveLevel[]
        returnUrl: string
      }): Promise<{ authUrl: string; redirectUri: string }> =>
        (
          await axiosPrivate.post(
            '/release-certificates/drive/oauth/start',
            data
          )
        ).data
    ),
    test: useMutation(
      async (): Promise<DriveStatus> =>
        (await axiosPrivate.post('/release-certificates/drive/test')).data,
      { onSuccess: refresh }
    ),
    backfill: useMutation(
      async (): Promise<{ queued: number }> =>
        (await axiosPrivate.post('/release-certificates/drive/backfill')).data,
      { onSuccess: () => queryClient.invalidateQueries(RELEASE_QUERY_KEYS.all) }
    ),
    remove: useMutation(
      () => axiosPrivate.delete('/release-certificates/drive'),
      { onSuccess: refresh }
    )
  }
}

export type ReleaseRuleType =
  | 'field_label'
  | 'document_type'
  | 'magnitude_prefix'
  | 'instrument_device'

export interface ReleaseRule {
  id: number
  ruleType: ReleaseRuleType
  key: string
  patterns: string[]
  value: string | null
  active: boolean
}

export const useReleaseRules = (enabled: boolean) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<ReleaseRule[]>(
    ['releaseCertificates', 'rules'],
    () =>
      axiosPrivate
        .get('/release-certificates/rules')
        .then((response) => response.data),
    { enabled, cacheTime: 0 }
  )
}

export const useRuleActions = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const refresh = () =>
    queryClient.invalidateQueries(['releaseCertificates', 'rules'])
  return {
    create: useMutation(
      (data: {
        ruleType: ReleaseRuleType
        key: string
        patterns: string[]
        value?: string | null
      }) => axiosPrivate.post('/release-certificates/rules', data),
      { onSuccess: refresh }
    ),
    update: useMutation(
      ({
        id,
        ...data
      }: {
        id: number
        patterns?: string[]
        value?: string | null
        active?: boolean
      }) => axiosPrivate.put(`/release-certificates/rules/${id}`, data),
      { onSuccess: refresh }
    ),
    remove: useMutation(
      (id: number) => axiosPrivate.delete(`/release-certificates/rules/${id}`),
      { onSuccess: refresh }
    )
  }
}

export const useReleaseUploaders = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<{ id: number; nombre: string }[]>(
    ['releaseCertificates', 'uploaders'],
    () =>
      axiosPrivate
        .get('/release-certificates/uploaders')
        .then((response) => response.data),
    { staleTime: 60 * 1000 }
  )
}

/** Buscador de clientes de la plataforma para los filtros (mismo que usa la edición). */
export const useReleaseCustomerOptions = (search: string) =>
  useReleaseCustomerSearch(search)

/** Clientes de la plataforma que se parecen al nombre que trae el PDF (para cuando no se identificó solo). */
export const useCustomerSuggestions = (id: number | null, enabled: boolean) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<{ id: number; nombre: string; score: number }[]>(
    ['releaseCertificates', 'customer-suggestions', id],
    () =>
      axiosPrivate
        .get(`/release-certificates/${id}/customer-suggestions`)
        .then((response) => response.data),
    { enabled: enabled && id !== null }
  )
}

/** Búsqueda manual dentro de los equipos del cliente del certificado. */
export const useReleaseEquipmentSearch = (
  id: number | null,
  search: string,
  enabled: boolean
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<ReleaseEquipmentCandidate[]>(
    ['releaseCertificates', 'equipment-search', id, search],
    () =>
      axiosPrivate
        .get(`/release-certificates/${id}/equipment-search`, {
          params: { search }
        })
        .then((response) => response.data),
    {
      enabled: enabled && id !== null && search.length >= 2,
      keepPreviousData: true
    }
  )
}
