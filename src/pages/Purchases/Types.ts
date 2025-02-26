import { PurchaseRequestStatus } from './Enums'

export interface Criterion {
  id: number
  category: string
  name: string
  baseScore: number
  type: 'Juridical' | 'Natural' | 'Both'
  requiresWhich?: boolean
}

export interface SupplierFormData {
  name: string
  taxId: string
  phone: string
  mobile: string
  email: string
  address: string
  city: string
  contactName?: string
  position?: string
  state?: string
  accountType: string
  accountNumber: string
  bankName: string
  product: string
  purchaseType: number
}

export interface FormState {
  supplierData: SupplierFormData
  providerType: 'Juridical' | 'Natural' | 'Both' | ''
  selections: Record<string, number[]>
  scores: Record<string, number>
  totalScore: number

  whichAnswers: Record<string, string>
}

export interface Supplier {
  id: number
  name: string
  taxId: string
  phone: string
  mobile: string
  email: string
  address: string
  city: string
  state: string | null
  contactName: string | null
  position: string | null
  accountType: string
  accountNumber: string
  bankName: string
  typePerson: number
  createdAt: string
  updatedAt: string
}

export interface SelectionSupplier {
  id: number
  supplierId: number
  selectionSupplierDate: string
  finalDecision:
    | 'NOT APPROVED'
    | 'APPROVED'
    | 'APPROVED WITH RESERVE'
    | 'EXCELLENT'
  product: string | null
  createdAt: string
  updatedAt: string
  supplier: Supplier
}

export interface PurchaseRequestItem {
  id: number
  quantity: number
  description: string
  motive: string
  supplierIds: number[]
  purchaseRequestId: number
  createdAt: Date
  updatedAt: Date
  suppliers?: Supplier[]
  procesed?: boolean

  // // Relaciones (opcionales para nested loading)
  // suggestedProvider?: Provider;
  // purchaseRequest?: PurchaseRequest;
}

export interface Approver {
  id: number
  nombre: string
  email: string
}

export interface PurchaseRequest {
  id: number
  elaborationDate: Date
  applicantName: string
  applicantPosition: string
  purchaseCode: string
  requirements: string[]
  status: PurchaseRequestStatus
  rejectionReason?: string // Opcional cuando no está rechazada
  approvalDate?: Date
  approver?: Approver
  preApproved?: boolean
  approved?: boolean
  createdAt: Date
  updatedAt: Date

  // Relación (opcional para nested loading)
  items?: PurchaseRequestItem[]
}

export interface PurchaseOrder {
  code: string
  requestDate: string
  deliveryDate: string
  deliveryPlace: string
  paymentMethod: string
  installments: string
  freight: string
  observations: string
  totalBeforeVAT: number
  requirements: string[]
  vat: number
  retefuente: number
  retecree: number
  discount: number
  total: number
  purchaseRequestId: number
  purchaseRequest: PurchaseRequest
}

interface PurchaseOrderItem {
  id: number
  purchaseRequestItem: {
    description: string
    quantity: number
  }
}

export interface PurchaseOrderData extends PurchaseOrder {
  id: number
  supplier: Supplier
  items: PurchaseOrderItem[]
}

export interface PurchaseVerification {
  id: number
  receivedDate: string
  invoiceNumber: string
  observations: string
  techicalVerification: string
  purchaseOrderId: number
  purchaseRequestId: number
  createdAt: string
  updatedAt: string
  purchaseOrder: PurchaseOrder
  items: PurchaseVerificationItem[]
}

export interface PurchaseVerificationItem {
  id?: number
  purchaseVerificationId?: number
  purchaseOrderItemId: number
  sensorialInspection: string
  technicalVerification: string
  devliveryTime: string
  quality: string
  meetsRequirements: boolean
  orderItem: PurchaseOrderItem
}
