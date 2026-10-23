import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import {
  fetchPaginated,
  fetchTotal,
  type PaginatedResponse,
  type ServerListParams
} from 'src/hooks/useServerTable'
import {
  NonConformWorkReport,
  NonConformWorkReportAlert
} from 'src/Components/NonConformWorkReport/NonConformWorkReport.types'
import { notify } from 'src/utils/notify'

export const NON_CONFORM_QUERY_KEYS = {
  all: ['nonConformWorkReports'] as const,
  list: ['nonConformWorkReports', 'list'] as const,
  alerts: ['nonConformWorkReports', 'alerts'] as const,
  paginated: (params: ServerListParams) =>
    ['nonConformWorkReports', 'paginated', params] as const,
  counts: ['nonConformWorkReports', 'counts'] as const
}

/** Columnas que `GET /non-conform-work-report` acepta en `sortBy`. */
export const NON_CONFORM_SORTABLE_FIELDS = [
  'tncCode',
  'registerDate',
  'status',
  'riskLevel',
  'closingDate',
  'createdAt',
  'id'
] as const

/** Filtros exactos del endpoint usados por la tabla (id de columna = parámetro). */
export const NON_CONFORM_EXACT_FILTERS = ['status', 'riskLevel'] as const

/** Página de reportes de trabajo no conforme (`?page=&limit=...`). */
export const useNonConformWorkReportsPaginated = (
  params: ServerListParams,
  options: { enabled?: boolean } = {}
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<PaginatedResponse<NonConformWorkReport>>(
    NON_CONFORM_QUERY_KEYS.paginated(params),
    () =>
      fetchPaginated<NonConformWorkReport>(
        axiosPrivate,
        '/non-conform-work-report',
        params
      ),
    {
      enabled: options.enabled ?? true,
      keepPreviousData: true,
      // El formulario (fuera de esta caché) crea/edita reportes: refrescar al montar
      staleTime: 0,
      onError: () => {
        notify.error('Error al obtener los reportes')
      }
    }
  )
}

/** Indicadores: total, abiertos y cerrados (`totalItems` con `limit=1`). */
export const useNonConformWorkReportCounts = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    NON_CONFORM_QUERY_KEYS.counts,
    async () => {
      const url = '/non-conform-work-report'
      const [total, open, closed] = await Promise.all([
        fetchTotal(axiosPrivate, url),
        fetchTotal(axiosPrivate, url, { status: 'Open' }),
        fetchTotal(axiosPrivate, url, { status: 'Closed' })
      ])
      return { total, open, closed }
    },
    { staleTime: 0 }
  )
}

/** Listado de reportes de trabajo no conforme */
export const useNonConformWorkReports = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    NON_CONFORM_QUERY_KEYS.list,
    async (): Promise<NonConformWorkReport[]> => {
      const res = await axiosPrivate.get('/non-conform-work-report')
      return res.data || []
    },
    {
      // El formulario (fuera de esta caché) crea/edita reportes: refrescar al montar
      staleTime: 0,
      onError: () => {
        notify.error('Error al obtener los reportes')
      }
    }
  )
}

/** Reportes con alertas activas (si falla, la lista queda vacía) */
export const useNonConformWorkReportAlerts = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(
    NON_CONFORM_QUERY_KEYS.alerts,
    async (): Promise<NonConformWorkReportAlert[]> => {
      const res = await axiosPrivate.get('/non-conform-work-report/alerts')
      return res.data || []
    },
    { staleTime: 0 }
  )
}

/** Elimina un reporte y lo quita del listado en caché */
export const useDeleteNonConformWorkReport = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    async (id: number) => {
      await axiosPrivate.delete(`/non-conform-work-report/${id}`)
    },
    {
      retry: false,
      onSuccess: (_data, id) => {
        queryClient.setQueryData<NonConformWorkReport[]>(
          NON_CONFORM_QUERY_KEYS.list,
          (current) => (current ?? []).filter((r) => r.id !== id)
        )
        // Páginas, indicadores y alertas se vuelven a pedir.
        queryClient.invalidateQueries(NON_CONFORM_QUERY_KEYS.all)
      }
    }
  )
}

/** Crea (sin `id`) o actualiza (con `id`) un reporte y refresca listados e indicadores */
export const useSaveNonConformWorkReport = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation(
    async ({ id, payload }: { id?: number; payload: unknown }) => {
      if (id) {
        await axiosPrivate.put(`/non-conform-work-report/${id}`, payload)
      } else {
        await axiosPrivate.post('/non-conform-work-report', payload)
      }
    },
    {
      retry: false,
      onSuccess: () => {
        queryClient.invalidateQueries(NON_CONFORM_QUERY_KEYS.all)
      }
    }
  )
}

/** Devuelve una función que dice si ya existe un reporte con ese código TNC */
export const useCheckNonConformCode = () => {
  const axiosPrivate = useAxiosPrivate()
  return async (code: string): Promise<boolean> => {
    const response = await axiosPrivate.get(
      `/non-conform-work-report/check-code/${code}`
    )
    return Boolean(response.data.exists)
  }
}
