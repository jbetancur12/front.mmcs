// utils/formUtils.ts
import { PurchaseRequest as IPurchaseRequest } from 'src/pages/Purchases/Types'
import { PurchaseRequestStatus } from 'src/pages/Purchases/Enums'
import { CurrentPurchaseRequestItem } from '../types/PurchaseRequestTypes'

export const createDefaultFormData = (): Partial<IPurchaseRequest> => ({
  status: PurchaseRequestStatus.Pending,
  requirements: [],
  items: [],
  elaborationDate: new Date(new Date().getTime() - 5 * 60 * 60 * 1000),
  purchaseType: 'I'
})

export const createDefaultCurrentItem = (): CurrentPurchaseRequestItem => ({
  quantity: 1,
  description: '',
  supplierIds: [],
  supplierInput: []
})

export const formatDateForInput = (date: Date | string | undefined): string => {
  if (!date) return ''
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toISOString().split('T')[0]
}

export const createPayloadFromFormData = (
  formData: Partial<IPurchaseRequest>
) => ({
  ...formData,
  items: formData.items?.map((item) => ({
    ...item,
    quantity: Number(item.quantity),
    supplierIds: item.supplierIds || []
  }))
})

export const validateFormData = (
  formData: Partial<IPurchaseRequest>
): string | null => {
  if (!formData.elaborationDate) {
    return 'La fecha de elaboración es obligatoria'
  }

  if (!formData.applicantName) {
    return 'El nombre del solicitante es obligatorio'
  }

  if (!formData.applicantPosition) {
    return 'El cargo del solicitante es obligatorio'
  }

  if (!formData.items || formData.items.length === 0) {
    return 'Debe agregar al menos un ítem'
  }

  return null
}
