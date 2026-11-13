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
