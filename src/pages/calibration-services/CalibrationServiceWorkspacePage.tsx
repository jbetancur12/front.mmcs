import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import SendOutlinedIcon from '@mui/icons-material/SendOutlined'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import { Toaster, toast } from 'react-hot-toast'
import { axiosPrivate } from '@utils/api'
import { useNavigate, useParams } from 'react-router-dom'
import {
  CALIBRATION_SERVICE_APPROVAL_COLORS,
  CALIBRATION_SERVICE_APPROVAL_LABELS,
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS
} from '../../constants/calibrationServices'
import {
  useCalibrationService,
  useCalibrationServiceMutations
} from '../../hooks/useCalibrationServices'
import {
  CalibrationServiceCustomer,
  CalibrationServiceItemPayload,
  CalibrationServicePayload,
  CalibrationServiceProductSummary
} from '../../types/calibrationService'

type FormItem = CalibrationServiceItemPayload & { localId: string }
type FormState = Omit<CalibrationServicePayload, 'items'> & { items: FormItem[] }

const REQUEST_CHANNEL_OPTIONS = ['En persona', 'Por Email', 'Por Telefono', 'Por WhatsApp']
const PAYMENT_METHOD_OPTIONS = ['De Contado', 'A 30 Dias', 'A 60 Dias', 'A 90 Dias', '50% / 50%']
const DELIVERY_TIME_OPTIONS = ['8 Dias Habiles', '15 Dias Habiles', '30 Dias Habiles']
const VALIDITY_DAY_OPTIONS = [8, 15, 30, 60, 90]
const SERVICE_TYPE_OPTIONS = ['Acreditado', 'Trazable', 'Especial']
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
  otherFields: {}
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
  internalNotes: '',
  otherFields: {},
  items: [createEmptyItem()]
})

const getItemTotals = (item: CalibrationServiceItemPayload) => {
  const subtotal = Math.max(Number(item.quantity) || 0, 0) * toNumber(item.unitPrice)
  const taxTotal = subtotal * (toNumber(item.taxRate) / 100)
  return { subtotal, taxTotal, total: subtotal + taxTotal }
}

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
  commercialComments: formState.commercialComments?.trim() || null,
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
  const { serviceId } = useParams<{ serviceId?: string }>()
  const isEditing = Boolean(serviceId)
  const { data: service, isLoading: isLoadingService } = useCalibrationService(serviceId)
  const { createService, updateService, uploadDocument } = useCalibrationServiceMutations()
  const { data: customers = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['calibration-service-customers'],
    queryFn: async () => {
      const response = await axiosPrivate.get<CalibrationServiceCustomer[]>('/customers')
      return response.data
    },
    staleTime: 5 * 60 * 1000
  })
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['calibration-service-products'],
    queryFn: async () => {
      const response = await axiosPrivate.get<CalibrationServiceProductSummary[]>('/products')
      return response.data
    },
    staleTime: 5 * 60 * 1000
  })

  const [formState, setFormState] = useState<FormState>(createInitialFormState)
  const [requestEvidenceFile, setRequestEvidenceFile] = useState<File | null>(null)
  const [requestEvidenceTitle, setRequestEvidenceTitle] = useState('')
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    if (!service || hydrated) return
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
        otherFields: item.otherFields || {}
      })) || [createEmptyItem()]
    })
    setRequestEvidenceTitle(`Evidencia de solicitud ${service.serviceCode}`)
    setHydrated(true)
  }, [hydrated, service])

  const selectedCustomer = customers.find((customer) => customer.id === formState.customerId) || null
  const customerSites = selectedCustomer?.sede ?? []
  const requestEvidenceDocuments =
    service?.documents?.filter((document) => document.documentType === 'request_evidence') || []
  const canEdit = !service || ['draft', 'pending_approval'].includes(service.status)
  const isBusy = createService.isLoading || updateService.isLoading || uploadDocument.isLoading

  const subtotal = formState.items.reduce((acc, item) => acc + getItemTotals(item).subtotal, 0)
  const taxTotal = formState.items.reduce((acc, item) => acc + getItemTotals(item).taxTotal, 0)
  const discountTotal = formState.hasDiscount
    ? formState.discountType === 'percentage'
      ? subtotal * (toNumber(formState.discountValue) / 100)
      : toNumber(formState.discountValue)
    : 0
  const grandTotal = subtotal + taxTotal - discountTotal

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((previous) => ({ ...previous, [field]: value }))
  }

  const setItemField = (localId: string, field: keyof FormItem, value: string | number | null) => {
    setFormState((previous) => ({
      ...previous,
      items: previous.items.map((item) =>
        item.localId === localId ? { ...item, [field]: value } : item
      )
    }))
  }

  const handleCustomerChange = (customer: CalibrationServiceCustomer | null) => {
    setFormState((previous) => ({
      ...previous,
      customerId: customer?.id ?? null,
      customerSite:
        previous.scopeType === 'site' ? customer?.sede?.[0] || previous.customerSite : previous.customerSite,
      contactEmail: previous.contactEmail || customer?.email || '',
      contactPhone: previous.contactPhone || customer?.telefono || '',
      city: previous.city || customer?.ciudad || '',
      department: previous.department || customer?.departamento || '',
      address: previous.address || customer?.direccion || ''
    }))
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
      toast.success(
        targetStatus === 'pending_approval'
          ? 'Servicio guardado y enviado a aprobacion.'
          : 'Servicio guardado como borrador.'
      )
      navigate(`/calibration-services/${savedService.id}`)
    } catch (error) {
      console.error(error)
      toast.error(isEditing ? 'No pudimos actualizar el servicio.' : 'No pudimos crear el servicio.')
    }
  }

  if (isLoadingService || isLoadingCustomers || isLoadingProducts) {
    return (
      <Box display='flex' justifyContent='center' alignItems='center' minHeight='55vh'>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box p={{ xs: 2, md: 3 }}>
      <Toaster position='top-center' />
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Button
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() =>
              navigate(isEditing && serviceId ? `/calibration-services/${serviceId}` : '/calibration-services')
            }
            sx={{ mb: 1 }}
          >
            Volver
          </Button>
          <Typography variant='h4' fontWeight={700}>
            {isEditing ? 'Editar servicio de calibracion' : 'Nuevo servicio de calibracion'}
          </Typography>
          <Typography variant='body1' color='text.secondary' sx={{ mt: 1 }}>
            Cotizacion base del servicio con cliente, sede, condiciones comerciales,
            items y evidencia de solicitud.
          </Typography>
        </Box>
        {service ? (
          <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
            <Chip color={CALIBRATION_SERVICE_STATUS_COLORS[service.status]} label={CALIBRATION_SERVICE_STATUS_LABELS[service.status]} />
            <Chip color={CALIBRATION_SERVICE_APPROVAL_COLORS[service.approvalStatus]} label={CALIBRATION_SERVICE_APPROVAL_LABELS[service.approvalStatus]} />
          </Stack>
        ) : null}
      </Stack>

      {!canEdit ? (
        <Alert severity='warning' sx={{ mb: 3 }}>
          Este servicio ya no puede editarse desde el formulario base porque supero la etapa comercial inicial.
        </Alert>
      ) : null}

      <Grid container spacing={2}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Typography variant='h6' fontWeight={700} gutterBottom>
                Cliente y alcance
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={customers}
                    value={selectedCustomer}
                    getOptionLabel={(option) => option.nombre || ''}
                    onChange={(_, value) => handleCustomerChange(value)}
                    disabled={!canEdit || isBusy}
                    renderInput={(params) => <TextField {...params} label='Cliente' required />}
                  />
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
                      <FormControl fullWidth>
                        <InputLabel>Sede</InputLabel>
                        <Select
                          value={formState.customerSite || ''}
                          label='Sede'
                          disabled={!canEdit || isBusy}
                          onChange={(event) => setField('customerSite', event.target.value)}
                        >
                          {customerSites.map((site) => (
                            <MenuItem key={site} value={site}>
                              {site}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        fullWidth
                        label='Sede'
                        value={formState.customerSite || ''}
                        disabled={!canEdit || isBusy}
                        onChange={(event) => setField('customerSite', event.target.value)}
                      />
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
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Typography variant='h6' fontWeight={700} gutterBottom>
                Contacto y ejecucion
              </Typography>
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
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label='Cliente de ejecucion' value={formState.executionCustomerName || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('executionCustomerName', event.target.value)} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label='Sede de ejecucion' value={formState.executionSiteName || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('executionSiteName', event.target.value)} />
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
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Typography variant='h6' fontWeight={700} gutterBottom>
                Condiciones comerciales
              </Typography>
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
                      <TextField fullWidth type='number' label='Valor descuento' value={formState.discountValue ?? 0} disabled={!canEdit || isBusy} onChange={(event) => setField('discountValue', Number(event.target.value))} />
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
                  <TextField fullWidth multiline minRows={3} label='Comentarios comerciales' value={formState.commercialComments || ''} disabled={!canEdit || isBusy} onChange={(event) => setField('commercialComments', event.target.value)} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3, mb: 2 }}>
            <CardContent>
              <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' spacing={2} mb={2}>
                <Box>
                  <Typography variant='h6' fontWeight={700}>
                    Items cotizados
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Version base editable. Luego la llevamos a tabla operativa.
                  </Typography>
                </Box>
                <Button variant='outlined' startIcon={<AddOutlinedIcon />} onClick={() => setFormState((previous) => ({ ...previous, items: [...previous.items, createEmptyItem()] }))} disabled={!canEdit || isBusy}>
                  Agregar item
                </Button>
              </Stack>
              <Stack spacing={2}>
                {formState.items.map((item, index) => {
                  const totals = getItemTotals(item)
                  const selectedProduct = products.find((product) => product.id === item.productId) || null
                  return (
                    <Card key={item.localId} variant='outlined'>
                      <CardContent>
                        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' spacing={2} mb={2}>
                          <Typography variant='subtitle1' fontWeight={700}>
                            Item {index + 1}
                          </Typography>
                          <Button color='error' startIcon={<DeleteOutlineOutlinedIcon />} onClick={() => setFormState((previous) => ({ ...previous, items: previous.items.length === 1 ? [createEmptyItem()] : previous.items.filter((candidate) => candidate.localId !== item.localId) }))} disabled={!canEdit || isBusy}>
                            Quitar
                          </Button>
                        </Stack>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Autocomplete
                              options={products}
                              value={selectedProduct}
                              getOptionLabel={(option) => option.name || ''}
                              onChange={(_, value) =>
                                setFormState((previous) => ({
                                  ...previous,
                                  items: previous.items.map((candidate) =>
                                    candidate.localId === item.localId
                                      ? {
                                          ...candidate,
                                          productId: value?.id ?? null,
                                          itemName: value?.name || candidate.itemName,
                                          unitPrice: value?.price ?? candidate.unitPrice
                                        }
                                      : candidate
                                  )
                                }))
                              }
                              disabled={!canEdit || isBusy}
                              renderInput={(params) => <TextField {...params} label='Producto catalogo' />}
                            />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField fullWidth required label='Item' value={item.itemName} disabled={!canEdit || isBusy} onChange={(event) => setItemField(item.localId, 'itemName', event.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <TextField fullWidth label='Instrumento' value={item.instrumentName || ''} disabled={!canEdit || isBusy} onChange={(event) => setItemField(item.localId, 'instrumentName', event.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={6}>
                            <FormControl fullWidth>
                              <InputLabel>Tipo servicio</InputLabel>
                              <Select value={item.serviceType || 'Trazable'} label='Tipo servicio' disabled={!canEdit || isBusy} onChange={(event) => setItemField(item.localId, 'serviceType', event.target.value)}>
                                {SERVICE_TYPE_OPTIONS.map((option) => (
                                  <MenuItem key={option} value={option}>
                                    {option}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField fullWidth label='Intervalo' value={item.intervalText || ''} disabled={!canEdit || isBusy} onChange={(event) => setItemField(item.localId, 'intervalText', event.target.value)} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField fullWidth type='number' label='Cantidad' value={item.quantity} disabled={!canEdit || isBusy} onChange={(event) => setItemField(item.localId, 'quantity', Number(event.target.value))} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField fullWidth type='number' label='Valor unitario' value={item.unitPrice} disabled={!canEdit || isBusy} onChange={(event) => setItemField(item.localId, 'unitPrice', Number(event.target.value))} />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <TextField fullWidth type='number' label='IVA %' value={item.taxRate} disabled={!canEdit || isBusy} onChange={(event) => setItemField(item.localId, 'taxRate', Number(event.target.value))} />
                          </Grid>
                          <Grid item xs={12} md={8}>
                            <TextField fullWidth multiline minRows={2} label='Notas del item' value={item.notes || ''} disabled={!canEdit || isBusy} onChange={(event) => setItemField(item.localId, 'notes', event.target.value)} />
                          </Grid>
                        </Grid>
                        <Divider sx={{ my: 2 }} />
                        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} justifyContent='space-between'>
                          <Typography variant='body2' color='text.secondary'>
                            Subtotal: {currencyFormatter.format(totals.subtotal)}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            IVA: {currencyFormatter.format(totals.taxTotal)}
                          </Typography>
                          <Typography variant='subtitle2' fontWeight={700}>
                            Total linea: {currencyFormatter.format(totals.total)}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  )
                })}
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ borderRadius: 3 }}>
            <CardContent>
              <Typography variant='h6' fontWeight={700} gutterBottom>
                Evidencia de solicitud
              </Typography>
              <Stack spacing={2}>
                <TextField fullWidth label='Titulo de la evidencia' value={requestEvidenceTitle} disabled={!canEdit || isBusy} onChange={(event) => setRequestEvidenceTitle(event.target.value)} />
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
                ) : (
                  <Alert severity='info'>Aun no hay evidencia de solicitud cargada.</Alert>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, position: { lg: 'sticky' }, top: { lg: 24 } }}>
            <CardContent>
              <Typography variant='h6' fontWeight={700} gutterBottom>
                Resumen economico
              </Typography>
              <Stack spacing={1.5}>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography color='text.secondary'>Subtotal</Typography>
                  <Typography fontWeight={600}>{currencyFormatter.format(subtotal)}</Typography>
                </Stack>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography color='text.secondary'>IVA</Typography>
                  <Typography fontWeight={600}>{currencyFormatter.format(taxTotal)}</Typography>
                </Stack>
                <Stack direction='row' justifyContent='space-between'>
                  <Typography color='text.secondary'>Descuento</Typography>
                  <Typography fontWeight={600}>{currencyFormatter.format(discountTotal)}</Typography>
                </Stack>
                <Divider />
                <Stack direction='row' justifyContent='space-between'>
                  <Typography variant='h6'>Total</Typography>
                  <Typography variant='h6' fontWeight={700}>
                    {currencyFormatter.format(grandTotal)}
                  </Typography>
                </Stack>
              </Stack>
              <Divider sx={{ my: 3 }} />
              <Stack spacing={1.5}>
                <Button variant='contained' startIcon={<SaveOutlinedIcon />} onClick={() => void handleSave('draft')} disabled={!canEdit || isBusy}>
                  Guardar borrador
                </Button>
                <Button variant='outlined' startIcon={<SendOutlinedIcon />} onClick={() => void handleSave('pending_approval')} disabled={!canEdit || isBusy}>
                  Guardar y enviar a aprobacion
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default CalibrationServiceWorkspacePage
