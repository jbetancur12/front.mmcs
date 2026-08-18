export type EquipmentQuotationStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'ready_for_invoicing'
  | 'rejected'
  | 'invoiced'
  | 'cancelled'

export type EquipmentQuotationCustomerResponseType =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | null

export type EquipmentQuotationDocumentType =
  | 'request_evidence'
  | 'approval_evidence'
  | 'rejection_evidence'
  | 'quote_pdf'
  | 'supporting_attachment'

export interface EquipmentQuotationDocument {
  id: number
  quotationId: number
  uploadedByUserId: number | null
  documentType: EquipmentQuotationDocumentType
  title: string | null
  originalFileName: string
  storedFileName: string
  fileMimeType: string | null
  fileSize: number | null
  version: number
  generatedBySystem: boolean
  notes: string | null
  uploadedAt: string
  otherFields: Record<string, unknown>
  uploadedBy: { id: number; nombre: string; email: string } | null
}

export interface EquipmentQuotationSequenceConfig {
  initialized: boolean
  quotePrefix: string
  nextQuoteNumber: number | null
  quotePreview: string | null
  initializedAt: string | null
  initializedByName: string | null
  updatedAt: string | null
  updatedByName: string | null
}

export interface EquipmentCustomerSite {
  id?: number
  customerId?: number
  name: string
  address?: string
  city?: string
  department?: string
  country?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
  isActive?: boolean
}

export interface EquipmentCustomerOption {
  id: number
  nombre: string
  identificacion: string
  email?: string
  telefono?: string
  ciudad?: string
  departamento?: string
  direccion?: string
  sede?: string[]
  sites?: EquipmentCustomerSite[]
}

export interface EquipmentProduct {
  id: number
  name: string
  description: string | null
  category: string | null
  defaultBrand: string | null
  defaultModel: string | null
  defaultPrice: number | null
  taxRate: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EquipmentProductPayload {
  name: string
  description?: string | null
  category?: string | null
  defaultBrand?: string | null
  defaultModel?: string | null
  defaultPrice?: number | null
  taxRate?: number | null
}

export interface EquipmentQuotationItemPayload {
  productId: number | null
  itemName: string
  brand: string | null
  model: string | null
  characteristics: string | null
  quantity: number
  unitPrice: number
  taxRate: number
  subtotal: number
  taxTotal: number
  total: number
  warrantyMonths: number | null
  deliveryTime: string | null
  notes: string | null
  sortOrder: number
  otherFields?: Record<string, unknown>
}

export interface EquipmentQuotationPayload {
  customerId: number | null
  customerSite: string | null
  requestChannel: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  city: string | null
  department: string | null
  address: string | null
  validityDays: number | null
  paymentMethod: string | null
  deliveryTime: string | null
  warrantyTerms: string | null
  hasDiscount: boolean
  discountType: string | null
  discountValue: number
  commercialComments: string | null
  internalNotes: string | null
  quoteTerms: Record<string, unknown> | null
  status: EquipmentQuotationStatus
  otherFields?: Record<string, unknown>
  items: EquipmentQuotationItemPayload[]
}

export interface EquipmentQuotationItem extends EquipmentQuotationItemPayload {
  id: number
  quotationId: number
  product: EquipmentProduct | null
  createdAt: string
  updatedAt: string
}

export interface EquipmentQuotationCustomer {
  id: number
  nombre: string
  identificacion: string
  email: string | null
  telefono: string | null
  direccion: string | null
  ciudad: string | null
  departamento: string | null
}

export interface EquipmentQuotation {
  id: number
  quoteCode: string
  status: EquipmentQuotationStatus
  customerId: number | null
  customerSite: string | null
  requestChannel: string | null
  approvalChannel: string | null
  approvalReference: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  city: string | null
  department: string | null
  address: string | null
  validityDays: number | null
  paymentMethod: string | null
  deliveryTime: string | null
  warrantyTerms: string | null
  hasDiscount: boolean
  discountType: string | null
  discountValue: number
  subtotal: number
  taxTotal: number
  discountTotal: number
  grandTotal: number
  commercialComments: string | null
  internalNotes: string | null
  quoteTerms: Record<string, unknown>
  createdByUserId: number | null
  sentAt: string | null
  acceptedAt: string | null
  rejectedAt: string | null
  rejectedReason: string | null
  invoicedAt: string | null
  cancelledAt: string | null
  cancelledReason: string | null
  otherFields: Record<string, unknown>
  items: EquipmentQuotationItem[]
  customer: EquipmentQuotationCustomer | null
  createdBy: { id: number; nombre: string; email: string } | null
  createdAt: string
  updatedAt: string
}

export interface EquipmentQuotationListResponse {
  data: EquipmentQuotation[]
  total: number
  page: number
  limit: number
}

export interface EquipmentProductListResponse {
  data: EquipmentProduct[]
  total: number
  page: number
  limit: number
}
