import {
  CalibrationService,
  CalibrationServiceCustomer,
  CalibrationServiceCustomerSite,
  CalibrationServiceItemPayload,
  CalibrationServicePayload,
  CalibrationServiceProductSummary
} from '../../../types/calibrationService'
import { mergeCalibrationQuoteTerms } from '../calibrationQuoteTerms'
import {
  CatalogPriceSource,
  FormItem,
  FormState
} from './calibrationServiceWorkspaceTypes'

export const createLocalId = () =>
  `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

export const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return 0
  const parsed = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(parsed) ? parsed : 0
}

export const stripHtml = (value?: string | null) =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const getQueryErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error && error.message) {
    return `${fallbackMessage} ${error.message}`
  }

  return fallbackMessage
}

export const createEmptyItem = (): FormItem => ({
  localId: createLocalId(),
  productId: null,
  itemName: '',
  instrumentName: '',
  intervalText: '',
  quantity: 1,
  serviceType: 'Trazable',
  unitPrice: 0,
  taxRate: 19,
  subtotal: 0,
  taxTotal: 0,
  total: 0,
  notes: '',
  sortOrder: 0,
  otherFields: {
    catalogPriceSource: 'medicalPrice',
    hasCalibrationPoints: false
  }
})

export const createInitialFormState = (): FormState => ({
  customerId: null,
  scopeType: 'general',
  customerSite: '',
  executionCustomerName: '',
  executionSiteName: '',
  requestChannel: '',
  approvalChannel: '',
  approvalReference: '',
  validityDays: 30,
  hasDiscount: false,
  discountType: 'fixed',
  discountValue: 0,
  paymentMethod: '',
  instrumentDeliveryTime: '',
  certificateDeliveryTime: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  city: '',
  department: '',
  address: '',
  commercialComments: '',
  quoteTerms: mergeCalibrationQuoteTerms(),
  internalNotes: '',
  otherFields: {},
  items: []
})

export const getItemTotals = (item: CalibrationServiceItemPayload) => {
  const subtotal = Math.max(Number(item.quantity) || 0, 0) * toNumber(item.unitPrice)
  const taxTotal = subtotal * (toNumber(item.taxRate) / 100)
  return { subtotal, taxTotal, total: subtotal + taxTotal }
}

export const getCatalogPriceValue = (
  product: CalibrationServiceProductSummary | null,
  priceSource: CatalogPriceSource
) => {
  if (!product) return null

  const firstVariant = product.variants?.[0]
  if (!firstVariant) return null

  const val = firstVariant[priceSource]
  return val !== null && val !== undefined ? Number(val) : null
}

export const getCustomerSiteOptions = (
  customer: CalibrationServiceCustomer | null
): CalibrationServiceCustomerSite[] => {
  if (!customer) return []

  if (customer.sites?.length) {
    return customer.sites.filter((site) => site.isActive !== false)
  }

  return (customer.sede || []).map((siteName) => ({
    name: siteName,
    address: customer.direccion || '',
    city: customer.ciudad || '',
    department: customer.departamento || '',
    country: 'Colombia',
    contactEmail: customer.email || '',
    contactPhone: customer.telefono || '',
    isActive: true
  }))
}

export const getSiteDisplayLabel = (site: CalibrationServiceCustomerSite) =>
  [site.name, site.city, site.department].filter(Boolean).join(' · ')

export const buildPayload = (formState: FormState, status: 'draft' | 'pending_approval'): CalibrationServicePayload => ({
  customerId: formState.customerId ?? null,
  scopeType: formState.scopeType ?? 'general',
  customerSite: formState.customerSite?.trim() || null,
  executionCustomerName: formState.executionCustomerName?.trim() || null,
  executionSiteName: formState.executionSiteName?.trim() || null,
  requestChannel: formState.requestChannel?.trim() || null,
  approvalChannel: formState.approvalChannel?.trim() || null,
  approvalReference: formState.approvalReference?.trim() || null,
  validityDays: formState.validityDays ? Number(formState.validityDays) : null,
  hasDiscount: Boolean(formState.hasDiscount),
  discountType: formState.hasDiscount ? formState.discountType || 'fixed' : null,
  discountValue: formState.hasDiscount ? toNumber(formState.discountValue) : 0,
  paymentMethod: formState.paymentMethod?.trim() || null,
  instrumentDeliveryTime: formState.instrumentDeliveryTime?.trim() || null,
  certificateDeliveryTime: formState.certificateDeliveryTime?.trim() || null,
  contactName: formState.contactName?.trim() || null,
  contactEmail: formState.contactEmail?.trim() || null,
  contactPhone: formState.contactPhone?.trim() || null,
  city: formState.city?.trim() || null,
  department: formState.department?.trim() || null,
  address: formState.address?.trim() || null,
  commercialComments:
    stripHtml(formState.quoteTerms?.commercialComments) ||
    formState.commercialComments?.trim() ||
    null,
  quoteTerms: formState.quoteTerms || null,
  internalNotes: formState.internalNotes?.trim() || null,
  status,
  otherFields: formState.otherFields || {},
  items: formState.items
    .filter((item) => item.itemName.trim() || item.instrumentName?.trim())
    .map((item, index) => {
      const totals = getItemTotals(item)
      return {
        productId: item.productId ?? null,
        itemName: item.itemName.trim() || item.instrumentName?.trim() || '',
        instrumentName: item.instrumentName?.trim() || null,
        intervalText: item.intervalText?.trim() || null,
        quantity: Number(item.quantity) || 1,
        serviceType: item.serviceType?.trim() || null,
        unitPrice: toNumber(item.unitPrice),
        taxRate: toNumber(item.taxRate),
        subtotal: totals.subtotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        notes: item.notes?.trim() || null,
        sortOrder: index,
        otherFields: item.otherFields || {}
      }
    })
})

/** Estado del formulario a partir de un servicio guardado (edición). */
export const mapServiceToFormState = (service: CalibrationService): FormState => ({
  customerId: service.customerId ?? null,
  scopeType: service.scopeType ?? 'general',
  customerSite: service.customerSite || '',
  executionCustomerName: service.executionCustomerName || '',
  executionSiteName: service.executionSiteName || '',
  requestChannel: service.requestChannel || '',
  approvalChannel: service.approvalChannel || '',
  approvalReference: service.approvalReference || '',
  validityDays: service.validityDays || 30,
  hasDiscount: service.hasDiscount,
  discountType: service.discountType || 'fixed',
  discountValue: toNumber(service.discountValue),
  paymentMethod: service.paymentMethod || '',
  instrumentDeliveryTime: service.instrumentDeliveryTime || '',
  certificateDeliveryTime: service.certificateDeliveryTime || '',
  contactName: service.contactName || '',
  contactEmail: service.contactEmail || '',
  contactPhone: service.contactPhone || '',
  city: service.city || '',
  department: service.department || '',
  address: service.address || '',
  commercialComments: service.commercialComments || '',
  quoteTerms: mergeCalibrationQuoteTerms({
    commercialComments:
      service.quoteTerms?.commercialComments ||
      (service.commercialComments
        ? `<p>${service.commercialComments}</p>`
        : undefined),
    ...(service.quoteTerms || {})
  }),
  internalNotes: service.internalNotes || '',
  otherFields: service.otherFields || {},
  items: service.items?.map((item, index) => ({
    localId: String(item.id ?? createLocalId()),
    productId: item.productId ?? null,
    itemName: item.itemName,
    instrumentName: item.instrumentName || '',
    intervalText: item.intervalText || '',
    quantity: item.quantity,
    serviceType: item.serviceType || 'Trazable',
    unitPrice: toNumber(item.unitPrice),
    taxRate: toNumber(item.taxRate),
    subtotal: toNumber(item.subtotal),
    taxTotal: toNumber(item.taxTotal),
    total: toNumber(item.total),
    notes: item.notes || '',
    sortOrder: item.sortOrder ?? index,
    otherFields: {
      catalogPriceSource:
        typeof item.otherFields?.catalogPriceSource === 'string' &&
        ['medicalPrice', 'industrialPrice', 'thirdPartyPrice'].includes(item.otherFields.catalogPriceSource)
          ? item.otherFields.catalogPriceSource
          : 'medicalPrice',
      ...(item.otherFields || {})
    }
  })) || [createEmptyItem()]
})
