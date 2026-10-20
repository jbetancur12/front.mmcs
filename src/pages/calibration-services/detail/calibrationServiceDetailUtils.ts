import {
  CalibrationService,
  CalibrationServiceCustomerResponseType,
  CalibrationServiceSendPreviewResult
} from '../../../types/calibrationService'

export type DetailTab =
  | 'summary'
  | 'items'
  | 'operations'
  | 'adjustments'
  | 'cuts'
  | 'documents'
  | 'logistics'
  | 'guide'
  | 'history'

export const detailTabs: readonly DetailTab[] = [
  'summary',
  'items',
  'operations',
  'adjustments',
  'cuts',
  'documents',
  'logistics',
  'guide',
  'history'
]

export const getStoredDetailTab = (serviceId?: string): DetailTab => {
  if (!serviceId || typeof window === 'undefined') {
    return 'summary'
  }

  const storedTab = window.sessionStorage.getItem(
    `calibration-service-detail-tab:${serviceId}`
  )

  return detailTabs.includes(storedTab as DetailTab)
    ? (storedTab as DetailTab)
    : 'summary'
}

export const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

export const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined) {
    return 0
  }

  const parsed = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(parsed) ? parsed : 0
}

export const getApprovedQuantityDeltaForItem = (
  service: CalibrationService,
  serviceItemId: number
) =>
  (service.adjustments || []).reduce((accumulator, adjustment) => {
    if (adjustment.serviceItemId !== serviceItemId) {
      return accumulator
    }

    if (!['approved', 'applied_to_cut'].includes(adjustment.status)) {
      return accumulator
    }

    if (adjustment.changeType === 'extra_item') {
      return accumulator
    }

    return accumulator + toNumber(adjustment.differenceQuantity)
  }, 0)

export const getEffectiveServiceItemQuantity = (
  service: CalibrationService,
  item: NonNullable<CalibrationService['items']>[number]
) =>
  Math.max(
    toNumber(item.quantity) + getApprovedQuantityDeltaForItem(service, item.id),
    0
  )

export const getApprovedFinancialImpactForItem = (
  service: CalibrationService,
  serviceItemId: number
) =>
  (service.adjustments || []).reduce(
    (accumulator, adjustment) => {
      if (adjustment.serviceItemId !== serviceItemId) {
        return accumulator
      }

      if (!['approved', 'applied_to_cut'].includes(adjustment.status)) {
        return accumulator
      }

      if (adjustment.changeType === 'extra_item') {
        return accumulator
      }

      const taxTotalFromOtherFields =
        adjustment.approvedTaxTotal ??
        (adjustment.otherFields &&
        typeof adjustment.otherFields.approvedTaxTotal === 'number'
          ? adjustment.otherFields.approvedTaxTotal
          : adjustment.otherFields &&
              typeof adjustment.otherFields.approvedTaxTotal === 'string'
            ? adjustment.otherFields.approvedTaxTotal
            : 0)

      return {
        subtotal: accumulator.subtotal + toNumber(adjustment.approvedSubtotal),
        taxTotal: accumulator.taxTotal + toNumber(taxTotalFromOtherFields),
        total: accumulator.total + toNumber(adjustment.approvedTotal),
        hasImpact: true
      }
    },
    { subtotal: 0, taxTotal: 0, total: 0, hasImpact: false }
  )

export const getApprovedPricingAdjustmentsForItem = (
  service: CalibrationService,
  serviceItemId: number
) =>
  (service.adjustments || []).filter(
    (adjustment) =>
      adjustment.serviceItemId === serviceItemId &&
      ['approved', 'applied_to_cut'].includes(adjustment.status) &&
      adjustment.changeType !== 'extra_item'
  )

export const getOtherFieldText = (
  otherFields: Record<string, unknown> | undefined,
  fieldName: string
) => {
  const fieldValue = otherFields?.[fieldName]
  return typeof fieldValue === 'string' ? fieldValue : ''
}

export const getOtherFieldRecord = (
  otherFields: Record<string, unknown> | undefined,
  fieldName: string
) => {
  const fieldValue = otherFields?.[fieldName]
  return fieldValue &&
    typeof fieldValue === 'object' &&
    !Array.isArray(fieldValue)
    ? (fieldValue as Record<string, unknown>)
    : undefined
}

export const getEmailSendPreview = (
  contactEmail?: string | null,
  customerEmail?: string | null
): CalibrationServiceSendPreviewResult | null => {
  const envOverride = import.meta.env.VITE_DEV_EMAIL_OVERRIDE
  const intendedRecipient = contactEmail || customerEmail || null

  // El backend solo redirige el correo en desarrollo; en producción no hay override.
  if (!envOverride || !import.meta.env.DEV) {
    return {
      intendedRecipient,
      actualRecipient: intendedRecipient,
      isDevOverride: false
    }
  }

  return {
    intendedRecipient,
    actualRecipient: envOverride,
    isDevOverride: true
  }
}

export const formatDateValue = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('es-CO') : 'Sin registrar'

export const buildTodayValue = () => new Date().toISOString().slice(0, 10)

export const getCustomerResponseType = (
  otherFields: Record<string, unknown> | undefined
) => {
  const value = otherFields?.customerResponseType
  return typeof value === 'string'
    ? (value as CalibrationServiceCustomerResponseType)
    : null
}

export const getLatestChangeRequest = (
  otherFields: Record<string, unknown> | undefined
) => {
  const value = otherFields?.latestChangeRequest
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export const getOperationsDetails = (
  otherFields: Record<string, unknown> | undefined
) => {
  const value = otherFields?.operations
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export const getLogisticsDetails = (
  otherFields: Record<string, unknown> | undefined
) => {
  const value = otherFields?.logistics
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined
}

export const primaryActionSx = {
  borderRadius: 2,
  textTransform: 'none',
  fontWeight: 600,
  bgcolor: '#00BFA5',
  '&:hover': { bgcolor: '#00ACC1' },
  '&.Mui-disabled': { bgcolor: '#e5e7eb', color: '#9ca3af' }
} as const
export const secondaryActionSx = {
  borderRadius: 2,
  textTransform: 'none',
  fontWeight: 600,
  color: '#00897B',
  borderColor: '#00BFA5',
  '&:hover': { borderColor: '#00897B', bgcolor: '#E0F7F4' }
} as const
export const cautionActionSx = {
  borderRadius: 2,
  textTransform: 'none',
  fontWeight: 600
} as const
