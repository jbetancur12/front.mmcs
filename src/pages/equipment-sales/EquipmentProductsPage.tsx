import { useMemo, useState } from 'react'
import { type MRT_Cell, type MRT_ColumnDef } from 'material-react-table'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Tooltip,
  Typography
} from '@mui/material'
import {
  Add,
  Edit,
  Delete,
  ArrowBack,
  Inventory2Outlined
} from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import DataTable from 'src/Components/Common/DataTable'
import Swal from 'sweetalert2'
import {
  useEquipmentProducts,
  useEquipmentSalesMutations
} from '../../hooks/useEquipmentSales'
import {
  EquipmentProduct,
  EquipmentProductPayload
} from '../../types/equipmentSales'

const emptyProduct: EquipmentProductPayload = {
  name: '',
  description: '',
  category: '',
  defaultBrand: '',
  defaultModel: '',
  defaultPrice: null,
  taxRate: 19
}

const EquipmentProductsPage = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const { data } = useEquipmentProducts({
    page: page + 1,
    limit: 50,
    search: search || undefined
  })
  const mutations = useEquipmentSalesMutations()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<EquipmentProductPayload>(emptyProduct)

  const openCreate = () => {
    setForm(emptyProduct)
    setEditingId(null)
    setDialogOpen(true)
  }
  const openEdit = (p: EquipmentProduct) => {
    setForm({
      name: p.name,
      description: p.description,
      category: p.category,
      defaultBrand: p.defaultBrand,
      defaultModel: p.defaultModel,
      defaultPrice: p.defaultPrice,
      taxRate: p.taxRate
    })
    setEditingId(p.id)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name)
      return Swal.fire('Validación', 'El nombre es obligatorio', 'warning')
    try {
      if (editingId) {
        await mutations.updateProduct.mutateAsync({
          id: editingId,
          payload: form
        })
      } else {
        await mutations.createProduct.mutateAsync(form)
      }
      setDialogOpen(false)
      Swal.fire(editingId ? 'Actualizado' : 'Creado', '', 'success')
    } catch {
      Swal.fire('Error', 'No se pudo guardar', 'error')
    }
  }

  const handleDelete = async (id: number, name: string) => {
    const result = await Swal.fire({
      title: 'Desactivar producto',
      text: `¿Desactivar "${name}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Desactivar'
    })
    if (result.isConfirmed) {
      mutations.deleteProduct.mutate(id, {
        onSuccess: () => Swal.fire('Desactivado', '', 'success')
      })
    }
  }

  const columns = useMemo<MRT_ColumnDef<EquipmentProduct>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Producto',
        size: 280,
        Cell: ({ cell }: { cell: MRT_Cell<EquipmentProduct> }) => (
          <Typography variant='body2' fontWeight={600}>
            {cell.getValue<string>()}
          </Typography>
        )
      },
      {
        accessorKey: 'category',
        header: 'Categoría',
        size: 180,
        Cell: ({ row }) => <>{row.original.category || '-'}</>
      },
      {
        accessorKey: 'defaultBrand',
        header: 'Marca',
        size: 130,
        Cell: ({ row }) => <>{row.original.defaultBrand || '-'}</>
      },
      {
        accessorKey: 'defaultModel',
        header: 'Modelo',
        size: 130,
        Cell: ({ row }) => <>{row.original.defaultModel || '-'}</>
      },
      {
        accessorKey: 'defaultPrice',
        header: 'Precio',
        size: 140,
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        Cell: ({ row }) => (
          <>
            {row.original.defaultPrice
              ? `$ ${Number(row.original.defaultPrice).toLocaleString('es-CO')}`
              : '-'}
          </>
        )
      },
      {
        accessorKey: 'taxRate',
        header: 'IVA',
        size: 80,
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        Cell: ({ row }) => <>{Number(row.original.taxRate)}%</>
      }
    ],
    []
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/equipment-sales')}
        sx={{
          mb: 1,
          color: 'text.secondary',
          textTransform: 'none',
          fontWeight: 600
        }}
      >
        Volver a cotizaciones
      </Button>

      <LmsPageHeader
        title='Catálogo de Productos'
        subtitle='Productos que se pueden cotizar en venta de equipos'
        icon={<Inventory2Outlined />}
        actions={
          <Button
            variant='contained'
            startIcon={<Add />}
            onClick={openCreate}
            sx={{
              bgcolor: '#00BFA5',
              whiteSpace: 'nowrap',
              '&:hover': { bgcolor: '#00ACC1' }
            }}
          >
            Nuevo producto
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        itemLabel={['producto', 'productos']}
        searchPlaceholder='Buscar productos'
        manualPagination
        manualFiltering
        enableColumnFilters={false}
        enableSorting={false}
        rowCount={data?.total ?? 0}
        state={{
          pagination: { pageIndex: page, pageSize: 50 },
          globalFilter: search
        }}
        onPaginationChange={(updater) => {
          const next =
            typeof updater === 'function'
              ? updater({ pageIndex: page, pageSize: 50 })
              : updater
          setPage(next.pageIndex)
        }}
        onGlobalFilterChange={(value) => {
          setSearch(value ?? '')
          setPage(0)
        }}
        muiTablePaginationProps={{ rowsPerPageOptions: [50] }}
        enableRowActions
        getRowId={(row, index) => String(row.id ?? `row-${index}`)}
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title='Editar'>
              <IconButton
                size='small'
                aria-label={`Editar ${row.original.name}`}
                sx={{ color: '#2563eb' }}
                onClick={() => openEdit(row.original)}
              >
                <Edit fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Desactivar'>
              <IconButton
                size='small'
                aria-label={`Desactivar ${row.original.name}`}
                color='error'
                onClick={() => handleDelete(row.original.id, row.original.name)}
              >
                <Delete fontSize='small' />
              </IconButton>
            </Tooltip>
          </Box>
        )}
        renderEmptyRowsFallback={() => (
          <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
            No hay productos
          </Box>
        )}
      />

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>
          {editingId ? 'Editar Producto' : 'Nuevo Producto'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label='Nombre *'
                fullWidth
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='Categoría'
                fullWidth
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder='Ej: Equipos médicos, Industriales'
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='Marca por defecto'
                fullWidth
                value={form.defaultBrand}
                onChange={(e) =>
                  setForm({ ...form, defaultBrand: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='Modelo por defecto'
                fullWidth
                value={form.defaultModel}
                onChange={(e) =>
                  setForm({ ...form, defaultModel: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label='Precio sugerido'
                type='number'
                fullWidth
                value={form.defaultPrice || ''}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultPrice: parseFloat(e.target.value) || null
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label='Descripción'
                multiline
                rows={3}
                fullWidth
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button
            variant='contained'
            onClick={handleSave}
            disabled={
              mutations.createProduct.isLoading ||
              mutations.updateProduct.isLoading
            }
          >
            {editingId ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default EquipmentProductsPage
