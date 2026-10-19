import { AxiosResponse } from 'axios'
import { useMutation, useQuery, useQueryClient } from 'react-query'

import useAxiosPrivate from '@utils/use-axios-private'
import {
  fetchPaginated,
  fetchTotal,
  PaginatedResponse,
  ServerListParams
} from 'src/hooks/useServerTable'

import { DataSheetData } from './types'

export const dataSheetKeys = {
  all: ['dataSheets'] as const,
  paginated: (params: ServerListParams) =>
    [...dataSheetKeys.all, 'paginated', params] as const,
  counts: () => [...dataSheetKeys.all, 'counts'] as const
}

/** Columnas que `GET /dataSheet` acepta en `sortBy`. */
export const DATASHEET_SORTABLE_FIELDS = [
  'internalCode',
  'equipmentName',
  'brand',
  'model',
  'location',
  'receivedDate',
  'id'
] as const

/** Filtros exactos de `GET /dataSheet` (id de columna = parámetro). */
export const DATASHEET_EXACT_FILTERS = [
  'status',
  'equipmentStatus',
  'serviceType'
] as const

const EMPTY: DataSheetData[] = []

/** Página de hojas de vida (`GET /dataSheet?page=&limit=...`). */
export const useDataSheetsPaginated = (params: ServerListParams) => {
  const axiosPrivate = useAxiosPrivate()

  const query = useQuery<PaginatedResponse<DataSheetData>>(
    dataSheetKeys.paginated(params),
    () => fetchPaginated<DataSheetData>(axiosPrivate, '/dataSheet', params),
    {
      keepPreviousData: true,
      onError: (error) => {
        console.error('Error fetching dataSheet data:', error)
      }
    }
  )

  return {
    ...query,
    dataSheets: query.data?.items ?? EMPTY,
    totalItems: query.data?.totalItems ?? 0,
    totalPages: query.data?.totalPages
  }
}

/**
 * Indicadores de la lista sin bajar todas las hojas de vida: el total y los
 * conteos por estado salen de `totalItems` con `limit=1`, y los equipos por
 * calibrar o inspeccionar de `GET /dataSheet/alerts` (la misma alerta del
 * encabezado).
 */
export const useDataSheetCounts = () => {
  const axiosPrivate = useAxiosPrivate()

  return useQuery(
    dataSheetKeys.counts(),
    async () => {
      const count = (filters: Record<string, string> = {}) =>
        fetchTotal(axiosPrivate, '/dataSheet', filters)
      const [total, available, busy, alerts] = await Promise.all([
        count(),
        count({ status: 'available' }),
        count({ status: 'busy' }),
        axiosPrivate.get<unknown[]>('/dataSheet/alerts')
      ])
      return {
        total,
        available,
        busy,
        dueSoon: Array.isArray(alerts.data) ? alerts.data.length : 0
      }
    },
    {
      onError: (error) => {
        console.error('Error fetching dataSheet counts:', error)
      }
    }
  )
}

/** Mutaciones de hojas de vida; todas invalidan la lista al terminar bien. */
export const useDataSheetMutations = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries(dataSheetKeys.all)
  // Sin reintentos: el `retry: 1` global de mutaciones reenviaría POST/PUT/DELETE.
  const options = { onSuccess: invalidate, retry: 0 }

  const updateDataSheet = useMutation<
    AxiosResponse,
    unknown,
    { id: number; values: Record<string, unknown> }
  >(({ id, values }) => axiosPrivate.put(`/dataSheet/${id}`, values, {}), options)

  const deleteDataSheet = useMutation<AxiosResponse, unknown, number>(
    (id) => axiosPrivate.delete(`/dataSheet/${id}`),
    options
  )

  const uploadImage = useMutation<
    AxiosResponse,
    unknown,
    { id: number | undefined; image: File }
  >(
    ({ id, image }) => {
      const formData = new FormData()
      formData.append('picture', image)
      return axiosPrivate.put(`/dataSheet/${id}/update-image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
    },
    options
  )

  const uploadInvoice = useMutation<
    AxiosResponse,
    unknown,
    { id: number; pdfFile: File }
  >(
    ({ id, pdfFile }) => {
      const formData = new FormData()
      formData.append('invoice', pdfFile)
      return axiosPrivate.put(`/dataSheet/${id}/update-invoice`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
    },
    options
  )

  const createDataSheet = useMutation<AxiosResponse, unknown, FormData>(
    (formData) =>
      axiosPrivate.post(`/dataSheet`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }),
    options
  )

  return {
    updateDataSheet,
    deleteDataSheet,
    uploadImage,
    uploadInvoice,
    createDataSheet
  }
}

/** Descarga de la factura (blob): efecto imperativo, no es una query. */
export const useDownloadInvoice = () => {
  const axiosPrivate = useAxiosPrivate()
  return (id: number) =>
    axiosPrivate.get(`/dataSheet/download-invoice/${id}`, {
      responseType: 'blob' // Importante para manejar archivos binarios
    })
}
