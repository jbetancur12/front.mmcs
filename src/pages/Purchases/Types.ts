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
  supplierId: number
  purchaseRequestId: number
  createdAt: Date
  updatedAt: Date

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
  requirements: string[]
  status: PurchaseRequestStatus
  rejectionReason?: string // Opcional cuando no está rechazada
  approvalDate?: Date
  approver?: Approver
  createdAt: Date
  updatedAt: Date

  // Relación (opcional para nested loading)
  items?: PurchaseRequestItem[]
}
