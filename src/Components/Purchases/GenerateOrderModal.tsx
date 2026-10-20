// src/Components/Purchases/GenerateOrderModal.tsx
import { useState, useEffect, FC, ChangeEvent } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
  MenuItem,
  Checkbox,
  Grid,
  Box,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material'
import { Close, DeleteOutline } from '@mui/icons-material'
import { PURCHASE_TEAL, PURCHASE_TEAL_HOVER } from './purchaseTableStyle'
import Swal from 'sweetalert2'
import {
  useCreatePurchaseOrder,
  useFiscalSettings
} from 'src/hooks/purchases/usePurchaseOrders'
import {
  PurchaseRequestItem,
  Supplier,
  PurchaseRequest,
  PurchaseOrder
} from 'src/pages/Purchases/Types' // Asegúrate que estas rutas sean correctas
import { NumericFormat } from 'react-number-format'

interface AssignedItem {
  purchaseRequestItemId: string
  description: string
  quantity: number
  unitValue: string // Se mantiene como string por NumericFormat, se parsea para cálculos
  total: number // quantity * unitValue (subtotal original del ítem)
  itemType: 'service' | 'purchase'
  applyIVA: boolean
  ivaPercentageForItem: string // Se mantiene como string, se parsea para cálculos
}

interface GenerateOrderModalProps {
  open: boolean
  onClose: () => void
  purchaseRequest: PurchaseRequest
  onSuccess: () => void
}


const GenerateOrderModal: FC<GenerateOrderModalProps> = ({
  open,
  onClose,
  purchaseRequest,
  onSuccess
}) => {
  const [orderData, setOrderData] = useState<
    Omit<PurchaseOrder, 'purchaseRequestId' | 'purchaseRequest'>
  >({
    code: '',
    requestDate: new Date().toISOString().slice(0, 10),
    deliveryDate: new Date().toISOString().slice(0, 10),
    deliveryPlace: 'Calle 35 No. 13 - 46 Barrio, Guadalupe',
    paymentMethod: 'Contado',
    installments: 'N/A',
    freight: 'Asume Metromedics',
    observations: '',
    totalBeforeVAT: 0, // Suma de item.total (subtotal bruto de la orden)
    vat: 0,
    retefuente: 0,
    retecree: 0,
    discount: 0, // Valor del descuento (calculado a partir de discountPercentage)
    total: 0,
    requirements: purchaseRequest.requirements || ['No hay requerimientos']
  })
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [selectedSupplierFull, setSelectedSupplierFull] =
    useState<Supplier | null>(null)
  const [assignedItems, setAssignedItems] = useState<AssignedItem[]>([])
  const [removedItems, setRemovedItems] = useState<string[]>([])
  const [_pendingItems, setPendingItems] = useState<PurchaseRequestItem[]>([])
  const [discountPercentage, setDiscountPercentage] = useState<number>(0) // Porcentaje de descuento ingresado por el usuario

  const {
    data: fiscalSettings,
    isLoading: isLoadingFiscalSettings,
    error: fiscalSettingsError
  } = useFiscalSettings()
  const createOrder = useCreatePurchaseOrder()

  const handleSubmitOrder = async () => {
    if (!selectedSupplier) {
      Swal.fire('Advertencia', 'Por favor, seleccione un proveedor.', 'warning')
      return
    }
    if (assignedItems.length === 0) {
      Swal.fire(
        'Advertencia',
        'No hay ítems asignados para este proveedor.',
        'warning'
      )
      return
    }
    if (isLoadingFiscalSettings) {
      Swal.fire(
        'Info',
        'Cargando configuración fiscal, por favor espere.',
        'info'
      )
      return
    }
    if (fiscalSettingsError || !fiscalSettings) {
      Swal.fire(
        'Error',
        'No se pudo cargar la configuración fiscal necesaria.',
        'error'
      )
      return
    }

    // El orderData.discount ya es el valor calculado, no el porcentaje
    // El orderData.total ya está calculado con el descuento comercial aplicado
    const payload = {
      purchaseRequestId: purchaseRequest.id,
      supplierId: selectedSupplier,
      orderData: {
        ...orderData, // Contiene todos los valores calculados, incluyendo el total final
        requirements: purchaseRequest.requirements || [],
        // Asegurar que los valores numéricos se envíen como números
        totalBeforeVAT: Number(orderData.totalBeforeVAT) || 0,
        vat: Number(orderData.vat) || 0,
        retefuente: Number(orderData.retefuente) || 0,
        retecree: Number(orderData.retecree) || 0,
        discount: Number(orderData.discount) || 0, // Este es el valor del descuento
        total: Number(orderData.total) || 0
      },
      items: assignedItems.map((item) => ({
        purchaseRequestItemId: item.purchaseRequestItemId,
        unitValue:
          parseFloat(String(item.unitValue).replace(/[^0-9.-]+/g, '')) || 0,
        quantity: item.quantity,
        total: item.total, // Subtotal original del ítem (cantidad * valor unitario)
        itemType: item.itemType,
        applyIVA: item.applyIVA,
        ivaPercentageForItem: parseFloat(item.ivaPercentageForItem) || 0
      }))
    }

    try {
      await createOrder.mutateAsync(payload)
      Swal.fire('Éxito', 'La orden de compra ha sido generada.', 'success')
      const processedIds = assignedItems.map(
        (item) => item.purchaseRequestItemId
      )
      setPendingItems((prev) =>
        prev.filter((item) => !processedIds.includes(item.id.toString()))
      )
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error generating purchase order:', error)
      Swal.fire('Error', 'No se pudo generar la orden de compra.', 'error')
    }
  }

  const availableSuppliers: Supplier[] = Array.from(
    new Set(
      (purchaseRequest.items ?? [])
        .filter((item) => !item.procesed)
        .flatMap((item) =>
          item.suppliers ? item.suppliers.map((s) => s.id.toString()) : []
        )
    )
  )
    .map((supplierId: string) => {
      const itemWithSupplier = (purchaseRequest.items ?? []).find(
        (item) =>
          !item.procesed &&
          item.suppliers?.some((s) => s.id.toString() === supplierId)
      )
      return (
        itemWithSupplier?.suppliers?.find(
          (s) => s.id.toString() === supplierId
        ) || null
      )
    })
    .filter((s): s is Supplier => s !== null)

  useEffect(() => {
    if (selectedSupplier) {
      const supplierDetails = availableSuppliers.find(
        (s) => s.id.toString() === selectedSupplier
      )
      setSelectedSupplierFull(supplierDetails || null)
      const itemsForSupplier: AssignedItem[] = (purchaseRequest.items ?? [])
        .filter(
          (item) =>
            !item.procesed &&
            item.suppliers?.some((s) => s.id.toString() === selectedSupplier) &&
            !removedItems.includes(item.id.toString())
        )
        .map((item) => ({
          purchaseRequestItemId: item.id.toString(),
          description: item.description,
          quantity: item.quantity,
          unitValue: '',
          total: 0,
          itemType: 'purchase',
          applyIVA: true,
          ivaPercentageForItem:
            fiscalSettings?.IVA_GENERAL_RATE_PERCENTAGE?.toString() || '19'
        }))
      setAssignedItems(itemsForSupplier)
    } else {
      setSelectedSupplierFull(null)
      setAssignedItems([])
    }
  }, [selectedSupplier, removedItems, purchaseRequest.items, fiscalSettings])

  const handleOrderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setOrderData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSupplierChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedSupplier(e.target.value)
    setRemovedItems([])
  }

  const handleItemChange = (
    index: number,
    field: keyof AssignedItem,
    value: string | boolean | number
  ) => {
    setAssignedItems((prevItems) => {
      const newItems = [...prevItems]
      ;(newItems[index] as any)[field] = value
      if (field === 'unitValue' || field === 'quantity') {
        const quantity = Number(newItems[index].quantity) || 0
        const unitValue =
          parseFloat(
            String(newItems[index].unitValue).replace(/[^0-9.-]+/g, '')
          ) || 0
        newItems[index].total = unitValue * quantity
      }
      return newItems
    })
  }

  const handleRemoveItem = (itemId: string) => {
    setRemovedItems((prev) => [...prev, itemId])
  }

  // 1. Calcular Total Bruto Antes de IVA y Descuento (Subtotal Original)
  useEffect(() => {
    const grossSubtotal = assignedItems.reduce(
      (sum, item) => sum + item.total,
      0
    )
    setOrderData((prev) => ({ ...prev, totalBeforeVAT: grossSubtotal }))
  }, [assignedItems])

  // 2. Calcular el Valor del Descuento
  useEffect(() => {
    const grossSubtotal = Number(orderData.totalBeforeVAT) || 0
    const percentage = Number(discountPercentage) || 0
    const validPercentage = Math.max(0, percentage) // Evitar descuento negativo
    const calculatedDiscountAmount = (grossSubtotal * validPercentage) / 100
    setOrderData((prev) => ({
      ...prev,
      discount: parseFloat(calculatedDiscountAmount.toFixed(2))
    }))
  }, [discountPercentage, orderData.totalBeforeVAT])

  // 3. Calcular IVA Total (sobre la base después del descuento)
  useEffect(() => {
    const grossSubtotal = Number(orderData.totalBeforeVAT) || 0
    const discountAmount = Number(orderData.discount) || 0
    let totalVAT = 0

    if (grossSubtotal > 0) {
      assignedItems.forEach((item) => {
        if (item.applyIVA) {
          const itemOriginalSubtotal = item.total // Subtotal original del ítem
          const itemProportion = itemOriginalSubtotal / grossSubtotal
          const itemDiscount = discountAmount * itemProportion
          const itemTaxableBase = itemOriginalSubtotal - itemDiscount
          const itemIVAPerc = parseFloat(item.ivaPercentageForItem) / 100 || 0
          totalVAT += itemTaxableBase * itemIVAPerc
        }
      })
    } else {
      // Si grossSubtotal es 0, pero algún ítem podría tener IVA (caso raro, ej. ítem de $0 con IVA)
      assignedItems.forEach((item) => {
        if (item.applyIVA && item.total === 0) {
          const itemIVAPerc = parseFloat(item.ivaPercentageForItem) / 100 || 0
          totalVAT += 0 * itemIVAPerc // Explicitly 0
        }
      })
    }
    setOrderData((prev) => ({ ...prev, vat: parseFloat(totalVAT.toFixed(2)) }))
  }, [assignedItems, orderData.totalBeforeVAT, orderData.discount])

  // 4. Calcular Retefuente (sobre la base después del descuento)
  useEffect(() => {
    if (
      !selectedSupplierFull ||
      !selectedSupplierFull.applyRetention ||
      isLoadingFiscalSettings ||
      !fiscalSettings
    ) {
      setOrderData((prev) => ({ ...prev, retefuente: 0 }))
      return
    }

    const {
      PURCHASE_RETENTION_RATE = 0,
      SERVICE_RETENTION_RATE = 0,
      PURCHASE_MINIMUM_BASE = 0,
      SERVICE_MINIMUM_BASE = 0
    } = fiscalSettings

    const grossSubtotal = Number(orderData.totalBeforeVAT) || 0
    const discountAmount = Number(orderData.discount) || 0

    let discountedPurchasesBase = 0
    let discountedServicesBase = 0

    if (grossSubtotal > 0) {
      assignedItems.forEach((item) => {
        const itemOriginalSubtotal = item.total
        const itemProportion = itemOriginalSubtotal / grossSubtotal
        const itemDiscount = discountAmount * itemProportion
        const itemTaxableBase = itemOriginalSubtotal - itemDiscount

        if (item.itemType === 'purchase') {
          discountedPurchasesBase += itemTaxableBase
        } else if (item.itemType === 'service') {
          discountedServicesBase += itemTaxableBase
        }
      })
    }

    let calculatedRetefuente = 0
    if (discountedPurchasesBase >= PURCHASE_MINIMUM_BASE) {
      calculatedRetefuente += discountedPurchasesBase * PURCHASE_RETENTION_RATE
    }
    if (discountedServicesBase >= SERVICE_MINIMUM_BASE) {
      calculatedRetefuente += discountedServicesBase * SERVICE_RETENTION_RATE
    }
    setOrderData((prev) => ({
      ...prev,
      retefuente: parseFloat(calculatedRetefuente.toFixed(2))
    }))
  }, [
    assignedItems,
    selectedSupplierFull,
    fiscalSettings,
    isLoadingFiscalSettings,
    orderData.totalBeforeVAT,
    orderData.discount
  ])

  // 5. Calcular Total Final
  useEffect(() => {
    const subtotalOriginal = Number(orderData.totalBeforeVAT) || 0
    const discountVal = Number(orderData.discount) || 0
    const vatVal = Number(orderData.vat) || 0
    const retefuenteVal = Number(orderData.retefuente) || 0
    const retecreeVal = Number(orderData.retecree) || 0 // Asumimos que este es un valor, no un %

    const subtotalAfterDiscount = subtotalOriginal - discountVal

    const finalTotal =
      subtotalAfterDiscount + vatVal - retefuenteVal - retecreeVal

    setOrderData((prev) => ({
      ...prev,
      total: parseFloat(finalTotal.toFixed(2))
    }))
  }, [
    orderData.totalBeforeVAT,
    orderData.vat,
    orderData.retefuente,
    orderData.retecree,
    orderData.discount
  ])

  const formatCOP = (value: number | string) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Number(value) || 0)

  const blockedReason = isLoadingFiscalSettings
    ? 'Cargando configuración fiscal...'
    : !selectedSupplier
      ? 'Elige un proveedor para continuar'
      : assignedItems.length === 0
        ? 'Este proveedor no tiene ítems pendientes de orden'
        : ''

  const sectionTitle = (text: string) => (
    <Typography variant='subtitle1' fontWeight={700} sx={{ mb: 1.5 }}>
      {text}
    </Typography>
  )

  const summaryRow = (label: string, value: number | string, bold = false) => (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        py: 0.5,
        fontWeight: bold ? 700 : 400
      }}
    >
      <Typography variant='body2' color='text.secondary'>
        {label}
      </Typography>
      <Typography variant='body2' fontWeight='inherit'>
        {formatCOP(value)}
      </Typography>
    </Box>
  )

  return (
    <Dialog open={open} onClose={onClose} maxWidth='lg' fullWidth>
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <Box>
          <Typography variant='h6' component='span' fontWeight={700}>
            Generar orden · {purchaseRequest.purchaseCode}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            {[
              purchaseRequest.applicantName,
              purchaseRequest.purchaseType
                ? `Tipo ${purchaseRequest.purchaseType}`
                : null
            ]
              .filter(Boolean)
              .join(' · ')}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label='Cerrar'>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        {isLoadingFiscalSettings && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant='body2'>
              Cargando configuración fiscal...
            </Typography>
          </Box>
        )}
        {fiscalSettingsError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            Error al cargar la configuración fiscal:{' '}
            {fiscalSettingsError.message}. Los cálculos pueden ser incorrectos.
          </Alert>
        )}

        {sectionTitle('Proveedor')}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <TextField
              select
              label='Proveedor'
              value={selectedSupplier}
              onChange={handleSupplierChange}
              fullWidth
              required
              disabled={isLoadingFiscalSettings}
            >
              {availableSuppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id.toString()}>
                  {supplier.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Código de la orden (opcional)'
              name='code'
              fullWidth
              value={orderData.code}
              onChange={handleOrderChange}
              disabled={isLoadingFiscalSettings}
            />
          </Grid>
        </Grid>

        {sectionTitle('Entrega y pago')}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label='Fecha de solicitud'
              name='requestDate'
              type='date'
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={orderData.requestDate}
              onChange={handleOrderChange}
              disabled={isLoadingFiscalSettings}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              label='Fecha de entrega'
              name='deliveryDate'
              type='date'
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={orderData.deliveryDate}
              onChange={handleOrderChange}
              disabled={isLoadingFiscalSettings}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Lugar de entrega'
              name='deliveryPlace'
              fullWidth
              value={orderData.deliveryPlace}
              onChange={handleOrderChange}
              disabled={isLoadingFiscalSettings}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label='Método de pago'
              name='paymentMethod'
              fullWidth
              value={orderData.paymentMethod}
              onChange={handleOrderChange}
              disabled={isLoadingFiscalSettings}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label='Cuotas'
              name='installments'
              fullWidth
              value={orderData.installments}
              onChange={handleOrderChange}
              disabled={isLoadingFiscalSettings}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label='Flete'
              name='freight'
              fullWidth
              value={orderData.freight}
              onChange={handleOrderChange}
              disabled={isLoadingFiscalSettings}
            />
          </Grid>
        </Grid>

        {selectedSupplier && assignedItems.length > 0 && (
          <>
            <Divider sx={{ mb: 2 }} />
            {sectionTitle(
              `Ítems de ${selectedSupplierFull?.name || 'el proveedor'}`
            )}
            <Box sx={{ overflowX: 'auto', mb: 3 }}>
              <Table size='small'>
                <TableHead>
                  <TableRow sx={{ '& th': { bgcolor: '#f5f5f5', fontWeight: 600 } }}>
                    <TableCell>Descripción</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Tipo</TableCell>
                    <TableCell>Cant.</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>Valor unitario</TableCell>
                    <TableCell align='right' sx={{ minWidth: 120 }}>
                      Total
                    </TableCell>
                    <TableCell sx={{ minWidth: 90 }}>IVA %</TableCell>
                    <TableCell>Aplica IVA</TableCell>
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {assignedItems.map((item, index) => (
                    <TableRow key={item.purchaseRequestItemId}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <TextField
                          select
                          value={item.itemType}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'itemType',
                              e.target.value as 'service' | 'purchase'
                            )
                          }
                          size='small'
                          sx={{ minWidth: 100 }}
                          disabled={isLoadingFiscalSettings}
                        >
                          <MenuItem value='purchase'>Compra</MenuItem>
                          <MenuItem value='service'>Servicio</MenuItem>
                        </TextField>
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <NumericFormat
                          value={item.unitValue}
                          thousandSeparator=','
                          decimalSeparator='.'
                          prefix={'$ '}
                          customInput={TextField}
                          size='small'
                          onValueChange={(values) =>
                            handleItemChange(index, 'unitValue', values.value)
                          }
                          sx={{ minWidth: 120 }}
                          disabled={isLoadingFiscalSettings}
                        />
                      </TableCell>
                      <TableCell align='right'>
                        <Typography variant='body2' fontWeight={600}>
                          {formatCOP(item.total)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <NumericFormat
                          value={item.ivaPercentageForItem}
                          customInput={TextField}
                          suffix={'%'}
                          size='small'
                          onValueChange={(values) =>
                            handleItemChange(
                              index,
                              'ivaPercentageForItem',
                              values.value
                            )
                          }
                          sx={{ minWidth: 80 }}
                          disabled={isLoadingFiscalSettings || !item.applyIVA}
                        />
                      </TableCell>
                      <TableCell>
                        <Checkbox
                          checked={item.applyIVA}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              'applyIVA',
                              e.target.checked
                            )
                          }
                          size='small'
                          sx={{
                            color: PURCHASE_TEAL,
                            '&.Mui-checked': { color: PURCHASE_TEAL }
                          }}
                          disabled={isLoadingFiscalSettings}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title='Quitar de la orden'>
                          <span>
                            <IconButton
                              size='small'
                              color='error'
                              onClick={() =>
                                handleRemoveItem(item.purchaseRequestItemId)
                              }
                              disabled={isLoadingFiscalSettings}
                              aria-label='Quitar de la orden'
                            >
                              <DeleteOutline />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </>
        )}

        {selectedSupplier && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={7}>
              {sectionTitle('Observaciones')}
              <TextField
                multiline
                minRows={4}
                maxRows={8}
                label='Observaciones'
                name='observations'
                fullWidth
                value={orderData.observations}
                onChange={handleOrderChange}
                disabled={isLoadingFiscalSettings}
              />
            </Grid>
            <Grid item xs={12} md={5}>
              {sectionTitle('Resumen')}
              <Box
                sx={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 2,
                  p: 2
                }}
              >
                {summaryRow('Total antes de IVA', orderData.totalBeforeVAT)}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.5,
                    gap: 1
                  }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    Descuento
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <NumericFormat
                      value={discountPercentage}
                      suffix={'%'}
                      customInput={TextField}
                      size='small'
                      onValueChange={(values) => {
                        setDiscountPercentage(Number(values.value) || 0)
                      }}
                      decimalScale={2}
                      allowNegative={false}
                      sx={{ width: 90 }}
                      inputProps={{ 'aria-label': 'Descuento en porcentaje' }}
                      disabled={
                        isLoadingFiscalSettings ||
                        orderData.totalBeforeVAT === 0
                      }
                    />
                    <Typography variant='body2' sx={{ minWidth: 80 }} align='right'>
                      {formatCOP(orderData.discount)}
                    </Typography>
                  </Box>
                </Box>
                {summaryRow('IVA', orderData.vat)}
                {summaryRow('ReteFuente', orderData.retefuente)}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 0.5,
                    gap: 1
                  }}
                >
                  <Typography variant='body2' color='text.secondary'>
                    ReteICA / otros
                  </Typography>
                  <NumericFormat
                    value={orderData.retecree}
                    thousandSeparator=','
                    decimalSeparator='.'
                    prefix={'$ '}
                    customInput={TextField}
                    size='small'
                    onValueChange={(values) => {
                      setOrderData((prev) => ({
                        ...prev,
                        retecree: Number(values.value) || 0
                      }))
                    }}
                    sx={{ width: 150 }}
                    inputProps={{ 'aria-label': 'ReteICA u otros' }}
                    disabled={isLoadingFiscalSettings}
                  />
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline'
                  }}
                >
                  <Typography variant='subtitle1' fontWeight={700}>
                    Total final
                  </Typography>
                  <Typography variant='h6' fontWeight={700}>
                    {formatCOP(orderData.total)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {blockedReason && (
          <Typography variant='body2' color='text.secondary' sx={{ mr: 'auto' }}>
            {blockedReason}
          </Typography>
        )}
        <Button onClick={onClose} color='inherit'>
          Cancelar
        </Button>
        <Button
          variant='contained'
          onClick={handleSubmitOrder}
          disabled={!!blockedReason}
          sx={{
            bgcolor: PURCHASE_TEAL,
            '&:hover': { bgcolor: PURCHASE_TEAL_HOVER }
          }}
        >
          Generar orden
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default GenerateOrderModal
