import React, { useMemo, useState } from 'react'
import {
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { EquipmentProduct } from '../../types/equipmentSales'

interface PickedProduct {
  product: EquipmentProduct
  unitPrice: number
}

interface EquipmentSalesCatalogProductPickerDialogProps {
  open: boolean
  products: EquipmentProduct[]
  onClose: () => void
  onAddItems: (picked: PickedProduct[], quantity: number) => void
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const EquipmentSalesCatalogProductPickerDialog: React.FC<EquipmentSalesCatalogProductPickerDialogProps> = ({
  open,
  products,
  onClose,
  onAddItems
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set())
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set())
  const [defaultQuantity, setDefaultQuantity] = useState(1)

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products
    const q = searchQuery.toLowerCase().trim()
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.defaultBrand || '').toLowerCase().includes(q) ||
        (p.defaultModel || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q)
    )
  }, [products, searchQuery])

  const toggleProduct = (id: number) => {
    setExpandedProducts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelection = (id: number) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearSelection = () => {
    setSelectedProductIds(new Set())
  }

  const handleAddItems = () => {
    const picked: PickedProduct[] = products
      .filter((product) => selectedProductIds.has(product.id))
      .map((product) => ({
        product,
        unitPrice: Number(product.defaultPrice || 0)
      }))
    if (picked.length === 0) return
    onAddItems(picked, defaultQuantity)
    setSelectedProductIds(new Set())
    onClose()
  }

  const handleClose = () => {
    setSelectedProductIds(new Set())
    setSearchQuery('')
    onClose()
  }

  const totalSelected = selectedProductIds.size

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
            <TextField
              size='small'
              type='number'
              label='Cantidad por defecto'
              value={defaultQuantity}
              onChange={(e) => setDefaultQuantity(Math.max(1, Number(e.target.value)))}
              sx={{ width: 160 }}
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
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 700, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Producto</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 700, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Marca</th>
                  <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 700, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Modelo</th>
                  <th style={{ textAlign: 'right', padding: '10px 8px', fontWeight: 700, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Precio sugerido</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isExpanded = expandedProducts.has(product.id)
                  const isSelected = selectedProductIds.has(product.id)
                  return (
                    <React.Fragment key={product.id}>
                      <tr
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? 'rgba(16,185,129,0.04)' : undefined
                        }}
                        onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.02)' }}
                        onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.backgroundColor = '' }}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                          <Checkbox
                            size='small'
                            checked={isSelected}
                            onClick={(e) => { e.stopPropagation(); toggleSelection(product.id) }}
                            sx={{ color: '#d1d5db', '&.Mui-checked': { color: '#059669' } }}
                          />
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <Typography variant='body2' fontWeight={600}>{product.name}</Typography>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <Typography variant='body2' color='text.secondary'>{product.defaultBrand || '—'}</Typography>
                        </td>
                        <td style={{ padding: '10px 8px' }}>
                          <Typography variant='body2' color='text.secondary'>{product.defaultModel || '—'}</Typography>
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                          <Typography variant='body2' fontWeight={600} color='#059669'>
                            {product.defaultPrice != null ? CURRENCY_FORMATTER.format(product.defaultPrice) : '—'}
                          </Typography>
                        </td>
                        <td style={{ padding: '10px 8px', textAlign: 'center', width: 40 }}>
                          <IconButton size='small' sx={{ color: isExpanded ? '#059669' : '#9ca3af' }}>
                            {isExpanded ? <ExpandLessIcon fontSize='small' /> : <ExpandMoreIcon fontSize='small' />}
                          </IconButton>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                          <td colSpan={6} style={{ padding: '12px 16px 12px 56px' }}>
                            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                              <strong>Descripción:</strong> {product.description || 'Sin descripción registrada'}
                            </Typography>
                            <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                              <strong>Categoría:</strong> {product.category || '—'}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                              <strong>IVA:</strong> {product.taxRate}%
                            </Typography>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 32, textAlign: 'center' }}>
                      <Typography variant='body2' color='text.secondary'>
                        {searchQuery.trim() ? 'Ningún producto coincide con la búsqueda.' : 'No hay productos disponibles en el catálogo.'}
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
          <Button onClick={handleClose} color='inherit'>Cancelar</Button>
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
              '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }
            }}
          >
            Agregar {totalSelected > 0 ? `${totalSelected} seleccionado${totalSelected !== 1 ? 's' : ''}` : ''}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  )
}

export default EquipmentSalesCatalogProductPickerDialog
