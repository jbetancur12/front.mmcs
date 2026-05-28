import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  Alert,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  FormControl,
  Grid,
  InputLabel,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined'
import RequestQuoteOutlinedIcon from '@mui/icons-material/RequestQuoteOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import { Toaster, toast } from 'react-hot-toast'
import { axiosPrivate } from '@utils/api'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CALIBRATION_SERVICE_EDIT_ROLES,
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS,
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS
} from '../../constants/calibrationServices'
import {
  useCalibrationServiceSequenceConfig,
  useCalibrationService,
  useCalibrationServiceQuoteTermsTemplate,
  useCalibrationServiceMutations
} from '../../hooks/useCalibrationServices'
import {
  CalibrationServiceCustomer,
  CalibrationServiceCustomerSite,
  CalibrationServiceItemPayload,
  CalibrationServicePayload,
  CalibrationServiceQuoteTerms,
  CalibrationServiceProductSummary
} from '../../types/calibrationService'
import { useHasRole } from '../../utils/functions'
import CalibrationServiceItemsEditor from './CalibrationServiceItemsEditor'
import CatalogProductPickerDialog from './CatalogProductPickerDialog'
import CalibrationServiceSequenceConfigDialog from './CalibrationServiceSequenceConfigDialog'
import CalibrationServiceCustomerDialog, {
  CalibrationServiceCustomerDialogValues
} from './CalibrationServiceCustomerDialog'
import CalibrationServiceRichTextEditor from './CalibrationServiceRichTextEditor'
import {
  CALIBRATION_QUOTE_TERM_KEYS,
  CALIBRATION_QUOTE_TERM_LABELS,
  CalibrationQuoteTermKey,
  mergeCalibrationQuoteTerms
} from './calibrationQuoteTerms'
import { NumericFormatCustom } from '../../Components/NumericFormatCustom'

type FormItem = CalibrationServiceItemPayload & { localId: string }
type FormState = Omit<CalibrationServicePayload, 'items'> & { items: FormItem[] }

const REQUEST_CHANNEL_OPTIONS = ['En persona', 'Por Email', 'Por Telefono', 'Por WhatsApp']
const PAYMENT_METHOD_OPTIONS = ['De Contado', 'A 30 Dias', 'A 60 Dias', 'A 90 Dias', '50% / 50%']
const DELIVERY_TIME_OPTIONS = ['8 Dias Habiles', '15 Dias Habiles', '30 Dias Habiles']
const VALIDITY_DAY_OPTIONS = [8, 15, 30, 60, 90]
const SERVICE_TYPE_OPTIONS = ['Acreditado', 'Trazable', 'Subcontratado ONAC', 'Especial']
const CATALOG_PRICE_SOURCE_OPTIONS = [
  { value: 'medicalPrice', label: 'Valor médica' },
  { value: 'industrialPrice', label: 'Valor industrial' },
  { value: 'thirdPartyPrice', label: 'Valor subcontratados' }
] as const

type CatalogPriceSource = (typeof CATALOG_PRICE_SOURCE_OPTIONS)[number]['value']
const DISCOUNT_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Valor fijo' },
  { value: 'percentage', label: 'Porcentaje' }
]

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const createLocalId = () =>
  `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const toNumber = (value: number | string | null | undefined) => {
  if (value === null || value === undefined || value === '') return 0
  const parsed = typeof value === 'string' ? parseFloat(value) : value
  return Number.isFinite(parsed) ? parsed : 0
}

const stripHtml = (value?: string | null) =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const getQueryErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (error instanceof Error && error.message) {
    return `${fallbackMessage} ${error.message}`
  }

  return fallbackMessage
}

const createEmptyItem = (): FormItem => ({
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
    catalogPriceSource: 'medicalPrice'
  }
})

const createInitialFormState = (): FormState => ({
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

const getItemTotals = (item: CalibrationServiceItemPayload) => {
  const subtotal = Math.max(Number(item.quantity) || 0, 0) * toNumber(item.unitPrice)
  const taxTotal = subtotal * (toNumber(item.taxRate) / 100)
  return { subtotal, taxTotal, total: subtotal + taxTotal }
}

const getCatalogPriceValue = (
  product: CalibrationServiceProductSummary | null,
  priceSource: CatalogPriceSource
) => {
  if (!product) return null

  const firstVariant = product.variants?.[0]
  if (!firstVariant) return null

  const val = firstVariant[priceSource]
  return val !== null && val !== undefined ? Number(val) : null
}

const getCustomerSiteOptions = (
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

const getSiteDisplayLabel = (site: CalibrationServiceCustomerSite) =>
  [site.name, site.city, site.department].filter(Boolean).join(' · ')

const buildPayload = (formState: FormState, status: 'draft' | 'pending_approval'): CalibrationServicePayload => ({
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

const CalibrationServiceWorkspacePage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { serviceId } = useParams<{ serviceId?: string }>()
  const isEditing = Boolean(serviceId)
  const canAccessWorkspace = useHasRole([...CALIBRATION_SERVICE_EDIT_ROLES])
  const {
    data: sequenceConfig,
    isLoading: isLoadingSequenceConfig
  } = useCalibrationServiceSequenceConfig(canAccessWorkspace)
  const { data: service, isLoading: isLoadingService } = useCalibrationService(serviceId)
  const { data: quoteTermsTemplate } =
    useCalibrationServiceQuoteTermsTemplate(canAccessWorkspace && !isEditing)
  const {
    createService,
    updateService,
    uploadDocument,
    generateQuotePdf,
    downloadDocument,
    upsertSequenceConfig
  } = useCalibrationServiceMutations()
  const {
    data: customers = [],
    error: customersError,
    isError: hasCustomersError,
    isLoading: isLoadingCustomers
  } = useQuery({
    queryKey: ['calibration-service-customers'],
    queryFn: async () => {
      const response = await axiosPrivate.get<CalibrationServiceCustomer[]>('/customers', {
        params: { scope: 'calibration' }
      })
      return response.data
    },
    enabled: canAccessWorkspace,
    staleTime: 5 * 60 * 1000
  })
  const {
    data: products = [],
    error: productsError,
    isError: hasProductsError,
    isLoading: isLoadingProducts
  } = useQuery({
    queryKey: ['calibration-service-products'],
    queryFn: async () => {
      const response = await axiosPrivate.get<CalibrationServiceProductSummary[]>('/products')
      return response.data
    },
    enabled: canAccessWorkspace,
    staleTime: 5 * 60 * 1000
  })

  const [formState, setFormState] = useState<FormState>(createInitialFormState)
  const [requestEvidenceFile, setRequestEvidenceFile] = useState<File | null>(null)
  const [requestEvidenceTitle, setRequestEvidenceTitle] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const [templateHydrated, setTemplateHydrated] = useState(false)
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false)
  const [customerDialogMode, setCustomerDialogMode] = useState<'customer' | 'site' | null>(null)
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false)
  const [useDifferentExecutionCustomer, setUseDifferentExecutionCustomer] =
    useState(false)
  const [activeSection, setActiveSection] = useState(0)

  const createCustomerMutation = useMutation({
    mutationFn: async (values: CalibrationServiceCustomerDialogValues) => {
      const response = await axiosPrivate.post<{ customer: CalibrationServiceCustomer }>(
        '/customers',
        {
          ...values.customer,
          direccion: values.customer.direccion || values.site.address || '',
          ciudad: values.customer.ciudad || values.site.city || '',
          departamento: values.customer.departamento || values.site.department || '',
          email: values.customer.email || values.site.contactEmail || '',
          telefono: values.customer.telefono || values.site.contactPhone || '',
          pais: values.customer.pais || values.site.country || 'Colombia',
          sites: [values.site]
        }
      )
      return response.data.customer
    },
    onSuccess: (customer) => {
      queryClient.setQueryData<CalibrationServiceCustomer[]>(
        ['calibration-service-customers'],
        (previous = []) => {
          const withoutDuplicate = previous.filter((item) => item.id !== customer.id)
          return [...withoutDuplicate, customer].sort((left, right) =>
            left.nombre.localeCompare(right.nombre)
          )
        }
      )
      handleCustomerChange(customer)
      if (customer.sites?.[0]) {
        handleCustomerSiteChange(customer.sites[0])
      }
      setCustomerDialogMode(null)
      toast.success('Cliente creado y seleccionado.')
    }
  })

  const createCustomerSiteMutation = useMutation({
    mutationFn: async (values: CalibrationServiceCustomerDialogValues) => {
      if (!selectedCustomer?.id) {
        throw new Error('Selecciona un cliente antes de crear la sede.')
      }

      const response = await axiosPrivate.post<CalibrationServiceCustomer>(
        `/customers/${selectedCustomer.id}/sedes`,
        values.site
      )
      return response.data
    },
    onSuccess: (customer) => {
      queryClient.setQueryData<CalibrationServiceCustomer[]>(
        ['calibration-service-customers'],
        (previous = []) =>
          previous.map((item) => (item.id === customer.id ? customer : item))
      )
      const createdSite = customer.sites?.[customer.sites.length - 1]
      handleCustomerChange(customer)
      if (createdSite) {
        handleCustomerSiteChange(createdSite)
      }
      setCustomerDialogMode(null)
      toast.success('Sede creada y seleccionada.')
    }
  })

  useEffect(() => {
    if (!canAccessWorkspace || isLoadingSequenceConfig) {
      return
    }

    if (!sequenceConfig?.initialized) {
      setIsSequenceDialogOpen(true)
    }
  }, [canAccessWorkspace, isLoadingSequenceConfig, sequenceConfig?.initialized])

  useEffect(() => {
    if (!service || hydrated) return
    const hasDifferentExecutionCustomer = Boolean(service.executionCustomerName)
    setFormState({
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
    setRequestEvidenceTitle(`Evidencia de solicitud ${service.serviceCode}`)
    setUseDifferentExecutionCustomer(hasDifferentExecutionCustomer)
    setHydrated(true)
  }, [hydrated, service])

  useEffect(() => {
    if (isEditing || templateHydrated || !quoteTermsTemplate?.terms) return

    setFormState((previous) => ({
      ...previous,
      quoteTerms: mergeCalibrationQuoteTerms(quoteTermsTemplate.terms),
      commercialComments:
        stripHtml(quoteTermsTemplate.terms.commercialComments) ||
        previous.commercialComments
    }))
    setTemplateHydrated(true)
  }, [isEditing, quoteTermsTemplate?.terms, templateHydrated])

  const customerOptions =
    customers.length > 0
      ? customers
      : service?.customer
        ? [service.customer]
        : []
  const productFallbackOptions = (service?.items || [])
    .map((item) => item.product)
    .filter(
      (product): product is CalibrationServiceProductSummary =>
        Boolean(product?.id)
    )
    .filter(
      (product, index, array) =>
        array.findIndex((candidate) => candidate.id === product.id) === index
    )
  const productOptions = products.length > 0 ? products : productFallbackOptions
  const catalogErrors = [
    hasCustomersError
      ? getQueryErrorMessage(
          customersError,
          'No pudimos cargar el catalogo de clientes para este formulario.'
        )
      : null,
    hasProductsError
      ? getQueryErrorMessage(
          productsError,
          'No pudimos cargar el catalogo de productos para este formulario.'
        )
      : null
  ].filter(Boolean) as string[]
  const selectedCustomer =
    customerOptions.find((customer) => customer.id === formState.customerId) || null
  const customerSites = getCustomerSiteOptions(selectedCustomer)
  const requestEvidenceDocuments =
    service?.documents?.filter((document) => document.documentType === 'request_evidence') || []
  const hasCustomerChangeRequest =
    service?.otherFields?.customerResponseType === 'changes_requested'
  const latestChangeRequest =
    service?.otherFields?.latestChangeRequest &&
    typeof service.otherFields.latestChangeRequest === 'object' &&
    !Array.isArray(service.otherFields.latestChangeRequest)
      ? (service.otherFields.latestChangeRequest as Record<string, unknown>)
      : null
  const canEdit =
    canAccessWorkspace &&
    (!service || service.status === 'draft')
  const isBusy = createService.isLoading || updateService.isLoading || uploadDocument.isLoading ||
    generateQuotePdf.isLoading || downloadDocument.isLoading
  const suggestedCatalogPriceSource: CatalogPriceSource | null =
    typeof formState.otherFields?.catalogPriceProfile === 'string' &&
    ['medicalPrice', 'industrialPrice', 'thirdPartyPrice'].includes(formState.otherFields.catalogPriceProfile)
      ? (formState.otherFields.catalogPriceProfile as CatalogPriceSource)
      : null

  const sections = [
    { key: 'customer', label: 'Cliente y alcance', icon: <GroupOutlinedIcon sx={{ fontSize: 18 }} />, fields: ['customerId', 'requestChannel'] as const },
    { key: 'contact', label: 'Contacto y destino', icon: <Inventory2OutlinedIcon sx={{ fontSize: 18 }} />, fields: ['contactName', 'contactEmail', 'city'] as const },
    { key: 'terms', label: 'Términos', icon: <UploadFileOutlinedIcon sx={{ fontSize: 18 }} />, fields: [] as const },
    { key: 'items', label: 'Ítems cotizados', icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 18 }} />, fields: ['items'] as const },
    { key: 'commercial', label: 'Condiciones', icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 18 }} />, fields: ['paymentMethod', 'validityDays', 'instrumentDeliveryTime', 'certificateDeliveryTime'] as const },
  ] as const
  const sectionCompletion = sections.map((section) => {
    if (section.key === 'items') {
      const validItems = formState.items.filter((i) => i.itemName.trim())
      return Math.min(validItems.length, 1)
    }
    if (section.key === 'customer') {
      const base = section.fields.filter((f) => {
        const val = formState[f]
        return val !== null && val !== undefined && val !== '' && val !== 0
      }).length
      const hasEvidence = Boolean(requestEvidenceFile || requestEvidenceDocuments.length)
      const total = section.fields.length + 1
      return Math.min((base + (hasEvidence ? 1 : 0)) / total, 1)
    }
    if (section.key === 'terms') {
      const hasContent = CALIBRATION_QUOTE_TERM_KEYS.some(
        (key) => formState.quoteTerms?.[key]?.trim()
      )
      return hasContent ? 1 : 0
    }
    if (section.key === 'commercial') {
      const base = section.fields.filter((f) => {
        const val = formState[f]
        return val !== null && val !== undefined && val !== '' && val !== 0
      }).length
      const hasPriceProfile = typeof formState.otherFields?.catalogPriceProfile === 'string' &&
        ['medicalPrice', 'industrialPrice', 'thirdPartyPrice'].includes(formState.otherFields.catalogPriceProfile)
      const discountOk = !formState.hasDiscount || (
        formState.discountType?.trim() && Number(formState.discountValue) > 0
      )
      const extraTotal = 2
      return Math.min((base + (hasPriceProfile ? 1 : 0) + (discountOk ? 1 : 0)) / (section.fields.length + extraTotal), 1)
    }
    const filled = section.fields.filter((f) => {
      const val = formState[f]
      return val !== null && val !== undefined && val !== '' && val !== 0
    }).length
    return Math.min(filled / Math.max(section.fields.length, 1), 1)
  })

  const subtotal = formState.items.reduce((acc, item) => acc + getItemTotals(item).subtotal, 0)
  const taxTotal = formState.items.reduce((acc, item) => acc + getItemTotals(item).taxTotal, 0)
  const discountTotal = formState.hasDiscount
    ? formState.discountType === 'percentage'
      ? subtotal * (toNumber(formState.discountValue) / 100)
      : toNumber(formState.discountValue)
    : 0
  const grandTotal = subtotal + taxTotal - discountTotal
  const validItemsCount = formState.items.filter((i) => i.itemName.trim()).length

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

  const handleAddItem = () => {
    setCatalogPickerOpen(true)
  }

  const handleAddItemsFromCatalog = (
    pickedItems: { productId: number; productVariantId: number; itemName: string; intervalText: string | null; serviceType: string; unitPrice: number }[],
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
            catalogPriceSource: suggestedCatalogPriceSource || 'medicalPrice'
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
    const catalogPriceSource = suggestedCatalogPriceSource || 'medicalPrice'
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

  const validateForm = () => {
    if (!formState.customerId) return 'Selecciona un cliente.'
    if (formState.scopeType === 'site' && !formState.customerSite?.trim()) {
      return 'Selecciona la sede del servicio.'
    }
    if (!formState.requestChannel?.trim()) return 'Define la via de solicitud.'
    const validItems = formState.items.filter(
      (item) => item.itemName.trim() || item.instrumentName?.trim()
    )
    if (!validItems.length) return 'Agrega al menos un item.'
    if (validItems.some((item) => !item.itemName.trim() || !(Number(item.quantity) > 0))) {
      return 'Revisa nombre y cantidad de los items.'
    }
    if (!requestEvidenceFile && !requestEvidenceDocuments.length) {
      return 'Debes adjuntar la evidencia de solicitud.'
    }
    return null
  }

  const handleSave = async (targetStatus: 'draft' | 'pending_approval') => {
    const validationError = validateForm()
    if (validationError) {
      toast.error(validationError)
      return
    }
    try {
      const payload = buildPayload(formState, targetStatus)
      const savedService = isEditing
        ? await updateService.mutateAsync({ serviceId: serviceId as string, payload })
        : await createService.mutateAsync(payload)
      if (requestEvidenceFile) {
        try {
          await uploadDocument.mutateAsync({
            serviceId: String(savedService.id),
            file: requestEvidenceFile,
            documentType: 'request_evidence',
            title: requestEvidenceTitle || `Evidencia de solicitud ${savedService.serviceCode}`
          })
        } catch (uploadError) {
          console.error(uploadError)
          toast.error('El servicio se guardo, pero no fue posible subir la evidencia.')
          navigate(`/calibration-services/${savedService.id}`)
          return
        }
      }
      if (targetStatus === 'pending_approval') {
        try {
          const pdfDocument = await generateQuotePdf.mutateAsync({
            serviceId: String(savedService.id)
          })
          const fileBlob = await downloadDocument.mutateAsync({
            serviceId: String(savedService.id),
            documentId: String(pdfDocument.id)
          })
          const objectUrl = window.URL.createObjectURL(fileBlob as Blob)
          const anchor = window.document.createElement('a')
          anchor.href = objectUrl
          anchor.download = pdfDocument.originalFileName || `cotizacion-${savedService.serviceCode}.pdf`
          anchor.target = '_blank'
          anchor.rel = 'noopener'
          anchor.click()
          window.URL.revokeObjectURL(objectUrl)
        } catch (pdfError) {
          console.error(pdfError)
          toast.error('No se pudo generar la cotización PDF.')
        }
      }
      const codeLabel = savedService.quoteCode || savedService.serviceCode
      toast.success(
        targetStatus === 'pending_approval'
          ? `Cotización ${codeLabel} generada y guardada.`
          : `Servicio ${codeLabel} guardado como borrador.`
      )
      navigate(`/calibration-services/${savedService.id}`)
    } catch (error) {
      console.error(error)
      toast.error(isEditing ? 'No pudimos actualizar el servicio.' : 'No pudimos crear el servicio.')
    }
  }

  const handleSaveSequenceConfig = async (values: {
    nextQuoteNumber: number
    nextOdsNumber: number
  }) => {
    try {
      await upsertSequenceConfig.mutateAsync(values)
      toast.success('Los consecutivos iniciales del módulo quedaron configurados.')
      setIsSequenceDialogOpen(false)
    } catch (configError) {
      console.error(configError)
      toast.error('No pudimos guardar la configuración inicial.')
    }
  }

  if (isLoadingService || isLoadingCustomers || isLoadingProducts || isLoadingSequenceConfig) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='55vh'>
        <CircularProgress />
      </Box>
    )
  }

  if (!canAccessWorkspace) {
    return (
      <Box p={3}>
        <Alert severity='warning'>
          Tu rol actual puede consultar servicios, pero no crear ni editar esta
          etapa del flujo.
        </Alert>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        minHeight: '100vh',
        backgroundColor: '#f8fafb',
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'translateY(15px)' },
          to: { opacity: 1, transform: 'translateY(0)' }
        }
      }}
    >
      <Toaster position='top-center' />

      {/* ── Header banner ── */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #0f766e 0%, #059669 50%, #047857 100%)',
          borderRadius: '20px',
          p: { xs: 3, md: 4 },
          mb: 3,
          position: 'relative',
          overflow: 'hidden',
          animation: 'fadeUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '45%',
            height: '100%',
            background: 'radial-gradient(ellipse at 70% 10%, rgba(255,255,255,0.10) 0%, transparent 65%)',
            pointerEvents: 'none'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
          }
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          justifyContent='space-between'
          alignItems={{ xs: 'flex-start', md: 'center' }}
          spacing={2}
        >
          <Box>
            <Button
              startIcon={<ArrowBackOutlinedIcon />}
              onClick={() =>
                navigate(isEditing && serviceId ? `/calibration-services/${serviceId}` : '/calibration-services')
              }
              sx={{
                mb: 1,
                color: 'rgba(255,255,255,0.8)',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: '10px',
                fontSize: '0.85rem',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.10)',
                  color: '#fff'
                }
              }}
            >
              Volver
            </Button>
            <Typography variant='h4' fontWeight={800} sx={{ color: '#fff', lineHeight: 1.15, letterSpacing: '-0.025em', fontSize: { xs: '1.6rem', md: '2rem' } }}>
              {isEditing ? `Editar ${service?.quoteCode || service?.serviceCode || 'servicio'}` : 'Nuevo servicio de calibración'}
            </Typography>
            <Typography variant='body2' sx={{ mt: 1, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, maxWidth: 700, fontSize: '0.9rem' }}>
              Cotización base del servicio con cliente, sede, condiciones comerciales,
              ítems y evidencia de solicitud.
            </Typography>
          </Box>
          {service ? (
            <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
              <Chip color={CALIBRATION_SERVICE_STATUS_COLORS[service.status]} label={CALIBRATION_SERVICE_STATUS_LABELS[service.status]} sx={{ fontWeight: 700, borderRadius: '8px' }} />
              <Chip color={CALIBRATION_SERVICE_APPROVAL_COLORS[service.approvalStatus]} label={CALIBRATION_SERVICE_APPROVAL_LABELS[service.approvalStatus]} sx={{ fontWeight: 700, borderRadius: '8px' }} />
            </Stack>
          ) : null}
        </Stack>
      </Box>

      {!canEdit ? (
        <Alert severity='warning' sx={{ mb: 3 }}>
          Este servicio ya no puede editarse desde el formulario base porque supero la etapa comercial inicial.
        </Alert>
      ) : null}

      {canEdit && hasCustomerChangeRequest ? (
        <Alert severity='warning' sx={{ mb: 3 }}>
          El cliente pidió modificar esta cotización.
          {typeof latestChangeRequest?.changeRequestReason === 'string'
            ? ` Motivo: ${latestChangeRequest.changeRequestReason}`
            : ''}
        </Alert>
      ) : null}

      {canAccessWorkspace && sequenceConfig && !sequenceConfig.initialized ? (
        <Alert
          severity='warning'
          sx={{ mb: 3 }}
          action={
            <Button color='inherit' size='small' onClick={() => setIsSequenceDialogOpen(true)}>
              Configurar
            </Button>
          }
        >
          Antes de guardar la primera cotización, define los consecutivos
          iniciales de oferta y ODS.
        </Alert>
      ) : null}

      {catalogErrors.length ? (
        <Alert severity='error' sx={{ mb: 3 }}>
          {catalogErrors.join(' ')}
        </Alert>
      ) : null}

      {/* ── Section navigation ── */}
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          borderRadius: '14px',
          border: '1px solid rgba(0,0,0,0.06)',
          overflow: 'hidden',
          animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.08s both'
        }}
      >
        <Tabs
          value={activeSection}
          onChange={(_, v) => setActiveSection(v)}
          variant='scrollable'
          scrollButtons={false}
          sx={{
            minHeight: 48,
            px: 1.5,
            '& .MuiTab-root': {
              minHeight: 48,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.8rem',
              letterSpacing: '0.01em',
              px: 2,
              gap: 1,
              color: 'text.secondary',
              '&.Mui-selected': { color: '#059669' }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#059669',
              height: 3,
              borderRadius: '3px 3px 0 0'
            }
          }}
        >
          {sections.map((section, index) => (
            <Tab
              key={section.key}
              icon={section.icon}
              iconPosition='start'
              label={
                <Stack direction='row' alignItems='center' spacing={1}>
                  <span>{section.label}</span>
                  <Chip
                    size='small'
                    label={`${Math.round(sectionCompletion[index] * 100)}%`}
                    color={sectionCompletion[index] >= 1 ? 'success' : 'default'}
                    variant='outlined'
                    sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.8 } }}
                  />
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Paper>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          <div style={{ display: activeSection !== 0 ? 'none' : undefined }}>
          <Card elevation={0} sx={{ borderRadius: '16px', mb: 3, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both', position: 'relative', overflow: 'visible', '&::before': { content: '""', position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, borderRadius: '2px', background: 'linear-gradient(180deg, #10b981, #34d399)' } }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2.5 }}>
                <GroupOutlinedIcon sx={{ color: '#059669', fontSize: 22 }} />
                <Typography variant='h6' fontWeight={800} sx={{ color: '#111827', letterSpacing: '-0.01em' }}>
                  Cliente y alcance
                </Typography>
                {sectionCompletion[0] >= 1 ? (
                  <Chip icon={<CheckCircleOutlineOutlinedIcon sx={{ fontSize: 14 }} />} size='small' label='Completo' color='success' variant='outlined' sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.5 }, '& .MuiChip-icon': { fontSize: 14, ml: 0.5 } }} />
                ) : (
                  <LinearProgress
                    variant='determinate'
                    value={sectionCompletion[0] * 100}
                    sx={{ width: 60, height: 4, borderRadius: 2, ml: 'auto', backgroundColor: 'rgba(0,0,0,0.06)', '& .MuiLinearProgress-bar': { backgroundColor: '#059669', borderRadius: 2 } }}
                  />
                )}
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                    <Autocomplete
                      fullWidth
                      options={customerOptions}
                      value={selectedCustomer}
                      getOptionLabel={(option) =>
                        [option.nombre, option.identificacion].filter(Boolean).join(' · ')
                      }
                      onChange={(_, value) => handleCustomerChange(value)}
                      disabled={
                        !canEdit ||
                        isBusy ||
                        (hasCustomersError && customerOptions.length === 0)
                      }
                      renderInput={(params) => <TextField {...params} label='Cliente' required />}
                    />
                    <Button
                      variant='outlined'
                      sx={{ minWidth: 150 }}
                      disabled={!canEdit || isBusy}
                      onClick={() => setCustomerDialogMode('customer')}
                    >
                      Nuevo cliente
                    </Button>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Alcance</InputLabel>
                    <Select
                      value={formState.scopeType || 'general'}
                      label='Alcance'
                      disabled={!canEdit || isBusy}
                      onChange={(event) => setField('scopeType', event.target.value as FormState['scopeType'])}
                    >
                      <MenuItem value='general'>Cliente general</MenuItem>
                      <MenuItem value='site'>Sede especifica</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {formState.scopeType === 'site' ? (
                  <Grid item xs={12} md={6}>
                    {customerSites.length ? (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <FormControl fullWidth>
                          <InputLabel>Sede</InputLabel>
                          <Select
                            value={formState.customerSite || ''}
                            label='Sede'
                            disabled={!canEdit || isBusy}
                            onChange={(event) => {
                              const site = customerSites.find(
                                (candidate) => candidate.name === event.target.value
                              )
                              handleCustomerSiteChange(site || null)
                            }}
                          >
                            {customerSites.map((site) => (
                              <MenuItem key={site.id || site.name} value={site.name}>
                                {getSiteDisplayLabel(site)}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Button
                          variant='outlined'
                          sx={{ minWidth: 130 }}
                          disabled={!canEdit || isBusy || !selectedCustomer}
                          onClick={() => setCustomerDialogMode('site')}
                        >
                          Nueva sede
                        </Button>
                      </Stack>
                    ) : (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <TextField
                          fullWidth
                          label='Sede'
                          value={formState.customerSite || ''}
                          disabled={!canEdit || isBusy}
                          onChange={(event) => setField('customerSite', event.target.value)}
                        />
                        <Button
                          variant='outlined'
                          sx={{ minWidth: 130 }}
                          disabled={!canEdit || isBusy || !selectedCustomer}
                          onClick={() => setCustomerDialogMode('site')}
                        >
                          Crear sede
                        </Button>
                      </Stack>
                    )}
                  </Grid>
                ) : null}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Via de solicitud</InputLabel>
                    <Select
                      value={formState.requestChannel || ''}
                      label='Via de solicitud'
                      disabled={!canEdit || isBusy}
                      onChange={(event) => setField('requestChannel', event.target.value)}
                    >
                      {REQUEST_CHANNEL_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />
              <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2 }}>
                <UploadFileOutlinedIcon sx={{ color: '#7c3aed', fontSize: 20 }} />
                <Typography variant='subtitle2' fontWeight={700} sx={{ color: '#374151' }}>
                  Evidencia de solicitud *
                </Typography>
                {requestEvidenceFile || requestEvidenceDocuments.length ? (
                  <Chip icon={<CheckCircleOutlineOutlinedIcon sx={{ fontSize: 14 }} />} size='small' label='Adjunta' color='success' variant='outlined' sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.5 }, '& .MuiChip-icon': { fontSize: 14, ml: 0.5 } }} />
                ) : (
                  <Chip size='small' label='Obligatorio' color='error' variant='outlined' sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.5 } }} />
                )}
              </Stack>
              <Stack spacing={2}>
                <TextField fullWidth label='Titulo de la evidencia' value={requestEvidenceTitle} disabled={!canEdit || isBusy} onChange={(event) => setRequestEvidenceTitle(event.target.value)} required />
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                  <Button component='label' variant='outlined' startIcon={<UploadFileOutlinedIcon />} disabled={!canEdit || isBusy}>
                    Seleccionar archivo
                    <input
                      hidden
                      type='file'
                      accept='.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx'
                      onChange={(event) => setRequestEvidenceFile(event.target.files?.[0] || null)}
                    />
                  </Button>
                  <Typography variant='body2' color='text.secondary'>
                    {requestEvidenceFile ? requestEvidenceFile.name : 'Adjunta PDF, imagen o soporte documental de la solicitud.'}
                  </Typography>
                </Stack>
                {requestEvidenceDocuments.length ? (
                  <List dense disablePadding>
                    {requestEvidenceDocuments.map((document) => (
                      <ListItem key={document.id} disableGutters>
                        <ListItemText primary={document.title || document.originalFileName} secondary={`Version ${document.version}`} />
                      </ListItem>
                    ))}
                  </List>
                ) : null}
              </Stack>
            </CardContent>
          </Card>
          </div>

          <div style={{ display: activeSection !== 1 ? 'none' : undefined }}>
          <Card elevation={0} sx={{ borderRadius: '16px', mb: 3, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both', position: 'relative', overflow: 'visible', '&::before': { content: '""', position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, borderRadius: '2px', background: 'linear-gradient(180deg, #f59e0b, #fbbf24)' } }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2.5 }}>
                <Inventory2OutlinedIcon sx={{ color: '#d97706', fontSize: 22 }} />
                <Typography variant='h6' fontWeight={800} sx={{ color: '#111827', letterSpacing: '-0.01em' }}>
                  Contacto y destino del servicio
                </Typography>
                {sectionCompletion[1] >= 1 ? (
                  <Chip icon={<CheckCircleOutlineOutlinedIcon sx={{ fontSize: 14 }} />} size='small' label='Completo' color='success' variant='outlined' sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.5 }, '& .MuiChip-icon': { fontSize: 14, ml: 0.5 } }} />
                ) : null}
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label='Contacto' value={formState.contactName || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('contactName', event.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label='Email' type='email' value={formState.contactEmail || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('contactEmail', event.target.value)} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label='Telefono / celular' value={formState.contactPhone || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('contactPhone', event.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label='Ciudad' value={formState.city || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('city', event.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label='Departamento' value={formState.department || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('department', event.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label='Direccion' value={formState.address || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('address', event.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={useDifferentExecutionCustomer}
                        disabled={!canEdit || isBusy}
                        onChange={(event) =>
                          handleDifferentExecutionCustomerToggle(event.target.checked)
                        }
                      />
                    }
                    label='El servicio es para un cliente diferente a la oferta'
                  />
                </Grid>
                {useDifferentExecutionCustomer ? (
                  <>
                    <Grid item xs={12}>
                      <Alert severity='info'>
                        Usa este bloque cuando la cotización se emite a un cliente, pero la
                        ejecución real será para un tercero. Estos datos quedarán precargados en
                        la ODS y en el bloque `Cliente Diferente Oferta`.
                      </Alert>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label='Cliente de ejecución'
                        value={formState.executionCustomerName || ''}
                        disabled={!canEdit || isBusy}
                        onChange={(event) =>
                          setField('executionCustomerName', event.target.value)
                        }
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label='Sede o referencia de ejecución'
                        value={formState.executionSiteName || ''}
                        disabled={!canEdit || isBusy}
                        onChange={(event) =>
                          setField('executionSiteName', event.target.value)
                        }
                      />
                    </Grid>
                  </>
                ) : (
                  <Grid item xs={12}>
                    <Typography variant='body2' color='text.secondary'>
                      Si no marcas esta opción, el sistema asumirá que el servicio se presta para el
                      mismo cliente de la oferta y tomará como base el cliente y la sede ya elegidos.
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
          </div>


          <div style={{ display: activeSection !== 2 ? 'none' : undefined }}>
          <Card elevation={0} sx={{ borderRadius: '16px', mb: 3, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both', position: 'relative', overflow: 'visible', '&::before': { content: '""', position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, borderRadius: '2px', background: 'linear-gradient(180deg, #8b5cf6, #a78bfa)' } }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2.5 }}>
                <UploadFileOutlinedIcon sx={{ color: '#7c3aed', fontSize: 22 }} />
                <Typography variant='h6' fontWeight={800} sx={{ color: '#111827', letterSpacing: '-0.01em' }}>
                  Términos
                </Typography>
              </Stack>
              <Stack spacing={2}>
                <Box>
                  <Typography variant='body2' color='text.secondary'>
                    Este bloque se deja al final para ajustar la última hoja de la
                    cotización. Al guardar, los términos quedan como snapshot de este
                    servicio sin afectar la plantilla global. Para modificar la plantilla
                    que se precarga en servicios nuevos, usa el botón "Plantilla
                    términos" en la bandeja de entrada.
                  </Typography>
                </Box>
                <Alert severity='info'>
                  Puedes usar variables dentro del texto. Al generar el PDF se reemplazan
                  automáticamente por los valores de esta cotización:
                  <Box component='ul' sx={{ mt: 1, mb: 0, pl: 3 }}>
                    <li><strong>{'{{validityDays}}'}</strong>: validez de la oferta.</li>
                    <li><strong>{'{{paymentMethod}}'}</strong>: forma de pago acordada.</li>
                    <li><strong>{'{{instrumentDeliveryTime}}'}</strong>: tiempo de entrega de los equipos.</li>
                    <li><strong>{'{{certificateDeliveryTime}}'}</strong>: tiempo de entrega de los certificados.</li>
                  </Box>
                </Alert>
                {CALIBRATION_QUOTE_TERM_KEYS.map((termKey) => (
                  <Accordion
                    key={termKey}
                    disableGutters
                    elevation={0}
                    sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important' }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                      <Typography fontWeight={800}>
                        {CALIBRATION_QUOTE_TERM_LABELS[termKey]}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <CalibrationServiceRichTextEditor
                        value={formState.quoteTerms?.[termKey] || ''}
                        disabled={!canEdit || isBusy}
                        placeholder={`Escribe ${CALIBRATION_QUOTE_TERM_LABELS[termKey].toLowerCase()}`}
                        onChange={(value) => setQuoteTerm(termKey, value)}
                      />
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            </CardContent>
          </Card>
          </div>

          <div style={{ display: activeSection !== 3 ? 'none' : undefined }}>
          <Card elevation={0} sx={{ borderRadius: '16px', mb: 3, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.25s both', position: 'relative', overflow: 'visible', '&::before': { content: '""', position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, borderRadius: '2px', background: 'linear-gradient(180deg, #ec4899, #f472b6)' } }}>
            <CardContent sx={{ p: { xs: 2, md: 3 }, pBottom: { xs: 2, md: 3 } }}>
              <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2.5 }}>
                <RequestQuoteOutlinedIcon sx={{ color: '#db2777', fontSize: 22 }} />
                <Typography variant='h6' fontWeight={800} sx={{ color: '#111827', letterSpacing: '-0.01em' }}>
                  Ítems cotizados
                </Typography>
                <Chip size='small' label={`${formState.items.filter((i) => i.itemName.trim()).length} ítems`} variant='outlined' sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.8 } }} />
                {formState.items.filter((i) => i.itemName.trim()).length > 0 ? (
                  <Chip icon={<CheckCircleOutlineOutlinedIcon sx={{ fontSize: 14 }} />} size='small' label='Completo' color='success' variant='outlined' sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.5 }, '& .MuiChip-icon': { fontSize: 14, ml: 0.5 } }} />
                ) : null}
              </Stack>
              <CalibrationServiceItemsEditor
                items={formState.items}
                products={productOptions}
                catalogPriceSourceOptions={CATALOG_PRICE_SOURCE_OPTIONS}
                suggestedCatalogPriceSource={suggestedCatalogPriceSource}
                canEdit={canEdit}
                isBusy={isBusy}
                onAddItem={handleAddItem}
                onRemoveItem={handleRemoveItem}
                onSelectProduct={handleSelectProduct}
                onSelectCatalogPrice={handleSelectCatalogPrice}
                onChangeItemField={setItemField}
                onChangeItemOtherField={setItemOtherField}
              />
            </CardContent>
          </Card>
          </div>

          <div style={{ display: activeSection !== 4 ? 'none' : undefined }}>
          <Card elevation={0} sx={{ borderRadius: '16px', mb: 3, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both', position: 'relative', overflow: 'visible', '&::before': { content: '""', position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, borderRadius: '2px', background: 'linear-gradient(180deg, #6366f1, #818cf8)' } }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2.5 }}>
                <ReceiptLongOutlinedIcon sx={{ color: '#4f46e5', fontSize: 22 }} />
                <Typography variant='h6' fontWeight={800} sx={{ color: '#111827', letterSpacing: '-0.01em' }}>
                  Condiciones comerciales
                </Typography>
                {sectionCompletion[4] >= 1 ? (
                  <Chip icon={<CheckCircleOutlineOutlinedIcon sx={{ fontSize: 14 }} />} size='small' label='Completo' color='success' variant='outlined' sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.5 }, '& .MuiChip-icon': { fontSize: 14, ml: 0.5 } }} />
                ) : null}
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Validez</InputLabel>
                    <Select
                      value={String(formState.validityDays || 30)}
                      label='Validez'
                      disabled={!canEdit || isBusy}
                      onChange={(event) => setField('validityDays', Number(event.target.value))}
                    >
                      {VALIDITY_DAY_OPTIONS.map((days) => (
                        <MenuItem key={days} value={String(days)}>
                          {days} dias
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Forma de pago</InputLabel>
                    <Select
                      value={formState.paymentMethod || ''}
                      label='Forma de pago'
                      disabled={!canEdit || isBusy}
                      onChange={(event) => setField('paymentMethod', event.target.value)}
                    >
                      {PAYMENT_METHOD_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth required>
                    <InputLabel>Perfil sugerido de precio</InputLabel>
                    <Select
                      value={suggestedCatalogPriceSource ?? ''}
                      label='Perfil sugerido de precio'
                      disabled={!canEdit || isBusy}
                      onChange={(event) =>
                        setField('otherFields', {
                          ...(formState.otherFields || {}),
                          catalogPriceProfile: event.target.value
                        })
                      }
                    >
                      {CATALOG_PRICE_SOURCE_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={4}>
                  <FormControl fullWidth>
                    <InputLabel>Aplica descuento</InputLabel>
                    <Select
                      value={formState.hasDiscount ? 'yes' : 'no'}
                      label='Aplica descuento'
                      disabled={!canEdit || isBusy}
                      onChange={(event) => setField('hasDiscount', event.target.value === 'yes')}
                    >
                      <MenuItem value='no'>No</MenuItem>
                      <MenuItem value='yes'>Si</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {formState.hasDiscount ? (
                  <>
                    <Grid item xs={12} md={4}>
                      <FormControl fullWidth>
                        <InputLabel>Tipo descuento</InputLabel>
                        <Select
                          value={formState.discountType || 'fixed'}
                          label='Tipo descuento'
                          disabled={!canEdit || isBusy}
                          onChange={(event) => setField('discountType', event.target.value)}
                        >
                          {DISCOUNT_TYPE_OPTIONS.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <TextField
                        fullWidth
                        label='Valor descuento'
                        value={formState.discountValue ?? 0}
                        disabled={!canEdit || isBusy}
                        onChange={(event) =>
                          setField('discountValue', Number(event.target.value))
                        }
                        InputProps={
                          formState.discountType === 'fixed'
                            ? { inputComponent: NumericFormatCustom as never }
                            : undefined
                        }
                      />
                    </Grid>
                  </>
                ) : null}
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Entrega instrumento</InputLabel>
                    <Select
                      value={formState.instrumentDeliveryTime || ''}
                      label='Entrega instrumento'
                      disabled={!canEdit || isBusy}
                      onChange={(event) => setField('instrumentDeliveryTime', event.target.value)}
                    >
                      {DELIVERY_TIME_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Entrega certificado</InputLabel>
                    <Select
                      value={formState.certificateDeliveryTime || ''}
                      label='Entrega certificado'
                      disabled={!canEdit || isBusy}
                      onChange={(event) => setField('certificateDeliveryTime', event.target.value)}
                    >
                      {DELIVERY_TIME_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Alert severity='info'>
                    El perfil sugerido de precio se usa para precargar el valor al
                    seleccionar un producto del catálogo. Luego cada ítem puede cambiar
                    su precio de catálogo o editar manualmente el valor unitario.
                  </Alert>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          </div>


        </Grid>

        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(14px)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', position: { lg: 'sticky' }, top: { lg: 24 }, animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2 }}>
                <ReceiptLongOutlinedIcon sx={{ color: '#059669', fontSize: 22 }} />
                <Typography variant='h6' fontWeight={800} sx={{ color: '#111827', letterSpacing: '-0.01em' }}>
                  Resumen económico
                </Typography>
              </Stack>
              <Stack spacing={1.5}>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography sx={{ color: '#6b7280', fontWeight: 500 }}>Subtotal</Typography>
                  <Typography fontWeight={600} sx={{ color: '#111827' }}>{currencyFormatter.format(subtotal)}</Typography>
                </Stack>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography sx={{ color: '#6b7280', fontWeight: 500 }}>IVA</Typography>
                  <Typography fontWeight={600} sx={{ color: '#111827' }}>{currencyFormatter.format(taxTotal)}</Typography>
                </Stack>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography sx={{ color: '#6b7280', fontWeight: 500 }}>Descuento</Typography>
                  <Typography fontWeight={600} sx={{ color: '#111827' }}>{currencyFormatter.format(discountTotal)}</Typography>
                </Stack>
                <Divider />
                <Stack direction='row' justifyContent='space-between' alignItems='center'>
                  <Typography variant='h6' sx={{ color: '#111827', fontWeight: 700 }}>Total</Typography>
                  <Typography variant='h6' fontWeight={800} sx={{ color: '#059669' }}>
                    {currencyFormatter.format(grandTotal)}
                  </Typography>
                </Stack>
              </Stack>

              <Divider sx={{ my: 2.5 }} />

              <Stack spacing={1.5}>
                <Typography variant='caption' color='text.secondary' fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resumen del formulario</Typography>
                {sections.map((section, index) => (
                  <Stack key={section.key} direction='row' justifyContent='space-between' alignItems='center'>
                    <Stack direction='row' alignItems='center' spacing={1}>
                      {section.icon}
                      <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 500 }}>{section.label}</Typography>
                    </Stack>
                    <Chip
                      size='small'
                      label={sectionCompletion[index] >= 1 ? 'Listo' : `${Math.round(sectionCompletion[index] * 100)}%`}
                      color={sectionCompletion[index] >= 1 ? 'success' : 'default'}
                      variant='outlined'
                      sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.65rem', px: 0.6 } }}
                    />
                  </Stack>
                ))}
                <Stack direction='row' justifyContent='space-between' alignItems='center'>
                  <Typography variant='body2' sx={{ color: 'text.secondary', fontWeight: 500 }}>Ítems</Typography>
                  <Typography variant='body2' fontWeight={600}>{validItemsCount}</Typography>
                </Stack>
              </Stack>

              <Divider sx={{ my: 2.5 }} />
              <Stack spacing={1.5}>
                <Button
                  variant='contained'
                  startIcon={<SaveOutlinedIcon />}
                  onClick={() => void handleSave('draft')}
                  disabled={!canEdit || isBusy || !sequenceConfig?.initialized}
                  sx={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1.2,
                    boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.2)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
                      boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.3)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  Guardar borrador
                </Button>
                <Button
                  variant='outlined'
                  startIcon={<SendOutlinedIcon />}
                  onClick={() => void handleSave('pending_approval')}
                  disabled={!canEdit || isBusy || !sequenceConfig?.initialized}
                  sx={{
                    borderColor: '#10b981',
                    color: '#059669',
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 700,
                    py: 1.2,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      borderColor: '#059669',
                      backgroundColor: 'rgba(16, 185, 129, 0.06)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  Guardar y enviar cotización
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <CatalogProductPickerDialog
        open={catalogPickerOpen}
        products={productOptions}
        suggestedPriceSource={suggestedCatalogPriceSource}
        onClose={() => setCatalogPickerOpen(false)}
        onAddItems={handleAddItemsFromCatalog}
      />
      {canAccessWorkspace ? (
        <CalibrationServiceSequenceConfigDialog
          open={isSequenceDialogOpen}
          isLoading={upsertSequenceConfig.isLoading}
          config={sequenceConfig}
          onClose={() => setIsSequenceDialogOpen(false)}
          onSubmit={handleSaveSequenceConfig}
        />
      ) : null}
      <CalibrationServiceCustomerDialog
        open={Boolean(customerDialogMode)}
        mode={customerDialogMode || 'customer'}
        customer={selectedCustomer}
        isSubmitting={createCustomerMutation.isLoading || createCustomerSiteMutation.isLoading}
        onClose={() => setCustomerDialogMode(null)}
        onSubmit={(values) => {
          if (customerDialogMode === 'site') {
            if (!values.site.name.trim()) {
              toast.error('Indica el nombre de la sede.')
              return
            }
            createCustomerSiteMutation.mutate(values)
            return
          }

          if (!values.customer.nombre.trim()) {
            toast.error('Indica el nombre del cliente.')
            return
          }

          if (!values.site.name.trim()) {
            toast.error('Indica al menos una sede inicial.')
            return
          }

          createCustomerMutation.mutate(values)
        }}
      />
    </Box>
  )
}

export default CalibrationServiceWorkspacePage
