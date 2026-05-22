import {
  Autocomplete, Box, Button, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography, Paper, Collapse, Grid
} from '@mui/material'
import { Add, Delete, ExpandMore, ExpandLess } from '@mui/icons-material'
import { NumericFormatCustom } from '../../Components/NumericFormatCustom'
import { EquipmentProduct, EquipmentQuotationItemPayload } from '../../types/equipmentSales'
import { useEquipmentProducts } from '../../hooks/useEquipmentSales'

export type FormItem = EquipmentQuotationItemPayload & { localId: string; expanded?: boolean }

export const createEmptyItem = (): FormItem => ({
  localId: `item-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  productId: null,
  itemName: '',
  brand: '',
  model: '',
  characteristics: '',
  quantity: 1,
  unitPrice: 0,
  taxRate: 19,
  subtotal: 0,
  taxTotal: 0,
  total: 0,
  warrantyMonths: null,
  deliveryTime: '',
  notes: '',
  sortOrder: 0,
  otherFields: {},
  expanded: false
})

export const calculateItemTotals = (item: FormItem): Partial<FormItem> => {
  const qty = item.quantity || 0
  const price = item.unitPrice || 0
  const tax = item.taxRate || 0
  const subtotal = qty * price
  const taxTotal = subtotal * (tax / 100)
  const total = subtotal + taxTotal
  return { subtotal, taxTotal, total }
}

interface Props {
  items: FormItem[]
  onChange: (items: FormItem[]) => void
  readOnly?: boolean
}

const EquipmentQuotationItemsEditor = ({ items, onChange, readOnly = false }: Props) => {
  const { data: productsData } = useEquipmentProducts({ limit: 500 })
  const products = productsData?.data || []

  const updateItem = (localId: string, field: string, value: unknown) => {
    const newItems = items.map((item) => {
      if (item.localId !== localId) return item
      const updated = { ...item, [field]: value }
      const totals = calculateItemTotals(updated as FormItem)
      return { ...updated, ...totals }
    })
    onChange(newItems)
  }

  const toggleExpand = (localId: string) => {
    onChange(items.map((i) => (i.localId === localId ? { ...i, expanded: !i.expanded } : i)))
  }

  const addItem = () => {
    onChange([...items, createEmptyItem()])
  }

  const removeItem = (localId: string) => {
    if (items.length <= 1) {
      onChange([createEmptyItem()])
      return
    }
    onChange(items.filter((i) => i.localId !== localId))
  }

  const handleSelectProduct = (localId: string, product: EquipmentProduct | null) => {
    if (!product) {
      updateItem(localId, 'productId', null)
      return
    }
    updateItem(localId, 'productId', product.id)
    updateItem(localId, 'itemName', product.name)
    updateItem(localId, 'brand', product.defaultBrand || '')
    updateItem(localId, 'model', product.defaultModel || '')
    updateItem(localId, 'taxRate', Number(product.taxRate))
    updateItem(localId, 'unitPrice', Number(product.defaultPrice || 0))
  }

  const subtotal = items.reduce((s, i) => s + (i.subtotal || 0), 0)
  const taxTotal = items.reduce((s, i) => s + (i.taxTotal || 0), 0)
  const total = items.reduce((s, i) => s + (i.total || 0), 0)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>Productos Cotizados</Typography>
        {!readOnly && (
          <Button startIcon={<Add />} variant='outlined' size='small' onClick={addItem}>
            Agregar Producto
          </Button>
        )}
      </Box>

      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell width={40} />
              <TableCell>Producto</TableCell>
              <TableCell width={120}>Marca</TableCell>
              <TableCell width={120}>Modelo</TableCell>
              <TableCell width={80} align='right'>Cant.</TableCell>
              <TableCell width={120} align='right'>P. Unitario</TableCell>
              <TableCell width={100} align='right'>Total</TableCell>
              {!readOnly && <TableCell width={40} />}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.localId} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                <TableCell>
                  <IconButton size='small' onClick={() => toggleExpand(item.localId)}>
                    {item.expanded ? <ExpandLess fontSize='small' /> : <ExpandMore fontSize='small' />}
                  </IconButton>
                </TableCell>
                <TableCell>
                  {readOnly ? (
                    <Typography variant='body2'>{item.itemName}</Typography>
                  ) : (
                    <Autocomplete
                      size='small'
                      options={products}
                      value={products.find((p) => p.id === item.productId) || null}
                      onChange={(_, val) => handleSelectProduct(item.localId, val)}
                      getOptionLabel={(o) => `${o.name}${o.defaultBrand ? ` - ${o.defaultBrand}` : ''}`}
                      renderInput={(params) => <TextField {...params} placeholder='Buscar o escribir...' variant='standard'
                        onChange={(e) => updateItem(item.localId, 'itemName', e.target.value)}
                        value={item.itemName} />}
                      freeSolo={false}
                      sx={{ minWidth: 200 }}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <TextField size='small' variant='standard' value={item.brand || ''}
                    onChange={(e) => updateItem(item.localId, 'brand', e.target.value)}
                    disabled={readOnly} fullWidth />
                </TableCell>
                <TableCell>
                  <TextField size='small' variant='standard' value={item.model || ''}
                    onChange={(e) => updateItem(item.localId, 'model', e.target.value)}
                    disabled={readOnly} fullWidth />
                </TableCell>
                <TableCell align='right'>
                  <TextField size='small' variant='standard' type='number' value={item.quantity}
                    onChange={(e) => updateItem(item.localId, 'quantity', parseInt(e.target.value) || 0)}
                    disabled={readOnly} inputProps={{ min: 1 }} sx={{ width: 60 }} />
                </TableCell>
                <TableCell align='right'>
                  <TextField size='small' variant='standard' value={item.unitPrice}
                    onChange={(e) => updateItem(item.localId, 'unitPrice', parseFloat(e.target.value) || 0)}
                    disabled={readOnly}
                    InputProps={{ inputComponent: NumericFormatCustom as any }}
                    sx={{ width: 120 }} />
                </TableCell>
                <TableCell align='right'>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    ${Number(item.total || 0).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                  </Typography>
                </TableCell>
                {!readOnly && (
                  <TableCell>
                    <IconButton size='small' color='error' onClick={() => removeItem(item.localId)}>
                      <Delete fontSize='small' />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {items.map((item) => (
        <Collapse key={item.localId} in={item.expanded}>
          <Paper variant='outlined' sx={{ p: 2, mb: 1, mt: 0.5 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField label='Características' multiline rows={3} fullWidth size='small'
                  value={item.characteristics || ''}
                  onChange={(e) => updateItem(item.localId, 'characteristics', e.target.value)}
                  disabled={readOnly} />
              </Grid>
              <Grid item xs={6} sm={2}>
                <TextField label='Garantía (meses)' type='number' fullWidth size='small'
                  value={item.warrantyMonths || ''}
                  onChange={(e) => updateItem(item.localId, 'warrantyMonths', parseInt(e.target.value) || null)}
                  disabled={readOnly} />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label='Tiempo de entrega' fullWidth size='small'
                  value={item.deliveryTime || ''}
                  onChange={(e) => updateItem(item.localId, 'deliveryTime', e.target.value)}
                  disabled={readOnly} placeholder='Ej: 15 días hábiles' />
              </Grid>
              <Grid item xs={6} sm={3}>
                <TextField label='IVA %' type='number' fullWidth size='small' value={item.taxRate}
                  onChange={(e) => updateItem(item.localId, 'taxRate', parseFloat(e.target.value) || 0)}
                  disabled={readOnly} />
              </Grid>
              <Grid item xs={12}>
                <TextField label='Notas' multiline rows={2} fullWidth size='small'
                  value={item.notes || ''}
                  onChange={(e) => updateItem(item.localId, 'notes', e.target.value)}
                  disabled={readOnly} />
              </Grid>
            </Grid>
          </Paper>
        </Collapse>
      ))}

      <Paper variant='outlined' sx={{ p: 2, mt: 2, bgcolor: 'grey.50' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
          <Typography><strong>Subtotal:</strong> ${subtotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</Typography>
          <Typography><strong>IVA:</strong> ${taxTotal.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</Typography>
          <Typography variant='h6'><strong>Total:</strong> ${total.toLocaleString('es-CO', { minimumFractionDigits: 2 })}</Typography>
        </Box>
      </Paper>
    </Box>
  )
}

export default EquipmentQuotationItemsEditor
