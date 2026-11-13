import { useQuery } from 'react-query'
import { axiosPrivate } from 'src/utils/api'
import { downloadPrivateFile } from 'src/utils/downloadBlob'
import type {
  ManagementReport,
  StoredManagementReport
} from 'src/types/managementReport'

const REPORT_KEY = 'management-report'

export const useManagementReport = ({
  month,
  profile,
  enabled = true
}: {
  month: string
  profile: 'full' | 'no_amounts'
  enabled?: boolean
}) =>
  useQuery<ManagementReport>(
    [REPORT_KEY, month, profile],
    async () =>
      (
        await axiosPrivate.get<ManagementReport>(
          '/management-reports/monthly',
          {
            params: { month, profile, format: 'json' }
          }
        )
      ).data,
    {
      enabled,
      staleTime: 5 * 60 * 1000,
      retry: false
    }
  )

export const useManagementReportHistory = (enabled = true) =>
  useQuery<StoredManagementReport[]>(
    [REPORT_KEY, 'history'],
    async () =>
      (await axiosPrivate.get<StoredManagementReport[]>('/management-reports'))
        .data,
    {
      enabled,
      staleTime: 60 * 1000,
      retry: false
    }
  )

/** Alcance del PDF: `summary` son las dos primeras páginas, `full` las cuatro. */
export type ManagementReportPdfPages = 'summary' | 'full'

export const downloadManagementReport = ({
  month,
  profile,
  format,
  pages
}: {
  month: string
  profile: 'full' | 'no_amounts'
  format: 'pdf' | 'xlsx'
  pages?: ManagementReportPdfPages
}) =>
  downloadPrivateFile(
    '/management-reports/monthly',
    `reporte-gerencial_${month}_${profile}${pages === 'summary' ? '_resumen' : ''}.${format}`,
    { month, profile, format, ...(format === 'pdf' && pages ? { pages } : {}) }
  )

export const downloadStoredManagementReport = ({
  period,
  profile,
  format
}: {
  period: string
  profile: 'full' | 'no_amounts'
  format: 'pdf' | 'xlsx'
}) =>
  downloadPrivateFile(
    `/management-reports/${period}/${format}`,
    `reporte-gerencial_${period}_${profile}.${format}`,
    { profile }
  )

export interface ManagementReportConfig {
  recipients: {
    full: string[]
    no_amounts: string[]
  }
  /** Un solo número: recibe por WhatsApp la versión de gerencia. */
  whatsappPhone?: string
  includeLms: boolean
  /** Aviso semanal (lunes 07:00) con las dos listas de acción; apagado por defecto. */
  weeklyDigestEnabled?: boolean
  /** Alcance del PDF que recibe cada versión (envío, WhatsApp e historial). */
  pdfPages?: {
    full: ManagementReportPdfPages
    no_amounts: ManagementReportPdfPages
  }
  /** Metas mensuales opcionales; null = sin meta. */
  goals?: {
    approvedSales: number | string | null
    billed: number | string | null
    /** Porcentaje de 1 a 100. */
    winRate: number | string | null
  }
}

export const useManagementReportConfig = (enabled = true) =>
  useQuery<ManagementReportConfig>(
    [REPORT_KEY, 'config'],
    async () =>
      (
        await axiosPrivate.get<ManagementReportConfig>(
          '/management-reports/config'
        )
      ).data,
    {
      enabled,
      staleTime: 5 * 60 * 1000,
      retry: false
    }
  )

export const saveManagementReportConfig = async (
  values: ManagementReportConfig
) => {
  const { data } = await axiosPrivate.put<ManagementReportConfig>(
    '/management-reports/config',
    values
  )
  return data
}

export const sendManagementReport = async ({
  month,
  profile
}: {
  month: string
  profile: 'full' | 'no_amounts'
}) => {
  const { data } = await axiosPrivate.post('/management-reports/monthly/send', {
    month,
    profile
  })
  return data
}
