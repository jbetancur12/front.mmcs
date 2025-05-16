// src/Components/Purchases/GenerateOrderModal.tsx
import { useState, useEffect, FC, ChangeEvent } from 'react' // Agregado React para React.Fragment
import {
  Modal,
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
  CircularProgress, // Para el estado de carga de los settings
  Alert // Para mostrar errores de los settings
} from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'
import { useQuery } from 'react-query' // React Query para obtener los settings
import {
  PurchaseRequestItem,
  Supplier,
  PurchaseRequest,
  PurchaseOrder
} from 'src/pages/Purchases/Types' // Asegúrate que estas rutas sean correctas
import { NumericFormat } from 'react-number-format'

// Interfaz para los parámetros fiscales que se obtendrán del backend
interface FiscalSettings {
  PURCHASE_RETENTION_RATE?: number
  SERVICE_RETENTION_RATE?: number
  PURCHASE_MINIMUM_BASE?: number
  SERVICE_MINIMUM_BASE?: number
  IVA_GENERAL_RATE_PERCENTAGE?: number
}

interface AssignedItem {
  purchaseRequestItemId: string
  description: string
  quantity: number
  unitValue: string
  total: number
  itemType: 'service' | 'purchase'
  applyIVA: boolean
  ivaPercentageForItem: string
}

interface GenerateOrderModalProps {
  open: boolean
  onClose: () => void
  purchaseRequest: PurchaseRequest
  onSuccess: () => void
}

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto',
  width: '70vw',
  minWidth: '600px'
}

const GenerateOrderModal: FC<GenerateOrderModalProps> = ({
  open,
  onClose,
  purchaseRequest,
  onSuccess
}) => {
  const axiosPrivate = useAxiosPrivate()
  // Estado para los datos generales de la orden
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
    totalBeforeVAT: 0,
    vat: 0,
    retefuente: 0,
    retecree: 0, // Considerar si este campo sigue siendo relevante o se reemplaza por ReteICA u otros
    discount: 0,
    total: 0,
    requirements: purchaseRequest.requirements || ['No hay requerimientos']
  })
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [selectedSupplierFull, setSelectedSupplierFull] =
    useState<Supplier | null>(null)
  const [assignedItems, setAssignedItems] = useState<AssignedItem[]>([])
  const [removedItems, setRemovedItems] = useState<string[]>([])
  const [_pendingItems, setPendingItems] = useState<PurchaseRequestItem[]>([])

  // --- NUEVO: Fetch de Parámetros Fiscales ---
  const {
    data: fiscalSettings,
    isLoading: isLoadingFiscalSettings,
    error: fiscalSettingsError
  } = useQuery<FiscalSettings, Error>(
    'fiscalSettings', // Clave para la query cache
    async () => {
      // Ajusta este endpoint a tu implementación real en el backend
      const response =
        await axiosPrivate.get<FiscalSettings>('/fiscal-parameters')
      return response.data
    },
    {
      staleTime: 1000 * 60 * 30 // Cachear datos por 30 minutos, ya que no cambian muy seguido
      // onError: (err) => { console.error("Error fetching fiscal settings:", err); },
    }
  )
  // --- FIN NUEVO ---

  const handleSubmitOrder = async () => {
    // ... (lógica de validación existente)
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
    // Asegurarse que los parámetros fiscales hayan cargado, si no, mostrar advertencia o deshabilitar botón.
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
        'No se pudo cargar la configuración fiscal necesaria para generar la orden.',
        'error'
      )
      return
    }

    const payload = {
      purchaseRequestId: purchaseRequest.id,
      supplierId: selectedSupplier,
      orderData: {
        ...orderData,
        requirements: purchaseRequest.requirements || [],
        totalBeforeVAT: Number(orderData.totalBeforeVAT) || 0,
        vat: Number(orderData.vat) || 0,
        retefuente: Number(orderData.retefuente) || 0,
        retecree: Number(orderData.retecree) || 0,
        discount: Number(orderData.discount) || 0,
        total: Number(orderData.total) || 0
      },
      items: assignedItems.map((item) => ({
        purchaseRequestItemId: item.purchaseRequestItemId,
        unitValue: parseFloat(item.unitValue) || 0,
        quantity: item.quantity,
        total: item.total,
        itemType: item.itemType,
        applyIVA: item.applyIVA,
        ivaPercentageForItem: parseFloat(item.ivaPercentageForItem) || 0 // Enviar como número
      }))
    }

    try {
      await axiosPrivate.post('/purchaseOrders', payload)
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

  // Lógica para availableSuppliers (sin cambios directos por esta refactorización)
  const availableSuppliers: Supplier[] = Array.from(
    new Set(
      (purchaseRequest.items ?? [])
        .filter((item) => !item.procesed) // Considera solo ítems no procesados de la solicitud
        .flatMap(
          (item) =>
            item.suppliers ? item.suppliers.map((s) => s.id.toString()) : [] // Obtiene IDs de proveedores
        )
    )
  )
    .map((supplierId: string) => {
      // Encuentra el objeto Supplier completo para cada ID único
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
    .filter((s): s is Supplier => s !== null) // Filtra nulos y asegura el tipo

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
            item.suppliers &&
            item.suppliers.some((s) => s.id.toString() === selectedSupplier) &&
            !removedItems.includes(item.id.toString())
        )
        .map((item) => ({
          purchaseRequestItemId: item.id.toString(),
          description: item.description,
          quantity: item.quantity,
          unitValue: '', // El usuario ingresará esto
          total: 0,
          itemType: 'purchase', // Tipo por defecto
          applyIVA: true, // Aplicar IVA por defecto
          // Usar valor de configuración fiscal para IVA por defecto si está disponible
          ivaPercentageForItem:
            fiscalSettings?.IVA_GENERAL_RATE_PERCENTAGE?.toString() || '19'
        }))
      setAssignedItems(itemsForSupplier)
    } else {
      setSelectedSupplierFull(null)
      setAssignedItems([])
    }
    // Añadir fiscalSettings a las dependencias si se usa para ivaPercentageForItem
  }, [selectedSupplier, removedItems, purchaseRequest.items, fiscalSettings])

  // --- MODIFICADO: Cálculo de ReteFuente ---
  useEffect(() => {
    // Esperar a que fiscalSettings esté cargado y sea válido
    if (
      !selectedSupplierFull ||
      !selectedSupplierFull.applyRetention ||
      isLoadingFiscalSettings ||
      !fiscalSettings
    ) {
      setOrderData((prev) => ({ ...prev, retefuente: 0 }))
      return
    }

    // Usar los valores obtenidos del backend, con fallbacks por si algún parámetro no viene
    const PURCHASE_RETENTION_RATE = fiscalSettings.PURCHASE_RETENTION_RATE || 0
    const SERVICE_RETENTION_RATE = fiscalSettings.SERVICE_RETENTION_RATE || 0 // Corregido typo: SERVICE_RETENTION_RATE
    const PURCHASE_MINIMUM_BASE = fiscalSettings.PURCHASE_MINIMUM_BASE || 0
    const SERVICE_MINIMUM_BASE = fiscalSettings.SERVICE_MINIMUM_BASE || 0

    let totalPurchasesBase = 0
    let totalServicesBase = 0

    assignedItems.forEach((item) => {
      if (item.itemType === 'purchase') {
        totalPurchasesBase += item.total // item.total ya es unitValue * quantity
      } else if (item.itemType === 'service') {
        totalServicesBase += item.total
      }
    })

    let calculatedRetefuente = 0

    if (totalPurchasesBase >= PURCHASE_MINIMUM_BASE) {
      calculatedRetefuente += totalPurchasesBase * PURCHASE_RETENTION_RATE
    }

    if (totalServicesBase >= SERVICE_MINIMUM_BASE) {
      calculatedRetefuente += totalServicesBase * SERVICE_RETENTION_RATE
    }

    // console.log('Cálculo ReteFuente - Bases:', {totalPurchasesBase, totalServicesBase});
    // console.log('Cálculo ReteFuente - Settings:', {PURCHASE_MINIMUM_BASE, SERVICE_MINIMUM_BASE, PURCHASE_RETENTION_RATE, SERVICE_RETENTION_RATE});
    // console.log('Cálculo ReteFuente - Resultado:', calculatedRetefuente);

    setOrderData((prev) => ({ ...prev, retefuente: calculatedRetefuente }))
  }, [
    assignedItems,
    selectedSupplierFull,
    fiscalSettings,
    isLoadingFiscalSettings
  ]) // Dependencias actualizadas
  // --- FIN MODIFICADO ---

  // ... (handleOrderChange, handleSupplierChange, handleItemChange, handleRemoveItem sin cambios)
  // ... (useEffect para totalBeforeVAT, vat, total sin cambios directos, pero se recalcularán)
  const handleOrderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setOrderData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSupplierChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Debería ser SelectChangeEvent si usas MUI Select
    const newSupplierId = e.target.value
    setSelectedSupplier(newSupplierId)
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
          ) || 0 // Limpiar valor
        newItems[index].total = unitValue * quantity
      }
      // Si cambia applyIVA o ivaPercentageForItem, el useEffect de VAT se encargará
      return newItems
    })
  }

  const handleRemoveItem = (itemId: string) => {
    setRemovedItems((prev) => [...prev, itemId])
  }

  useEffect(() => {
    const totalBefore = assignedItems.reduce((sum, item) => sum + item.total, 0)
    setOrderData((prev) => ({ ...prev, totalBeforeVAT: totalBefore }))
  }, [assignedItems])

  useEffect(() => {
    let currentVat = 0
    currentVat = assignedItems.reduce((sum, item) => {
      if (item.applyIVA) {
        const itemPerc = parseFloat(item.ivaPercentageForItem) / 100 || 0
        return sum + item.total * itemPerc
      }
      return sum
    }, 0)
    setOrderData((prev) => ({ ...prev, vat: currentVat }))
  }, [assignedItems])

  useEffect(() => {
    const finalTotal =
      (Number(orderData.totalBeforeVAT) || 0) +
      (Number(orderData.vat) || 0) -
      (Number(orderData.retefuente) || 0) -
      (Number(orderData.retecree) || 0) - // Considerar si retecree sigue aplicando o es ReteICA, etc.
      (Number(orderData.discount) || 0)
    setOrderData((prev) => ({ ...prev, total: finalTotal }))
  }, [
    orderData.totalBeforeVAT,
    orderData.vat,
    orderData.retefuente,
    orderData.retecree,
    orderData.discount
  ])

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={modalStyle}>
        <Typography variant='h6' gutterBottom>
          Generar Orden de Compra
        </Typography>

        {/* --- NUEVO: Indicador de carga y error para parámetros fiscales --- */}
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
            {fiscalSettingsError.message}. Los cálculos automáticos pueden ser
            incorrectos.
          </Alert>
        )}
        {/* --- FIN NUEVO --- */}

        <Grid container spacing={2}>
          {/* ... (resto del JSX para los campos de la orden: Proveedor, Código, Fechas, etc.) */}
          {/* Asegúrate de que el botón "Generar Orden" esté deshabilitado si isLoadingFiscalSettings es true */}
          {/* Ejemplo:
            <Button
                ...
                onClick={handleSubmitOrder}
                disabled={!selectedSupplier || assignedItems.length === 0 || isLoadingFiscalSettings}
            >
                Generar Orden
            </Button>
          */}
          <Grid item xs={12} md={6}>
            <TextField
              select
              label='Seleccionar Proveedor'
              value={selectedSupplier}
              onChange={handleSupplierChange as any} // Cast a 'any' por el tipo de evento esperado por TextField select
              fullWidth
              margin='normal'
              required
              disabled={isLoadingFiscalSettings} // Deshabilitar si la config fiscal está cargando
            >
              {availableSuppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id.toString()}>
                  {supplier.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          {/* ... (otros campos como código, fechas, etc. pueden necesitar disabled={isLoadingFiscalSettings} también) */}

          <Grid item xs={12} md={6}>
            <TextField
              label='Código Orden (Opcional)'
              name='code'
              fullWidth
              margin='normal'
              value={orderData.code}
              onChange={handleOrderChange}
              disabled={isLoadingFiscalSettings}
            />
          </Grid>
          {/* ... (campos de fechas, lugar de entrega, etc. ... todos deberían tener disabled={isLoadingFiscalSettings}) ... */}
          {/* Asegúrate de propagar disabled={isLoadingFiscalSettings} a todos los campos de entrada relevantes */}
          <Grid item xs={12} md={6}>
            <TextField
              label='Fecha de Solicitud'
              name='requestDate'
              type='date'
              fullWidth
              margin='normal'
              InputLabelProps={{ shrink: true }}
              value={orderData.requestDate}
              onChange={handleOrderChange}
              disabled={isLoadingFiscalSettings}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Fecha de Entrega'
              name='deliveryDate'
              type='date'
              fullWidth
              margin='normal'
              InputLabelProps={{ shrink: true }}
              value={orderData.deliveryDate}
              onChange={handleOrderChange}
              disabled={isLoadingFiscalSettings}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Lugar de Entrega'
              name='deliveryPlace'
              fullWidth
              margin='normal'
              value={orderData.deliveryPlace}
              onChange={handleOrderChange}
              disabled={isLoadingFiscalSettings}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Método de Pago'
              name='paymentMethod'
              fullWidth
              margin='normal'
              value={orderData.paymentMethod}
              onChange={handleOrderChange}
              disabled={isLoadingFiscalSettings}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Cuotas'
              name='installments'
              fullWidth
              margin='normal'
              value={orderData.installments}
              onChange={handleOrderChange}
              disabled={isLoadingFiscalSettings}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label='Flete'
              name='freight'
              fullWidth
              margin='normal'
              value={orderData.freight}
              onChange={handleOrderChange}
              disabled={isLoadingFiscalSettings}
            />
          </Grid>
        </Grid>

        {selectedSupplier && assignedItems.length > 0 && (
          <>
            <Typography
              variant='subtitle1'
              gutterBottom
              style={{ marginTop: '1rem' }}
            >
              Ítems para el proveedor seleccionado:{' '}
              {selectedSupplierFull?.name || ''}
            </Typography>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Descripción</TableCell>
                  <TableCell sx={{ minWidth: 120 }}>Tipo Ítem</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Valor Unitario</TableCell>
                  <TableCell sx={{ minWidth: 140 }}>Total Ítem</TableCell>
                  <TableCell sx={{ minWidth: 100 }}>IVA %</TableCell>
                  <TableCell>Aplica IVA</TableCell>
                  <TableCell>Acciones</TableCell>
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
                        onValueChange={(values) => {
                          handleItemChange(index, 'unitValue', values.value)
                        }}
                        sx={{ minWidth: 120 }}
                        disabled={isLoadingFiscalSettings}
                      />
                    </TableCell>
                    <TableCell>
                      <NumericFormat
                        value={item.total}
                        thousandSeparator=','
                        decimalSeparator='.'
                        prefix={'$ '}
                        customInput={TextField}
                        size='small'
                        disabled // Siempre deshabilitado, es calculado
                        sx={{ minWidth: 120 }}
                      />
                    </TableCell>
                    <TableCell>
                      <NumericFormat
                        value={item.ivaPercentageForItem}
                        customInput={TextField}
                        suffix={'%'}
                        size='small'
                        onValueChange={(values) => {
                          handleItemChange(
                            index,
                            'ivaPercentageForItem',
                            values.value
                          )
                        }}
                        sx={{ minWidth: 80 }}
                        disabled={isLoadingFiscalSettings || !item.applyIVA}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox
                        checked={item.applyIVA}
                        onChange={(e) =>
                          handleItemChange(index, 'applyIVA', e.target.checked)
                        }
                        color='primary'
                        size='small'
                        disabled={isLoadingFiscalSettings}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='outlined'
                        color='secondary'
                        size='small'
                        onClick={() =>
                          handleRemoveItem(item.purchaseRequestItemId)
                        }
                        disabled={isLoadingFiscalSettings}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        )}
        {selectedSupplier && (
          <Grid container spacing={2} style={{ marginTop: '1rem' }}>
            <Grid item xs={12}>
              <TextField
                multiline
                minRows={2}
                maxRows={4}
                label='Observaciones'
                name='observations'
                fullWidth
                margin='normal'
                value={orderData.observations}
                onChange={handleOrderChange}
                disabled={isLoadingFiscalSettings}
              />
            </Grid>
            {/* Campos de Totales y Retenciones */}
            <Grid item xs={12} sm={6} md={4}>
              <NumericFormat
                label='Total antes de IVA'
                value={orderData.totalBeforeVAT}
                thousandSeparator=','
                decimalSeparator='.'
                prefix={'$ '}
                customInput={TextField}
                fullWidth
                margin='normal'
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <NumericFormat
                label='IVA (valor)'
                name='vat'
                value={orderData.vat}
                thousandSeparator=','
                decimalSeparator='.'
                prefix={'$ '}
                customInput={TextField}
                fullWidth
                margin='normal'
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <NumericFormat
                label='ReteFuente'
                name='retefuente'
                value={orderData.retefuente}
                thousandSeparator=','
                decimalSeparator='.'
                prefix={'$ '}
                customInput={TextField}
                fullWidth
                margin='normal'
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <NumericFormat
                label='ReteICA / Otros' // Renombrado. ReteCREE está obsoleto.
                name='retecree' // Mantener nombre de estado si el backend lo espera, o cambiar a 'reteica'
                value={orderData.retecree} // Este es un campo manual
                thousandSeparator=','
                decimalSeparator='.'
                prefix={'$ '}
                customInput={TextField}
                fullWidth
                margin='normal'
                onValueChange={(values) => {
                  setOrderData((prev) => ({
                    ...prev,
                    retecree: Number(values.value) || 0 // o reteica si cambias el nombre del estado
                  }))
                }}
                disabled={isLoadingFiscalSettings}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <NumericFormat
                label='Descuento'
                name='discount'
                value={orderData.discount}
                thousandSeparator=','
                decimalSeparator='.'
                prefix={'$ '}
                customInput={TextField}
                fullWidth
                margin='normal'
                onValueChange={(values) => {
                  setOrderData((prev) => ({
                    ...prev,
                    discount: Number(values.value) || 0
                  }))
                }}
                disabled={isLoadingFiscalSettings}
              />
            </Grid>
            <Grid item xs={12} sx={{ mt: 2 }}>
              <Typography variant='h6'>
                Total Final:{' '}
                {new Intl.NumberFormat('es-CO', {
                  style: 'currency',
                  currency: 'COP',
                  minimumFractionDigits: 0, // Para no mostrar decimales si son .00
                  maximumFractionDigits: 0
                }).format(Number(orderData.total) || 0)}
              </Typography>
            </Grid>
          </Grid>
        )}

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} color='secondary' sx={{ mr: 1 }}>
            Cancelar
          </Button>
          <Button
            variant='contained'
            color='primary'
            onClick={handleSubmitOrder}
            disabled={
              !selectedSupplier ||
              assignedItems.length === 0 ||
              isLoadingFiscalSettings
            }
          >
            Generar Orden
          </Button>
        </Box>
      </Box>
    </Modal>
  )
}

export default GenerateOrderModal
