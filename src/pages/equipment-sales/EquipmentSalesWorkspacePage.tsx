import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import { useCallback } from 'react'
import {
  Accordion, AccordionDetails, AccordionSummary, Autocomplete, Box, Button,
  Card, CardContent, FormControl, Grid,
  InputLabel, MenuItem, Select, Stack, Switch, Tab, Tabs,
  TextField, Typography, Chip, IconButton
} from '@mui/material'
import {
  ArrowBack, ExpandMoreOutlined, GroupOutlined, Inventory2Outlined, ReceiptLongOutlined,
  RequestQuoteOutlined, UploadFileOutlined, Save, Send
} from '@mui/icons-material'
import { axiosPrivate } from '@utils/api'
import Swal from 'sweetalert2'
import { useEquipmentQuotation, useEquipmentSalesMutations } from '../../hooks/useEquipmentSales'
import { EQUIPMENT_QUOTATION_STATUS_LABELS, EQUIPMENT_QUOTATION_STATUS_COLORS } from '../../constants/equipmentSales'
import { EquipmentQuotationPayload } from '../../types/equipmentSales'
import EquipmentQuotationItemsEditor, { FormItem, createEmptyItem, calculateItemTotals } from './EquipmentQuotationItemsEditor'
import CalibrationServiceRichTextEditor from '../calibration-services/CalibrationServiceRichTextEditor'
import { EQUIPMENT_QUOTE_TERM_KEYS, EQUIPMENT_QUOTE_TERM_LABELS, mergeEquipmentQuoteTerms } from './equipmentQuoteTerms'

const REQUEST_CHANNEL_OPTIONS = ['En persona', 'Por Email', 'Por Telefono', 'Por WhatsApp']
const PAYMENT_METHOD_OPTIONS = ['De Contado', 'A 30 Dias', 'A 60 Dias', 'A 90 Dias', '50% / 50%', 'Credito 30 Dias', 'Credito 60 Dias']

interface CustomerSite {
  id?: number
  name: string
  address?: string
  city?: string
  department?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  isActive?: boolean
}

interface CustomerOption {
  id: number
  nombre: string
  identificacion: string
  email?: string
  telefono?: string
  ciudad?: string
  departamento?: string
  direccion?: string
  sede?: string[]
  sites?: CustomerSite[]
}

interface FormState {
  customerId: number | null
  customerSite: string
  contactName: string
  contactEmail: string
  contactPhone: string
  city: string
  department: string
  address: string
  validityDays: number
  paymentMethod: string
  deliveryTime: string
  warrantyTerms: string
  hasDiscount: boolean
  discountType: string
  discountValue: number
  commercialComments: string
  internalNotes: string
  quoteTerms: Record<string, string>
  items: FormItem[]
}

const TABS = [
  { index: 0, key: 'customer', label: 'Cliente y alcance', icon: <GroupOutlined /> },
  { index: 1, key: 'contact', label: 'Contacto y destino', icon: <Inventory2Outlined /> },
  { index: 2, key: 'commercial', label: 'Condiciones', icon: <ReceiptLongOutlined /> },
  { index: 3, key: 'items', label: 'Productos', icon: <RequestQuoteOutlined /> },
  { index: 4, key: 'terms', label: 'Términos', icon: <UploadFileOutlined /> }
]

const getCustomerSites = (customer: CustomerOption | null): CustomerSite[] => {
  if (!customer) return []
  if (customer.sites?.length) {
    return customer.sites.filter((s) => s.isActive !== false)
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

const initialFormState: FormState = {
  customerId: null,
  customerSite: '',
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
  items: [createEmptyItem()]
}

const EquipmentSalesWorkspacePage = () => {
  const navigate = useNavigate()
  const { quotationId } = useParams()
  const isEditing = !!quotationId
  const [activeTab, setActiveTab] = useState(0)
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const mutations = useEquipmentSalesMutations()

  const { data: quotationData, isLoading: loadingQuotation } = useEquipmentQuotation(isEditing ? quotationId : null)
  const { data: customers = [] } = useQuery({
    queryKey: ['equipment-sales-customers'],
    queryFn: async () => {
      const { data } = await axiosPrivate.get('/customers')
      return data as CustomerOption[]
    },
    staleTime: 5 * 60 * 1000
  })

  useEffect(() => {
    if (quotationData) {
      setFormState({
        customerId: quotationData.customerId,
        customerSite: quotationData.customerSite || '',
        contactName: quotationData.contactName || '',
        contactEmail: quotationData.contactEmail || '',
        contactPhone: quotationData.contactPhone || '',
        city: quotationData.city || '',
        department: quotationData.department || '',
        address: quotationData.address || '',
        validityDays: quotationData.validityDays || 30,
        paymentMethod: quotationData.paymentMethod || '',
        deliveryTime: quotationData.deliveryTime || '',
        warrantyTerms: quotationData.warrantyTerms || '',
        hasDiscount: quotationData.hasDiscount,
        discountType: quotationData.discountType || 'fixed',
        discountValue: Number(quotationData.discountValue) || 0,
        commercialComments: quotationData.commercialComments || '',
        internalNotes: quotationData.internalNotes || '',
        quoteTerms: mergeEquipmentQuoteTerms(quotationData.quoteTerms as Record<string, string> | null),
        items: quotationData.items?.length
          ? quotationData.items.map((i, idx) => ({
              localId: `item-${Date.now()}-${idx}`,
              productId: i.productId,
              itemName: i.itemName,
              brand: i.brand || '',
              model: i.model || '',
              characteristics: i.characteristics || '',
              quantity: i.quantity,
              unitPrice: Number(i.unitPrice),
              taxRate: Number(i.taxRate),
              subtotal: Number(i.subtotal),
              taxTotal: Number(i.taxTotal),
              total: Number(i.total),
              warrantyMonths: i.warrantyMonths,
              deliveryTime: i.deliveryTime || '',
              notes: i.notes || '',
              sortOrder: i.sortOrder,
              otherFields: {},
              expanded: false
            }))
          : [createEmptyItem()]
      })
    }
  }, [quotationData])

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((prev) => ({ ...prev, [field]: value }))
  }

  const setQuoteTerm = useCallback((key: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      quoteTerms: { ...prev.quoteTerms, [key]: value }
    }))
  }, [])

  const selectedCustomer = customers.find((c: CustomerOption) => c.id === formState.customerId)
  const customerSites = getCustomerSites(selectedCustomer)

  const handleCustomerChange = (customer: CustomerOption | null) => {
    if (!customer) {
      setFormState({ ...initialFormState })
      return
    }
    const firstSite = getCustomerSites(customer)[0]
    setFormState((prev) => ({
      ...prev,
      customerId: customer.id,
      customerSite: firstSite?.name || '',
      contactEmail: customer.email || '',
      contactPhone: customer.telefono || '',
      city: firstSite?.city || customer.ciudad || '',
      department: firstSite?.department || customer.departamento || '',
      address: firstSite?.address || customer.direccion || '',
    }))
  }

  const handleCustomerSiteChange = (siteName: string) => {
    const site = customerSites.find((s) => s.name === siteName)
    if (!site) {
      setField('customerSite', siteName)
      return
    }
    setFormState((prev) => ({
      ...prev,
      customerSite: site.name,
      contactName: site.contactName || prev.contactName || '',
      contactEmail: site.contactEmail || prev.contactEmail || selectedCustomer?.email || '',
      contactPhone: site.contactPhone || prev.contactPhone || selectedCustomer?.telefono || '',
      city: site.city || prev.city || selectedCustomer?.ciudad || '',
      department: site.department || prev.department || selectedCustomer?.departamento || '',
      address: site.address || prev.address || selectedCustomer?.direccion || '',
    }))
  }

  const validateForm = (): string | null => {
    if (!formState.customerId) return 'Selecciona un cliente.'
    if (!formState.contactName) return 'Ingresa el nombre de contacto.'
    const validItems = formState.items.filter((i) => i.itemName)
    if (validItems.length === 0) return 'Agrega al menos un producto con nombre.'
    return null
  }

  const buildPayload = (status: 'draft' | 'sent'): EquipmentQuotationPayload => {
    const validItems = formState.items.filter((i) => i.itemName).map((item, idx) => {
      const totals = calculateItemTotals(item as FormItem)
      return {
        productId: item.productId,
        itemName: item.itemName,
        brand: item.brand || null,
        model: item.model || null,
        characteristics: item.characteristics || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        subtotal: totals.subtotal || 0,
        taxTotal: totals.taxTotal || 0,
        total: totals.total || 0,
        warrantyMonths: item.warrantyMonths,
        deliveryTime: item.deliveryTime || null,
        notes: item.notes || null,
        sortOrder: idx,
        otherFields: {}
      }
    })

    return {
      customerId: formState.customerId,
      customerSite: formState.customerSite || null,
      contactName: formState.contactName || null,
      contactEmail: formState.contactEmail || null,
      contactPhone: formState.contactPhone || null,
      city: formState.city || null,
      department: formState.department || null,
      address: formState.address || null,
      validityDays: formState.validityDays,
      paymentMethod: formState.paymentMethod || null,
      deliveryTime: formState.deliveryTime || null,
      warrantyTerms: formState.warrantyTerms || null,
      hasDiscount: formState.hasDiscount,
      discountType: formState.discountType || null,
      discountValue: formState.discountValue,
      commercialComments: formState.commercialComments || null,
      internalNotes: formState.internalNotes || null,
      quoteTerms: formState.quoteTerms || null,
      status,
      items: validItems
    }
  }

  const handleSave = async (targetStatus: 'draft' | 'sent') => {
    const error = validateForm()
    if (error) {
      Swal.fire('Validación', error, 'warning')
      return
    }
    try {
      const payload = buildPayload(targetStatus)
      if (isEditing) {
        await mutations.updateQuotation.mutateAsync({ id: quotationId!, payload })
        Swal.fire('Guardado', 'Cotización actualizada correctamente', 'success')
      } else {
        await mutations.createQuotation.mutateAsync(payload)
        Swal.fire('Creada', 'Cotización creada correctamente', 'success')
      }
      navigate('/equipment-sales')
    } catch (err: any) {
      Swal.fire('Error', err?.response?.data?.error || 'Error al guardar', 'error')
    }
  }

  const tabCompletion = (index: number): number => {
    if (index === 0) return formState.customerId ? 100 : 0
    if (index === 1) return formState.contactName ? 100 : 40
    if (index === 2) return formState.paymentMethod ? 100 : 50
    if (index === 3) return formState.items.some((i) => i.itemName) ? 100 : 0
    if (index === 4) return formState.quoteTerms?.commercialComments ? 100 : 30
    return 50
  }

  if (isEditing && loadingQuotation) return <Typography>Cargando...</Typography>

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <IconButton onClick={() => navigate('/equipment-sales')}><ArrowBack /></IconButton>
        <Box>
          <Typography variant='h5' sx={{ fontWeight: 700 }}>
            {isEditing ? `Editar ${quotationData?.quoteCode}` : 'Nueva Cotización - Venta de Equipos'}
          </Typography>
          {quotationData && (
            <Chip label={EQUIPMENT_QUOTATION_STATUS_LABELS[quotationData.status]}
              size='small' sx={{ backgroundColor: EQUIPMENT_QUOTATION_STATUS_COLORS[quotationData.status], color: '#fff' }} />
          )}
        </Box>
      </Box>

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant='scrollable' sx={{ mb: 2 }}>
        {TABS.map((tab) => (
          <Tab key={tab.key} label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {tab.icon}
              <span>{tab.label}</span>
              <Chip label={`${tabCompletion(tab.index)}%`} size='small'
                color={tabCompletion(tab.index) === 100 ? 'success' : 'default'} />
            </Box>
          } />
        ))}
      </Tabs>

      <Grid container spacing={2.5}>
        <Grid item xs={12} lg={8}>
          {/* Tab 0: Customer */}
          <Card sx={{ display: activeTab === 0 ? 'block' : 'none', borderLeft: '4px solid #4caf50' }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2 }}>Cliente y alcance</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Autocomplete
                    options={customers}
                    value={selectedCustomer || null}
                    onChange={(_, val) => handleCustomerChange(val)}
                    getOptionLabel={(o) => `${o.nombre} · ${o.identificacion}`}
                    renderInput={(params) => <TextField {...params} label='Cliente' required />}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Sede</InputLabel>
                    <Select
                      value={formState.customerSite || ''}
                      label='Sede'
                      disabled={!selectedCustomer}
                      onChange={(e) => handleCustomerSiteChange(e.target.value)}
                    >
                      {customerSites.map((site) => (
                        <MenuItem key={site.name} value={site.name}>
                          {[site.name, site.city, site.department].filter(Boolean).join(' · ')}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Canal de solicitud</InputLabel>
                    <Select
                      value={formState.commercialComments || ''}
                      label='Canal de solicitud'
                      onChange={(e) => setField('commercialComments', e.target.value)}
                    >
                      {REQUEST_CHANNEL_OPTIONS.map((opt) => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tab 1: Contact */}
          <Card sx={{ display: activeTab === 1 ? 'block' : 'none', borderLeft: '4px solid #ff9800' }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2 }}>Contacto y destino</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField label='Nombre de contacto' fullWidth required value={formState.contactName}
                    onChange={(e) => setField('contactName', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label='Email' fullWidth type='email' value={formState.contactEmail}
                    onChange={(e) => setField('contactEmail', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label='Teléfono' fullWidth value={formState.contactPhone}
                    onChange={(e) => setField('contactPhone', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label='Ciudad' fullWidth value={formState.city}
                    onChange={(e) => setField('city', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label='Departamento' fullWidth value={formState.department}
                    onChange={(e) => setField('department', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField label='Dirección' fullWidth value={formState.address}
                    onChange={(e) => setField('address', e.target.value)} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tab 2: Commercial conditions */}
          <Card sx={{ display: activeTab === 2 ? 'block' : 'none', borderLeft: '4px solid #3f51b5' }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2 }}>Condiciones comerciales</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField label='Días de validez' type='number' fullWidth value={formState.validityDays}
                    onChange={(e) => setField('validityDays', parseInt(e.target.value) || 30)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth>
                    <InputLabel>Forma de pago</InputLabel>
                    <Select
                      value={formState.paymentMethod || ''}
                      label='Forma de pago'
                      onChange={(e) => setField('paymentMethod', e.target.value)}
                    >
                      {PAYMENT_METHOD_OPTIONS.map((opt) => (
                        <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label='Tiempo de entrega' fullWidth value={formState.deliveryTime}
                    onChange={(e) => setField('deliveryTime', e.target.value)}
                    placeholder='Ej: 15 días hábiles' />
                </Grid>
                <Grid item xs={12}>
                  <TextField label='Términos de garantía' multiline rows={2} fullWidth value={formState.warrantyTerms}
                    onChange={(e) => setField('warrantyTerms', e.target.value)}
                    placeholder='Ej: 1 año contra defectos de fábrica...' />
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography>¿Aplicar descuento?</Typography>
                    <Switch checked={formState.hasDiscount}
                      onChange={(e) => setField('hasDiscount', e.target.checked)} />
                    {formState.hasDiscount && (
                      <TextField label='Valor descuento' type='number' size='small'
                        value={formState.discountValue}
                        onChange={(e) => setField('discountValue', parseFloat(e.target.value) || 0)}
                        sx={{ width: 150 }} />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tab 3: Items */}
          <Card sx={{ display: activeTab === 3 ? 'block' : 'none', borderLeft: '4px solid #e91e63' }}>
            <CardContent>
              <EquipmentQuotationItemsEditor
                items={formState.items}
                onChange={(items) => setField('items', items)}
              />
            </CardContent>
          </Card>

          {/* Tab 4: Terms */}
          <Card sx={{ display: activeTab === 4 ? 'block' : 'none', borderLeft: '4px solid #9c27b0' }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2 }}>Términos y condiciones</Typography>

              <Box sx={{ mb: 3, p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
                <Typography variant='subtitle2' sx={{ mb: 1, color: '#166534' }}>
                  Variables disponibles:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  <Chip label='{{validityDays}}' size='small' color='success' variant='outlined' />
                  <Chip label='{{paymentMethod}}' size='small' color='success' variant='outlined' />
                  <Chip label='{{deliveryTime}}' size='small' color='success' variant='outlined' />
                  <Chip label='{{warrantyTerms}}' size='small' color='success' variant='outlined' />
                </Box>
                <Typography variant='caption' sx={{ mt: 1, display: 'block', color: '#15803d' }}>
                  Escribe estas variables en el texto y serán reemplazadas automáticamente al generar el PDF.
                </Typography>
              </Box>

              <Stack spacing={1.5}>
                {EQUIPMENT_QUOTE_TERM_KEYS.map((termKey) => {
                  const variablesForTerm: Record<string, string[]> = {
                    paymentConditions: ['{{validityDays}}', '{{paymentMethod}}'],
                    deliveryConditions: ['{{deliveryTime}}'],
                    warrantyConditions: ['{{warrantyTerms}}'],
                  }
                  const vars = variablesForTerm[termKey] || []
                  return (
                    <Accordion key={termKey} elevation={0}
                      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px !important' }}>
                      <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
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
        </Grid>

        {/* Right sidebar: economic summary */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ position: 'sticky', top: 24 }}>
            <CardContent>
              <Typography variant='h6' sx={{ mb: 2 }}>Resumen económico</Typography>
              {(() => {
                const items = formState.items.filter((i) => i.itemName)
                const subtotal = items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0)
                const tax = items.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0) * (i.taxRate || 0) / 100, 0)
                const discount = formState.hasDiscount ? (formState.discountValue || 0) : 0
                const grandTotal = subtotal + tax - discount
                return (
                  <>
                    <Typography variant='body2' sx={{ mb: 1 }}>Subtotal: <strong>${subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</strong></Typography>
                    <Typography variant='body2' sx={{ mb: 1 }}>IVA: <strong>${tax.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</strong></Typography>
                    {discount > 0 && <Typography variant='body2' sx={{ mb: 1 }}>Dto.: <strong>-${discount.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</strong></Typography>}
                    <Typography variant='h6' sx={{ mb: 2, borderTop: 1, pt: 1, borderColor: 'divider' }}>
                      Total: ${grandTotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </Typography>
                  </>
                )
              })()}

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Button variant='contained' color='primary' startIcon={<Save />}
                  onClick={() => handleSave('draft')}
                  disabled={mutations.createQuotation.isLoading || mutations.updateQuotation.isLoading}>
                  Guardar borrador
                </Button>
                <Button variant='contained' color='success' startIcon={<Send />}
                  onClick={() => handleSave('sent')}
                  disabled={mutations.createQuotation.isLoading || mutations.updateQuotation.isLoading}>
                  Guardar y enviar
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}

export default EquipmentSalesWorkspacePage
