import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { PurchaseRequest as IPurchaseRequest } from 'src/pages/Purchases/Types'
import { purchaseKeys } from './queryKeys'

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
