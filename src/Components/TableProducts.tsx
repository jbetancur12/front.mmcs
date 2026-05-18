import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
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

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const toNullableNumber = (value: string | number | null | undefined) => {
  if (value === '' || value === null || value === undefined) {
    return null
  }

  const parsed = typeof value === 'string' ? Number(value) : value
  return Number.isFinite(parsed) ? parsed : null
}

const TableProducts: React.FC = () => {
  const axiosPrivate = useAxiosPrivate()
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [tableData, setTableData] = useState<ProductData[]>([])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [percentage, setPercentage] = useState('0')
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const fetchProducts = async () => {
    try {
      const response = await axiosPrivate.get<ProductData[]>('/products', {})
      setTableData(response.data)
    } catch (error) {
      console.error('Error fetching product data:', error)
      bigToast('No se pudo cargar el catálogo.', 'error')
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

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
      } else {
        bigToast('Error al actualizar los precios.', 'error')
      }
    } catch (error) {
      console.error('Error updating prices:', error)
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
            Los servicios ya cotizados que usen este producto conservarán sus datos,
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
    } catch (error) {
      console.error('Error deleting product:', error)
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
    } catch (error) {
      console.error('Error downloading template:', error)
      bigToast('Error al descargar la plantilla.', 'error')
    }
  }

  const handleImportFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setImportFile(event.target.files?.[0] || null)
  }

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
    } catch (error) {
      console.error('Error importing products:', error)
      bigToast('Error al importar productos.', 'error')
    } finally {
      setIsImporting(false)
    }
  }

  const onCreateProduct = async (productData: ProductFormValues) => {
    try {
      const response = await axiosPrivate.post('/products', productData, {})

      if (response.status === 201) {
        bigToast('Producto o servicio creado exitosamente.', 'success')
        await fetchProducts()
      } else {
        bigToast('No se pudo crear el registro.', 'error')
      }
    } catch (error) {
      console.error('Error creating product:', error)
      bigToast('No se pudo crear el registro.', 'error')
    }
  }

  const handleCancelRowEdits = () => {
    setValidationErrors({})
  }

  const handleSaveRowEdits: MaterialReactTableProps<ProductData>['onEditingRowSave'] =
    async ({ exitEditingMode, row, values }) => {
      if (Object.keys(validationErrors).length) {
        return
      }

      const payload = {
        name: values.name,
        serviceType: values.serviceType || null,
        intervalText: values.intervalText || null,
        medicalPrice: toNullableNumber(values.medicalPrice),
        industrialPrice: toNullableNumber(values.industrialPrice),
        thirdPartyPrice: toNullableNumber(values.thirdPartyPrice),
        price: toNullableNumber(values.price)
      }

      try {
        const response = await axiosPrivate.put(`/products/${values.id}`, payload, {})

        if (response.status === 200) {
          bigToast('Producto o servicio modificado exitosamente.', 'success')
          tableData[row.index] = response.data
          setTableData([...tableData])
          exitEditingMode()
        } else {
          bigToast('No se pudo modificar el registro.', 'error')
        }
      } catch (error) {
        console.error('Error updating product:', error)
        bigToast('No se pudo modificar el registro.', 'error')
      }
    }

  const getCommonEditTextFieldProps = useCallback(
    (fieldKey: keyof ProductData, header: string) => ({
      error: !!validationErrors[String(fieldKey)],
      helperText: validationErrors[String(fieldKey)],
      onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
        const value = event.target.value
        const nextErrors = { ...validationErrors }

        if (fieldKey === 'name' && !value.trim()) {
          nextErrors[String(fieldKey)] = `${header} es obligatorio`
        } else {
          delete nextErrors[String(fieldKey)]
        }

        setValidationErrors(nextErrors)
      }
    }),
    [validationErrors]
  )

  const renderMoneyCell = (value: number | null | undefined) =>
    value !== null && value !== undefined ? currencyFormatter.format(value) : 'Sin valor'

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
        Edit: ({ row }) => (
          <FormControl fullWidth size='small'>
            <InputLabel>Tipo servicio</InputLabel>
            <Select
              label='Tipo servicio'
              value={row.original.serviceType || ''}
              onChange={(event) => {
                row._valuesCache.serviceType = event.target.value
              }}
            >
              {SERVICE_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )
      },
      {
        accessorKey: 'intervalText',
        header: 'Intervalo',
        size: 260
      },
      {
        accessorKey: 'medicalPrice',
        header: 'Valor médica',
        size: 150,
        Cell: ({ row }) => renderMoneyCell(row.original.medicalPrice),
        Edit: ({ row }) => (
          <TextField
            defaultValue={row.original.medicalPrice ?? ''}
            InputProps={{ inputComponent: NumericFormatCustom as never }}
            onChange={(event) => {
              row._valuesCache.medicalPrice = event.target.value
            }}
          />
        )
      },
      {
        accessorKey: 'industrialPrice',
        header: 'Valor industrial',
        size: 150,
        Cell: ({ row }) => renderMoneyCell(row.original.industrialPrice),
        Edit: ({ row }) => (
          <TextField
            defaultValue={row.original.industrialPrice ?? ''}
            InputProps={{ inputComponent: NumericFormatCustom as never }}
            onChange={(event) => {
              row._valuesCache.industrialPrice = event.target.value
            }}
          />
        )
      },
      {
        accessorKey: 'thirdPartyPrice',
        header: 'Valor subcontratados',
        size: 170,
        Cell: ({ row }) => renderMoneyCell(row.original.thirdPartyPrice),
        Edit: ({ row }) => (
          <TextField
            defaultValue={row.original.thirdPartyPrice ?? ''}
            InputProps={{ inputComponent: NumericFormatCustom as never }}
            onChange={(event) => {
              row._valuesCache.thirdPartyPrice = event.target.value
            }}
          />
        )
      },
      {
        accessorKey: 'price',
        header: 'Valor general',
        size: 150,
        Cell: ({ row }) => renderMoneyCell(row.original.price),
        Edit: ({ row }) => (
          <TextField
            defaultValue={row.original.price ?? ''}
            InputProps={{ inputComponent: NumericFormatCustom as never }}
            onChange={(event) => {
              row._valuesCache.price = event.target.value
            }}
          />
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
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Button
          variant='contained'
          color='primary'
          onClick={() => setConfirmationDialogOpen(true)}
          sx={{ fontWeight: 'bold', color: '#DCFCE7' }}
        >
          Actualizar precios
        </Button>
        <TextField
          label='Porcentaje'
          type='number'
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
          InputProps={{ inputProps: { min: 0 } }}
        />
        <Button
          variant='outlined'
          startIcon={<DownloadOutlinedIcon />}
          onClick={handleDownloadTemplate}
          sx={{ fontWeight: 600, ml: 'auto' }}
        >
          Descargar plantilla
        </Button>
        <Button
          variant='outlined'
          startIcon={<CloudUploadOutlinedIcon />}
          onClick={() => setImportDialogOpen(true)}
          sx={{ fontWeight: 600 }}
        >
          Importar Excel
        </Button>
      </Stack>

      <Dialog
        open={confirmationDialogOpen}
        onClose={() => setConfirmationDialogOpen(false)}
      >
        <DialogTitle>Confirmación</DialogTitle>
        <DialogContent>
          ¿Estás seguro de que deseas actualizar todos los precios del catálogo en un {percentage}%?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmationDialogOpen(false)}>Cancelar</Button>
          <Button onClick={updateAllPrices} color='primary'>
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      <MaterialReactTable
        enableHiding={false}
        enableColumnActions={false}
        enableEditing
        enableRowActions
        positionActionsColumn='last'
        localization={MRT_Localization_ES}
        muiTableProps={{
          sx: {
            tableLayout: 'fixed'
          }
        }}
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
          <Button
            variant='contained'
            onClick={() => setCreateModalOpen(true)}
            sx={{ fontWeight: 'bold', color: '#DCFCE7' }}
          >
            Crear nuevo producto y/o servicio
          </Button>
        )}
      />

      <CreateNewProductModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateNewRow}
      />

      <Dialog open={importDialogOpen} onClose={() => { setImportDialogOpen(false); setImportFile(null) }} maxWidth='sm' fullWidth>
        <DialogTitle>Importar productos desde Excel</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography variant='body2' color='text.secondary'>
              Selecciona un archivo Excel (.xlsx) con los productos a importar.
              Usa la plantilla de ejemplo para asegurar el formato correcto.
              Los productos existentes se actualizarán automáticamente.
            </Typography>
            <Button
              variant='outlined'
              component='label'
              startIcon={<CloudUploadOutlinedIcon />}
              sx={{ alignSelf: 'flex-start' }}
            >
              {importFile ? importFile.name : 'Seleccionar archivo'}
              <input type='file' hidden accept='.xlsx,.xls' onChange={handleImportFileChange} />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setImportDialogOpen(false); setImportFile(null) }} color='inherit'>
            Cancelar
          </Button>
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
  name: '',
  serviceType: 'Trazable',
  intervalText: '',
  medicalPrice: null,
  industrialPrice: null,
  thirdPartyPrice: null,
  price: null
}

export const CreateNewProductModal = ({
  open,
  onClose,
  onSubmit
}: CreateModalProps) => {
  const [values, setValues] = useState<ProductFormValues>(initialCreateValues)

  useEffect(() => {
    if (open) {
      setValues(initialCreateValues)
    }
  }, [open])

  const handleTextChange =
    (field: keyof ProductFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((previous) => ({
        ...previous,
        [field]: event.target.value
      }))
    }

  const handleNumberChange =
    (field: keyof ProductFormValues) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValues((previous) => ({
        ...previous,
        [field]: toNullableNumber(event.target.value)
      }))
    }

  const handleSubmit = () => {
    onSubmit(values)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='md'>
      <DialogTitle textAlign='center'>Crear nuevo producto o servicio</DialogTitle>
      <DialogContent>
        <Stack
          sx={{
            width: '100%',
            minWidth: { xs: '300px', sm: '500px', md: '720px' },
            gap: '1.5rem',
            pt: 1
          }}
        >
          <TextField
            label='Nombre'
            value={values.name}
            onChange={handleTextChange('name')}
          />
          <FormControl fullWidth>
            <InputLabel>Tipo servicio</InputLabel>
            <Select
              label='Tipo servicio'
              value={values.serviceType || ''}
              onChange={(event) =>
                setValues((previous) => ({
                  ...previous,
                  serviceType: event.target.value
                }))
              }
            >
              {SERVICE_TYPE_OPTIONS.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label='Intervalo'
            value={values.intervalText || ''}
            onChange={handleTextChange('intervalText')}
          />
          <TextField
            label='Valor médica'
            value={values.medicalPrice ?? ''}
            onChange={handleNumberChange('medicalPrice')}
            InputProps={{ inputComponent: NumericFormatCustom as never }}
          />
          <TextField
            label='Valor industrial'
            value={values.industrialPrice ?? ''}
            onChange={handleNumberChange('industrialPrice')}
            InputProps={{ inputComponent: NumericFormatCustom as never }}
          />
          <TextField
            label='Valor subcontratados'
            value={values.thirdPartyPrice ?? ''}
            onChange={handleNumberChange('thirdPartyPrice')}
            InputProps={{ inputComponent: NumericFormatCustom as never }}
          />
          <TextField
            label='Valor general'
            value={values.price ?? ''}
            onChange={handleNumberChange('price')}
            InputProps={{ inputComponent: NumericFormatCustom as never }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: '1.25rem' }}>
        <Button onClick={onClose} color='inherit'>
          Cancelar
        </Button>
        <Button variant='contained' onClick={handleSubmit}>
          Crear producto
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TableProducts
