import { useMutation, useQuery, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { purchaseKeys } from './queryKeys'

/** Parámetros fiscales vigentes (GET /fiscal-parameters). */
export interface FiscalSettings {
  PURCHASE_RETENTION_RATE?: number
  SERVICE_RETENTION_RATE?: number
  PURCHASE_MINIMUM_BASE?: number
  SERVICE_MINIMUM_BASE?: number
  IVA_GENERAL_RATE_PERCENTAGE?: number // Ej: 19 para 19%
}

export const useFiscalSettings = () => {
  const axiosPrivate = useAxiosPrivate()
  return useQuery<FiscalSettings, Error>(
    purchaseKeys.fiscalSettings,
    async () => {
      const response =
        await axiosPrivate.get<FiscalSettings>('/fiscal-parameters')
      return response.data
    },
    { staleTime: 1000 * 60 * 30 }
  )
}

/** Genera una orden de compra (POST /purchaseOrders). */
export const useCreatePurchaseOrder = <TPayload = unknown>() => {
  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  return useMutation<unknown, unknown, TPayload>(
    (payload) => axiosPrivate.post('/purchaseOrders', payload),
    {
      retry: false,
      onSuccess: () => {
        queryClient.invalidateQueries(purchaseKeys.orders)
        queryClient.invalidateQueries(purchaseKeys.requests)
      }
    }
  )
}
