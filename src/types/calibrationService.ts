export type CalibrationServiceStatus =
  | 'draft'
  | 'pending_approval'
  | 'rejected'
  | 'approved'
  | 'ods_issued'
  | 'pending_programming'
  | 'scheduled'
  | 'in_execution'
  | 'technically_completed'
  | 'closed'

export type CalibrationServiceApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected'

export type CalibrationServiceCustomerResponseType =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested'

export type CalibrationServiceAdjustmentType =
  | 'quantity_less'
  | 'quantity_more'
  | 'extra_item'
  | 'not_received'
  | 'scope_change'

export type CalibrationServiceAdjustmentStatus =
  | 'reported'
  | 'approved'
  | 'rejected'
  | 'applied_to_cut'

export type CalibrationServiceScopeType = 'general' | 'site'
export type CalibrationServiceSlaIndicatorColor =
  | 'gray'
  | 'green'
  | 'yellow'
  | 'red'
  | 'blue'

export interface CalibrationServiceCutSlaIndicator {
  color: CalibrationServiceSlaIndicatorColor
  label: string
  message: string
  businessDaysElapsed?: number
}

export type CalibrationServiceCutDocumentStatus =
  | 'pending_certificates'
  | 'certificates_partial'
  | 'certificates_ready'
  | 'reviewed'
  | 'sent'

export interface CalibrationServiceCutDocumentControl {
  expectedCertificates: number
  uploadedCertificates: number
  reviewedCertificates: number
  sentCertificates: number
  status: CalibrationServiceCutDocumentStatus
  sendChannel?: string | null
  sentTo?: string | null
  uploadedAt?: string | null
  reviewedAt?: string | null
  sentAt?: string | null
  evidenceDocumentIds?: number[]
  notes?: string | null
}

export type CalibrationServiceOperationalItemStatus =
  | 'pending'
  | 'scheduled'
  | 'in_progress'
  | 'completed'

export type CalibrationServiceDocumentType =
  | 'request_evidence'
  | 'approval_evidence'
  | 'rejection_evidence'
  | 'quote_pdf'
  | 'ods_pdf'
  | 'supporting_attachment'

export type CalibrationServiceCutType = 'partial' | 'final'

export type CalibrationServiceCutStatus =
  | 'draft'
  | 'ready_for_invoicing'
  | 'invoiced'

export type CalibrationServiceEventType =
  | 'service_created'
  | 'service_updated'
  | 'approval_requested'
  | 'service_approved'
  | 'service_rejected'
  | 'adjustment_reported'
  | 'adjustment_reviewed'
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

export interface CalibrationServiceOperationsSummary {
  commitmentDate?: string | null
  scheduledDate?: string | null
  scheduledAt?: string | null
  operationalResponsibleName?: string | null
  operationalResponsibleRole?: string | null
  programmingNotes?: string | null
  startedAt?: string | null
  executionNotes?: string | null
  lastOperationalUpdateAt?: string | null
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

export interface CalibrationServiceCutItem {
  id: number
  cutId: number
  serviceItemId: number
  quantity: number
  otherFields?: Record<string, unknown>
  serviceItem?: CalibrationServiceItem | null
  createdAt?: string
  updatedAt?: string
}

export interface CalibrationServiceCut {
  id: number
  serviceId: number
  cutCode: string
  cutType: CalibrationServiceCutType
  status: CalibrationServiceCutStatus
  releasedAt?: string | null
  readyForInvoicingAt?: string | null
  invoiceReference?: string | null
  invoicedAt?: string | null
  invoiceNotes?: string | null
  notes?: string | null
  createdByUserId?: number | null
  otherFields?: Record<string, unknown> & {
    documentControl?: CalibrationServiceCutDocumentControl
  }
  slaIndicator?: CalibrationServiceCutSlaIndicator
  createdBy?: CalibrationServiceUserSummary | null
  items?: CalibrationServiceCutItem[]
  createdAt?: string
  updatedAt?: string
}

export interface CalibrationServiceAdjustment {
  id: number
  serviceId: number
  serviceItemId?: number | null
  changeType: CalibrationServiceAdjustmentType
  status: CalibrationServiceAdjustmentStatus
  itemName: string
  quotedQuantity: number
  actualQuantity: number
  differenceQuantity: number
  description: string
  technicalNotes?: string | null
  requiresCommercialAdjustment: boolean
  commercialNotes?: string | null
  pricingNotes?: string | null
  approvedUnitPrice?: number | string | null
  approvedTaxRate?: number | string | null
  approvedTaxTotal?: number | string | null
  approvedSubtotal?: number | string | null
  approvedTotal?: number | string | null
  reportedAt: string
  reportedByUserId?: number | null
  reviewedAt?: string | null
  reviewedByUserId?: number | null
  otherFields?: Record<string, unknown>
  serviceItem?: CalibrationServiceItem | null
  reportedBy?: CalibrationServiceUserSummary | null
  reviewedBy?: CalibrationServiceUserSummary | null
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
  adjustments?: CalibrationServiceAdjustment[]
  cuts?: CalibrationServiceCut[]
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
  cutId?: number | null
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

export interface CalibrationServiceRequestChangesPayload {
  serviceId: string
  approvalChannel: string
  approvalReference?: string | null
  changeRequestReason: string
  requestedAt?: string
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

export interface CalibrationServiceSchedulePayload {
  serviceId: string
  commitmentDate: string
  scheduledDate: string
  operationalResponsibleName: string
  operationalResponsibleRole?: string | null
  programmingNotes?: string | null
  scheduledAt?: string
}

export interface CalibrationServiceStartExecutionPayload {
  serviceId: string
  startedAt?: string
  executionNotes?: string | null
}

export interface CalibrationServiceClosePayload {
  serviceId: string
  closedAt?: string
  closingNotes?: string | null
}

export interface CalibrationServiceItemProgressEntryPayload {
  itemId: number
  operationalStatus: CalibrationServiceOperationalItemStatus
  technicalNotes?: string | null
  scheduledFor?: string | null
  startedAt?: string | null
  completedAt?: string | null
}

export interface CalibrationServiceItemProgressPayload {
  serviceId: string
  items: CalibrationServiceItemProgressEntryPayload[]
}

export interface CalibrationServiceCreateCutItemPayload {
  serviceItemId: number
  quantity: number
}

export interface CalibrationServiceCreateCutPayload {
  serviceId: string
  cutType: CalibrationServiceCutType
  notes?: string | null
  releasedAt?: string
  items: CalibrationServiceCreateCutItemPayload[]
}

export interface CalibrationServiceCreateAdjustmentPayload {
  serviceId: string
  serviceItemId?: number | null
  changeType: CalibrationServiceAdjustmentType
  itemName?: string | null
  quotedQuantity?: number
  actualQuantity: number
  description: string
  technicalNotes?: string | null
  requiresCommercialAdjustment?: boolean
  reportedAt?: string
}

export interface CalibrationServiceReviewAdjustmentPayload {
  serviceId: string
  adjustmentId: string
  decision: Extract<CalibrationServiceAdjustmentStatus, 'approved' | 'rejected'>
  commercialNotes?: string | null
  pricingNotes?: string | null
  approvedUnitPrice?: number | null
  approvedTaxRate?: number | null
  approvedTaxTotal?: number | null
  approvedSubtotal?: number | null
  approvedTotal?: number | null
  useQuotedPrice?: boolean
  applyDiscount?: boolean
  reviewedAt?: string
}

export interface CalibrationServiceMarkCutReadyPayload {
  serviceId: string
  cutId: string
  readyForInvoicingAt?: string
}

export interface CalibrationServiceMarkCutInvoicedPayload {
  serviceId: string
  cutId: string
  invoiceReference: string
  invoicedAt?: string
  invoiceNotes?: string | null
}

export interface CalibrationServiceUpdateCutDocumentControlPayload {
  serviceId: string
  cutId: string
  expectedCertificates: number
  uploadedCertificates: number
  reviewedCertificates: number
  sentCertificates: number
  sendChannel?: string | null
  sentTo?: string | null
  sentAt?: string | null
  evidenceDocumentIds?: number[]
  notes?: string | null
}

export interface CalibrationServiceDocumentActionPayload {
  serviceId: string
  documentId?: string
}

export interface CalibrationServiceSequenceConfigPayload {
  nextQuoteNumber: number
  nextOdsNumber: number
}
