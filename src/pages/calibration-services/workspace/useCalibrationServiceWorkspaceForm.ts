import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from 'react-query'
import { CALIBRATION_SERVICE_QUERY_KEYS } from '../../../hooks/useCalibrationServices'
import {
  CalibrationServiceCustomer,
  CalibrationServiceCustomerSite,
  CalibrationServiceProductSummary,
  CalibrationServiceQuoteTerms
} from '../../../types/calibrationService'
import {
  CalibrationQuoteTermKey,
  mergeCalibrationQuoteTerms
} from '../calibrationQuoteTerms'
import { SUGGESTED_CATALOG_PRICE_SOURCE } from './calibrationServiceWorkspaceConstants'
import {
  CatalogPickedItem,
  CatalogPriceSource,
  FormItem,
  FormState
} from './calibrationServiceWorkspaceTypes'
import {
  createEmptyItem,
  createInitialFormState,
  createLocalId,
  getCatalogPriceValue,
  getCustomerSiteOptions,
  mapServiceToFormState,
  stripHtml
} from './calibrationServiceWorkspaceUtils'
import { CalibrationServiceWorkspaceData } from './useCalibrationServiceWorkspaceData'

/**
 * Estado editable del formulario de cotización: se hidrata desde el servicio (edición)
 * o desde la plantilla de términos (nuevo), y expone los manejadores de campos e ítems.
 */
const useCalibrationServiceWorkspaceForm = (data: CalibrationServiceWorkspaceData) => {
  const { service, isEditing, quoteTermsTemplate, isTemplateFresh, customerOptions } = data
  const queryClient = useQueryClient()
  const [formState, setFormState] = useState<FormState>(() => {
    const cached = queryClient.getQueryData<{ terms: CalibrationServiceQuoteTerms }>(
      [CALIBRATION_SERVICE_QUERY_KEYS.all, 'quote-terms-template']
    )
    if (cached?.terms) {
      return {
        ...createInitialFormState(),
        quoteTerms: mergeCalibrationQuoteTerms(cached.terms),
        commercialComments: stripHtml(cached.terms.commercialComments) || ''
      }
    }
    return createInitialFormState()
  })
  const [requestEvidenceFile, setRequestEvidenceFile] = useState<File | null>(null)
  const [requestEvidenceTitle, setRequestEvidenceTitle] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const templateHydratedRef = useRef(false)
  const [useDifferentExecutionCustomer, setUseDifferentExecutionCustomer] =
    useState(false)

  useEffect(() => {
    if (!service || hydrated) return
    const hasDifferentExecutionCustomer = Boolean(service.executionCustomerName)
    setFormState(mapServiceToFormState(service))
    setRequestEvidenceTitle(`Evidencia de solicitud ${service.serviceCode}`)
    setUseDifferentExecutionCustomer(hasDifferentExecutionCustomer)
    setHydrated(true)
  }, [hydrated, service])

  useEffect(() => {
    // Solo la respuesta pedida en este montaje: el caché puede traer una plantilla vieja
    if (isEditing || templateHydratedRef.current || !isTemplateFresh || !quoteTermsTemplate?.terms) return

    templateHydratedRef.current = true
    setFormState((previous) => ({
      ...previous,
      quoteTerms: mergeCalibrationQuoteTerms(quoteTermsTemplate.terms),
      commercialComments:
        stripHtml(quoteTermsTemplate.terms.commercialComments) ||
        previous.commercialComments
    }))
  }, [isEditing, isTemplateFresh, quoteTermsTemplate?.terms])

  const selectedCustomer =
    customerOptions.find((customer) => customer.id === formState.customerId) || null
  const customerSites = getCustomerSiteOptions(selectedCustomer)

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((previous) => ({ ...previous, [field]: value }))
  }

  const setQuoteTerm = (field: CalibrationQuoteTermKey, value: string) => {
    setFormState((previous) => ({
      ...previous,
      commercialComments:
        field === 'commercialComments'
          ? stripHtml(value)
          : previous.commercialComments,
      quoteTerms: {
        ...(previous.quoteTerms || mergeCalibrationQuoteTerms()),
        [field]: value
      } as CalibrationServiceQuoteTerms
    }))
  }

  const setItemField = (localId: string, field: keyof FormItem, value: string | number | null) => {
    setFormState((previous) => ({
      ...previous,
      items: previous.items.map((item) =>
        item.localId === localId ? { ...item, [field]: value } : item
      )
    }))
  }

  const setItemOtherField = (localId: string, field: string, value: unknown) => {
    setFormState((previous) => ({
      ...previous,
      items: previous.items.map((item) =>
        item.localId === localId
          ? {
              ...item,
              otherFields: {
                ...(item.otherFields || {}),
                [field]: value
              }
            }
          : item
      )
    }))
  }

  const handleAddItemsFromCatalog = (
    pickedItems: CatalogPickedItem[],
    quantity: number
  ) => {
    setFormState((previous) => ({
      ...previous,
      items: [
        ...previous.items,
        ...pickedItems.map((picked, index) => ({
          localId: createLocalId(),
          productId: picked.productId,
          itemName: picked.itemName,
          instrumentName: picked.itemName,
          intervalText: picked.intervalText || '',
          quantity,
          serviceType: picked.serviceType,
          unitPrice: picked.unitPrice,
          taxRate: 19,
          subtotal: quantity * picked.unitPrice,
          taxTotal: quantity * picked.unitPrice * 0.19,
          total: quantity * picked.unitPrice * 1.19,
          notes: '',
          sortOrder: previous.items.length + index,
          otherFields: {
            catalogPriceSource: picked.catalogPriceSource || SUGGESTED_CATALOG_PRICE_SOURCE,
            hasCalibrationPoints: false
          }
        }))
      ]
    }))
  }

  const handleRemoveItem = (localId: string) => {
    setFormState((previous) => ({
      ...previous,
      items:
        previous.items.length === 1
          ? [createEmptyItem()]
          : previous.items.filter((candidate) => candidate.localId !== localId)
    }))
  }

  const handleSelectProduct = (
    localId: string,
    product: CalibrationServiceProductSummary | null
  ) => {
    const catalogPriceSource = SUGGESTED_CATALOG_PRICE_SOURCE
    const selectedUnitPrice = getCatalogPriceValue(product, catalogPriceSource)
    const firstVariantServiceType = product?.variants?.[0]?.serviceType || null

    setFormState((previous) => ({
      ...previous,
      items: previous.items.map((candidate) =>
        candidate.localId === localId
          ? {
              ...candidate,
              productId: product?.id ?? null,
              itemName: product?.name || candidate.itemName,
              instrumentName: product?.name || candidate.instrumentName,
              intervalText: product?.intervalText || candidate.intervalText,
              serviceType: firstVariantServiceType || candidate.serviceType,
              unitPrice:
                selectedUnitPrice ?? candidate.unitPrice,
              otherFields: {
                ...(candidate.otherFields || {}),
                catalogPriceSource
              }
            }
          : candidate
      )
    }))
  }

  const handleSelectCatalogPrice = (
    localId: string,
    product: CalibrationServiceProductSummary | null,
    priceSource: CatalogPriceSource
  ) => {
    const nextUnitPrice = getCatalogPriceValue(product, priceSource)

    setFormState((previous) => ({
      ...previous,
      items: previous.items.map((candidate) =>
        candidate.localId === localId
          ? {
              ...candidate,
              unitPrice:
                nextUnitPrice !== null && nextUnitPrice !== undefined
                  ? nextUnitPrice
                  : candidate.unitPrice,
              otherFields: {
                ...(candidate.otherFields || {}),
                catalogPriceSource: priceSource
              }
            }
          : candidate
      )
    }))
  }

  const handleCustomerChange = (customer: CalibrationServiceCustomer | null) => {
    const firstSite = getCustomerSiteOptions(customer)[0]

    setFormState((previous) => ({
      ...previous,
      customerId: customer?.id ?? null,
      customerSite:
        previous.scopeType === 'site'
          ? firstSite?.name || previous.customerSite
          : previous.customerSite,
      contactEmail: firstSite?.contactEmail || customer?.email || previous.contactEmail || '',
      contactPhone: firstSite?.contactPhone || customer?.telefono || previous.contactPhone || '',
      city: firstSite?.city || customer?.ciudad || previous.city || '',
      department: firstSite?.department || customer?.departamento || previous.department || '',
      address: firstSite?.address || customer?.direccion || previous.address || ''
    }))
  }

  const handleCustomerSiteChange = (site: CalibrationServiceCustomerSite | null) => {
    setFormState((previous) => ({
      ...previous,
      customerSite: site?.name || '',
      contactName: site?.contactName || previous.contactName || '',
      contactEmail: site?.contactEmail || previous.contactEmail || selectedCustomer?.email || '',
      contactPhone: site?.contactPhone || previous.contactPhone || selectedCustomer?.telefono || '',
      city: site?.city || previous.city || selectedCustomer?.ciudad || '',
      department: site?.department || previous.department || selectedCustomer?.departamento || '',
      address: site?.address || previous.address || selectedCustomer?.direccion || ''
    }))
  }

  const handleDifferentExecutionCustomerToggle = (checked: boolean) => {
    setUseDifferentExecutionCustomer(checked)

    if (!checked) {
      setFormState((previous) => ({
        ...previous,
        executionCustomerName: '',
        executionSiteName: ''
      }))
    }
  }

  return {
    formState,
    requestEvidenceFile,
    setRequestEvidenceFile,
    requestEvidenceTitle,
    setRequestEvidenceTitle,
    useDifferentExecutionCustomer,
    selectedCustomer,
    customerSites,
    setField,
    setQuoteTerm,
    setItemField,
    setItemOtherField,
    handleAddItemsFromCatalog,
    handleRemoveItem,
    handleSelectProduct,
    handleSelectCatalogPrice,
    handleCustomerChange,
    handleCustomerSiteChange,
    handleDifferentExecutionCustomerToggle
  }
}

export type CalibrationServiceWorkspaceForm = ReturnType<
  typeof useCalibrationServiceWorkspaceForm
>

export default useCalibrationServiceWorkspaceForm
