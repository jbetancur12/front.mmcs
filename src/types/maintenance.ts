export interface MaintenanceTicketCost {
  id?: string
  ticketId?: string
  name: string
  description?: string
  amount: number
  createdAt?: string
}

export interface MaintenanceTechnicalReportPart {
  description: string
  quantity: number
  code?: string
  notes?: string
}

export interface MaintenanceTechnicalReportTool {
  name: string
  serial?: string | null
  calibrationDue?: string | null
  internalCode?: string | null
  location?: string | null
}

export interface MaintenanceTechnicalReportTest {
  parameter: string
  result: string
  value?: string
  notes?: string
}

export interface MaintenanceToolEquipmentSummary {
  id: string
  internalCode: string
  equipmentName: string
  brand: string
  model: string
  serialNumber: string
  location: string
  nextCalibrationDate?: string | null
}

export interface MaintenanceProtocolTemplate {
  id: string
  name: string
  code: string
  description?: string | null
  appliesTo: string[]
  riskClass?: string | null
  tools: MaintenanceTechnicalReportTool[]
  tests: MaintenanceTechnicalReportTest[]
  recommendations?: string | null
  sortOrder: number
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface MaintenanceProtocolTemplateRequest {
  name: string
  code: string
  description?: string | null
  appliesTo: string[]
  riskClass?: string | null
  tools: MaintenanceTechnicalReportTool[]
  tests: MaintenanceTechnicalReportTest[]
  recommendations?: string | null
  sortOrder?: number
  isActive?: boolean
}

export interface MaintenanceTechnicalReport {
  id?: string | null
  ticketId: string
  maintenanceType: string
  serviceFinalStatus?: string | null
  deliveryStatus?: string | null
  riskClass?: string
  finalDiagnosis?: string
  rootCause?: string
  activities: string[]
  parts: MaintenanceTechnicalReportPart[]
  verificationProtocolType?: string
  verificationTools: MaintenanceTechnicalReportTool[]
  verificationTests: MaintenanceTechnicalReportTest[]
  recommendations?: string
  nextMaintenanceDate?: string | null
  technicianWorkMinutes?: number | null
  warrantyDays: number
  warrantyTerms?: string
  scopeClause?: string
  responsibilityClause?: string
  createdAt?: string | null
  updatedAt?: string | null
}

export interface MaintenanceTicket {
  id: string
  ticketCode: string
  customerName: string
  customerEmail: string
  customerPhone: string
  equipmentType: string
  equipmentBrand: string
  equipmentModel: string
  equipmentSerial: string
  issueDescription: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  assignedTechnician?: MaintenanceTechnician
  assignedTechnicianId?: string
  scheduledDate?: string
  completedDate?: string
  estimatedCost?: number
  actualCost?: number
  technicianWorkMinutes?: number | null
  customerSatisfaction?: number
  location: string
  workPerformed?: string
  intakePhysicalCondition?: string | null
  receivedAccessories?: string | null
  requiresTechnicalReport?: boolean
  createdAt: string
  updatedAt: string
  comments: MaintenanceComment[]
  files: MaintenanceFile[]
  timeline: MaintenanceTimelineEntry[]
  costs?: MaintenanceTicketCost[]
  isInvoiced?: boolean
  technicianSignatureData?: string | null
  technicianSignedAt?: string | null
  customerSignatureData?: string | null
  customerSignedAt?: string | null
  customerSignerName?: string | null
  technicalReport?: MaintenanceTechnicalReport | null
}

export interface MaintenanceTicketCreateResponse {
  message: string
  ticket: MaintenanceTicket
  ticketNumber: string
}

export interface MaintenanceComment {
  id: string
  ticketId: string
  userId?: string
  technicianId?: string
  userName: string // Legacy field
  userRole: string // Legacy field
  authorName: string // Backend field
  authorType: string // Backend field
  content: string
  commentType: string
  isInternal: boolean
  isVisible?: boolean
  createdAt: string
  updatedAt?: string
  user?: {
    id: string
    nombre: string
    email: string
  }
  technician?: {
    id: string
    name: string
    email: string
  }
}

export interface MaintenanceFile {
  id: string
  ticketId: string
  fileName: string
  originalName: string
  fileType: string
  fileSize: number
  filePath: string
  uploadedBy: string
  uploadedAt: string
  isImage: boolean
  isVideo: boolean
}

export interface MaintenanceTimelineEntry {
  id: string
  ticketId: string
  action: MaintenanceAction
  description: string
  performedBy: string
  performedAt: string
  metadata?: Record<string, any>
}

export interface MaintenanceTechnician {
  id: string
  name: string
  email: string
  phone: string
  specialization?: string | null
  certifications?: string | null
  status: 'active' | 'inactive' | 'on_leave'
  employeeId?: string | null
  hireDate?: string | null
  workload: number
  rating: number
  totalTicketsCompleted: number
  isAvailable: boolean
  maxWorkload: number
  notes?: string | null
  signatureData?: string | null
  signatureUpdatedAt?: string | null
  createdAt: string
  updatedAt: string
  metrics?: {
    activeTickets: number
    monthlyCompleted: number
    workloadPercentage: number
    efficiency: number
  }
}

interface Metrics {
  totalTickets: number
  completedTickets: number
  avgResolutionTimeHours: number
  activeTechnicians: number
  pendingTickets: number
}

interface RecentTicket {
  id: number
  ticketCode: string
  customerName: string
  status: string
  priority: string
  createdAt: string
  assignedTechnician: null
}

interface PriorityStat {
  priority: string
  count: string
}

interface StatusStat {
  status: string
  count: string
}

export interface MaintenanceStats {
  statusStats: StatusStat[]
  priorityStats: PriorityStat[]
  technicianStats: any[]
  recentTickets: RecentTicket[]
  metrics: Metrics
}

export interface MaintenanceAnalyticsFilters {
  startDate?: string
  endDate?: string
  technicianId?: string
}

export interface MaintenanceAnalyticsOverview {
  totalTickets: number
  openTickets: number
  completedTickets: number
  cancelledTickets: number
  urgentOpenTickets: number
  avgResolutionTimeHours: number
  avgActualCost: number
  avgCustomerSatisfaction: number
  invoicedCompletedTickets: number
  notInvoicedCompletedTickets: number
}

export interface MaintenanceAnalyticsBreakdownItem {
  status?: string
  priority?: string
  label: string
  count: number
}

export interface MaintenanceTechnicianPerformance {
  technicianId: string
  name: string
  email: string
  status: string
  workload: number
  maxWorkload: number
  isAvailable: boolean
  openTickets: number
  assignedTickets: number
  pendingTickets: number
  completedTickets: number
  cancelledTickets: number
  totalAssignedTickets: number
  completionRate: number
  avgResolutionTimeHours: number
  avgCustomerSatisfaction: number
  totalActualCost: number
  historicalCompletedTickets: number
  rating: number
}

export interface MaintenanceAnalyticsTrendPoint {
  date: string
  created: number
  completed: number
}

export interface MaintenanceAnalyticsEquipmentType {
  equipmentType: string
  count: number
  completedCount: number
}

export interface MaintenanceAnalyticsAgingBucket {
  bucket: string
  count: number
}

export interface MaintenanceAnalyticsResponse {
  filters: {
    startDate: string | null
    endDate: string | null
    technicianId: string | null
  }
  overview: MaintenanceAnalyticsOverview
  statusBreakdown: MaintenanceAnalyticsBreakdownItem[]
  priorityBreakdown: MaintenanceAnalyticsBreakdownItem[]
  technicianPerformance: MaintenanceTechnicianPerformance[]
  dailyTrend: MaintenanceAnalyticsTrendPoint[]
  topEquipmentTypes: MaintenanceAnalyticsEquipmentType[]
  agingBuckets: MaintenanceAnalyticsAgingBucket[]
}

export interface MaintenanceCreateRequest {
  customerName: string
  customerEmail: string
  customerPhone: string
  equipmentType: string
  equipmentBrand: string
  equipmentModel: string
  equipmentSerial: string
  issueDescription: string
  priority?: MaintenancePriority
  location: string
  files?: File[]
}

export interface MaintenanceUpdateRequest {
  status?: MaintenanceStatus
  assignedTechnician?: string
  scheduledDate?: string
  equipmentType?: string
  equipmentBrand?: string
  equipmentModel?: string
  equipmentSerial?: string
  estimatedCost?: number
  actualCost?: number
  technicianWorkMinutes?: number | null
  priority?: MaintenancePriority
  location?: string
  workPerformed?: string
  intakePhysicalCondition?: string | null
  receivedAccessories?: string | null
  costs?: MaintenanceTicketCost[]
  isInvoiced?: boolean
  technicianSignatureData?: string | null
  customerSignatureData?: string | null
  customerSignerName?: string | null
}

export interface MaintenanceTechnicalReportRequest {
  maintenanceType?: string
  serviceFinalStatus?: string | null
  deliveryStatus?: string | null
  riskClass?: string
  finalDiagnosis?: string
  rootCause?: string
  activities: string[]
  parts: MaintenanceTechnicalReportPart[]
  verificationProtocolType?: string
  verificationTools: MaintenanceTechnicalReportTool[]
  verificationTests: MaintenanceTechnicalReportTest[]
  recommendations?: string
  nextMaintenanceDate?: string | null
  warrantyDays?: number
  warrantyTerms?: string
  scopeClause?: string
  responsibilityClause?: string
}

export interface MaintenanceFilters {
  status?: MaintenanceStatus[]
  priority?: MaintenancePriority[]
  assignedTechnician?: string[]
  dateRange?: {
    from: string
    to: string
  }
  equipmentType?: string[]
  search?: string
  customerEmail?: string
}

export interface FilterPreset {
  id: string
  name: string
  filters: MaintenanceFilters
  isDefault: boolean
  createdBy: string
  createdAt: string
}

export interface MaintenancePagination {
  currentPage: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

export interface MaintenanceResponse {
  tickets: MaintenanceTicket[]
  pagination: MaintenancePagination
}

export interface MaintenanceNotification {
  id: string
  type: MaintenanceNotificationType
  title: string
  message: string
  ticketId?: string
  recipientId: string
  isRead: boolean
  createdAt: string
}

// Enums
export enum MaintenanceStatus {
  PENDING = 'new',
  ASSIGNED = 'assigned',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  WAITING_PARTS = 'waiting_parts',
  WAITING_CUSTOMER = 'waiting_customer',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum MaintenanceAction {
  CREATED = 'created',
  ASSIGNED = 'assigned',
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  COMMENT_ADDED = 'comment_added',
  FILE_UPLOADED = 'file_uploaded',
  SCHEDULED = 'scheduled',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  COST_UPDATED = 'cost_updated'
}

export enum TechnicianAvailability {
  AVAILABLE = 'available',
  BUSY = 'busy',
  ON_BREAK = 'on_break',
  OFFLINE = 'offline'
}

export enum MaintenanceNotificationType {
  TICKET_CREATED = 'ticket_created',
  TICKET_ASSIGNED = 'ticket_assigned',
  STATUS_UPDATED = 'status_updated',
  COMMENT_ADDED = 'comment_added',
  TICKET_COMPLETED = 'ticket_completed',
  RATING_REQUESTED = 'rating_requested'
}

// Helper types for forms
export interface MaintenanceFormErrors {
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  equipmentType?: string
  equipmentBrand?: string
  equipmentModel?: string
  equipmentSerial?: string
  issueDescription?: string
  priority?: string
  location?: string
  files?: string
}

export interface TechnicianFormData {
  name: string
  email: string
  phone: string
  specialization: string
  certifications: string
  status: 'active' | 'inactive' | 'on_leave'
  employeeId: string
  isAvailable: boolean
  maxWorkload: number
  notes: string
  signatureData?: string | null
}

export interface TechnicianFormErrors {
  name?: string
  email?: string
  phone?: string
  specialization?: string
  certifications?: string
  status?: string
  employeeId?: string
  isAvailable?: string
  maxWorkload?: string
  notes?: string
}

// API Response types
export interface MaintenanceApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  error?: string
}

export interface MaintenanceFileUploadResponse {
  success: boolean
  files: MaintenanceFile[]
  message?: string
}

export interface MaintenanceTrackingResponse {
  ticket: MaintenanceTicket | null
  found: boolean
  message?: string
}

// Backend timeline response types
export interface BackendTimelineEntry {
  id: string
  type: string
  title: string
  description: string
  timestamp: string
  author: string
  authorType?: string
  icon: string
}

export interface MaintenanceTimelineResponse {
  ticketId: string
  ticketCode: string
  timeline: BackendTimelineEntry[]
}
