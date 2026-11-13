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
  /** Contra qué se compara el cambio (por defecto, el mes anterior). */
  comparison?: string
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
  comparison?: string
  hasValue?: boolean
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

/** Una fila del bloque Equipo (una persona, o el total). */
export interface ManagementReportTeamRow {
  userId: number | null
  name: string
  created: number
  approved: number
  rejected: number
  expired: number
  decisions: number
  /** Fracción 0–1; null con menos de 5 decisiones. */
  winRate: number | null
  insufficientData: boolean
  waiting: number
  medianApprovalDays: number | null
  /** Los tres valores solo vienen en la versión con valores. */
  createdValue?: number
  approvedValue?: number
  waitingValue?: number
}

export interface ManagementReportTeamTable {
  rows: ManagementReportTeamRow[]
  totals: ManagementReportTeamRow
}

export type ManagementReportTeamKind = 'calibration' | 'equipment' | 'both'
export type ManagementReportTeamRange = 'month' | 'year'

export interface ManagementReport {
  meta: ManagementReportMeta
  cover: ManagementReportCoverItem[]
  blocks: Record<string, ManagementReportBlock>
  alerts: ManagementReportAlert[]
  /** Indicadores sin información suficiente este mes. */
  noData?: Array<{ section: string; label: string; note?: string }>
  annexes?: Record<string, unknown>
  team?: {
    minDecisions: number
    year: number
    month: number
  } & Record<
    ManagementReportTeamRange,
    Record<ManagementReportTeamKind, ManagementReportTeamTable>
  >
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
