// types/PurchaseRequestTypes.ts
import {
  PurchaseRequest as IPurchaseRequest,
  PurchaseRequestItem,
  Supplier
} from 'src/pages/Purchases/Types'

export interface RequesterUser {
  id: number | string
  name: string
  position: string
}

export interface SuppliersAPIResponse {
  totalItems: number
  suppliers: Supplier[]
  totalPages: number
  currentPage: number
}

export interface CurrentPurchaseRequestItem
  extends Partial<PurchaseRequestItem> {
  supplierInput?: Supplier[]
}

export interface PurchaseRequestModalProps {
  open: boolean
  onClose: () => void
  onSuccess: (request: IPurchaseRequest) => void
  existingRequest?: IPurchaseRequest | null
}

export interface RequirementsSectionProps {
  formData: Partial<IPurchaseRequest>
  setFormData: React.Dispatch<React.SetStateAction<Partial<IPurchaseRequest>>>
  requirementType: string
  setRequirementType: React.Dispatch<React.SetStateAction<string>>
  newRequirement: string
  setNewRequirement: React.Dispatch<React.SetStateAction<string>>
  editingRequirementIndex: number | null
  setEditingRequirementIndex: React.Dispatch<
    React.SetStateAction<number | null>
  >
  editingRequirementValue: string
  setEditingRequirementValue: React.Dispatch<React.SetStateAction<string>>
}

export interface ItemsSectionProps {
  formData: Partial<IPurchaseRequest>
  setFormData: React.Dispatch<React.SetStateAction<Partial<IPurchaseRequest>>>
  currentItem: CurrentPurchaseRequestItem
  setCurrentItem: React.Dispatch<
    React.SetStateAction<CurrentPurchaseRequestItem>
  >
}

export interface RequesterSectionProps {
  selectedRequester: RequesterUser | null
  setSelectedRequester: React.Dispatch<
    React.SetStateAction<RequesterUser | null>
  >
  requesterOptions: RequesterUser[]
  loadingRequesters: boolean
  formData: Partial<IPurchaseRequest>
  setFormData: React.Dispatch<React.SetStateAction<Partial<IPurchaseRequest>>>
  existingRequest?: IPurchaseRequest | null
}
