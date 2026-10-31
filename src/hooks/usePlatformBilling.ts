import { useQuery } from 'react-query'
import { axiosPrivate } from '../utils/api'

export interface PlatformBillingStatus {
  configured: boolean
  hasProblem: boolean
  status?: string
  message?: string | null
  billingUrl?: string
  checkedAt?: string
}

/** Estado de pago de la nube donde corre la plataforma. Solo se consulta con la capacidad de verlo. */
export const usePlatformBilling = (enabled: boolean) =>
  useQuery<PlatformBillingStatus>(
    ['platform-billing', 'status'],
    async () =>
      (await axiosPrivate.get<PlatformBillingStatus>('/platform-billing/status'))
        .data,
    {
      enabled,
      staleTime: 10 * 60 * 1000,
      refetchInterval: 30 * 60 * 1000,
      retry: false
    }
  )
