import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { PurchaseRequest as IPurchaseRequest } from 'src/pages/Purchases/Types'
import { purchaseKeys } from './queryKeys'
import {
  fetchAllPages,
  fetchPaginated,
  fetchTotal,
  type PaginatedResponse,
  type ServerListParams
} from 'src/hooks/useServerTable'
import { PurchaseRequestStatus } from 'src/pages/Purchases/Enums'

export interface PurchaseRequestsResponse {
  count: number
  purchaseRequests: IPurchaseRequest[]
}

export interface PurchaseRequester {
  id: number | string
  name: string
  position: string
}

/** Listado de solicitudes de compra (GET /purchaseRequests). */
export const usePurchaseRequests = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<PurchaseRequestsResponse, Error>(
    purchaseKeys.requests,
    async () => {
      const { data } =
        await axiosPrivate.get<PurchaseRequestsResponse>('/purchaseRequests')
      return data
    }
  )
}

// Las claves cuelgan de 'purchaseRequests': las pantallas que invalidan ese
// prefijo (acciones de fila, órdenes de compra) refrescan también estas.
export const purchaseRequestKeys = {
  paginated: (params: ServerListParams) =>
    [...purchaseKeys.requests, 'paginated', params] as const,
  counts: [...purchaseKeys.requests, 'counts'] as const,
  approved: [...purchaseKeys.requests, 'approved'] as const
}

/** Columnas que `GET /purchaseRequests` acepta en `sortBy`. */
export const PURCHASE_REQUEST_SORTABLE_FIELDS = [
  'purchaseCode',
  'elaborationDate',
  'status',
  'createdAt',
  'id'
] as const

/** Filtros exactos de `GET /purchaseRequests` (id de columna = parámetro). */
export const PURCHASE_REQUEST_EXACT_FILTERS = ['status', 'purchaseType'] as const

/** Página de solicitudes de compra (`?page=&limit=...`). */
export const usePurchaseRequestsPaginated = (
  params: ServerListParams,
  options: { enabled?: boolean } = {}
) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<PaginatedResponse<IPurchaseRequest>, Error>(
    purchaseRequestKeys.paginated(params),
    () =>
      fetchPaginated<IPurchaseRequest>(
        axiosPrivate,
        '/purchaseRequests',
        params
      ),
    { keepPreviousData: true, enabled: options.enabled ?? true }
  )
}

/** Total de solicitudes y pendientes de aprobar (`totalItems` con `limit=1`). */
export const usePurchaseRequestCounts = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery(purchaseRequestKeys.counts, async () => {
    const [total, pending] = await Promise.all([
      fetchTotal(axiosPrivate, '/purchaseRequests'),
      fetchTotal(axiosPrivate, '/purchaseRequests', {
        status: PurchaseRequestStatus.Pending
      })
    ])
    return { total, pending }
  })
}

/**
 * Solicitudes pre-aprobadas y aprobadas (todas las páginas). El endpoint no
 * filtra por "sin orden de compra", así que los indicadores "Por generar
 * orden" y "Sin orden hace más de 7 días" se calculan sobre este subconjunto
 * en lugar de bajar también las pendientes y rechazadas.
 */
export const useApprovedPurchaseRequests = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<IPurchaseRequest[], Error>(
    purchaseRequestKeys.approved,
    async () => {
      const [preApproved, accepted] = await Promise.all([
        fetchAllPages<IPurchaseRequest>(axiosPrivate, '/purchaseRequests', {
          status: PurchaseRequestStatus.PreApproved
        }),
        fetchAllPages<IPurchaseRequest>(axiosPrivate, '/purchaseRequests', {
          status: PurchaseRequestStatus.Accepted
        })
      ])
      // Mismo orden que el listado (id descendente).
      return [...preApproved, ...accepted].sort(
        (left, right) => Number(right.id) - Number(left.id)
      )
    }
  )
}

/** Personas que pueden figurar como solicitantes (GET /personnel). */
export const usePurchaseRequesters = (enabled = true) => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<PurchaseRequester[], Error>(
    purchaseKeys.requesters,
    async () => {
      try {
        const response =
          await axiosPrivate.get<PurchaseRequester[]>('/personnel')
        return response.data || []
      } catch (err) {
        console.error('Error cargando solicitantes:', err)
        throw err
      }
    },
    {
      enabled,
      staleTime: 1000 * 60 * 15
    }
  )
}

interface SavePurchaseRequestVars {
  id?: IPurchaseRequest['id'] | null
  payload: Partial<IPurchaseRequest>
}

/** Crea (POST) o actualiza (PUT) una solicitud de compra. */
export const useSavePurchaseRequest = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation<IPurchaseRequest, unknown, SavePurchaseRequestVars>(
    async ({ id, payload }) => {
      const response = id
        ? await axiosPrivate.put<IPurchaseRequest>(
            `/purchaseRequests/${id}`,
            payload
          )
        : await axiosPrivate.post<IPurchaseRequest>(
            '/purchaseRequests',
            payload
          )
      return response.data
    },
    {
      retry: false,
      onSuccess: () => {
        queryClient.invalidateQueries(purchaseKeys.requests)
      }
    }
  )
}

/** Configura el consecutivo inicial de las solicitudes de compra. */
export const useSetInitialPurchaseRequestId = () => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation<unknown, unknown, string>(
    (initialId) =>
      axiosPrivate.post('/purchaseRequests/set-initial-id', { initialId }),
    {
      retry: false,
      onSuccess: () => {
        queryClient.invalidateQueries(purchaseKeys.requests)
      }
    }
  )
}
