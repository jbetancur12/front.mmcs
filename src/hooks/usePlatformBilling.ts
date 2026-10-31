import { useQuery, useQueryClient } from 'react-query'
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
