import { useMemo, useState } from 'react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Autocomplete,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import SellOutlinedIcon from '@mui/icons-material/SellOutlined'
import TableChartOutlinedIcon from '@mui/icons-material/TableChartOutlined'
import ViewStreamOutlinedIcon from '@mui/icons-material/ViewStreamOutlined'
import { NumericFormatCustom } from '../../Components/NumericFormatCustom'
import { EquipmentProduct, EquipmentQuotationItemPayload } from '../../types/equipmentSales'
import { useEquipmentProducts } from '../../hooks/useEquipmentSales'

export type FormItem = EquipmentQuotationItemPayload & { localId: string }

interface EquipmentQuotationItemsEditorProps {
  items: FormItem[]
  onChange: (items: FormItem[]) => void
  canEdit?: boolean
  isBusy?: boolean
  onAddItem: () => void
}

const ROWS_PER_PAGE = 15

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
  otherFields: {}
})

export const calculateItemTotals = (item: FormItem): { subtotal: number; taxTotal: number; total: number } => {
  const subtotal = Math.max(Number(item.quantity) || 0, 0) * toNumber(item.unitPrice)
  const taxTotal = subtotal * (toNumber(item.taxRate) / 100)
  return { subtotal, taxTotal, total: subtotal + taxTotal }
}

const EquipmentQuotationItemsEditor = ({
  items,
  onChange,
  canEdit = true,
  isBusy = false,
  onAddItem
}: EquipmentQuotationItemsEditorProps) => {
  const { data: productsData } = useEquipmentProducts({ limit: 500 })
  const products = productsData?.data || []

  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'accordion' | 'table'>('accordion')

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase().trim()
    return items.filter(
      (item) =>
        item.itemName.toLowerCase().includes(q) ||
        (item.brand || '').toLowerCase().includes(q) ||
        (item.model || '').toLowerCase().includes(q) ||
        (item.notes || '').toLowerCase().includes(q)
    )
  }, [items, searchQuery])

  const paginatedItems = useMemo(
    () => filteredItems.slice(page * ROWS_PER_PAGE, (page + 1) * ROWS_PER_PAGE),
    [filteredItems, page]
  )

  const subtotalTotal = items.reduce((acc, item) => acc + calculateItemTotals(item).subtotal, 0)
  const taxTotalTotal = items.reduce((acc, item) => acc + calculateItemTotals(item).taxTotal, 0)
  const totalTotal = items.reduce((acc, item) => acc + calculateItemTotals(item).total, 0)
  const validCount = items.filter((i) => i.itemName.trim()).length

  const setItemField = (localId: string, field: keyof FormItem, value: string | number | null) => {
    const nextItems = items.map((item) => {
      if (item.localId !== localId) return item
      const updated = { ...item, [field]: value }
      return { ...updated, ...calculateItemTotals(updated as FormItem) }
    })
    onChange(nextItems)
  }

  const handleSelectProduct = (localId: string, product: EquipmentProduct | null) => {
    const nextItems = items.map((item) => {
      if (item.localId !== localId) return item
      const updated = {
        ...item,
        productId: product?.id ?? null,
        itemName: product?.name || item.itemName,
        brand: product?.defaultBrand || item.brand,
        model: product?.defaultModel || item.model,
        taxRate: product ? Number(product.taxRate) : item.taxRate,
        unitPrice: product?.defaultPrice != null ? Number(product.defaultPrice) : item.unitPrice
      }
      return { ...updated, ...calculateItemTotals(updated as FormItem) }
    })
    onChange(nextItems)
  }

  const toggleExpandAll = () => {
    if (expandedIds.size > 0) setExpandedIds(new Set())
    else setExpandedIds(new Set(items.map((i) => i.localId)))
  }

  const isExpanded = (localId: string) => expandedIds.has(localId)

  const handleAccordionToggle = (localId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(localId)) next.delete(localId)
      else next.add(localId)
      return next
    })
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const renderAccordionItem = (item: FormItem, actualIndex: number) => {
    const selectedProduct = products.find((product) => product.id === item.productId) || null
    const totals = calculateItemTotals(item as FormItem)
    const itemNameLabel = item.itemName || 'Nuevo producto'
    const expanded = isExpanded(item.localId)

    return (
      <Accordion
        key={item.localId}
        variant='outlined'
        expanded={expanded}
        onChange={() => handleAccordionToggle(item.localId)}
        slotProps={{ transition: { unmountOnExit: true } }}
        sx={{
          borderRadius: '12px !important',
          '&:before': { display: 'none' },
          border: '2px solid',
          borderColor: item.itemName ? 'divider' : '#10b981',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: 'rgba(16, 185, 129, 0.3)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          },
          '&.Mui-expanded': {
            borderColor: 'rgba(16, 185, 129, 0.4)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)'
          }
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            borderRadius: '12px',
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              gap: 1.5,
              pr: 1
            }
          }}
        >
          <Box
            sx={{
              width: 32, height: 32, borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backgroundColor: item.itemName ? '#059669' : '#e5e7eb',
              color: item.itemName ? '#fff' : '#9ca3af',
              fontWeight: 800, fontSize: '0.75rem', flexShrink: 0
            }}
          >
            {actualIndex + 1}
          </Box>
          <Typography variant='body2' fontWeight={600} sx={{ flexGrow: 1, minWidth: 0 }}>
            <Box component='span' sx={{ color: 'text.primary' }}>
              {item.quantity ? `${item.quantity} x ` : ''}{itemNameLabel}
            </Box>
            {totals.total > 0 ? (
              <Box component='span' sx={{ color: '#059669', fontWeight: 700, ml: 1 }}>
                {currencyFormatter.format(totals.total)}
              </Box>
            ) : null}
          </Typography>
          {item.brand ? (
            <Chip
              size='small' variant='outlined' label={item.brand}
              sx={{ height: 22, '& .MuiChip-label': { fontSize: 11, px: 0.8, fontWeight: 600 } }}
            />
          ) : null}
          <IconButton
            color='error' disabled={!canEdit || isBusy} size='small' title='Eliminar producto'
            sx={{ mr: 0.5, opacity: 0.6, '&:hover': { opacity: 1 } }}
            onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.localId) }}
            onFocus={(e) => e.stopPropagation()}
          >
            <DeleteOutlineOutlinedIcon fontSize='small' />
          </IconButton>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0, px: { xs: 2, sm: 3 }, pb: 3 }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 0.5 }}>
                <SellOutlinedIcon sx={{ color: '#6b7280', fontSize: 18 }} />
                <Typography variant='caption' fontWeight={700} sx={{ color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Producto y precio
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                size='small' options={products} value={selectedProduct}
                getOptionLabel={(option) => option.name || ''}
                onChange={(_, value) => handleSelectProduct(item.localId, value)}
                disabled={!canEdit || isBusy}
                renderInput={(params) => <TextField {...params} label='Producto catálogo' placeholder='Buscar producto...' />}
                PaperComponent={(props) => <Paper {...props} sx={{ borderRadius: '10px', mt: 0.5 }} />}
              />
            </Grid>
            <Grid item xs={12}><Divider sx={{ my: 0.5 }} /></Grid>
            <Grid item xs={12}>
              <Stack direction='row' alignItems='center' spacing={1} sx={{ mb: 0.5 }}>
                <Inventory2OutlinedIcon sx={{ color: '#6b7280', fontSize: 18 }} />
                <Typography variant='caption' fontWeight={700} sx={{ color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Detalles del producto
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth size='small' required label='Nombre producto' placeholder='Ej. Monitor de signos vitales'
                value={item.itemName} disabled={!canEdit || isBusy}
                onChange={(event) => setItemField(item.localId, 'itemName', event.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth size='small' label='Marca' placeholder='Ej. Mindray'
                value={item.brand || ''} disabled={!canEdit || isBusy}
                onChange={(event) => setItemField(item.localId, 'brand', event.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <TextField fullWidth size='small' label='Modelo' placeholder='Ej. uMEC12'
                value={item.model || ''} disabled={!canEdit || isBusy}
                onChange={(event) => setItemField(item.localId, 'model', event.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size='small' type='number' label='Cantidad' value={item.quantity}
                disabled={!canEdit || isBusy} inputProps={{ min: 1 }}
                onChange={(event) => setItemField(item.localId, 'quantity', Number(event.target.value))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size='small' label='Valor unitario' value={item.unitPrice}
                disabled={!canEdit || isBusy} placeholder='0'
                InputProps={{ inputComponent: NumericFormatCustom as never }}
                onChange={(event) => setItemField(item.localId, 'unitPrice', Number(event.target.value))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size='small' type='number' label='IVA %' value={item.taxRate}
                disabled={!canEdit || isBusy} inputProps={{ min: 0, step: 0.1 }}
                onChange={(event) => setItemField(item.localId, 'taxRate', Number(event.target.value))} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth size='small' type='number' label='Garantía (meses)' value={item.warrantyMonths ?? ''}
                disabled={!canEdit || isBusy} inputProps={{ min: 0 }}
                onChange={(event) => setItemField(item.localId, 'warrantyMonths', event.target.value === '' ? null : Number(event.target.value))} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size='small' label='Tiempo de entrega' placeholder='Ej: 15 días hábiles'
                value={item.deliveryTime || ''} disabled={!canEdit || isBusy}
                onChange={(event) => setItemField(item.localId, 'deliveryTime', event.target.value)} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField fullWidth size='small' label='Notas / Observaciones' placeholder='Detalles adicionales del producto'
                value={item.notes || ''} disabled={!canEdit || isBusy}
                onChange={(event) => setItemField(item.localId, 'notes', event.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth size='small' label='Características' multiline minRows={2}
                placeholder='Especificaciones técnicas relevantes'
                value={item.characteristics || ''} disabled={!canEdit || isBusy}
                onChange={(event) => setItemField(item.localId, 'characteristics', event.target.value)} />
            </Grid>
          </Grid>
          <Box sx={{
            mt: 3, p: 0, borderRadius: '10px', overflow: 'hidden',
            border: '1px solid', borderColor: 'rgba(16, 185, 129, 0.15)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.04) 0%, rgba(5, 150, 105, 0.02) 100%)'
          }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} divider={<Divider orientation='vertical' flexItem />} sx={{ px: 2.5, py: 2 }}>
              <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'center' } }}>
                <Typography variant='caption' color='text.secondary' fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>Subtotal</Typography>
                <Typography variant='body1' fontWeight={700} sx={{ mt: 0.5 }}>{currencyFormatter.format(totals.subtotal)}</Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'center' }, mt: { xs: 1, sm: 0 } }}>
                <Typography variant='caption' color='text.secondary' fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>IVA</Typography>
                <Typography variant='body1' fontWeight={700} sx={{ mt: 0.5 }}>{currencyFormatter.format(totals.taxTotal)}</Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: { xs: 'left', sm: 'center' }, mt: { xs: 1, sm: 0 } }}>
                <Typography variant='caption' color='primary' fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: '0.03em' }}>Total línea</Typography>
                <Typography variant='h6' color='primary.main' fontWeight={800} sx={{ mt: 0.25, lineHeight: 1.2 }}>{currencyFormatter.format(totals.total)}</Typography>
              </Box>
            </Stack>
          </Box>
        </AccordionDetails>
      </Accordion>
    )
  }

  const renderTableItem = (item: FormItem, actualIndex: number) => {
    const totals = calculateItemTotals(item as FormItem)
    return (
      <TableRow key={item.localId} hover sx={{ '&:hover': { backgroundColor: 'rgba(16,185,129,0.03)' } }}>
        <TableCell sx={{ fontWeight: 600, color: '#6b7280', fontSize: '0.8rem', width: 40 }}>{actualIndex + 1}</TableCell>
        <TableCell sx={{ minWidth: 180 }}>
          <Typography variant='body2' fontWeight={600} noWrap sx={{ maxWidth: 220 }}>{item.itemName || '—'}</Typography>
          {(item.brand || item.model) && (
            <Typography variant='caption' sx={{ color: '#9ca3af', display: 'block', lineHeight: 1.2, mt: 0.25 }}>
              {[item.brand, item.model].filter(Boolean).join(' · ')}
            </Typography>
          )}
        </TableCell>
        <TableCell sx={{ width: 80 }}>
          <TextField size='small' type='number' value={item.quantity} disabled={!canEdit || isBusy} variant='standard'
            inputProps={{ min: 1, style: { textAlign: 'center', fontSize: '0.85rem', width: 50 } }}
            onChange={(event) => setItemField(item.localId, 'quantity', Number(event.target.value))} />
        </TableCell>
        <TableCell sx={{ width: 120 }}>
          <Typography variant='body2' fontWeight={700} color='#059669'>{currencyFormatter.format(totals.total)}</Typography>
        </TableCell>
        <TableCell sx={{ width: 48 }}>
          <IconButton size='small' color='error' disabled={!canEdit || isBusy} title='Eliminar'
            onClick={() => handleRemoveItem(item.localId)}>
            <DeleteOutlineOutlinedIcon fontSize='small' />
          </IconButton>
        </TableCell>
      </TableRow>
    )
  }

  const handleRemoveItem = (localId: string) => {
    if (items.length <= 1) {
      onChange([createEmptyItem()])
      return
    }
    onChange(items.filter((i) => i.localId !== localId))
  }

  return (
    <Stack spacing={3}>
      {/* ── Header ── */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent='space-between' alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Stack direction='row' alignItems='center' spacing={1.5}>
          <Inventory2OutlinedIcon sx={{ color: '#059669', fontSize: 24 }} />
          <Box>
            <Typography variant='h6' fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>Productos cotizados</Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.25 }}>
              {validCount} de {items.length} productos · Total {currencyFormatter.format(totalTotal)}
            </Typography>
          </Box>
        </Stack>
        <Stack direction='row' spacing={1}>
          <IconButton size='small' onClick={() => setViewMode(viewMode === 'accordion' ? 'table' : 'accordion')}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px', color: 'text.secondary' }}
            title={viewMode === 'accordion' ? 'Vista tabla' : 'Vista detalle'}>
            {viewMode === 'accordion' ? <TableChartOutlinedIcon fontSize='small' /> : <ViewStreamOutlinedIcon fontSize='small' />}
          </IconButton>
          <Button variant='contained' startIcon={<AddOutlinedIcon />} onClick={onAddItem} disabled={!canEdit || isBusy}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', borderRadius: '10px',
              textTransform: 'none', fontWeight: 700, px: 3, whiteSpace: 'nowrap',
              boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.15)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                boxShadow: '0 6px 12px -2px rgba(16, 185, 129, 0.25)'
              }
            }}>
            Agregar producto
          </Button>
        </Stack>
      </Stack>

      {/* ── Summary bar ── */}
      <Paper elevation={0} sx={{
        p: 1.5, borderRadius: '10px', border: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(16,185,129,0.03)',
        display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant='caption' color='text.secondary' fontWeight={600}>Subtotal</Typography>
          <Typography variant='body2' fontWeight={700}>{currencyFormatter.format(subtotalTotal)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant='caption' color='text.secondary' fontWeight={600}>IVA</Typography>
          <Typography variant='body2' fontWeight={700}>{currencyFormatter.format(taxTotalTotal)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant='caption' color='primary' fontWeight={700}>TOTAL</Typography>
          <Typography variant='body1' fontWeight={800} color='primary.main'>{currencyFormatter.format(totalTotal)}</Typography>
        </Box>
      </Paper>

      {/* ── Search + actions ── */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'center' }}>
        <TextField size='small' placeholder='Buscar productos por nombre, marca o modelo...' value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(0) }} sx={{ minWidth: 280 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'><SearchOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>
            )
          }} />
        <Chip
          icon={expandedIds.size === paginatedItems.length ? <ExpandLessOutlinedIcon /> : <ExpandMoreOutlinedIcon />}
          label={expandedIds.size === paginatedItems.length ? 'Colapsar todos' : 'Expandir todos'}
          variant='outlined' size='small' onClick={toggleExpandAll} sx={{ borderRadius: '8px', cursor: 'pointer' }} />
        <Typography variant='caption' color='text.secondary' sx={{ display: 'flex', alignItems: 'center' }}>
          {filteredItems.length} producto{filteredItems.length !== 1 ? 's' : ''}
          {searchQuery.trim() && filteredItems.length !== items.length ? ` (filtrados de ${items.length})` : ''}
        </Typography>
      </Stack>

      {/* ── Items list ── */}
      {viewMode === 'accordion' ? (
        <Stack spacing={2}>
          {paginatedItems.length > 0 ? paginatedItems.map((item) => renderAccordionItem(item, items.indexOf(item)))
            : (
              <Paper elevation={0} sx={{ p: 4, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: '12px' }}>
                <Inventory2OutlinedIcon sx={{ fontSize: 40, color: '#d1d5db', mb: 1 }} />
                <Typography variant='body2' color='text.secondary'>
                  {searchQuery.trim() ? 'Ningún producto coincide con la búsqueda.' : 'Aún no hay productos. Agrega el primero.'}
                </Typography>
              </Paper>
            )}
          {filteredItems.length > ROWS_PER_PAGE && (
            <TablePagination component='div' count={filteredItems.length} page={page}
              onPageChange={handleChangePage} rowsPerPage={ROWS_PER_PAGE} rowsPerPageOptions={[ROWS_PER_PAGE]}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
              sx={{ '& .MuiTablePagination-toolbar': { pl: 0 } }} />
          )}
        </Stack>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px', overflow: 'hidden' }}>
          <TableContainer>
            <Table size='small'>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.02)' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#6b7280' }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#6b7280' }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#6b7280' }}>Cant.</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#6b7280' }}>Total</TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedItems.length > 0 ? paginatedItems.map((item) => renderTableItem(item, items.indexOf(item)))
                  : (
                    <TableRow>
                      <TableCell colSpan={5} align='center' sx={{ py: 4 }}>
                        <Typography variant='body2' color='text.secondary'>
                          {searchQuery.trim() ? 'Ningún producto coincide con la búsqueda.' : 'Aún no hay productos.'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
              </TableBody>
            </Table>
          </TableContainer>
          {filteredItems.length > ROWS_PER_PAGE && (
            <TablePagination component='div' count={filteredItems.length} page={page}
              onPageChange={handleChangePage} rowsPerPage={ROWS_PER_PAGE} rowsPerPageOptions={[ROWS_PER_PAGE]}
              labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`} />
          )}
        </Paper>
      )}
    </Stack>
  )
}

export default EquipmentQuotationItemsEditor
