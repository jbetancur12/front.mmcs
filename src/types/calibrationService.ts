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
  unitPrice: number | string
  taxRate: number | string
  subtotal: number | string
  taxTotal: number | string
  total: number | string
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
