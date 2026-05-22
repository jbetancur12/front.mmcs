export type EquipmentQuotationStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'rejected'
  | 'invoiced'
  | 'cancelled'

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
