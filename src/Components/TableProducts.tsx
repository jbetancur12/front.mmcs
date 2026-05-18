import {
  Box,
  Button,
  Card,
  CardContent,
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
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import PercentOutlinedIcon from '@mui/icons-material/PercentOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import {
  MaterialReactTable,
  MaterialReactTableProps,
  type MRT_ColumnDef
} from 'material-react-table'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { NumericFormatCustom } from './NumericFormatCustom'
import { bigToast } from './ExcelManipulation/Utils'
import useAxiosPrivate from '@utils/use-axios-private'
import Swal from 'sweetalert2'

export interface ProductData {
  id: number
  name: string
  serviceType?: string | null
  intervalText?: string | null
  medicalPrice?: number | null
  industrialPrice?: number | null
  thirdPartyPrice?: number | null
  price?: number | null
  createdAt: string
}

type ProductFormValues = Omit<ProductData, 'id' | 'createdAt'>

const SERVICE_TYPE_OPTIONS = [
  'Acreditado',
  'Trazable',
  'Subcontratado ONAC',
  'Especial'
]

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

const TableProducts: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [tableData, setTableData] = useState<ProductData[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [percentage, setPercentage] = useState('')
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const fetchProducts = async () => {
    try {
      const response = await axiosPrivate.get<ProductData[]>('/products', {})
      setTableData(response.data)
    } catch {
      bigToast('No se pudo cargar el catálogo.', 'error')
    }
  }

  useEffect(() => { fetchProducts() }, [])

  const totalProducts = tableData.length
  const pricedCount = tableData.filter((p) => p.price !== null).length

  const updateAllPrices = async () => {
    setConfirmationDialogOpen(false)
    const parsedPercentage = parseFloat(percentage)
    if (Number.isNaN(parsedPercentage)) {
      bigToast('Porcentaje inválido', 'error')
      return
    }
    try {
      const response = await axiosPrivate.put('/products/update-prices', { percentage: parsedPercentage })
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
      const response = await axiosPrivate.get('/products/template', { responseType: 'blob' })
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
    if (!importFile) { bigToast('Selecciona un archivo Excel.', 'warning'); return }
    setIsImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)
      const response = await axiosPrivate.post('/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
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
    } finally { setIsImporting(false) }
  }

  const onCreateProduct = async (productData: ProductFormValues) => {
    try {
      const response = await axiosPrivate.post('/products', productData, {})
      if (response.status === 201) {
        bigToast('Producto creado.', 'success')
        await fetchProducts()
      } else bigToast('No se pudo crear el registro.', 'error')
    } catch { bigToast('No se pudo crear el registro.', 'error') }
  }

  const handleCancelRowEdits = () => setValidationErrors({})

  const handleSaveRowEdits: MaterialReactTableProps<ProductData>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (Object.keys(validationErrors).length) return
      const payload = {
        name: values.name, serviceType: values.serviceType || null, intervalText: values.intervalText || null,
        medicalPrice: toNullableNumber(values.medicalPrice), industrialPrice: toNullableNumber(values.industrialPrice),
        thirdPartyPrice: toNullableNumber(values.thirdPartyPrice), price: toNullableNumber(values.price)
      }
      try {
        const response = await axiosPrivate.put(`/products/${row.original.id}`, payload, {})
        if (response.status === 200) {
          bigToast('Producto actualizado.', 'success')
          tableData[row.index] = response.data
          setTableData([...tableData])
          exitEditingMode()
        } else bigToast('No se pudo actualizar.', 'error')
      } catch { bigToast('No se pudo actualizar.', 'error') }
    }

  const getCommonEditTextFieldProps = useCallback(
    (fieldKey: keyof ProductData, header: string) => ({
      error: !!validationErrors[String(fieldKey)],
      helperText: validationErrors[String(fieldKey)],
      onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
        const value = event.target.value
        const nextErrors = { ...validationErrors }
        if (fieldKey === 'name' && !value.trim()) nextErrors[String(fieldKey)] = `${header} es obligatorio`
        else delete nextErrors[String(fieldKey)]
        setValidationErrors(nextErrors)
      }
    }),
    [validationErrors]
  )

  const columns = useMemo<MRT_ColumnDef<ProductData>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nombre',
        size: 260,
        muiTableBodyCellEditTextFieldProps: getCommonEditTextFieldProps('name', 'Nombre')
      },
      {
        accessorKey: 'serviceType',
        header: 'Tipo servicio',
        size: 170,
        Cell: ({ cell }) => {
          const value = cell.getValue<string>()
          return value ? (
            <Typography variant='body2' sx={{
              px: 1, py: 0.25, borderRadius: '6px', display: 'inline-block',
              backgroundColor: value === 'Acreditado' ? 'rgba(16,185,129,0.08)' :
                             value === 'Trazable' ? 'rgba(59,130,246,0.08)' :
                             value === 'Subcontratado ONAC' ? 'rgba(139,92,246,0.08)' : 'rgba(245,158,11,0.08)',
              color: value === 'Acreditado' ? '#059669' :
                     value === 'Trazable' ? '#2563eb' :
                     value === 'Subcontratado ONAC' ? '#7c3aed' : '#d97706',
              fontWeight: 600, fontSize: '0.78rem'
            }}>{value}</Typography>
          ) : <Typography variant='body2' color='text.disabled'>—</Typography>
        },
        Edit: ({ row }) => (
          <FormControl fullWidth size='small'>
            <InputLabel>Tipo servicio</InputLabel>
            <Select label='Tipo servicio' value={row.original.serviceType || ''}
              onChange={(event) => { row._valuesCache.serviceType = event.target.value }}>
              {SERVICE_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )
      },
      { accessorKey: 'intervalText', header: 'Intervalo', size: 240 },
      {
        accessorKey: 'medicalPrice', header: 'Valor médica', size: 140,
        Cell: ({ cell }) => {
          const v = cell.getValue<number | null>()
          return v !== null && v !== undefined
            ? <Typography variant='body2' fontWeight={600}>{formatMoney(v)}</Typography>
            : <Typography variant='body2' color='text.disabled'>—</Typography>
        },
        Edit: ({ row }) => (
          <TextField label='Valor médica' defaultValue={row.original.medicalPrice ?? ''}
            InputProps={{ inputComponent: NumericFormatCustom as never }}
            onChange={(event) => { row._valuesCache.medicalPrice = event.target.value }} />
        )
      },
      {
        accessorKey: 'industrialPrice', header: 'Valor industrial', size: 140,
        Cell: ({ cell }) => {
          const v = cell.getValue<number | null>()
          return v !== null && v !== undefined
            ? <Typography variant='body2' fontWeight={600}>{formatMoney(v)}</Typography>
            : <Typography variant='body2' color='text.disabled'>—</Typography>
        },
        Edit: ({ row }) => (
          <TextField label='Valor industrial' defaultValue={row.original.industrialPrice ?? ''}
            InputProps={{ inputComponent: NumericFormatCustom as never }}
            onChange={(event) => { row._valuesCache.industrialPrice = event.target.value }} />
        )
      },
      {
        accessorKey: 'thirdPartyPrice', header: 'Valor subcontratados', size: 165,
        Cell: ({ cell }) => {
          const v = cell.getValue<number | null>()
          return v !== null && v !== undefined
            ? <Typography variant='body2' fontWeight={600}>{formatMoney(v)}</Typography>
            : <Typography variant='body2' color='text.disabled'>—</Typography>
        },
        Edit: ({ row }) => (
          <TextField label='Valor subcontratados' defaultValue={row.original.thirdPartyPrice ?? ''}
            InputProps={{ inputComponent: NumericFormatCustom as never }}
            onChange={(event) => { row._valuesCache.thirdPartyPrice = event.target.value }} />
        )
      },
      {
        accessorKey: 'price', header: 'Valor general', size: 140,
        Cell: ({ cell }) => {
          const v = cell.getValue<number | null>()
          return v !== null && v !== undefined
            ? <Typography variant='body2' fontWeight={700} color='#059669'>{formatMoney(v)}</Typography>
            : <Typography variant='body2' color='text.disabled'>—</Typography>
        },
        Edit: ({ row }) => (
          <TextField label='Valor general' defaultValue={row.original.price ?? ''}
            InputProps={{ inputComponent: NumericFormatCustom as never }}
            onChange={(event) => { row._valuesCache.price = event.target.value }} />
        )
      }
    ],
    [getCommonEditTextFieldProps]
  )

  const handleCreateNewRow = async (values: ProductFormValues) => {
    await onCreateProduct(values)
    setCreateModalOpen(false)
  }

  return (
    <>
      {/* ── Summary bar ── */}
      <Paper elevation={0} sx={{
        p: 2, borderRadius: '12px', mb: 2.5, border: '1px solid rgba(0,0,0,0.06)',
        background: 'rgba(16,185,129,0.03)',
        display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Inventory2OutlinedIcon sx={{ color: '#059669', fontSize: 20 }} />
          <Typography variant='body2' fontWeight={700}>{totalProducts} producto{totalProducts !== 1 ? 's' : ''}</Typography>
          <Typography variant='caption' color='text.secondary'>· {pricedCount} con precio</Typography>
        </Box>
      </Paper>

      {/* ── Action bar ── */}
      <Paper elevation={0} sx={{
        p: 2, borderRadius: '12px', mb: 2.5, border: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center'
      }}>
        <TextField
          size='small' placeholder='Buscar productos...'
          sx={{ minWidth: 220 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position='start'><SearchOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>
            )
          }}
        />
        <Box sx={{ flex: 1 }} />
        <TextField
          size='small' label='%' type='number' value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          sx={{ width: 80 }}
          InputProps={{ inputProps: { min: 0 } }}
        />
        <Button size='small' variant='contained' startIcon={<PercentOutlinedIcon />}
          onClick={() => setConfirmationDialogOpen(true)}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, height: 36 }}
        >
          Actualizar precios
        </Button>
        <Divider orientation='vertical' flexItem sx={{ mx: 0.5 }} />
        <Button size='small' variant='outlined' startIcon={<DownloadOutlinedIcon />}
          onClick={handleDownloadTemplate}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, height: 36 }}
        >
          Plantilla
        </Button>
        <Button size='small' variant='outlined' startIcon={<CloudUploadOutlinedIcon />}
          onClick={() => setImportDialogOpen(true)}
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, height: 36 }}
        >
          Importar
        </Button>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <MaterialReactTable
          enableHiding={false}
          enableColumnActions={false}
          enableEditing
          enableRowActions
          positionActionsColumn='last'
          localization={MRT_Localization_ES}
          muiTableProps={{ sx: { tableLayout: 'fixed' } }}
          columns={columns}
          data={tableData}
          onEditingRowSave={handleSaveRowEdits}
          onEditingRowCancel={handleCancelRowEdits}
          renderRowActions={({ row, table }) => (
            <Stack direction='row' spacing={0.5}>
              <Tooltip title='Editar'>
                <IconButton size='small' onClick={() => table.setEditingRow(row)}>
                  <EditOutlinedIcon fontSize='small' />
                </IconButton>
              </Tooltip>
              <Tooltip title='Eliminar'>
                <IconButton size='small' color='error' onClick={() => handleDeleteProduct(row.original)}>
                  <DeleteOutlineOutlinedIcon fontSize='small' />
                </IconButton>
              </Tooltip>
            </Stack>
          )}
          renderTopToolbarCustomActions={() => (
            <Button variant='contained' onClick={() => setCreateModalOpen(true)}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700 }}
            >
              + Nuevo producto
            </Button>
          )}
        />
      </Paper>

      <Dialog open={confirmationDialogOpen} onClose={() => setConfirmationDialogOpen(false)} maxWidth='xs'>
        <DialogTitle>Actualizar precios</DialogTitle>
        <DialogContent>
          <Typography variant='body2' color='text.secondary'>
            ¿Actualizar todos los precios del catálogo en un <strong>{percentage}%</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationDialogOpen(false)} color='inherit'>Cancelar</Button>
          <Button onClick={updateAllPrices} variant='contained'>Aceptar</Button>
        </DialogActions>
      </Dialog>

      <CreateNewProductModal open={createModalOpen} onClose={() => setCreateModalOpen(false)} onSubmit={handleCreateNewRow} />

      <Dialog open={importDialogOpen} onClose={() => { setImportDialogOpen(false); setImportFile(null) }} maxWidth='sm' fullWidth>
        <DialogTitle>Importar productos</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              Selecciona un archivo Excel (.xlsx). Los productos existentes se actualizarán automáticamente.
            </Typography>
            <Button variant='outlined' component='label' startIcon={<CloudUploadOutlinedIcon />} sx={{ alignSelf: 'flex-start' }}>
              {importFile ? importFile.name : 'Seleccionar archivo'}
              <input type='file' hidden accept='.xlsx,.xls' onChange={handleImportFileChange} />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setImportDialogOpen(false); setImportFile(null) }} color='inherit'>Cancelar</Button>
          <Button variant='contained' onClick={handleImportProducts} disabled={!importFile || isImporting}>
            {isImporting ? 'Importando...' : 'Importar'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

interface CreateModalProps {
  onClose: () => void
  onSubmit: (values: ProductFormValues) => void
  open: boolean
}

const initialCreateValues: ProductFormValues = {
  name: '', serviceType: 'Trazable', intervalText: '',
  medicalPrice: null, industrialPrice: null, thirdPartyPrice: null, price: null
}

export const CreateNewProductModal = ({ open, onClose, onSubmit }: CreateModalProps) => {
  const [values, setValues] = useState<ProductFormValues>(initialCreateValues)

  useEffect(() => { if (open) setValues(initialCreateValues) }, [open])

  const handleTextChange = (field: keyof ProductFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: event.target.value }))

  const handleNumberChange = (field: keyof ProductFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) =>
      setValues((prev) => ({ ...prev, [field]: toNullableNumber(event.target.value) }))

  const handleSubmit = () => { onSubmit(values); onClose() }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
      <DialogTitle sx={{ pb: 1 }}>Nuevo producto o servicio</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <TextField label='Nombre' value={values.name} onChange={handleTextChange('name')} required />
          <FormControl fullWidth>
            <InputLabel>Tipo servicio</InputLabel>
            <Select label='Tipo servicio' value={values.serviceType || ''}
              onChange={(event) => setValues((prev) => ({ ...prev, serviceType: event.target.value }))}>
              {SERVICE_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>{option}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label='Intervalo' value={values.intervalText || ''} onChange={handleTextChange('intervalText')} />
          <Typography variant='caption' fontWeight={700} sx={{ color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', mt: 0.5 }}>Precios</Typography>
          <TextField label='Valor médica' value={values.medicalPrice ?? ''} onChange={handleNumberChange('medicalPrice')}
            InputProps={{ inputComponent: NumericFormatCustom as never }} />
          <TextField label='Valor industrial' value={values.industrialPrice ?? ''} onChange={handleNumberChange('industrialPrice')}
            InputProps={{ inputComponent: NumericFormatCustom as never }} />
          <TextField label='Valor subcontratados' value={values.thirdPartyPrice ?? ''} onChange={handleNumberChange('thirdPartyPrice')}
            InputProps={{ inputComponent: NumericFormatCustom as never }} />
          <TextField label='Valor general' value={values.price ?? ''} onChange={handleNumberChange('price')}
            InputProps={{ inputComponent: NumericFormatCustom as never }} />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <Button onClick={onClose} color='inherit'>Cancelar</Button>
        <Button variant='contained' onClick={handleSubmit}>Crear producto</Button>
      </DialogActions>
    </Dialog>
  )
}

export default TableProducts
