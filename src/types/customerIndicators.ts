import { CalibrationServiceStatus } from 'src/types/calibrationService'

/** Quién editó y cuándo. `updatedBy` solo llega al personal interno en la meta. */
export interface IndicatorEditor {
  id: number
  name: string
}

export type IndicatorGoalMode = 'auto' | 'manual'

export interface IndicatorGoal {
  value: number
  mode: IndicatorGoalMode
  contracted: number
  contractedServices: number
  reason: string | null
  updatedBy: IndicatorEditor | null
  updatedAt: string | null
}

export interface IndicatorTypeRow {
  /** Nombre normalizado: es el `sourceName` al crear un alias. */
  key: string
  label: string
  contracted: number
  calibrated: number
  /** `null` si el tipo no tiene contratados. */
  progressPct: number | null
}

/** Tipo de equipo con certificados del periodo, aunque sus certificados no sumen al avance. */
export interface AvailableCertificateType {
  key: string
  label: string
  /** Certificados del equipo en el periodo y la sede filtrada. */
  certificates: number
  /** De esos, cuántos son de un tipo que cuenta para el avance. */
  counted: number
  certificateTypes: { name: string; count: number }[]
}

export interface IndicatorObservations {
  text: string | null
  updatedBy: IndicatorEditor | null
  updatedAt: string | null
}

export interface CustomerIndicators {
  year: number
  headquarter: string | null
  goal: IndicatorGoal
  calibrated: number
  pending: number
  /** Ítems de la ODS marcados "no es metrológico": no suman a la meta. */
  excluded?: {
    quantity: number
    byType: { key: string; label: string; quantity: number }[]
  }
  /** `null` si no hay base para calcular ("Sin meta"). */
  progressPct: number | null
  lastCalibrationDate: string | null
  byType: IndicatorTypeRow[]
  /** Tipos de equipo con certificados de cualquier tipo: son las opciones del diálogo de asociación. */
  availableCertificateTypes?: AvailableCertificateType[]
  observations: IndicatorObservations
  availableYears: number[]
  headquarters: string[]
  /** Solo con sede filtrada. */
  scope?: { contracted: number; contractedServices: number }
}

export interface ContractedServiceRow {
  id: number
  odsCode: string
  quoteCode: string | null
  odsGeneratedAt: string
  status: CalibrationServiceStatus
  scopeType: 'general' | 'site' | string
  site: string | null
  quoted: number
  adjustmentsNet: number
  pendingAdjustments: number
  effective: number
  documents: { ods: boolean; technicalProgress: number; adjustments: number }
}

export interface ContractedServicesResponse {
  year: number
  services: ContractedServiceRow[]
  totals: {
    services: number
    quoted: number
    adjustmentsNet: number
    effective: number
    pendingAdjustments: number
  }
}

export interface SaveObservationsPayload {
  customerId: number | string
  year: number
  text: string
}

export interface SaveObservationsResponse {
  year: number
  observations: IndicatorObservations
}

export type SaveGoalPayload =
  | { customerId: number | string; year: number; mode: 'auto' }
  | {
      customerId: number | string
      year: number
      mode: 'manual'
      manualGoal: number
      reason: string
    }

export interface SaveGoalResponse {
  year: number
  goal: IndicatorGoal
}

export interface CreateTypeAliasPayload {
  sourceName: string
  /** Tipo de los certificados al que equivale; no se envía si `notMetrological`. */
  targetName?: string
  /** El ítem de la ODS no es metrología (viáticos, transporte): sale de la meta. */
  notMetrological?: boolean
}

export type CustomerServiceDocumentType =
  | 'ods_pdf'
  | 'technical_progress_pdf'
  | 'adjustment_pdf'
  | 'adjustment_summary_pdf'
  | 'adjustment_customer_response_pdf'

export interface CustomerServiceDocument {
  id: number
  type: CustomerServiceDocumentType
  title: string
  version: number
  uploadedAt: string
}

export interface CustomerServiceSummary {
  id: number
  odsCode: string
  odsGeneratedAt: string
  status: CalibrationServiceStatus
  site: string | null
  quoted: number
  adjustmentsNet: number
  effective: number
  documents: CustomerServiceDocument[]
}

export interface CustomerServicesResponse {
  year: number | null
  status: CalibrationServiceStatus | null
  services: CustomerServiceSummary[]
}

/** Asociación o exclusión guardada: un nombre de la ODS (normalizado) y a qué equivale. */
export interface TypeAliasEntry {
  id: number
  sourceName: string
  /** Tipo de los certificados (normalizado); `null` si se marcó como no metrológico. */
  targetName: string | null
  notMetrological: boolean
  createdBy: { id: number; name: string | null } | null
  createdAt: string | null
}
