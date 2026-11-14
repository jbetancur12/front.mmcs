import { useQuery } from 'react-query'
import { axiosPrivate } from 'src/utils/api'
import { downloadPrivateFile } from 'src/utils/downloadBlob'
import type {
  ManagementReport,
  ManagementReportDetail,
  StoredManagementReport
} from 'src/types/managementReport'

const REPORT_KEY = 'management-report'

/** El API responde 202 mientras arma el reporte por primera vez (puede tardar un minuto). */
interface ManagementReportGenerating {
  status: 'generating'
  message?: string
}

const isGenerating = (
  data: ManagementReport | ManagementReportGenerating | undefined
): data is ManagementReportGenerating =>
  Boolean(data && 'status' in data && data.status === 'generating')

export const useManagementReport = ({
  month,
  profile,
  enabled = true
}: {
  month: string
  profile: 'full' | 'no_amounts'
  enabled?: boolean
}) => {
  const query = useQuery<ManagementReport | ManagementReportGenerating>(
    [REPORT_KEY, month, profile],
    async () =>
      (
        await axiosPrivate.get<ManagementReport | ManagementReportGenerating>(
          '/management-reports/monthly',
          {
            params: { month, profile, format: 'json' }
          }
        )
      ).data,
    {
      enabled,
      staleTime: 5 * 60 * 1000,
      retry: false,
      // Mientras el servidor arma el reporte, vuelve a preguntar cada 5 s
      refetchInterval: (data) => (isGenerating(data) ? 5000 : false)
    }
  )
  const generating = isGenerating(query.data)
  return {
    ...query,
    data: generating ? undefined : (query.data as ManagementReport | undefined),
    isLoading: query.isLoading || generating,
    isGenerating: generating
  }
}

/** Lista detrás de un número del reporte (paginada y con búsqueda en el servidor). */
export const useManagementReportDetail = ({
  month,
  profile,
  code,
  page,
  search,
  enabled = true
}: {
  month: string
  profile: 'full' | 'no_amounts'
  code: string | null
  page: number
  search: string
  enabled?: boolean
}) =>
  useQuery<ManagementReportDetail>(
    [REPORT_KEY, 'detail', month, profile, code, page, search],
    async () =>
      (
        await axiosPrivate.get<ManagementReportDetail>(
          '/management-reports/monthly/detail',
          { params: { month, profile, code, page, search } }
        )
      ).data,
    { enabled, keepPreviousData: true, staleTime: 60 * 1000, retry: false }
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
  /** Aviso semanal por WhatsApp al número de gerencia; apagado por defecto. */
  weeklyWhatsappEnabled?: boolean
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
