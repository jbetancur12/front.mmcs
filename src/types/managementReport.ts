export type ManagementReportStatus = 'green' | 'yellow' | 'red' | 'gray'

export interface ManagementReportMetric {
  code: string
  label: string
  unit: 'currency' | 'count' | 'percent' | 'score' | 'days'
  value: number | null
  display: string
  previous: number | null
  previousDisplay: string
  variation: number | null
  variationDisplay: string
  direction: 'up' | 'down'
  status: ManagementReportStatus
  note: string
  count?: number | null
  countLabel?: string | null
  detail?: unknown
}

export interface ManagementReportBlock {
  key: string
  title: string
  question: string
  metrics: ManagementReportMetric[]
  action?: string | null
}

export interface ManagementReportCoverItem {
  code: string
  label: string
  display: string
  status: ManagementReportStatus
  variationDisplay: string
  note?: string
}

export interface ManagementReportAlert {
  severity: 'red' | 'yellow'
  title: string
  detail: string
  action: string
  owner: string
}

export interface ManagementReportMeta {
  period: string
  periodLabel: string
  previousPeriod: string
  previousPeriodLabel: string
  generatedAt: string
  cutoff: string
  currency: string
  profile: 'full' | 'no_amounts'
  includeLms: boolean
}

export interface ManagementReport {
  meta: ManagementReportMeta
  cover: ManagementReportCoverItem[]
  blocks: Record<string, ManagementReportBlock>
  alerts: ManagementReportAlert[]
  annexes?: Record<string, unknown>
  definitions: {
    terms: Array<{ term: string; definition: string }>
    limitations: string[]
  }
}

export interface StoredManagementReport {
  id: number
  period: string
  profile: 'full' | 'no_amounts'
  pdfPath?: string | null
  xlsxPath?: string | null
  sentAt: string | null
  createdAt: string
}
