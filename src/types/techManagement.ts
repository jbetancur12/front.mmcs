// Tipos del módulo de Gestión tecnológica y tecnovigilancia (api.mmcs: /tech-management).

export type RiskClass = 'I' | 'IIA' | 'IIB' | 'III'
export type EquipmentStatus = 'active' | 'inactive' | 'retired'
export type ScheduleStatus = 'vencido' | 'proximo' | 'al_dia' | 'sin_programar'
export type ActivityType = 'preventive' | 'calibration' | 'corrective'
export type ActivityStatus = 'pending' | 'executed' | 'cancelled'
export type ActivityResult = 'conforme' | 'no_conforme'
export type EventType = 'evento' | 'incidente'
export type Severity = 'serio' | 'no_serio'
export type ReportStatus = 'borrador' | 'en_gestion' | 'reportado' | 'cerrado'
export type DeadlineStatus = 'cumplido' | 'sin_plazo' | 'vencido' | 'por_vencer' | 'a_tiempo'
export type Methodology = 'espina_pescado' | 'protocolo_londres' | 'cinco_porques' | 'otro'
export type ActionStatus = 'pendiente' | 'en_progreso' | 'cumplida' | 'cancelada'
export type AlertType = 'alerta' | 'recall' | 'informe_seguridad'
export type AlertMatchStatus = 'pendiente' | 'no_aplica' | 'gestionada'

export interface Paged<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export interface ScheduleCounts {
  equipment: number
  overdue: number
  upcoming: number
  unscheduled: number
}

export interface TechCustomer extends ScheduleCounts {
  id: number
  nombre: string
  identificacion?: string | null
  ciudad?: string | null
}

export interface CustomerSite {
  id: number
  name: string
  city?: string | null
}

export interface CustomerEquipment {
  id: number
  customerId: number
  customerSiteId?: number | null
  deviceId?: number | null
  name: string
  brand?: string | null
  model?: string | null
  serie?: string | null
  activoFijo?: string | null
  city?: string | null
  sede?: string | null
  location?: string | null
  service?: string | null
  riskClass?: RiskClass | null
  invimaRegistry?: string | null
  lot?: string | null
  manufacturer?: string | null
  responsibleProvider?: string | null
  status: EquipmentStatus
  calibrationPeriodMonths?: number | null
  maintenancePeriodMonths?: number | null
  notes?: string | null
  publicToken: string
  origin: string
  site?: CustomerSite | null
  device?: { id: number; name: string; magnitude?: string | null } | null
  scheduleStatus: ScheduleStatus
  nextDueDate: string | null
  nextDueType: ActivityType | null
}

export type EquipmentPayload = Partial<
  Pick<
    CustomerEquipment,
    | 'name'
    | 'brand'
    | 'model'
    | 'serie'
    | 'activoFijo'
    | 'city'
    | 'sede'
    | 'location'
    | 'service'
    | 'riskClass'
    | 'invimaRegistry'
    | 'lot'
    | 'manufacturer'
    | 'responsibleProvider'
    | 'status'
    | 'calibrationPeriodMonths'
    | 'maintenancePeriodMonths'
    | 'notes'
    | 'customerSiteId'
  >
>

export interface EquipmentActivity {
  id: number
  customerEquipmentId: number
  type: ActivityType
  dueDate: string | null
  executedAt: string | null
  status: ActivityStatus
  result?: ActivityResult | null
  origin?: 'metromedics' | 'third_party' | null
  provider?: string | null
  fileId?: number | null
  maintenanceTicketId?: number | null
  evidenceName?: string | null
  surveillanceReview?: 'pending' | 'affected' | 'not_affected' | null
  notes?: string | null
  equipment?: Pick<
    CustomerEquipment,
    'id' | 'name' | 'brand' | 'model' | 'serie' | 'activoFijo' | 'sede' | 'service' | 'riskClass' | 'location'
  >
  ticket?: { id: number; ticketCode: string; issueDescription?: string | null } | null
}

export interface EquipmentCertificate {
  id: number
  name: string
  calibrationDate: string | null
  nextCalibrationDate: string | null
  filePath: string
  certificateType?: { id: number; name: string } | null
  certificateHistories?: { id: number; calibrationDate: string | null; filePath?: string | null }[]
}

export interface SurveillanceReport {
  id: number
  customerId: number
  customerEquipmentId?: number | null
  code: string
  eventType?: EventType | null
  severity?: Severity | null
  detectedAt: string
  reportDeadline?: string | null
  status: ReportStatus
  description: string
  patientAffected?: boolean | null
  outcome?: string | null
  service?: string | null
  detectedByName?: string | null
  origin: string
  invimaReportNumber?: string | null
  reportedAt?: string | null
  closedAt?: string | null
  deadlineStatus?: DeadlineStatus
  equipment?: Pick<
    CustomerEquipment,
    'id' | 'name' | 'brand' | 'model' | 'serie' | 'activoFijo' | 'sede' | 'service' | 'riskClass'
  > | null
  analysis?: SurveillanceAnalysis | null
  actions?: SurveillanceAction[]
}

export interface SurveillanceAnalysis {
  id?: number
  methodology: Methodology
  causes: { category: string; description: string }[]
  conclusion?: string | null
}

export interface SurveillanceAction {
  id: number
  description: string
  responsibleName?: string | null
  dueDate?: string | null
  status: ActionStatus
  completedAt?: string | null
  followUp?: string | null
}

export interface CommitteeMember {
  name: string
  position: string
  role: string
}

export interface SurveillanceProgram {
  id?: number
  exists?: boolean
  referentName?: string | null
  referentPosition?: string | null
  referentEmail?: string | null
  referentPhone?: string | null
  committee: CommitteeMember[]
  invimaRegistrationDate?: string | null
  scope?: string | null
  objective?: string | null
  procedures?: string | null
  documentVersion?: string | null
  approvedAt?: string | null
}

export interface QuarterlyReport {
  year: number
  quarter: number
  from: string
  to: string
  deadline: string
  zeroReport: boolean
  referent: { name?: string; email?: string; phone?: string } | null
  nonSerious: SurveillanceReport[]
  serious: SurveillanceReport[]
  unclassified: SurveillanceReport[]
}

export interface InvimaAlert {
  id: number
  code: string
  type: AlertType
  title: string
  deviceName?: string | null
  brand?: string | null
  model?: string | null
  manufacturer?: string | null
  invimaRegistry?: string | null
  affectedLots?: string | null
  description?: string | null
  publishedAt: string
  url?: string | null
  matches?: number
}

export interface InvimaAlertMatch {
  id: number
  alertId: number
  customerEquipmentId: number
  matchedBy: string
  status: AlertMatchStatus
  actionTaken?: string | null
  closedAt?: string | null
  alert?: InvimaAlert
  equipment?: Pick<
    CustomerEquipment,
    'id' | 'name' | 'brand' | 'model' | 'serie' | 'lot' | 'invimaRegistry' | 'sede' | 'service'
  >
}

export interface ComplianceGroup {
  label: string
  programmed: number
  executed: number
  onTime: number
  overdue: number
  pending: number
  compliance: number | null
  timeliness: number | null
}

export interface Compliance {
  period: { from: string; to: string }
  total: Omit<ComplianceGroup, 'label'>
  byType: Partial<Record<'calibration' | 'preventive', Omit<ComplianceGroup, 'label'>>>
  bySede: ComplianceGroup[]
  byService: ComplianceGroup[]
  byRiskClass: ComplianceGroup[]
  corrective: number
}

export interface TechDashboard {
  referenceDate: string
  counts: ScheduleCounts
  compliance: Compliance
  monthly: ({ month: number } & Omit<ComplianceGroup, 'label'>)[]
  openReports: SurveillanceReport[]
  reportsOverdue: number
  reportsDueSoon: number
  pendingReviews: number
  pendingAlerts: number
  program: { id: number; referentName?: string | null; approvedAt?: string | null } | null
  byRiskClass: { riskClass: string; count: number }[]
}

export interface EquipmentDetail extends CustomerEquipment {
  certificates: EquipmentCertificate[]
  activities: EquipmentActivity[]
  reports: SurveillanceReport[]
  alertMatches: InvimaAlertMatch[]
}

export interface AuditEntry {
  id: number
  entity: string
  entityId: number | null
  userName: string | null
  isStaff: boolean
  action: string
  changes: Record<string, [unknown, unknown]> | null
  createdAt: string
}

export interface PublicEquipment {
  customerName: string | null
  name: string
  brand?: string | null
  model?: string | null
  serie?: string | null
  activoFijo?: string | null
  sede?: string | null
  service?: string | null
  location?: string | null
  riskClass?: RiskClass | null
  invimaRegistry?: string | null
  status: EquipmentStatus
  lastCalibration: string | null
  lastPreventive: string | null
  scheduleStatus: ScheduleStatus
  nextDueDate: string | null
  nextDueType: ActivityType | null
  history: { type: ActivityType; executedAt: string; result?: ActivityResult | null; origin?: string | null }[]
}
