import { useEffect, useRef, useState } from 'react'
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
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
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
  EQUIPMENT_SALES_EDIT_ROLES,
  EQUIPMENT_QUOTATION_STATUS_COLORS,
  EQUIPMENT_QUOTATION_STATUS_LABELS
} from '../../constants/equipmentSales'
import {
  EQUIPMENT_SALES_QUERY_KEYS,
  useEquipmentProducts,
  useEquipmentQuotation,
  useEquipmentQuoteTermsTemplate,
  useEquipmentSalesMutations,
  useEquipmentSequenceConfig
} from '../../hooks/useEquipmentSales'
import {
  EquipmentCustomerOption,
  EquipmentProduct,
  EquipmentQuotationPayload
} from '../../types/equipmentSales'
import { useHasRole } from '../../utils/functions'
import EquipmentQuotationItemsEditor, {
  FormItem,
  createEmptyItem,
  calculateItemTotals
} from './EquipmentQuotationItemsEditor'
import EquipmentSalesCatalogProductPickerDialog from './EquipmentSalesCatalogProductPickerDialog'
import EquipmentSalesSequenceConfigDialog from './EquipmentSalesSequenceConfigDialog'
import EquipmentSalesCustomerDialog, {
  EquipmentSalesCustomerDialogValues
} from './EquipmentSalesCustomerDialog'
import CalibrationServiceRichTextEditor from '../calibration-services/CalibrationServiceRichTextEditor'
import {
  EQUIPMENT_QUOTE_TERM_KEYS,
  EQUIPMENT_QUOTE_TERM_LABELS,
  EquipmentQuoteTermKey,
  mergeEquipmentQuoteTerms
} from './equipmentQuoteTerms'

type FormState = Omit<EquipmentQuotationPayload, 'items' | 'status' | 'quoteTerms'> & {
  items: FormItem[]
  quoteTerms: Record<string, string>
}

const REQUEST_CHANNEL_OPTIONS = ['En persona', 'Por Email', 'Por Telefono', 'Por WhatsApp']
const PAYMENT_METHOD_OPTIONS = ['De Contado', 'A 30 Dias', 'A 60 Dias', 'A 90 Dias', '50% / 50%', 'Credito 30 Dias', 'Credito 60 Dias']
const DELIVERY_TIME_OPTIONS = ['8 Dias Habiles', '15 Dias Habiles', '20 Dias Habiles', '30 Dias Habiles']
const VALIDITY_DAY_OPTIONS = [8, 15, 30, 60, 90]
const DISCOUNT_TYPE_OPTIONS = [
  { value: 'fixed', label: 'Valor fijo' },
  { value: 'percentage', label: 'Porcentaje' }
]

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

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

const getCustomerSiteOptions = (customer: EquipmentCustomerOption | null) => {
  if (!customer) return []
  if (customer.sites?.length) {
    return customer.sites.filter((site) => site.isActive !== false)
  }
  return (customer.sede || []).map((name) => ({
    name,
    address: customer.direccion || '',
    city: customer.ciudad || '',
    department: customer.departamento || '',
    contactEmail: customer.email || '',
    contactPhone: customer.telefono || '',
    isActive: true
  }))
}

const getSiteDisplayLabel = (site: { name: string; city?: string; department?: string }) =>
  [site.name, site.city, site.department].filter(Boolean).join(' · ')

const createInitialFormState = (): FormState => ({
  customerId: null,
  customerSite: '',
  requestChannel: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  city: '',
  department: '',
  address: '',
  validityDays: 30,
  paymentMethod: '',
  deliveryTime: '',
  warrantyTerms: '',
  hasDiscount: false,
  discountType: 'fixed',
  discountValue: 0,
  commercialComments: '',
  internalNotes: '',
  quoteTerms: mergeEquipmentQuoteTerms(),
  otherFields: {},
  items: [createEmptyItem()]
})

const buildPayload = (formState: FormState, status: 'draft' | 'pending_approval'): EquipmentQuotationPayload => ({
  customerId: formState.customerId ?? null,
  customerSite: formState.customerSite?.trim() || null,
  requestChannel: formState.requestChannel?.trim() || null,
  contactName: formState.contactName?.trim() || null,
  contactEmail: formState.contactEmail?.trim() || null,
  contactPhone: formState.contactPhone?.trim() || null,
  city: formState.city?.trim() || null,
  department: formState.department?.trim() || null,
  address: formState.address?.trim() || null,
  validityDays: formState.validityDays ? Number(formState.validityDays) : null,
  paymentMethod: formState.paymentMethod?.trim() || null,
  deliveryTime: formState.deliveryTime?.trim() || null,
  warrantyTerms: formState.warrantyTerms?.trim() || null,
  hasDiscount: Boolean(formState.hasDiscount),
  discountType: formState.hasDiscount ? formState.discountType || 'fixed' : null,
  discountValue: formState.hasDiscount ? toNumber(formState.discountValue) : 0,
  commercialComments:
    stripHtml(formState.quoteTerms?.commercialComments) ||
    formState.commercialComments?.trim() ||
    null,
  internalNotes: formState.internalNotes?.trim() || null,
  quoteTerms: formState.quoteTerms || null,
  status,
  otherFields: formState.otherFields || {},
  items: formState.items
    .filter((item) => item.itemName.trim())
    .map((item, index) => {
      const totals = calculateItemTotals(item as FormItem)
      return {
        productId: item.productId ?? null,
        itemName: item.itemName.trim() || '',
        brand: item.brand?.trim() || null,
        model: item.model?.trim() || null,
        characteristics: item.characteristics?.trim() || null,
        quantity: Number(item.quantity) || 1,
        unitPrice: toNumber(item.unitPrice),
        taxRate: toNumber(item.taxRate),
        subtotal: totals.subtotal ?? 0,
        taxTotal: totals.taxTotal ?? 0,
        total: totals.total ?? 0,
        warrantyMonths: item.warrantyMonths ?? null,
        deliveryTime: item.deliveryTime?.trim() || null,
        notes: item.notes?.trim() || null,
        sortOrder: index,
        otherFields: item.otherFields || {}
      }
    })
})

const EquipmentSalesWorkspacePage = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { quotationId } = useParams<{ quotationId?: string }>()
  const isEditing = Boolean(quotationId)
  const isAdmin = useHasRole(['admin', 'super_admin'])
  const canAccessWorkspace = useHasRole([...EQUIPMENT_SALES_EDIT_ROLES])
  const { data: sequenceConfig, isLoading: isLoadingSequenceConfig } = useEquipmentSequenceConfig(canAccessWorkspace)
  const { data: quotation, isLoading: isLoadingQuotation } = useEquipmentQuotation(quotationId)
  const { data: quoteTermsTemplate, isLoading: isLoadingTemplate } =
    useEquipmentQuoteTermsTemplate(canAccessWorkspace && !isEditing)
  const {
    createQuotation,
    updateQuotation,
    uploadDocument,
    generateQuotePdf,
    downloadDocument,
    upsertSequenceConfig
  } = useEquipmentSalesMutations()
  const { data: customers = [] } = useQuery({
    queryKey: ['equipment-sales-customers'],
    queryFn: async () => {
      const response = await axiosPrivate.get<EquipmentCustomerOption[]>('/customers')
      return response.data
    },
    enabled: canAccessWorkspace,
    staleTime: 5 * 60 * 1000
  })
  const { data: productsData } = useEquipmentProducts({ limit: 500 })
  const products = productsData?.data || []

  const [formState, setFormState] = useState<FormState>(() => {
    const cached = queryClient.getQueryData(
      [EQUIPMENT_SALES_QUERY_KEYS.all, 'quote-terms-template']
    ) as { terms?: Record<string, string> } | undefined
    if (cached?.terms) {
      return {
        ...createInitialFormState(),
        quoteTerms: mergeEquipmentQuoteTerms(cached.terms),
        commercialComments: stripHtml(cached.terms.commercialComments) || ''
      }
    }
    return createInitialFormState()
  })
  const [requestEvidenceFile, setRequestEvidenceFile] = useState<File | null>(null)
  const [requestEvidenceTitle, setRequestEvidenceTitle] = useState('')
  const [hydrated, setHydrated] = useState(false)
  const templateHydratedRef = useRef(false)
  const [isSequenceDialogOpen, setIsSequenceDialogOpen] = useState(false)
  const [customerDialogMode, setCustomerDialogMode] = useState<'customer' | 'site' | null>(null)
  const [catalogPickerOpen, setCatalogPickerOpen] = useState(false)
  const [activeSection, setActiveSection] = useState(0)

  const createCustomerMutation = useMutation({
    mutationFn: async (values: EquipmentSalesCustomerDialogValues) => {
      const response = await axiosPrivate.post<{ customer: EquipmentCustomerOption }>(
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
      queryClient.setQueryData<EquipmentCustomerOption[]>(
        ['equipment-sales-customers'],
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
    mutationFn: async (values: EquipmentSalesCustomerDialogValues) => {
      if (!selectedCustomer?.id) {
        throw new Error('Selecciona un cliente antes de crear la sede.')
      }
      const response = await axiosPrivate.post<EquipmentCustomerOption>(
        `/customers/${selectedCustomer.id}/sedes`,
        values.site
      )
      return response.data
    },
    onSuccess: (customer) => {
      queryClient.setQueryData<EquipmentCustomerOption[]>(
        ['equipment-sales-customers'],
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
    if (!canAccessWorkspace || isLoadingSequenceConfig) return
    if (!sequenceConfig?.initialized) {
      setIsSequenceDialogOpen(true)
    }
  }, [canAccessWorkspace, isLoadingSequenceConfig, sequenceConfig?.initialized])

  useEffect(() => {
    if (!quotation || hydrated) return
    setFormState({
      customerId: quotation.customerId ?? null,
      customerSite: quotation.customerSite || '',
      requestChannel: quotation.requestChannel || '',
      contactName: quotation.contactName || '',
      contactEmail: quotation.contactEmail || '',
      contactPhone: quotation.contactPhone || '',
      city: quotation.city || '',
      department: quotation.department || '',
      address: quotation.address || '',
      validityDays: quotation.validityDays || 30,
      paymentMethod: quotation.paymentMethod || '',
      deliveryTime: quotation.deliveryTime || '',
      warrantyTerms: quotation.warrantyTerms || '',
      hasDiscount: quotation.hasDiscount,
      discountType: quotation.discountType || 'fixed',
      discountValue: toNumber(quotation.discountValue),
      commercialComments: quotation.commercialComments || '',
      quoteTerms: mergeEquipmentQuoteTerms({
        commercialComments:
          (quotation.quoteTerms?.commercialComments as string | undefined) ||
          (quotation.commercialComments
            ? `<p>${quotation.commercialComments}</p>`
            : undefined),
        ...(quotation.quoteTerms as Record<string, string> | undefined)
      } as Record<string, string>),
      internalNotes: quotation.internalNotes || '',
      otherFields: quotation.otherFields || {},
      items: quotation.items?.map((item, index) => ({
        localId: String(item.id ?? `item-${Date.now()}-${index}`),
        productId: item.productId ?? null,
        itemName: item.itemName,
        brand: item.brand || '',
        model: item.model || '',
        characteristics: item.characteristics || '',
        quantity: item.quantity,
        unitPrice: toNumber(item.unitPrice),
        taxRate: toNumber(item.taxRate),
        subtotal: toNumber(item.subtotal),
        taxTotal: toNumber(item.taxTotal),
        total: toNumber(item.total),
        warrantyMonths: item.warrantyMonths,
        deliveryTime: item.deliveryTime || '',
        notes: item.notes || '',
        sortOrder: item.sortOrder ?? index,
        otherFields: item.otherFields || {}
      })) || [createEmptyItem()]
    })
    setRequestEvidenceTitle(`Evidencia de solicitud ${quotation.quoteCode}`)
    setHydrated(true)
  }, [hydrated, quotation])

  useEffect(() => {
    if (isEditing || templateHydratedRef.current || isLoadingTemplate || !quoteTermsTemplate?.terms) return
    templateHydratedRef.current = true
    setFormState((previous) => ({
      ...previous,
      quoteTerms: mergeEquipmentQuoteTerms(quoteTermsTemplate.terms),
      commercialComments:
        stripHtml(quoteTermsTemplate.terms.commercialComments) ||
        previous.commercialComments
    }))
  }, [isEditing, isLoadingTemplate, quoteTermsTemplate?.terms])

  const customerOptions: EquipmentCustomerOption[] =
    customers.length > 0
      ? customers
      : quotation?.customer
        ? [{
            id: quotation.customer.id,
            nombre: quotation.customer.nombre,
            identificacion: quotation.customer.identificacion,
            email: quotation.customer.email || undefined,
            telefono: quotation.customer.telefono || undefined,
            ciudad: quotation.customer.ciudad || undefined,
            departamento: quotation.customer.departamento || undefined,
            direccion: quotation.customer.direccion || undefined
          }]
        : []
  const productOptions =
    products.length > 0
      ? products
      : (quotation?.items || [])
          .map((item) => item.product)
          .filter((product): product is NonNullable<typeof product> => Boolean(product?.id))
          .filter((product, index, array) =>
            array.findIndex((candidate) => candidate.id === product.id) === index
          )
  const selectedCustomer =
    customerOptions.find((customer) => customer.id === formState.customerId) || null
  const customerSites = getCustomerSiteOptions(selectedCustomer)
  const hasChangeRequest =
    quotation?.otherFields?.customerResponseType === 'changes_requested'
  const latestChangeRequest =
    quotation?.otherFields?.latestChangeRequest &&
    typeof quotation.otherFields.latestChangeRequest === 'object' &&
    !Array.isArray(quotation.otherFields.latestChangeRequest)
      ? (quotation.otherFields.latestChangeRequest as Record<string, unknown>)
      : null
  const canEdit = canAccessWorkspace && (!quotation || quotation.status === 'draft')
  const isBusy = createQuotation.isLoading || updateQuotation.isLoading || uploadDocument.isLoading ||
    generateQuotePdf.isLoading || downloadDocument.isLoading

  const sections = [
    { key: 'customer', label: 'Cliente y alcance', icon: <GroupOutlinedIcon sx={{ fontSize: 18 }} />, fields: ['customerId', 'requestChannel'] as const },
    { key: 'contact', label: 'Contacto y destino', icon: <Inventory2OutlinedIcon sx={{ fontSize: 18 }} />, fields: ['contactName', 'contactEmail', 'city'] as const },
    { key: 'terms', label: 'Términos', icon: <UploadFileOutlinedIcon sx={{ fontSize: 18 }} />, fields: [] as const },
    { key: 'items', label: 'Ítems cotizados', icon: <RequestQuoteOutlinedIcon sx={{ fontSize: 18 }} />, fields: ['items'] as const },
    { key: 'commercial', label: 'Condiciones', icon: <ReceiptLongOutlinedIcon sx={{ fontSize: 18 }} />, fields: ['paymentMethod', 'validityDays', 'deliveryTime'] as const },
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
      const hasEvidence = Boolean(requestEvidenceFile)
      const total = section.fields.length + 1
      return Math.min((base + (hasEvidence ? 1 : 0)) / total, 1)
    }
    if (section.key === 'terms') {
      const hasContent = EQUIPMENT_QUOTE_TERM_KEYS.some(
        (key) => formState.quoteTerms?.[key]?.trim()
      )
      return hasContent ? 1 : 0
    }
    if (section.key === 'commercial') {
      const base = section.fields.filter((f) => {
        const val = formState[f]
        return val !== null && val !== undefined && val !== '' && val !== 0
      }).length
      const discountOk = !formState.hasDiscount || (
        formState.discountType?.trim() && Number(formState.discountValue) > 0
      )
      const extraTotal = 1
      return Math.min((base + (discountOk ? 1 : 0)) / (section.fields.length + extraTotal), 1)
    }
    const filled = section.fields.filter((f) => {
      const val = formState[f]
      return val !== null && val !== undefined && val !== ''
    }).length
    return Math.min(filled / Math.max(section.fields.length, 1), 1)
  })

  const subtotal = formState.items.reduce((acc, item) => acc + calculateItemTotals(item as FormItem).subtotal, 0)
  const taxTotal = formState.items.reduce((acc, item) => acc + calculateItemTotals(item as FormItem).taxTotal, 0)
  const discountTotal = formState.hasDiscount
    ? formState.discountType === 'percentage'
      ? subtotal * (toNumber(formState.discountValue) / 100)
      : toNumber(formState.discountValue)
    : 0
  const grandTotal = subtotal + taxTotal - discountTotal

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((previous) => ({ ...previous, [field]: value }))
  }

  const setQuoteTerm = (field: EquipmentQuoteTermKey, value: string) => {
    setFormState((previous) => ({
      ...previous,
      commercialComments:
        field === 'commercialComments'
          ? stripHtml(value)
          : previous.commercialComments,
      quoteTerms: {
        ...(previous.quoteTerms || mergeEquipmentQuoteTerms()),
        [field]: value
      }
    }))
  }

  const handleCustomerChange = (customer: EquipmentCustomerOption | null) => {
    const firstSite = getCustomerSiteOptions(customer)[0]
    setFormState((previous) => ({
      ...previous,
      customerId: customer?.id ?? null,
      customerSite: firstSite?.name || previous.customerSite,
      contactEmail: firstSite?.contactEmail || customer?.email || previous.contactEmail || '',
      contactPhone: firstSite?.contactPhone || customer?.telefono || previous.contactPhone || '',
      city: firstSite?.city || customer?.ciudad || previous.city || '',
      department: firstSite?.department || customer?.departamento || previous.department || '',
      address: firstSite?.address || customer?.direccion || previous.address || ''
    }))
  }

  const handleCustomerSiteChange = (site: { name: string; contactName?: string; contactEmail?: string; contactPhone?: string; city?: string; department?: string; address?: string } | null) => {
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

  const handleAddItemsFromCatalog = (
    picked: { product: EquipmentProduct; unitPrice: number }[],
    quantity: number
  ) => {
    setFormState((previous) => ({
      ...previous,
      items: [
        ...previous.items,
        ...picked.map((pickedItem, index) => {
          const product = pickedItem.product
          const item: FormItem = {
            localId: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            productId: product.id,
            itemName: product.name,
            brand: product.defaultBrand || '',
            model: product.defaultModel || '',
            characteristics: '',
            quantity,
            unitPrice: pickedItem.unitPrice,
            taxRate: Number(product.taxRate || 19),
            subtotal: quantity * pickedItem.unitPrice,
            taxTotal: quantity * pickedItem.unitPrice * (Number(product.taxRate || 19) / 100),
            total: quantity * pickedItem.unitPrice * (1 + Number(product.taxRate || 19) / 100),
            warrantyMonths: null,
            deliveryTime: '',
            notes: '',
            sortOrder: previous.items.length + index,
            otherFields: {}
          }
          return item
        })
      ]
    }))
  }

  const validateForm = (targetStatus: 'draft' | 'pending_approval') => {
    if (!formState.customerId) return 'Selecciona un cliente.'
    if (!formState.requestChannel?.trim()) return 'Define la via de solicitud.'
    if (formState.contactEmail?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.contactEmail.trim())) {
      return 'El email de contacto no es válido. Ingresa un email con formato correcto (ej: usuario@dominio.com).'
    }
    const validItems = formState.items.filter((item) => item.itemName.trim())
    if (!validItems.length) return 'Agrega al menos un producto.'
    if (validItems.some((item) => !item.itemName.trim() || !(Number(item.quantity) > 0))) {
      return 'Revisa nombre y cantidad de los productos.'
    }
    if (targetStatus === 'pending_approval') {
      if (!formState.paymentMethod) {
        setActiveSection(4)
        return 'Selecciona la forma de pago.'
      }
      if (!formState.deliveryTime) {
        setActiveSection(4)
        return 'Selecciona el tiempo de entrega de los equipos.'
      }
      if (formState.hasDiscount) {
        if (!formState.discountType || Number(formState.discountValue) <= 0) {
          setActiveSection(4)
          return 'Completa el tipo y valor del descuento.'
        }
      }
    }
    if (!requestEvidenceFile) {
      return 'Debes adjuntar la evidencia de solicitud.'
    }
    return null
  }

  const handleSave = async (targetStatus: 'draft' | 'pending_approval') => {
    const validationError = validateForm(targetStatus)
    if (validationError) {
      toast.error(validationError)
      return
    }
    try {
      const payload = buildPayload(formState, targetStatus)
      const savedQuotation = isEditing
        ? await updateQuotation.mutateAsync({ id: quotationId as string, payload })
        : await createQuotation.mutateAsync(payload)
      if (requestEvidenceFile) {
        try {
          await uploadDocument.mutateAsync({
            quotationId: String(savedQuotation.id),
            file: requestEvidenceFile,
            documentType: 'request_evidence',
            title: requestEvidenceTitle || `Evidencia de solicitud ${savedQuotation.quoteCode}`
          })
        } catch (uploadError) {
          console.error(uploadError)
          toast.error('La cotización se guardo, pero no fue posible subir la evidencia.')
          navigate(`/equipment-sales/${savedQuotation.id}`)
          return
        }
      }
      if (targetStatus === 'pending_approval') {
        try {
          const pdfDocument = await generateQuotePdf.mutateAsync(String(savedQuotation.id))
          const fileBlob = await downloadDocument.mutateAsync({
            quotationId: String(savedQuotation.id),
            documentId: String(pdfDocument.id)
          })
          const objectUrl = window.URL.createObjectURL(fileBlob as Blob)
          const anchor = window.document.createElement('a')
          anchor.href = objectUrl
          anchor.download = pdfDocument.originalFileName || `cotizacion-${savedQuotation.quoteCode}.pdf`
          anchor.target = '_blank'
          anchor.rel = 'noopener'
          anchor.click()
          window.URL.revokeObjectURL(objectUrl)
        } catch (pdfError) {
          console.error(pdfError)
          toast.error('No se pudo generar la cotización PDF.')
        }
      }
      toast.success(
        targetStatus === 'pending_approval'
          ? `Cotización ${savedQuotation.quoteCode} generada y guardada.`
          : `Cotización ${savedQuotation.quoteCode} guardada como borrador.`
      )
      navigate(`/equipment-sales/${savedQuotation.id}`)
    } catch (error) {
      console.error(error)
      toast.error(isEditing ? 'No pudimos actualizar la cotización.' : 'No pudimos crear la cotización.')
    }
  }

  const handleSaveSequenceConfig = async (values: { nextQuoteNumber: number }) => {
    try {
      await upsertSequenceConfig.mutateAsync(values)
      toast.success('El consecutivo inicial quedó configurado.')
      setIsSequenceDialogOpen(false)
    } catch (configError) {
      console.error(configError)
      toast.error('No pudimos guardar la configuración.')
    }
  }

  if (isLoadingQuotation) {
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
          Tu rol actual puede consultar cotizaciones, pero no crear ni editar
          esta etapa del flujo.
        </Alert>
      </Box>
    )
  }

  const TERM_VARIABLES: Record<string, string[]> = {
    paymentConditions: ['{{validityDays}}', '{{paymentMethod}}'],
    deliveryConditions: ['{{deliveryTime}}'],
    warrantyConditions: ['{{warrantyTerms}}']
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
                navigate(isEditing && quotationId ? `/equipment-sales/${quotationId}` : '/equipment-sales')
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
              {isEditing ? `Editar ${quotation?.quoteCode || 'cotización'}` : 'Nueva cotización de venta de equipos'}
            </Typography>
            <Typography variant='body2' sx={{ mt: 1, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, maxWidth: 700, fontSize: '0.9rem' }}>
              Cotización de venta de equipos con cliente, sede, condiciones comerciales,
              productos y evidencia de solicitud.
            </Typography>
          </Box>
          {quotation ? (
            <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
              <Chip
                label={EQUIPMENT_QUOTATION_STATUS_LABELS[quotation.status]}
                sx={{ fontWeight: 700, borderRadius: '8px', backgroundColor: EQUIPMENT_QUOTATION_STATUS_COLORS[quotation.status], color: '#fff' }}
              />
            </Stack>
          ) : null}
        </Stack>
      </Box>

      {!canEdit ? (
        <Alert severity='warning' sx={{ mb: 3 }}>
          Esta cotización ya no puede editarse desde el formulario base porque superó la etapa comercial inicial.
        </Alert>
      ) : null}

      {canEdit && hasChangeRequest ? (
        <Alert severity='warning' sx={{ mb: 3 }}>
          El cliente pidió modificar esta cotización.
          {typeof latestChangeRequest?.changeRequestReason === 'string'
            ? ` Motivo: ${latestChangeRequest.changeRequestReason}`
            : ''}
        </Alert>
      ) : null}

      {canAccessWorkspace && sequenceConfig ? (
        <Alert
          severity={sequenceConfig.initialized ? 'info' : 'warning'}
          sx={{ mb: 3 }}
          action={
            <Button color='inherit' size='small' onClick={() => setIsSequenceDialogOpen(true)}>
              Configurar
            </Button>
          }
        >
          {sequenceConfig.initialized
            ? 'Puedes ajustar el consecutivo de cotizaciones desde la configuración.'
            : 'Sin consecutivo configurado: el código se deriva automáticamente. Puedes definir uno manualmente desde la configuración.'}
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
          {/* ── Section 0: Cliente y alcance ── */}
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
                  ) : null}
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Autocomplete
                      options={customerOptions}
                      value={selectedCustomer}
                      onChange={(_, value) => handleCustomerChange(value)}
                      getOptionLabel={(option) => `${option.nombre} · ${option.identificacion}`}
                      disabled={!canEdit || isBusy}
                      renderInput={(params) => <TextField {...params} label='Cliente' required />}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      variant='text'
                      size='small'
                      disabled={!canEdit || isBusy}
                      onClick={() => setCustomerDialogMode('customer')}
                      sx={{ textTransform: 'none', fontWeight: 600 }}
                    >
                      + Nuevo cliente
                    </Button>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Sede</InputLabel>
                      <Select
                        value={formState.customerSite || ''}
                        label='Sede'
                        disabled={!canEdit || isBusy || !selectedCustomer}
                        onChange={(event) => {
                          const site = customerSites.find((candidate) => candidate.name === event.target.value)
                          handleCustomerSiteChange(site || { name: event.target.value })
                        }}
                      >
                        {customerSites.map((site) => (
                          <MenuItem key={site.name} value={site.name}>
                            {getSiteDisplayLabel(site)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth required>
                      <InputLabel>Vía de solicitud</InputLabel>
                      <Select
                        value={formState.requestChannel || ''}
                        label='Vía de solicitud'
                        disabled={!canEdit || isBusy}
                        onChange={(event) => setField('requestChannel', event.target.value)}
                      >
                        {REQUEST_CHANNEL_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ borderRadius: '16px', mb: 3, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both', position: 'relative', overflow: 'visible', '&::before': { content: '""', position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, borderRadius: '2px', background: 'linear-gradient(180deg, #7c3aed, #a78bfa)' } }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2 }}>
                  <UploadFileOutlinedIcon sx={{ color: '#7c3aed', fontSize: 20 }} />
                  <Typography variant='subtitle2' fontWeight={700} sx={{ color: '#374151' }}>
                    Evidencia de solicitud *
                  </Typography>
                  {requestEvidenceFile ? (
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
                </Stack>
              </CardContent>
            </Card>
          </div>

          {/* ── Section 1: Contacto y destino ── */}
          <div style={{ display: activeSection !== 1 ? 'none' : undefined }}>
            <Card elevation={0} sx={{ borderRadius: '16px', mb: 3, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both', position: 'relative', overflow: 'visible', '&::before': { content: '""', position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, borderRadius: '2px', background: 'linear-gradient(180deg, #f59e0b, #fbbf24)' } }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2.5 }}>
                  <Inventory2OutlinedIcon sx={{ color: '#d97706', fontSize: 22 }} />
                  <Typography variant='h6' fontWeight={800} sx={{ color: '#111827', letterSpacing: '-0.01em' }}>
                    Contacto y destino
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
                  <Grid item xs={12} md={4}>
                    <TextField fullWidth label='Dirección' value={formState.address || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('address', event.target.value)} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </div>

          {/* ── Section 2: Términos ── */}
          <div style={{ display: activeSection !== 2 ? 'none' : undefined }}>
            <Card elevation={0} sx={{ borderRadius: '16px', mb: 3, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both', position: 'relative', overflow: 'visible', '&::before': { content: '""', position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, borderRadius: '2px', background: 'linear-gradient(180deg, #6366f1, #818cf8)' } }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2.5 }}>
                  <UploadFileOutlinedIcon sx={{ color: '#4f46e5', fontSize: 22 }} />
                  <Typography variant='h6' fontWeight={800} sx={{ color: '#111827', letterSpacing: '-0.01em' }}>
                    Términos de la cotización
                  </Typography>
                </Stack>
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
                  <Typography variant='subtitle2' sx={{ mb: 1, color: '#166534' }}>
                    Variables disponibles:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip label='{{validityDays}} → Días de validez' size='small' color='success' variant='outlined' />
                    <Chip label='{{paymentMethod}} → Forma de pago' size='small' color='success' variant='outlined' />
                    <Chip label='{{deliveryTime}} → Tiempo de entrega' size='small' color='success' variant='outlined' />
                    <Chip label='{{warrantyTerms}} → Términos de garantía' size='small' color='success' variant='outlined' />
                  </Box>
                  <Typography variant='caption' sx={{ mt: 1, display: 'block', color: '#15803d' }}>
                    Escribe estas variables en el texto y serán reemplazadas automáticamente al generar el PDF.
                  </Typography>
                </Box>
                <Stack spacing={1.5}>
                  {EQUIPMENT_QUOTE_TERM_KEYS.map((termKey) => {
                    const vars = TERM_VARIABLES[termKey] || []
                    return (
                      <Accordion key={termKey} elevation={0}
                        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important' }}>
                        <AccordionSummary expandIcon={<ExpandMoreOutlinedIcon />}>
                          <Typography fontWeight={800}>
                            {EQUIPMENT_QUOTE_TERM_LABELS[termKey]}
                          </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          {vars.length > 0 && (
                            <Box sx={{ mb: 1.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                              {vars.map((v) => (
                                <Chip key={v} label={v} size='small' color='success' variant='outlined' sx={{ height: 22, fontSize: 11 }} />
                              ))}
                            </Box>
                          )}
                          <CalibrationServiceRichTextEditor
                            value={formState.quoteTerms?.[termKey] || ''}
                            placeholder={`Escribe ${EQUIPMENT_QUOTE_TERM_LABELS[termKey].toLowerCase()}`}
                            onChange={(value) => setQuoteTerm(termKey, value)}
                          />
                        </AccordionDetails>
                      </Accordion>
                    )
                  })}
                </Stack>
              </CardContent>
            </Card>
          </div>

          {/* ── Section 3: Ítems cotizados ── */}
          <div style={{ display: activeSection !== 3 ? 'none' : undefined }}>
            <Card elevation={0} sx={{ borderRadius: '16px', mb: 3, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both', position: 'relative', overflow: 'visible', '&::before': { content: '""', position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, borderRadius: '2px', background: 'linear-gradient(180deg, #ec4899, #f472b6)' } }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <EquipmentQuotationItemsEditor
                  items={formState.items}
                  onChange={(items) => setField('items', items)}
                  canEdit={canEdit}
                  isBusy={isBusy}
                  onAddItem={() => setCatalogPickerOpen(true)}
                />
              </CardContent>
            </Card>
          </div>

          {/* ── Section 4: Condiciones ── */}
          <div style={{ display: activeSection !== 4 ? 'none' : undefined }}>
            <Card elevation={0} sx={{ borderRadius: '16px', mb: 3, border: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', animation: 'fadeUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) 0.15s both', position: 'relative', overflow: 'visible', '&::before': { content: '""', position: 'absolute', left: 0, top: 16, bottom: 16, width: 3, borderRadius: '2px', background: 'linear-gradient(180deg, #0ea5e9, #38bdf8)' } }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Stack direction='row' alignItems='center' spacing={1.5} sx={{ mb: 2.5 }}>
                  <ReceiptLongOutlinedIcon sx={{ color: '#0284c7', fontSize: 22 }} />
                  <Typography variant='h6' fontWeight={800} sx={{ color: '#111827', letterSpacing: '-0.01em' }}>
                    Condiciones comerciales
                  </Typography>
                  {sectionCompletion[4] >= 1 ? (
                    <Chip icon={<CheckCircleOutlineOutlinedIcon sx={{ fontSize: 14 }} />} size='small' label='Completo' color='success' variant='outlined' sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.5 }, '& .MuiChip-icon': { fontSize: 14, ml: 0.5 } }} />
                  ) : null}
                </Stack>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label='Días de validez'
                      select
                      value={formState.validityDays ?? 30}
                      disabled={!canEdit || isBusy}
                      onChange={(event) => setField('validityDays', Number(event.target.value))}
                    >
                      {VALIDITY_DAY_OPTIONS.map((option) => (
                        <MenuItem key={option} value={option}>{option} días</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Forma de pago</InputLabel>
                      <Select
                        value={formState.paymentMethod || ''}
                        label='Forma de pago'
                        disabled={!canEdit || isBusy}
                        onChange={(event) => setField('paymentMethod', event.target.value)}
                      >
                        {PAYMENT_METHOD_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth required>
                      <InputLabel>Tiempo de entrega equipos</InputLabel>
                      <Select
                        value={formState.deliveryTime || ''}
                        label='Tiempo de entrega equipos'
                        disabled={!canEdit || isBusy}
                        onChange={(event) => setField('deliveryTime', event.target.value)}
                      >
                        {DELIVERY_TIME_OPTIONS.map((option) => (
                          <MenuItem key={option} value={option}>{option}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label='Términos de garantía'
                      value={formState.warrantyTerms || ''}
                      disabled={!canEdit || isBusy}
                      onChange={(event) => setField('warrantyTerms', event.target.value)}
                      placeholder='Ej: 1 año contra defectos de fábrica...'
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'flex-start', md: 'center' }}>
                      <Stack direction='row' alignItems='center' spacing={1}>
                        <Typography variant='body2' fontWeight={600}>¿Aplicar descuento?</Typography>
                        <Switch
                          checked={formState.hasDiscount}
                          disabled={!canEdit || isBusy}
                          onChange={(event) => setField('hasDiscount', event.target.checked)}
                        />
                      </Stack>
                      {formState.hasDiscount ? (
                        <>
                          <FormControl size='small' sx={{ minWidth: 150 }}>
                            <InputLabel>Tipo descuento</InputLabel>
                            <Select
                              value={formState.discountType || 'fixed'}
                              label='Tipo descuento'
                              disabled={!canEdit || isBusy}
                              onChange={(event) => setField('discountType', event.target.value)}
                            >
                              {DISCOUNT_TYPE_OPTIONS.map((option) => (
                                <MenuItem key={option.value} value={option.value}>{option.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                          <TextField
                            label={formState.discountType === 'percentage' ? 'Valor descuento (%)' : 'Valor descuento'}
                            type='number'
                            size='small'
                            value={formState.discountValue}
                            disabled={!canEdit || isBusy}
                            onChange={(event) => setField('discountValue', parseFloat(event.target.value) || 0)}
                            sx={{ width: 180 }}
                          />
                        </>
                      ) : null}
                    </Stack>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </div>
        </Grid>

        {/* ── Right sidebar: resumen económico ── */}
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={{ position: 'sticky', top: 24, borderRadius: '16px', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Typography variant='h6' fontWeight={800} sx={{ mb: 2 }}>Resumen económico</Typography>
              <Stack spacing={1} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>Subtotal</Typography>
                  <Typography variant='body2' fontWeight={700}>{currencyFormatter.format(subtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='body2' color='text.secondary'>IVA</Typography>
                  <Typography variant='body2' fontWeight={700}>{currencyFormatter.format(taxTotal)}</Typography>
                </Box>
                {discountTotal > 0 ? (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant='body2' color='text.secondary'>
                      Descuento ({formState.discountType === 'percentage' ? `${formState.discountValue}%` : currencyFormatter.format(discountTotal)})
                    </Typography>
                    <Typography variant='body2' fontWeight={700} sx={{ color: '#dc2626' }}>-{currencyFormatter.format(discountTotal)}</Typography>
                  </Box>
                ) : null}
                <Box sx={{ borderTop: '1px dashed rgba(0,0,0,0.12)', pt: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant='subtitle1' fontWeight={800}>TOTAL</Typography>
                  <Typography variant='h6' fontWeight={800} sx={{ color: '#059669' }}>{currencyFormatter.format(grandTotal)}</Typography>
                </Box>
              </Stack>
              <Stack spacing={1} sx={{ mb: 3 }}>
                {sections.map((section, index) => (
                  <Box key={section.key} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant='caption' color='text.secondary'>{section.label}</Typography>
                    <Chip
                      size='small'
                      label={`${Math.round(sectionCompletion[index] * 100)}%`}
                      color={sectionCompletion[index] >= 1 ? 'success' : 'default'}
                      variant='outlined'
                      sx={{ height: 20, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.8 } }}
                    />
                  </Box>
                ))}
              </Stack>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button
                  variant='contained'
                  startIcon={<SaveOutlinedIcon />}
                  onClick={() => handleSave('draft')}
                  disabled={isBusy}
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                >
                  Guardar borrador
                </Button>
                <Button
                  variant='contained'
                  color='success'
                  startIcon={<SendOutlinedIcon />}
                  onClick={() => handleSave('pending_approval')}
                  disabled={isBusy}
                  sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                >
                  Guardar y enviar cotización
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <EquipmentSalesCatalogProductPickerDialog
        open={catalogPickerOpen}
        products={productOptions}
        onClose={() => setCatalogPickerOpen(false)}
        onAddItems={handleAddItemsFromCatalog}
      />

      <EquipmentSalesSequenceConfigDialog
        open={isSequenceDialogOpen}
        config={sequenceConfig}
        isAdmin={isAdmin}
        isLoading={upsertSequenceConfig.isLoading}
        onClose={() => setIsSequenceDialogOpen(false)}
        onSubmit={handleSaveSequenceConfig}
      />

      {customerDialogMode ? (
        <EquipmentSalesCustomerDialog
          open
          mode={customerDialogMode}
          customer={customerDialogMode === 'site' ? selectedCustomer : null}
          isSubmitting={createCustomerMutation.isLoading || createCustomerSiteMutation.isLoading}
          onClose={() => setCustomerDialogMode(null)}
          onSubmit={(values) => {
            if (customerDialogMode === 'customer') {
              createCustomerMutation.mutate(values)
            } else {
              createCustomerSiteMutation.mutate(values)
            }
          }}
        />
      ) : null}
    </Box>
  )
}

export default EquipmentSalesWorkspacePage
