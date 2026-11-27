// Visitas de un servicio de calibración y plazos de sus certificados (api.mmcs: calibrationVisit*.service.js).
export type VisitClockState =
  | 'not_started'
  | 'on_time'
  | 'due_soon'
  | 'overdue'
  | 'paused'
  | 'done_on_time'
  | 'done_late'

export interface VisitClock {
  startDate: string
  dueDate: string
  warningDate: string
  completedOn: string | null
  state: VisitClockState
  lateBusinessDays: number
}

export interface VisitMetrologist {
  userId: number
  name: string
  email?: string | null
}

export interface VisitItem {
  itemId: number
  plannedQuantity: number
  executedQuantity?: number
  nonCertifiableQuantity?: number
  note?: string | null
}

export interface VisitCertificate {
  id: number
  visitId?: number | null
  status: string
  kind: string
  documentNumber?: string | null
  instrument?: string | null
  serie?: string | null
  calibrationDate?: string | null
  createdAt: string
  releasedAt?: string | null
  clock?: (VisitClock & { stage: 'review' | 'adjustment' | 'released' }) | null
}

export interface CertificateDeadlines {
  uploadWarningBusinessDays: number
  uploadTargetBusinessDays: number
  reviewWarningBusinessDays: number
  reviewTargetBusinessDays: number
  adjustmentWarningBusinessDays: number
  adjustmentTargetBusinessDays: number
}

export interface VisitQuantities {
  planned: number
  executed: number
  expectedCertificates: number
  uploaded: number
  released: number
}

export interface CalibrationVisit {
  id: number
  serviceId: number
  visitNumber: number
  status: 'scheduled' | 'executed' | 'cancelled'
  startDate: string
  endDate: string
  siteName?: string | null
  notes?: string | null
  metrologists: VisitMetrologist[]
  uploadResponsibleUserId?: number | null
  items: VisitItem[]
  trackDeadlines: boolean
  uploadDueDateOverride?: string | null
  cancelReason?: string | null
  deadlines: CertificateDeadlines
  quantities: VisitQuantities
  upload: VisitClock | null
  certificates: VisitCertificate[]
}

export interface CalibrationVisitsResponse {
  visits: CalibrationVisit[]
  certificatesWithoutVisit: VisitCertificate[]
  deadlines: {
    general: CertificateDeadlines
    service: Partial<CertificateDeadlines>
    effective: CertificateDeadlines
  }
}

export interface VisitServiceSummary {
  serviceCode: string
  odsCode?: string | null
  customerName?: string | null
}

export type CalendarVisit = Omit<CalibrationVisit, 'certificates'> &
  VisitServiceSummary

export interface PendingStage {
  pending: number
  overdue: number
  dueSoon: number
  oldestDueDate: string | null
}

export type BoardVisit = CalendarVisit & {
  review: PendingStage
  adjustment: PendingStage
}

export interface VisitBoardResponse {
  visits: BoardVisit[]
  totals: {
    uploadOverdue: number
    uploadDueSoon: number
    reviewOverdue: number
    reviewPending: number
    adjustmentOverdue: number
    adjustmentPending: number
  }
}

export interface PersonCompliance {
  userId: number | null
  name: string | null
  total: number
  onTime: number
  late: number
  overdue: number
  onTimePercent: number | null
  averageLateBusinessDays: number | null
}

export interface VisitIndicatorsResponse {
  upload: PersonCompliance[]
  review: PersonCompliance[]
}

export interface UploadLagRow {
  userId: number | null
  name: string | null
  certificates: number
  medianBusinessDays: number | null
  maxBusinessDays: number | null
  late: number
  latePercent: number | null
}

export interface UploadLagResponse {
  targetBusinessDays: number
  uploaders: UploadLagRow[]
}

export interface ServiceProgressResponse {
  totals: {
    contracted: number
    scheduled: number
    executed: number
    uploaded: number
    released: number
    invoiced: number
  }
  visits: { scheduled: number; executed: number }
}
