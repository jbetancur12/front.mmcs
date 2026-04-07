export type CalibrationServiceStatus =
  | 'draft'
  | 'pending_approval'
  | 'rejected'
  | 'approved'
  | 'ods_issued'
  | 'pending_programming'

export type CalibrationServiceApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'

export type CalibrationServiceScopeType = 'general' | 'site'
export type CalibrationServiceSlaIndicatorColor =
  | 'gray'
  | 'green'
  | 'yellow'
  | 'red'
  | 'blue'

export type CalibrationServiceDocumentType =
  | 'request_evidence'
  | 'approval_evidence'
  | 'rejection_evidence'
  | 'quote_pdf'
  | 'ods_pdf'
  | 'supporting_attachment'

export type CalibrationServiceEventType =
  | 'service_created'
  | 'service_updated'
  | 'approval_requested'
  | 'service_approved'
  | 'service_rejected'
  | 'ods_issued'
  | 'document_uploaded'

export interface CalibrationServiceCustomer {
  id: number
  nombre: string
  identificacion?: string | null
  telefono?: string | null
  email?: string | null
  ciudad?: string | null
  departamento?: string | null
  direccion?: string | null
  sede?: string[]
}

export interface CalibrationServiceUserSummary {
  id: number
  nombre: string
  email?: string | null
}

export interface CalibrationServiceProductSummary {
  id: number
  name: string
  price?: number | null
}

export interface CalibrationServiceItem {
  id: number
  serviceId: number
  productId?: number | null
  itemName: string
  instrumentName?: string | null
  intervalText?: string | null
  quantity: number
  serviceType?: string | null
  unitPrice: number | string | null
  taxRate: number | string | null
  subtotal: number | string | null
  taxTotal: number | string | null
  total: number | string | null
  notes?: string | null
  sortOrder: number
  otherFields?: Record<string, unknown>
  product?: CalibrationServiceProductSummary | null
  createdAt?: string
  updatedAt?: string
}

export interface CalibrationServiceDocument {
  id: number
  serviceId: number
  uploadedByUserId?: number | null
  documentType: CalibrationServiceDocumentType
  title?: string | null
  originalFileName: string
  storedFileName: string
  filePath: string
  fileUrl?: string | null
  fileMimeType?: string | null
  fileSize?: number | null
  storageProvider: string
  bucketName?: string | null
  version: number
  generatedBySystem: boolean
  notes?: string | null
  uploadedAt: string
  otherFields?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface CalibrationServiceEvent {
  id: number
  serviceId: number
  eventType: CalibrationServiceEventType
  description: string
  oldValue?: string | null
  newValue?: string | null
  performedByUserId?: number | null
  performedByName: string
  performedByType: 'user' | 'system' | 'customer'
  isVisible: boolean
  occurredAt: string
  metadata?: Record<string, unknown>
  createdAt?: string
  updatedAt?: string
}

export interface CalibrationServiceSlaIndicator {
  color: CalibrationServiceSlaIndicatorColor
  label: string
  message: string
  activePhase: string
  isActive: boolean
  isClosed: boolean
  startedAt?: string | null
  businessDaysElapsed: number
  warningBusinessDays: number
  targetBusinessDays: number
}

export interface CalibrationService {
  id: number
  serviceCode: string
  quoteCode?: string | null
  odsCode?: string | null
  status: CalibrationServiceStatus
  approvalStatus: CalibrationServiceApprovalStatus
  customerId?: number | null
  scopeType: CalibrationServiceScopeType
  customerSite?: string | null
  executionCustomerName?: string | null
  executionSiteName?: string | null
  requestChannel?: string | null
  approvalChannel?: string | null
  approvalReference?: string | null
  validityDays?: number | null
  hasDiscount: boolean
  discountType?: string | null
  discountValue?: number | string | null
  paymentMethod?: string | null
  instrumentDeliveryTime?: string | null
  certificateDeliveryTime?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  city?: string | null
  department?: string | null
  address?: string | null
  commercialComments?: string | null
  internalNotes?: string | null
  rejectionReason?: string | null
  isPaused?: boolean
  pauseReason?: string | null
  createdByUserId?: number | null
  approvedByUserId?: number | null
  approvedAt?: string | null
  rejectedByUserId?: number | null
  rejectedAt?: string | null
  odsGeneratedByUserId?: number | null
  odsGeneratedAt?: string | null
  otherFields?: Record<string, unknown>
  createdAt: string
  updatedAt: string
  customer?: CalibrationServiceCustomer | null
  createdBy?: CalibrationServiceUserSummary | null
  approvedBy?: CalibrationServiceUserSummary | null
  rejectedBy?: CalibrationServiceUserSummary | null
  odsGeneratedBy?: CalibrationServiceUserSummary | null
  items?: CalibrationServiceItem[]
  documents?: CalibrationServiceDocument[]
  events?: CalibrationServiceEvent[]
  slaIndicator?: CalibrationServiceSlaIndicator
}

export interface CalibrationServiceFilters {
  search?: string
  status?: CalibrationServiceStatus
  approvalStatus?: CalibrationServiceApprovalStatus
  customerId?: number
  limit?: number
  offset?: number
}

export interface CalibrationServiceListResponse {
  totalItems: number
  totalPages: number
  currentPage: number
  services: CalibrationService[]
}

export interface CalibrationServiceSequenceConfig {
  initialized: boolean
  quotePrefix: string
  odsSuffix: string
  nextQuoteNumber: number | null
  nextOdsNumber: number | null
  quotePreview?: string | null
  odsPreview?: string | null
  initializedAt?: string | null
  initializedByName?: string | null
  updatedAt?: string | null
  updatedByName?: string | null
}

export interface CalibrationServiceItemPayload {
  productId?: number | null
  itemName: string
  instrumentName?: string | null
  intervalText?: string | null
  quantity: number
  serviceType?: string | null
  unitPrice: number
  taxRate?: number
  subtotal?: number
  taxTotal?: number
  total?: number
  notes?: string | null
  sortOrder?: number
  otherFields?: Record<string, unknown>
}

export interface CalibrationServicePayload {
  customerId?: number | null
  scopeType?: CalibrationServiceScopeType
  customerSite?: string | null
  executionCustomerName?: string | null
  executionSiteName?: string | null
  requestChannel?: string | null
  approvalChannel?: string | null
  approvalReference?: string | null
  validityDays?: number | null
  hasDiscount?: boolean
  discountType?: string | null
  discountValue?: number | null
  paymentMethod?: string | null
  instrumentDeliveryTime?: string | null
  certificateDeliveryTime?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  city?: string | null
  department?: string | null
  address?: string | null
  commercialComments?: string | null
  internalNotes?: string | null
  status?: Extract<CalibrationServiceStatus, 'draft' | 'pending_approval'>
  otherFields?: Record<string, unknown>
  items?: CalibrationServiceItemPayload[]
}

export interface CalibrationServiceDocumentUploadPayload {
  serviceId: string
  file: File
  documentType: CalibrationServiceDocumentType
  title?: string
  notes?: string
  generatedBySystem?: boolean
}

export interface CalibrationServiceRequestApprovalPayload {
  serviceId: string
}

export interface CalibrationServiceApprovePayload {
  serviceId: string
  approvalChannel: string
  approvalReference: string
  approvalNotes?: string | null
  approvedAt?: string
  evidenceDocumentId?: number | null
}

export interface CalibrationServiceRejectPayload {
  serviceId: string
  approvalChannel: string
  approvalReference?: string | null
  rejectionReason: string
  rejectedAt?: string
  evidenceDocumentId?: number | null
}

export interface CalibrationServiceIssueOdsPayload {
  serviceId: string
  issuedAt?: string
  executionCustomerName?: string | null
  executionSiteName?: string | null
  contactName?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  city?: string | null
  department?: string | null
  address?: string | null
  internalNotes?: string | null
  scheduledFor?: string | null
  scheduleWindow?: string | null
  serviceComments?: string | null
  modificationReason?: string | null
  customerAgreements?: string | null
  signerName?: string | null
  signerRole?: string | null
  externalReference?: string | null
  receptionNotes?: string | null
}

export interface CalibrationServiceDocumentActionPayload {
  serviceId: string
  documentId?: string
}

export interface CalibrationServiceSequenceConfigPayload {
  nextQuoteNumber: number
  nextOdsNumber: number
}
