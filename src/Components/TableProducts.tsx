import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined'
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import ExpandLessIcon from '@mui/icons-material/ExpandLess'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import React, { useEffect, useMemo, useState } from 'react'
import { NumericFormatCustom } from './NumericFormatCustom'
import { bigToast } from './ExcelManipulation/Utils'
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'

export interface ProductVariant {
  id: number
  productId: number
  serviceType: string
  medicalPrice: number | null
  industrialPrice: number | null
  thirdPartyPrice: number | null
}

export interface ProductData {
  id: number
  name: string
  intervalText: string | null
  variants: ProductVariant[]
  createdAt: string
}

interface VariantFormEntry {
  serviceType: string
  medicalPrice: number | null
  industrialPrice: number | null
  thirdPartyPrice: number | null
}

const SERVICE_TYPE_OPTIONS = [
  'Acreditado',
  'Trazable',
  'Subcontratado ONAC',
  'Especial'
]

const SERVICE_TYPE_COLORS: Record<string, string> = {
  Acreditado: '#059669',
  Trazable: '#2563eb',
  'Subcontratado ONAC': '#7c3aed',
  Especial: '#d97706'
}

const SERVICE_TYPE_BG: Record<string, string> = {
  Acreditado: 'rgba(16,185,129,0.08)',
  Trazable: 'rgba(59,130,246,0.08)',
  'Subcontratado ONAC': 'rgba(139,92,246,0.08)',
  Especial: 'rgba(245,158,11,0.08)'
}

const CURRENCY_FORMATTER = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const toNullableNumber = (value: string | number | null | undefined) => {
  if (value === '' || value === null || value === undefined) return null
  const parsed = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(parsed) ? parsed : null
}

const formatMoney = (value: number | null | undefined) =>
  value !== null && value !== undefined ? CURRENCY_FORMATTER.format(value) : '—'

const ServiceTypeBadge: React.FC<{ type: string }> = ({ type }) => (
  <Typography
    variant='body2'
    sx={{
      px: 1,
      py: 0.25,
      borderRadius: '6px',
      display: 'inline-block',
      backgroundColor: SERVICE_TYPE_BG[type] || 'rgba(107,114,128,0.08)',
      color: SERVICE_TYPE_COLORS[type] || '#6b7280',
      fontWeight: 600,
      fontSize: '0.78rem'
    }}
  >
    {type}
  </Typography>
)

const TableProducts: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [tableData, setTableData] = useState<ProductData[]>([])
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [percentage, setPercentage] = useState('')
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchProducts = async () => {
    try {
      const response = await axiosPrivate.get<ProductData[]>('/products', {})
      setTableData(response.data)
    } catch {
      bigToast('No se pudo cargar el catálogo.', 'error')
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return tableData
    const q = searchQuery.toLowerCase().trim()
    return tableData.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.intervalText?.toLowerCase().includes(q) ||
        p.variants.some((v) => v.serviceType.toLowerCase().includes(q))
    )
  }, [tableData, searchQuery])

  const totalProducts = filteredData.length
  const totalVariants = filteredData.reduce((s, p) => s + p.variants.length, 0)

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const updateAllPrices = async () => {
    setConfirmationDialogOpen(false)
    const parsedPercentage = parseFloat(percentage)
    if (Number.isNaN(parsedPercentage)) {
      bigToast('Porcentaje inválido', 'error')
      return
    }
    try {
      const response = await axiosPrivate.put('/products/update-prices', {
        percentage: parsedPercentage
      })
      if (response.status === 200) {
        await fetchProducts()
        bigToast('Precios actualizados exitosamente.', 'success')
      } else bigToast('Error al actualizar los precios.', 'error')
    } catch {
      bigToast('Error al actualizar los precios.', 'error')
    }
  }

  const handleDeleteProduct = async (product: ProductData) => {
    const result = await Swal.fire({
      title: '¿Eliminar producto?',
      html: `
        <div style="text-align: left;">
          <p><strong>Producto:</strong> ${product.name}</p>
          <p style="color: #6b7280; font-size: 0.9rem; margin-top: 12px;">
            Se eliminarán todas sus variantes de precio.
            Los servicios ya cotizados conservarán sus datos,
            pero perderán la referencia al catálogo.
          </p>
          <p style="color: #dc2626; font-size: 0.85rem;"><strong>Esta acción no se puede deshacer.</strong></p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#9ca3af',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
      focusCancel: true
    })
    if (!result.isConfirmed) return
    try {
      await axiosPrivate.delete(`/products/${product.id}`)
      await fetchProducts()
      bigToast('Producto eliminado.', 'success')
    } catch {
      bigToast('Error al eliminar el producto.', 'error')
    }
  }

  const handleDownloadTemplate = async () => {
    try {
      const response = await axiosPrivate.get('/products/template', {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'plantilla-productos.xlsx')
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      bigToast('Error al descargar la plantilla.', 'error')
    }
  }

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setImportFile(event.target.files?.[0] || null)

  const handleImportProducts = async () => {
    if (!importFile) {
      bigToast('Selecciona un archivo Excel.', 'warning')
      return
    }
    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      const response = await axiosPrivate.post('/products/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      const result = response.data
      bigToast(
        `Importación completada: ${result.created} creados, ${result.updated} actualizados${result.errors?.length ? `, ${result.errors.length} errores.` : '.'}`,
        result.errors?.length ? 'warning' : 'success'
      )
      setImportDialogOpen(false)
      setImportFile(null)
      await fetchProducts()
    } catch {
      bigToast('Error al importar productos.', 'error')
    } finally {
      setIsImporting(false)
    }
  }

  const handleCreateProduct = async (
    name: string,
    intervalText: string,
    variants: VariantFormEntry[]
  ) => {
    try {
      const response = await axiosPrivate.post('/products', {
        name,
        intervalText: intervalText || null,
        variants
      })
      if (response.status === 201) {
        bigToast('Producto creado.', 'success')
        await fetchProducts()
      } else bigToast('No se pudo crear el registro.', 'error')
    } catch {
      bigToast('No se pudo crear el registro.', 'error')
    }
  }

  const handleEditProduct = async (
    id: number,
    name: string,
    intervalText: string,
    variants: VariantFormEntry[]
  ) => {
    try {
      const response = await axiosPrivate.put(`/products/${id}`, {
        name,
        intervalText: intervalText || null,
        variants
      })
      if (response.status === 200) {
        bigToast('Producto actualizado.', 'success')
        await fetchProducts()
      } else bigToast('No se pudo actualizar.', 'error')
    } catch {
      bigToast('No se pudo actualizar.', 'error')
    }
  }

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: '12px',
          mb: 2.5,
          border: '1px solid rgba(0,0,0,0.06)',
          background: 'rgba(16,185,129,0.03)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          alignItems: 'center'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Inventory2OutlinedIcon sx={{ color: '#059669', fontSize: 20 }} />
          <Typography variant='body2' fontWeight={700}>
            {totalProducts} producto{totalProducts !== 1 ? 's' : ''}
          </Typography>
          <Typography variant='caption' color='text.secondary'>
            · {totalVariants} variante{totalVariants !== 1 ? 's' : ''}
          </Typography>
        </Box>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: '12px',
          mb: 2.5,
          border: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1.5,
          alignItems: 'center'
        }}
      >
        <TextField
          size='small'
          placeholder='Buscar productos...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'>
                <SearchOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
              </InputAdornment>
            )
          }}
        />
        <Box sx={{ flex: 1 }} />
        <TextField
          size='small'
          label='%'
          type='number'
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          sx={{ width: 80 }}
          InputProps={{ inputProps: { min: 0 } }}
        />
        <Button
          size='small'
          variant='contained'
          startIcon={<PercentOutlinedIcon />}
          onClick={() => setConfirmationDialogOpen(true)}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, height: 36 }}
        >
          Actualizar precios
        </Button>
        <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />
        <Button
          size='small'
          variant='outlined'
          startIcon={<DownloadOutlinedIcon />}
          onClick={handleDownloadTemplate}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, height: 36 }}
        >
          Plantilla
        </Button>
        <Button
          size='small'
          variant='outlined'
          startIcon={<CloudUploadOutlinedIcon />}
          onClick={() => setImportDialogOpen(true)}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, height: 36 }}
        >
          Importar
        </Button>
        <Button
          variant='contained'
          onClick={() => setCreateModalOpen(true)}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, ml: 1 }}
        >
          + Nuevo producto
        </Button>
      </Paper>

      <Paper
        elevation={0}
        sx={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}
      >
        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <th style={{ width: 40, padding: '12px 8px' }}></th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 700, fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Producto</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 700, fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', width: 200 }}>Intervalo</th>
                <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 700, fontSize: '0.8rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Variantes</th>
                <th style={{ width: 100, padding: '12px 8px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((product) => (
                <React.Fragment key={product.id}>
                  <tr
                    style={{ borderBottom: '1px solid #e5e7eb' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(0,0,0,0.02)' }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = '' }}
                  >
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      <IconButton
                        size='small'
                        onClick={() => toggleRow(product.id)}
                        sx={{ color: expandedRows.has(product.id) ? '#059669' : '#9ca3af' }}
                      >
                        {expandedRows.has(product.id) ? (
                          <ExpandLessIcon fontSize='small' />
                        ) : (
                          <ExpandMoreIcon fontSize='small' />
                        )}
                      </IconButton>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <Typography variant='body2' fontWeight={600}>
                        {product.name}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <Typography variant='body2' color='text.secondary'>
                        {product.intervalText || '—'}
                      </Typography>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <Stack direction='row' spacing={0.5} flexWrap='wrap' useFlexGap>
                        {product.variants.map((v) => (
                          <Chip
                            key={v.id}
                            label={`${v.serviceType} · ${formatMoney(v.medicalPrice)}`}
                            size='small'
                            variant='outlined'
                            sx={{
                              borderRadius: '6px',
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              borderColor: (SERVICE_TYPE_COLORS[v.serviceType] || '#d1d5db') + '40',
                              color: SERVICE_TYPE_COLORS[v.serviceType] || '#6b7280',
                              backgroundColor: (SERVICE_TYPE_COLORS[v.serviceType] || '#d1d5db') + '10'
                            }}
                          />
                        ))}
                      </Stack>
                    </td>
                    <td style={{ padding: '12px 8px' }}>
                      <Stack direction='row' spacing={0.5} justifyContent='flex-end'>
                        <Tooltip title='Editar'>
                          <IconButton
                            size='small'
                            onClick={() => {
                              setEditingProduct(product)
                              setEditModalOpen(true)
                            }}
                          >
                            <EditOutlinedIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title='Eliminar'>
                          <IconButton
                            size='small'
                            color='error'
                            onClick={() => handleDeleteProduct(product)}
                          >
                            <DeleteOutlineOutlinedIcon fontSize='small' />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </td>
                  </tr>
                  {expandedRows.has(product.id) && (
                    <tr style={{ backgroundColor: '#f9fafb' }}>
                      <td colSpan={5} style={{ padding: '8px 16px 16px 56px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                              <th style={{ textAlign: 'left', padding: '8px', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Tipo</th>
                              <th style={{ textAlign: 'right', padding: '8px', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Valor médica</th>
                              <th style={{ textAlign: 'right', padding: '8px', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Valor industrial</th>
                              <th style={{ textAlign: 'right', padding: '8px', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Valor subcontratados</th>
                            </tr>
                          </thead>
                          <tbody>
                            {product.variants.map((v) => (
                              <tr key={v.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '8px' }}>
                                  <ServiceTypeBadge type={v.serviceType} />
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>
                                  <Typography variant='body2' fontWeight={600}>{formatMoney(v.medicalPrice)}</Typography>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>
                                  <Typography variant='body2' fontWeight={600}>{formatMoney(v.industrialPrice)}</Typography>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'right' }}>
                                  <Typography variant='body2' fontWeight={600}>{formatMoney(v.thirdPartyPrice)}</Typography>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 32, textAlign: 'center' }}>
                    <Typography variant='body2' color='text.secondary'>
                      No hay productos en el catálogo.
                    </Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Box>
      </Paper>

      <Dialog
        open={confirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
        maxWidth='xs'
      >
        <DialogTitle>Actualizar precios</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            ¿Actualizar todos los precios del catálogo en un{' '}
            <strong>{percentage}%</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationDialogOpen(false)} color='inherit'>
            Cancelar
          </Button>
          <Button onClick={updateAllPrices} variant='contained'>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      <ProductFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateProduct}
        mode='create'
      />

      <ProductFormModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setEditingProduct(null)
        }}
        onSubmit={(name, intervalText, variants) =>
          editingProduct && handleEditProduct(editingProduct.id, name, intervalText, variants)
        }
        mode='edit'
        initialProduct={editingProduct || undefined}
      />

      <Dialog
        open={importDialogOpen}
        onClose={() => { setImportDialogOpen(false); setImportFile(null) }}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>Importar productos</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              Selecciona un archivo Excel (.xlsx). Productos existentes se
              actualizarán. Un mismo nombre con diferentes tipos de servicio
              crea variantes.
            </Typography>
            <Button
              variant='outlined'
              component='label'
              startIcon={<CloudUploadOutlinedIcon />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {importFile ? importFile.name : 'Seleccionar archivo'}
              <input
                type='file'
                hidden
                accept='.xlsx,.xls'
                onChange={handleImportFileChange}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => { setImportDialogOpen(false); setImportFile(null) }}
            color='inherit'
          >
            Cancelar
          </Button>
          <Button
            variant='contained'
            onClick={handleImportProducts}
            disabled={!importFile || isImporting}
          >
            {isImporting ? 'Importando...' : 'Importar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

interface ProductFormModalProps {
  open: boolean
  onClose: () => void
  onSubmit: (name: string, intervalText: string, variants: VariantFormEntry[]) => void
  mode: 'create' | 'edit'
  initialProduct?: ProductData
}

const ProductFormModal: React.FC<ProductFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  mode,
  initialProduct
}) => {
  const [name, setName] = useState('')
  const [intervalText, setIntervalText] = useState('')
  const [variants, setVariants] = useState<VariantFormEntry[]>([])
  const [newVariantType, setNewVariantType] = useState(SERVICE_TYPE_OPTIONS[0])
  const [newMedical, setNewMedical] = useState('')
  const [newIndustrial, setNewIndustrial] = useState('')
  const [newThirdParty, setNewThirdParty] = useState('')

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && initialProduct) {
        setName(initialProduct.name)
        setIntervalText(initialProduct.intervalText || '')
        setVariants(
          initialProduct.variants.map((v) => ({
            serviceType: v.serviceType,
            medicalPrice: v.medicalPrice,
            industrialPrice: v.industrialPrice,
            thirdPartyPrice: v.thirdPartyPrice
          }))
        )
      } else {
        setName('')
        setIntervalText('')
        setVariants([])
      }
      setNewVariantType(SERVICE_TYPE_OPTIONS[0])
      setNewMedical('')
      setNewIndustrial('')
      setNewThirdParty('')
    }
  }, [open, mode, initialProduct])

  const addVariant = () => {
    if (variants.some((v) => v.serviceType === newVariantType)) {
      bigToast(`Ya existe una variante "${newVariantType}".`, 'warning')
      return
    }
    setVariants((prev) => [
      ...prev,
      {
        serviceType: newVariantType,
        medicalPrice: toNullableNumber(newMedical),
        industrialPrice: toNullableNumber(newIndustrial),
        thirdPartyPrice: toNullableNumber(newThirdParty)
      }
    ])
    setNewMedical('')
    setNewIndustrial('')
    setNewThirdParty('')
  }

  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (!name.trim()) {
      bigToast('El nombre del producto es obligatorio.', 'warning')
      return
    }
    if (variants.length === 0) {
      bigToast('Debe agregar al menos una variante de precio.', 'warning')
      return
    }
    onSubmit(name.trim(), intervalText, variants)
    onClose()
  }

  const usedTypes = variants.map((v) => v.serviceType)
  const availableTypes = SERVICE_TYPE_OPTIONS.filter(
    (t) => !usedTypes.includes(t)
  )

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle sx={{ pb: 1 }}>
        {mode === 'create' ? 'Nuevo producto o servicio' : 'Editar producto'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField
            label='Nombre del servicio'
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <TextField
            label='Intervalo'
            value={intervalText}
            onChange={(e) => setIntervalText(e.target.value)}
          />

          <Divider sx={{ my: 0.5 }} />
          <Typography
            variant='caption'
            fontWeight={700}
            sx={{
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}
          >
            Variantes de precio
          </Typography>

          <Stack direction='row' spacing={1.5} alignItems='flex-end' flexWrap='wrap'>
            <FormControl size='small' sx={{ minWidth: 180 }}>
              <InputLabel>Tipo</InputLabel>
              <Select
                label='Tipo'
                value={newVariantType}
                onChange={(e) => setNewVariantType(e.target.value)}
              >
                {availableTypes.length > 0
                  ? availableTypes.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))
                  : SERVICE_TYPE_OPTIONS.map((t) => (
                      <MenuItem key={t} value={t}>
                        {t}
                      </MenuItem>
                    ))}
              </Select>
            </FormControl>
            <TextField
              size='small'
              label='Valor médica'
              value={newMedical}
              onChange={(e) => setNewMedical(e.target.value)}
              sx={{ width: 140 }}
              InputProps={{ inputComponent: NumericFormatCustom as never }}
            />
            <TextField
              size='small'
              label='Valor industrial'
              value={newIndustrial}
              onChange={(e) => setNewIndustrial(e.target.value)}
              sx={{ width: 140 }}
              InputProps={{ inputComponent: NumericFormatCustom as never }}
            />
            <TextField
              size='small'
              label='Valor subcontratados'
              value={newThirdParty}
              onChange={(e) => setNewThirdParty(e.target.value)}
              sx={{ width: 160 }}
              InputProps={{ inputComponent: NumericFormatCustom as never }}
            />
            <Button
              size='small'
              variant='outlined'
              startIcon={<AddCircleOutlineOutlinedIcon />}
              onClick={addVariant}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, height: 36, flexShrink: 0 }}
              disabled={availableTypes.length === 0}
            >
              Agregar
            </Button>
          </Stack>

          {variants.length > 0 ? (
            <Box
              sx={{
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                overflow: 'hidden'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280' }}>Tipo</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280' }}>Médica</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280' }}>Industrial</th>
                    <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, fontSize: '0.75rem', color: '#6b7280' }}>Subcontratados</th>
                    <th style={{ width: 48, padding: '8px 12px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '8px 12px' }}>
                        <ServiceTypeBadge type={v.serviceType} />
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <Typography variant='body2' fontWeight={600}>
                          {formatMoney(v.medicalPrice)}
                        </Typography>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <Typography variant='body2' fontWeight={600}>
                          {formatMoney(v.industrialPrice)}
                        </Typography>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                        <Typography variant='body2' fontWeight={600}>
                          {formatMoney(v.thirdPartyPrice)}
                        </Typography>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => removeVariant(i)}
                        >
                          <DeleteOutlineOutlinedIcon fontSize='small' />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          ) : (
            <Typography
              variant='body2'
              color='text.disabled'
              sx={{ textAlign: 'center', py: 2 }}
            >
              No has agregado variantes. Agrega al menos un tipo de servicio
              con sus precios.
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <Button onClick={onClose} color='inherit'>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleSubmit}>
          {mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TableProducts
