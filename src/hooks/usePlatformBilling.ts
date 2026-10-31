import { useMutation, useQuery, useQueryClient } from 'react-query'
import { axiosPrivate } from '../utils/api'

export interface PlatformExpiration {
  id: number
  name: string
  provider: string | null
  expiresOn: string
  cost: string | null
  renewUrl: string | null
  notes: string | null
  daysLeft: number
  severity: 'green' | 'orange' | 'red'
}

export type PlatformExpirationInput = Pick<
  PlatformExpiration,
  'name' | 'provider' | 'expiresOn' | 'cost' | 'renewUrl' | 'notes'
>

export interface PlatformBillingStatus {
  expiring?: PlatformExpiration[]
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
      (
        await axiosPrivate.get<PlatformBillingStatus>(
          '/platform-billing/status'
        )
      ).data,
    {
      enabled,
      staleTime: 10 * 60 * 1000,
      refetchInterval: 30 * 60 * 1000,
      retry: false
    }
  )

export interface PlatformInvoice {
  uuid: string
  period: string
  amount: string
}

export interface PlatformBillingEntry {
  description: string
  amount: string
  type: string
  date: string
  invoiceUuid: string | null
}

export interface PlatformBillingOverview extends PlatformBillingStatus {
  /** false si el token de DigitalOcean no puede leer saldo, facturas ni movimientos */
  billingAccess?: boolean
  accountBalance?: string | null
  monthToDateUsage?: string | null
  invoices?: PlatformInvoice[]
  invoicePreview?: { period: string; amount: string } | null
  history?: PlatformBillingEntry[]
  fetchedAt?: string
}

const overviewKey = ['platform-billing', 'overview']

/** Resumen completo para el panel de facturación: estado, saldo, facturas y movimientos. */
export const usePlatformBillingOverview = () => {
  const queryClient = useQueryClient()
  const query = useQuery<PlatformBillingOverview>(
    overviewKey,
    async () =>
      (
        await axiosPrivate.get<PlatformBillingOverview>(
          '/platform-billing/overview'
        )
      ).data,
    { staleTime: 5 * 60 * 1000, retry: false }
  )

  /** Fuerza la consulta a DigitalOcean sin esperar la caché del servidor. */
  const refresh = async () => {
    const { data } = await axiosPrivate.get<PlatformBillingOverview>(
      '/platform-billing/overview',
      { params: { refresh: true } }
    )
    queryClient.setQueryData(overviewKey, data)
    queryClient.invalidateQueries(['platform-billing', 'status'])
  }

  return { ...query, refresh }
}

/** Descarga el PDF de una factura de DigitalOcean a través del API. */
export const downloadPlatformInvoice = async (uuid: string) => {
  const { data } = await axiosPrivate.get<Blob>(
    `/platform-billing/invoices/${uuid}/pdf`,
    { responseType: 'blob' }
  )
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = `factura-digitalocean-${uuid}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

const expirationsKey = ['platform-billing', 'expirations']

/** Vencimientos de servicios registrados a mano (dominio, hosting...). */
export const usePlatformExpirations = () =>
  useQuery<PlatformExpiration[]>(
    expirationsKey,
    async () =>
      (
        await axiosPrivate.get<PlatformExpiration[]>(
          '/platform-billing/expirations'
        )
      ).data,
    { staleTime: 60 * 1000 }
  )

export const useSavePlatformExpiration = () => {
  const queryClient = useQueryClient()
  return useMutation(
    async ({ id, ...body }: PlatformExpirationInput & { id?: number }) =>
      id
        ? (await axiosPrivate.put(`/platform-billing/expirations/${id}`, body))
            .data
        : (await axiosPrivate.post('/platform-billing/expirations', body)).data,
    {
      onSuccess: () => {
        queryClient.invalidateQueries(expirationsKey)
        queryClient.invalidateQueries(['platform-billing', 'status'])
      }
    }
  )
}

export const useDeletePlatformExpiration = () => {
  const queryClient = useQueryClient()
  return useMutation(
    async (id: number) => {
      await axiosPrivate.delete(`/platform-billing/expirations/${id}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(expirationsKey)
        queryClient.invalidateQueries(['platform-billing', 'status'])
      }
    }
  )
}
