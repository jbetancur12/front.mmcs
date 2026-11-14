import { useQuery } from 'react-query'
import { axiosPrivate } from 'src/utils/api'

export type QuotationIndicatorsKind = 'calibration' | 'equipment'

export interface QuotationIndicators {
  kind: QuotationIndicatorsKind
  period: string
  periodLabel: string
  userId: number | null
  totals: {
    created: number
    approved: number
    rejected: number
    expired: number
    decisions: number
    /** Fracción 0–1; null con pocas decisiones. */
    winRate: number | null
    waiting: number
    /** Solo para quien puede ver valores. */
    approvedValue?: number
    waitingValue?: number
  }
  creators: Array<{ userId: number; name: string; count: number }>
}

const PATHS: Record<QuotationIndicatorsKind, string> = {
  calibration: '/calibration-services/indicators',
  equipment: '/equipment-sales/indicators'
}

/** Indicadores del mes en curso para la franja del listado; `userId` filtra por quien creó. */
export const useQuotationIndicators = (
  kind: QuotationIndicatorsKind,
  userId: number | null,
  enabled = true
) =>
  useQuery<QuotationIndicators>(
    ['quotation-indicators', kind, userId],
    async () =>
      (
        await axiosPrivate.get<QuotationIndicators>(PATHS[kind], {
          params: userId === null ? undefined : { userId }
        })
      ).data,
    { enabled, staleTime: 2 * 60 * 1000, retry: false }
  )

export interface FilterOption {
  value: string
  name: string
  count: number
}

export interface PurchaseIndicators {
  period: string
  periodLabel: string
  filter: string | null
  totals: {
    created: number
    approved: number
    sent: number
    withoutOrder: number
    /** Solo para quien puede ver valores. */
    sentValue?: number
  }
  options: FilterOption[]
}

export interface MaintenanceIndicators {
  period: string
  periodLabel: string
  filter: number | null
  totals: {
    created: number
    completed: number
    open: number
    medianAttentionDays: number | null
    actualCost?: number
  }
  options: FilterOption[]
}

/** Solicitudes de compra del mes; `person` es el nombre normalizado del solicitante. */
export const usePurchaseIndicators = (person: string | null) =>
  useQuery<PurchaseIndicators>(
    ['purchase-indicators', person],
    async () =>
      (
        await axiosPrivate.get<PurchaseIndicators>(
          '/purchaseRequests/indicators',
          { params: person === null ? undefined : { person } }
        )
      ).data,
    { staleTime: 2 * 60 * 1000, retry: false }
  )

/** Tickets de mantenimiento del mes; `technicianId` es el técnico asignado. */
export const useMaintenanceIndicators = (technicianId: number | null) =>
  useQuery<MaintenanceIndicators>(
    ['maintenance-indicators', technicianId],
    async () =>
      (
        await axiosPrivate.get<MaintenanceIndicators>(
          '/maintenance/tickets/indicators',
          { params: technicianId === null ? undefined : { technicianId } }
        )
      ).data,
    { staleTime: 2 * 60 * 1000, retry: false }
  )
