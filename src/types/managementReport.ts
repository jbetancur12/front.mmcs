/** `registry`: depende de que se registre el trabajo, no es un resultado. */
export type ManagementReportStatus =
  | 'green'
  | 'yellow'
  | 'red'
  | 'gray'
  | 'registry'

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
  dependsOnRecord?: boolean
  /** Meta mensual, si la hay: el semáforo se calcula contra ella. */
  goal?: {
    key: string
    target: number
    progress: number
    targetDisplay: string
  }
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
  goal?: { progress: number; targetDisplay: string }
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

/** Aviso de que una sola cuenta concentra casi todos los registros. */
export interface ManagementReportSharedAccountWarning {
  name: string
  count: number
  total: number
  share: number
  message: string
}

export interface ManagementReportTeamTable {
  /** false cuando no hay nada que comparar entre personas; `reason` dice por qué. */
  usable?: boolean
  reason?: string | null
  rows: ManagementReportTeamRow[]
  totals: ManagementReportTeamRow
  sharedAccountWarning?: ManagementReportSharedAccountWarning | null
}

/** Fila de las áreas distintas de cotizaciones: cifras por nombre de campo. */
export interface ManagementReportAreaRow {
  key: number | string | null
  name: string
  [field: string]: number | string | boolean | null
}

export interface ManagementReportAreaTable {
  usable?: boolean
  reason?: string | null
  rows: ManagementReportAreaRow[]
  totals: ManagementReportAreaRow
  sharedAccountWarning?: ManagementReportSharedAccountWarning | null
  /** Compras: la atribución es por nombre escrito, no por usuario. */
  approximate?: boolean
}

export type ManagementReportTeamArea =
  | 'quotations'
  | 'certificates'
  | 'maintenance'
  | 'purchases'

export type ManagementReportAreaKey = Exclude<
  ManagementReportTeamArea,
  'quotations'
>

export type ManagementReportTeamKind = 'calibration' | 'equipment' | 'both'
export type ManagementReportTeamRange = 'month' | 'year'

/** Un mes de la tendencia. Los campos *Value solo vienen con valores. */
export interface ManagementReportTrendPoint {
  key: string
  label: string
  createdCount: number
  createdValue?: number
  salesCalibrationCount: number
  salesCalibrationValue?: number
  salesEquipmentCount: number
  salesEquipmentValue?: number
  decisions: number
  /** Fracción 0–1; null con menos de 5 decisiones. */
  winRate: number | null
  billedCount: number
  billedValue?: number
  paidCount: number
  paidValue?: number
  openCount: number
  openValue?: number
}

export interface ManagementReportLossCategory {
  key: string
  label: string
  count: number
  share: number | null
  lostValue?: number
}

export interface ManagementReportLossBlock {
  minRecords: number
  total: number
  insufficientData: boolean
  lostValue?: number
  noResponseShare: number | null
  coverage: { rejected: number; withReason: number; share: number | null }
  categories: ManagementReportLossCategory[]
  topCustomers: Array<{ name: string; count: number; lostValue?: number }>
  byPerson: Array<{
    key: number | null
    name: string
    lost: number
    noResponse: number
    rejected: number
    lostValue?: number
  }>
}

/** Cotización que pide seguimiento. `valor` solo viene con valores. */
export interface ManagementReportExpiringRow {
  id: number
  kind: 'Calibración' | 'Equipos'
  customerName: string
  code: string
  valor?: number
  daysLeft: number | null
  daysSinceSent: number
  createdByName: string
  reason: string
  /** Ruta de la pantalla del servicio o de la cotización. */
  link: string
}

/** Cartera de un cliente. Los `openValue*` solo vienen con valores. */
export interface ManagementReportDebtorRow {
  customerId: number
  customerName: string
  invoices: number
  count0a30: number
  count31a60: number
  count61a90: number
  countOver90: number
  openValue0a30?: number
  openValue31a60?: number
  openValue61a90?: number
  openValueOver90?: number
  openValue?: number
  oldestDays: number | null
  oldestCode: string | null
}

export interface ManagementReportActionLists {
  cutoff: string
  expiringQuotes: {
    horizonDays: number
    staleDays: number
    count: number
    totalValue?: number
    rows: ManagementReportExpiringRow[]
  }
  debtors: {
    count: number
    invoices: number
    openValue?: number
    rows: ManagementReportDebtorRow[]
  }
}

export interface ManagementReportConfidenceItem {
  code: string | null
  label: string
  reason: string
}

export interface ManagementReportDataConfidence {
  firm: ManagementReportConfidenceItem[]
  dependsOnRecord: ManagementReportConfidenceItem[]
}

export interface ManagementReport {
  dataConfidence?: ManagementReportDataConfidence
  actionLists?: ManagementReportActionLists
  meta: ManagementReportMeta
  cover: ManagementReportCoverItem[]
  blocks: Record<string, ManagementReportBlock>
  alerts: ManagementReportAlert[]
  /** Indicadores sin información suficiente este mes. */
  noData?: Array<{ section: string; label: string; note?: string }>
  annexes?: Record<string, unknown>
  trend?: {
    months: number
    series: ManagementReportTrendPoint[]
    /** Metas para las líneas de referencia; el dinero solo con valores. */
    goals?: {
      salesGoalValue?: number
      billedGoalValue?: number
      winRateGoal?: number
    }
  }
  lossReasons?: Record<'month' | 'year', ManagementReportLossBlock>
  team?: {
    minDecisions: number
    year: number
    month: number
  } & Record<
    ManagementReportTeamRange,
    Record<ManagementReportTeamKind, ManagementReportTeamTable>
  > &
    Partial<
      Record<
        ManagementReportAreaKey,
        Record<ManagementReportTeamRange, ManagementReportAreaTable>
      >
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
