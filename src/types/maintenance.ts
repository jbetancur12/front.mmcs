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
  technicianId?: string
  scheduledDate?: string
  completedDate?: string
  estimatedCost?: number
  actualCost?: number
  customerSatisfaction?: number
  location: string
  createdAt: string
  updatedAt: string
  comments: MaintenanceComment[]
  files: MaintenanceFile[]
  timeline: MaintenanceTimelineEntry[]
}

export interface MaintenanceComment {
  id: string
  ticketId: string
  userId: string
  userName: string
  userRole: string
  comment: string
  isInternal: boolean
  createdAt: string
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
  specialties: string[]
  rating: number
  totalTickets: number
  completedTickets: number
  isActive: boolean
  availabilityStatus: TechnicianAvailability
  workload: number
  createdAt: string
  updatedAt: string
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
  estimatedCost?: number
  actualCost?: number
  priority?: MaintenancePriority
  location?: string
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
  specialties: string[]
  isActive: boolean
}

export interface TechnicianFormErrors {
  name?: string
  email?: string
  phone?: string
  specialties?: string
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
