// src/Components/Purchases/GenerateOrderModal.tsx
import { useState, useEffect, FC, ChangeEvent } from 'react'
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
  FormControlLabel,
  Checkbox,
  Grid
} from '@mui/material'
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'
import {
  PurchaseRequestItem,
  Supplier,
  PurchaseRequest,
  PurchaseOrder
} from 'src/pages/Purchases/Types'

interface AssignedItem {
  purchaseRequestItemId: string
  description: string
  quantity: number
  unitValue: string
  total: number
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
  const axiosPrivate = useAxiosPrivate()
  purchaseRequest.requirements
  const [orderData, setOrderData] = useState<
    Omit<PurchaseOrder, 'purchaseRequestId'>
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
    retecree: 0,
    discount: 0,
    total: 0,
    requirements: purchaseRequest.requirements || ['No hay requerimientos']
  })
  const [selectedSupplier, setSelectedSupplier] = useState<string>('')
  const [assignedItems, setAssignedItems] = useState<AssignedItem[]>([])
  const [removedItems, setRemovedItems] = useState<string[]>([])
  const [_, setPendingItems] = useState<PurchaseRequestItem[]>([
    ...(purchaseRequest.items || [])
  ])
  const [applyIVA, setApplyIVA] = useState<boolean>(true)
  const [ivaPercentage, setIvaPercentage] = useState<string>('19')

  const handleSubmitOrder = async () => {
    const payload = {
      purchaseRequestId: purchaseRequest.id,
      supplierId: selectedSupplier,
      orderData: {
        ...orderData,
        requirements: purchaseRequest.requirements || []
      },
      items: assignedItems.map((item) => ({
        purchaseRequestItemId: item.purchaseRequestItemId,
        unitValue: parseFloat(item.unitValue) || 0,
        total: parseFloat(item.total.toString()) || 0
      }))
    }

    try {
      // Aquí harías la llamada a tu endpoint real:
      await axiosPrivate.post('/purchaseOrders', payload)
      Swal.fire('Éxito', 'La orden de compra ha sido generada.', 'success')
      // Remover de los pendientes los ítems que ya fueron procesados:
      const processedIds = assignedItems.map(
        (item) => item.purchaseRequestItemId
      )
      setPendingItems((prev) =>
        prev.filter((item) => !processedIds.includes(item.id.toString()))
      )
      onSuccess()
      onClose()
    } catch (error) {
      Swal.fire('Error', 'No se pudo generar la orden de compra.', 'error')
    }
  }

  // Extraer proveedores disponibles solo de ítems que no están procesados
  const availableSuppliers: Supplier[] = Array.from(
    new Set(
      (purchaseRequest.items ?? [])
        .filter((item) => !item.procesed) // Solo ítems sin procesar
        .flatMap((item) =>
          item.suppliers ? item.suppliers.map((s) => s.id.toString()) : []
        )
    )
  )
    .map((supplierId: string) => {
      // Buscamos un ítem sin procesar que tenga al proveedor
      const foundItem = (purchaseRequest.items ?? [])
        .filter((item) => !item.procesed)
        .find(
          (item) =>
            item.suppliers &&
            item.suppliers.find((s) => s.id.toString() === supplierId)
        )
      return foundItem
        ? foundItem.suppliers!.find((s) => s.id.toString() === supplierId)
        : null
    })
    .filter((s): s is Supplier => s !== null)

  // Actualizar los ítems asignados según el proveedor seleccionado y los removidos.
  useEffect(() => {
    if (selectedSupplier) {
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
          unitValue: '',
          total: 0
        }))
      setAssignedItems(itemsForSupplier)
    } else {
      setAssignedItems([])
    }
  }, [selectedSupplier, removedItems, purchaseRequest.items])

  const handleOrderChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setOrderData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSupplierChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedSupplier(e.target.value)
  }

  // Cuando se modifica el valor unitario de un ítem, se calcula su total y se actualiza el total general.
  const handleItemChange = (
    index: number,
    field: keyof AssignedItem,
    value: string
  ) => {
    setAssignedItems((prevItems) => {
      const newItems = [...prevItems]
      newItems[index] = { ...newItems[index], [field]: value }
      if (field === 'unitValue') {
        const quantity = newItems[index].quantity
        const unitValue = parseFloat(value) || 0
        newItems[index].total = unitValue * quantity
      }
      const overallTotal = newItems.reduce(
        (sum, item) => sum + (parseFloat(item.total.toString()) || 0),
        0
      )
      setOrderData((prev) => ({ ...prev, total: overallTotal }))
      return newItems
    })
  }

  // Elimina un ítem asignado
  const handleRemoveItem = (itemId: string) => {
    setRemovedItems((prev) => [...prev, itemId])
    setAssignedItems((prev) =>
      prev.filter((item) => item.purchaseRequestItemId !== itemId)
    )
  }

  useEffect(() => {
    const totalBefore = assignedItems.reduce(
      (sum, item) => sum + (parseFloat(item.total.toString()) || 0),
      0
    )
    setOrderData((prev) => ({
      ...prev,
      totalBeforeVAT: totalBefore
    }))
  }, [assignedItems])

  useEffect(() => {
    const totalBefore = orderData.totalBeforeVAT || 0
    const retefuente = orderData.retefuente || 0
    const retecree = orderData.retecree || 0
    const discount = orderData.discount || 0
    let vat = 0
    if (applyIVA) {
      const perc = parseFloat(ivaPercentage) || 0
      vat = totalBefore * (perc / 100)
    }
    setOrderData((prev) => ({
      ...prev,
      vat: vat,
      total: totalBefore + vat - retefuente - retecree - discount
    }))
  }, [
    orderData.totalBeforeVAT,
    orderData.retefuente,
    orderData.retecree,
    orderData.discount,
    applyIVA,
    ivaPercentage
  ])

  const handleApplyIVAChange = (e: ChangeEvent<HTMLInputElement>) => {
    setApplyIVA(e.target.checked)
  }

  const handleIvaPercentageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIvaPercentage(e.target.value)
  }

  return (
    <Modal open={open} onClose={onClose}>
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'white',
          padding: '2rem',
          borderRadius: '8px',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <Typography variant='h6' gutterBottom>
          Generar Orden de Compra
        </Typography>
        <Grid container spacing={2}>
          {/* Fila 1: Proveedor y Código */}
          <Grid item xs={6}>
            <TextField
              select
              label='Seleccionar Proveedor'
              value={selectedSupplier}
              onChange={handleSupplierChange}
              fullWidth
              margin='normal'
            >
              {availableSuppliers.map((supplier) => (
                <MenuItem key={supplier.id} value={supplier.id.toString()}>
                  {supplier.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Código'
              name='code'
              fullWidth
              margin='normal'
              value={orderData.code}
              onChange={handleOrderChange}
            />
          </Grid>
          {/* Fila 2: Fechas */}
          <Grid item xs={6}>
            <TextField
              label='Fecha de Solicitud'
              name='requestDate'
              type='date'
              fullWidth
              margin='normal'
              InputLabelProps={{ shrink: true }}
              value={orderData.requestDate}
              onChange={handleOrderChange}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Fecha de Entrega'
              name='deliveryDate'
              type='date'
              fullWidth
              margin='normal'
              InputLabelProps={{ shrink: true }}
              value={orderData.deliveryDate}
              onChange={handleOrderChange}
            />
          </Grid>
          {/* Fila 3: Lugar y Método de Pago */}
          <Grid item xs={6}>
            <TextField
              label='Lugar de Entrega'
              name='deliveryPlace'
              fullWidth
              margin='normal'
              value={orderData.deliveryPlace}
              onChange={handleOrderChange}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Método de Pago'
              name='paymentMethod'
              fullWidth
              margin='normal'
              value={orderData.paymentMethod}
              onChange={handleOrderChange}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Cuotas'
              name='installments'
              fullWidth
              margin='normal'
              value={orderData.installments}
              onChange={handleOrderChange}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label='Flete'
              name='freight'
              fullWidth
              margin='normal'
              value={orderData.freight}
              onChange={handleOrderChange}
            />
          </Grid>
        </Grid>

        {/* Mostrar ítems asignados al proveedor seleccionado */}
        {selectedSupplier && (
          <>
            <Typography
              variant='subtitle1'
              gutterBottom
              style={{ marginTop: '1rem' }}
            >
              Ítems para el proveedor seleccionado
            </Typography>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <TableCell>Descripción</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Valor Unitario</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {assignedItems.map((item, index) => (
                  <TableRow key={item.purchaseRequestItemId}>
                    <TableCell>{item.description}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      <TextField
                        type='number'
                        value={item.unitValue}
                        onChange={(e) =>
                          handleItemChange(index, 'unitValue', e.target.value)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <TextField type='number' value={item.total} disabled />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='outlined'
                        color='secondary'
                        onClick={() =>
                          handleRemoveItem(item.purchaseRequestItemId)
                        }
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Campos generales de la orden */}
            <Grid container spacing={2} style={{ marginTop: '1rem' }}>
              <Grid item xs={12}>
                <TextField
                  multiline
                  rows={2}
                  maxRows={4}
                  label='Observaciones'
                  name='observations'
                  fullWidth
                  margin='normal'
                  value={orderData.observations}
                  onChange={handleOrderChange}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='Total antes de IVA'
                  name='totalBeforeVAT'
                  fullWidth
                  margin='normal'
                  value={orderData.totalBeforeVAT.toString()}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6} alignContent={'center'}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={applyIVA}
                      onChange={handleApplyIVAChange}
                      color='primary'
                    />
                  }
                  label='Aplicar IVA'
                />
              </Grid>
              {applyIVA && (
                <Grid item xs={6}>
                  <TextField
                    label='IVA (%)'
                    name='ivaPercentage'
                    fullWidth
                    margin='normal'
                    value={ivaPercentage}
                    onChange={handleIvaPercentageChange}
                  />
                </Grid>
              )}
              <Grid item xs={6}>
                <TextField
                  label='IVA (valor)'
                  name='vat'
                  fullWidth
                  margin='normal'
                  value={orderData.vat}
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='ReteFuente'
                  name='retefuente'
                  type='number'
                  fullWidth
                  margin='normal'
                  value={orderData.retefuente.toString()}
                  onChange={(e) =>
                    setOrderData((prev) => ({
                      ...prev,
                      retefuente: Number(e.target.value)
                    }))
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='ReteCree'
                  name='retecree'
                  type='number'
                  fullWidth
                  margin='normal'
                  value={orderData.retecree.toString()}
                  onChange={(e) =>
                    setOrderData((prev) => ({
                      ...prev,
                      retecree: Number(e.target.value)
                    }))
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  label='Descuento'
                  name='discount'
                  type='number'
                  fullWidth
                  margin='normal'
                  value={orderData.discount.toString()}
                  onChange={(e) =>
                    setOrderData((prev) => ({
                      ...prev,
                      discount: Number(e.target.value)
                    }))
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant='subtitle1'>
                  Total Final: {orderData.total.toFixed(2)}
                </Typography>
              </Grid>
            </Grid>
          </>
        )}
        <Button
          variant='contained'
          color='primary'
          onClick={handleSubmitOrder}
          style={{ marginTop: '1rem' }}
        >
          Generar Orden
        </Button>
        <Button
          onClick={onClose}
          color='secondary'
          style={{ marginTop: '1rem', marginLeft: '1rem' }}
        >
          Cancelar
        </Button>
      </div>
    </Modal>
  )
}

export default GenerateOrderModal
