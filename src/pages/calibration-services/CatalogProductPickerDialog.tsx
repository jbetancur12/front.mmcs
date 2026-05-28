import React, { useMemo, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import {
  CalibrationServiceProductSummary,
  ProductVariantSummary
} from '../../types/calibrationService'

type CatalogPriceSource = 'medicalPrice' | 'industrialPrice' | 'thirdPartyPrice'

interface PickedVariant {
  productId: number
  productVariantId: number
  itemName: string
  intervalText: string | null
  serviceType: string
  unitPrice: number
}

interface CatalogProductPickerDialogProps {
  open: boolean
  products: CalibrationServiceProductSummary[]
  suggestedPriceSource: CatalogPriceSource | null
  onClose: () => void
  onAddItems: (items: PickedVariant[], quantity: number) => void
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const PRICE_SOURCE_OPTIONS: { value: CatalogPriceSource; label: string }[] = [
  { value: 'medicalPrice', label: 'Valor médica' },
  { value: 'industrialPrice', label: 'Valor industrial' },
  { value: 'thirdPartyPrice', label: 'Valor subcontratados' }
]

const PRICE_COLORS: Record<CatalogPriceSource, string> = {
  medicalPrice: '#059669',
  industrialPrice: '#2563eb',
  thirdPartyPrice: '#7c3aed'
}

const SERVICE_TYPE_COLORS: Record<string, string> = {
  Acreditado: '#059669',
  Trazable: '#2563eb',
  'Subcontratado ONAC': '#7c3aed',
  Especial: '#d97706'
}

const getPriceValue = (
  variant: ProductVariantSummary,
  source: CatalogPriceSource
): number | null => {
  const val = variant[source]
  return val !== null && val !== undefined ? Number(val) : null
}

const CatalogProductPickerDialog: React.FC<CatalogProductPickerDialogProps> = ({
  open,
  products,
  suggestedPriceSource,
  onClose,
  onAddItems
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [priceSource, setPriceSource] = useState<CatalogPriceSource>(suggestedPriceSource || 'medicalPrice')
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set())
  const [selectedVariantIds, setSelectedVariantIds] = useState<Set<number>>(new Set())
  const [defaultQuantity, setDefaultQuantity] = useState(1)

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products
    const q = searchQuery.toLowerCase().trim()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.intervalText?.toLowerCase().includes(q) ||
        p.variants?.some(
          (v) =>
            (v.serviceType || '').toLowerCase().includes(q) ||
            String(getPriceValue(v, priceSource) ?? '').includes(q)
        )
    )
  }, [products, searchQuery, priceSource])

  const toggleProduct = (id: number) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleVariant = (variantId: number) => {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev)
      if (next.has(variantId)) next.delete(variantId)
      else next.add(variantId)
      return next
    })
  }

  const selectAllVariants = (product: CalibrationServiceProductSummary) => {
    setSelectedVariantIds((prev) => {
      const next = new Set(prev)
      const allSelected = product.variants?.every((v) => next.has(v.id))
      for (const v of product.variants || []) {
        if (allSelected) next.delete(v.id)
        else next.add(v.id)
      }
      return next
    })
  }

  const clearSelection = () => setSelectedVariantIds(new Set())

  const handleAddItems = () => {
    const picked: PickedVariant[] = []
    for (const product of products) {
      for (const variant of product.variants || []) {
        if (selectedVariantIds.has(variant.id)) {
          const price = getPriceValue(variant, priceSource)
          picked.push({
            productId: product.id,
            productVariantId: variant.id,
            itemName: product.name,
            intervalText: product.intervalText,
            serviceType: variant.serviceType,
            unitPrice: price ?? 0
          })
        }
      }
    }
    if (picked.length === 0) return
    onAddItems(picked, defaultQuantity)
    setSelectedVariantIds(new Set())
    onClose()
  }

  const handleClose = () => {
    setSelectedVariantIds(new Set())
    setSearchQuery('')
    onClose()
  }

  const totalSelected = selectedVariantIds.size

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='lg'>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction='row' alignItems='center' spacing={1.5}>
          <Typography variant='h6' fontWeight={800}>
            Agregar productos del catálogo
          </Typography>
          <Chip
            size='small'
            label={`${totalSelected} seleccionados`}
            color={totalSelected > 0 ? 'success' : 'default'}
            variant='outlined'
            sx={{ height: 22, '& .MuiChip-label': { fontSize: '0.7rem', px: 0.8 } }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
            <TextField
              size='small'
              placeholder='Buscar productos...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ minWidth: 280 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position='start'>
                    <SearchOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                )
              }}
            />
            <FormControl size='small' sx={{ minWidth: 200 }}>
              <InputLabel>Usar precio</InputLabel>
              <Select
                value={priceSource}
                label='Usar precio'
                onChange={(e) => setPriceSource(e.target.value as CatalogPriceSource)}
              >
                {PRICE_SOURCE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              size='small'
              type='number'
              label='Cantidad'
              value={defaultQuantity}
              onChange={(e) => setDefaultQuantity(Math.max(1, Number(e.target.value)))}
              sx={{ width: 100 }}
              inputProps={{ min: 1 }}
            />
          </Stack>

          <Paper
            elevation={0}
            sx={{
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '12px',
              overflow: 'hidden'
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ width: 40, padding: '10px 8px' }}></th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '10px 8px',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      textTransform: 'uppercase'
                    }}
                  >
                    Producto
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '10px 8px',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      textTransform: 'uppercase'
                    }}
                  >
                    Intervalo
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '10px 8px',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      textTransform: 'uppercase'
                    }}
                  >
                    Variantes
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isExpanded = expandedProducts.has(product.id)
                  return (
                    <React.Fragment key={product.id}>
                      <tr
                        style={{ borderBottom: '1px solid #e5e7eb', cursor: 'pointer' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = ''
                        }}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <IconButton
                            size='small'
                            sx={{ color: isExpanded ? '#059669' : '#9ca3af' }}
                          >
                            {isExpanded ? (
                              <ExpandLessIcon fontSize='small' />
                            ) : (
                              <ExpandMoreIcon fontSize='small' />
                            )}
                          </IconButton>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <Typography variant='body2' fontWeight={600}>
                            {product.name}
                          </Typography>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <Typography variant='body2' color='text.secondary'>
                            {product.intervalText || '—'}
                          </Typography>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
                            {product.variants?.map((v) => {
                              const price = getPriceValue(v, priceSource)
                              return (
                                <Chip
                                  key={v.id}
                                  size='small'
                                  label={`${v.serviceType} · ${price !== null ? CURRENCY_FORMATTER.format(price) : '—'}`}
                                  variant='outlined'
                                  sx={{
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    fontSize: '0.7rem',
                                    borderColor:
                                      (SERVICE_TYPE_COLORS[v.serviceType] || '#d1d5db') + '40',
                                    color: SERVICE_TYPE_COLORS[v.serviceType] || '#6b7280',
                                    backgroundColor:
                                      (SERVICE_TYPE_COLORS[v.serviceType] || '#d1d5db') + '10'
                                  }}
                                />
                              )
                            })}
                          </Stack>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                          <td colSpan={4} style={{ padding: '8px 16px 16px 56px' }}>
                            <Stack
                              direction='row'
                              alignItems='center'
                              spacing={1}
                              sx={{ mb: 1.5 }}
                            >
                              <Checkbox
                                size='small'
                                indeterminate={
                                  (product.variants?.filter((v) =>
                                    selectedVariantIds.has(v.id)
                                  ).length || 0) > 0 &&
                                  (product.variants?.filter((v) =>
                                    selectedVariantIds.has(v.id)
                                  ).length || 0) < (product.variants?.length || 0)
                                }
                                checked={product.variants?.every((v) =>
                                  selectedVariantIds.has(v.id)
                                )}
                                onChange={() => selectAllVariants(product)}
                              />
                              <Typography
                                variant='caption'
                                fontWeight={600}
                                sx={{ color: '#6b7280', cursor: 'pointer' }}
                                onClick={() => selectAllVariants(product)}
                              >
                                Seleccionar todos
                              </Typography>
                            </Stack>

                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                  <th style={{ width: 40, padding: '8px' }}></th>
                                  <th
                                    style={{
                                      textAlign: 'left',
                                      padding: '8px',
                                      fontWeight: 600,
                                      fontSize: '0.7rem',
                                      color: '#6b7280',
                                      textTransform: 'uppercase'
                                    }}
                                  >
                                    Tipo
                                  </th>
                                  {PRICE_SOURCE_OPTIONS.map((opt) => (
                                    <th
                                      key={opt.value}
                                      style={{
                                        textAlign: 'right',
                                        padding: '8px',
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                        color:
                                          opt.value === priceSource
                                            ? PRICE_COLORS[opt.value]
                                            : '#6b7280',
                                        textTransform: 'uppercase'
                                      }}
                                    >
                                      {opt.label}
                                      {opt.value === priceSource ? ' ✓' : ''}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {product.variants?.map((v) => {
                                  const isSelected = selectedVariantIds.has(v.id)
                                  return (
                                    <tr
                                      key={v.id}
                                      style={{
                                        borderBottom: '1px solid #f3f4f6',
                                        backgroundColor: isSelected
                                          ? 'rgba(16,185,129,0.04)'
                                          : undefined,
                                        cursor: 'pointer'
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!isSelected)
                                          e.currentTarget.style.backgroundColor =
                                            'rgba(0,0,0,0.015)'
                                      }}
                                      onMouseLeave={(e) => {
                                        if (!isSelected)
                                          e.currentTarget.style.backgroundColor = ''
                                      }}
                                      onClick={() => toggleVariant(v.id)}
                                    >
                                      <td style={{ padding: '8px', textAlign: 'center' }}>
                                        <Checkbox
                                          size='small'
                                          checked={isSelected}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={() => toggleVariant(v.id)}
                                          sx={{
                                            color: '#d1d5db',
                                            '&.Mui-checked': { color: '#059669' }
                                          }}
                                        />
                                      </td>
                                      <td style={{ padding: '8px' }}>
                                        <Typography
                                          variant='body2'
                                          fontWeight={600}
                                          sx={{
                                            color: SERVICE_TYPE_COLORS[v.serviceType] || '#374151'
                                          }}
                                        >
                                          {v.serviceType}
                                        </Typography>
                                      </td>
                                      {PRICE_SOURCE_OPTIONS.map((opt) => {
                                        const price = getPriceValue(v, opt.value)
                                        const isActive = opt.value === priceSource
                                        return (
                                          <td
                                            key={opt.value}
                                            style={{ padding: '8px', textAlign: 'right' }}
                                          >
                                            <Typography
                                              variant='body2'
                                              fontWeight={isActive ? 700 : 400}
                                              sx={{
                                                color: isActive
                                                  ? PRICE_COLORS[opt.value]
                                                  : '#6b7280'
                                              }}
                                            >
                                              {price !== null
                                                ? CURRENCY_FORMATTER.format(price)
                                                : '—'}
                                            </Typography>
                                          </td>
                                        )
                                      })}
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 32, textAlign: 'center' }}>
                      <Typography variant='body2' color='text.secondary'>
                        {searchQuery.trim()
                          ? 'Ningún producto coincide con la búsqueda.'
                          : 'No hay productos disponibles en el catálogo.'}
                      </Typography>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: '1.25rem', justifyContent: 'space-between' }}>
        <Button onClick={clearSelection} color='inherit' disabled={totalSelected === 0}>
          Limpiar selección
        </Button>
        <Stack direction='row' spacing={1}>
          <Button onClick={handleClose} color='inherit'>
            Cancelar
          </Button>
          <Button
            variant='contained'
            startIcon={<AddCircleOutlineOutlinedIcon />}
            disabled={totalSelected === 0}
            onClick={handleAddItems}
            sx={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)'
              }
            }}
          >
            Agregar {totalSelected > 0 ? `${totalSelected} seleccionado${totalSelected !== 1 ? 's' : ''}` : ''}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  )
}

export default CatalogProductPickerDialog
