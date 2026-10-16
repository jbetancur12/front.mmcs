import { useMemo, useState } from 'react'
import MaterialReactTable, { type MRT_ColumnDef } from 'material-react-table'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Container, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, TextField, Paper
} from '@mui/material'
import { Add, Edit, Delete, ArrowBack, Inventory2Outlined } from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { purchaseTableStyle } from 'src/Components/Purchases/purchaseTableStyle'
import Swal from 'sweetalert2'
import { useEquipmentProducts, useEquipmentSalesMutations } from '../../hooks/useEquipmentSales'
import { EquipmentProduct, EquipmentProductPayload } from '../../types/equipmentSales'

const emptyProduct: EquipmentProductPayload = {
  name: '', description: '', category: '', defaultBrand: '', defaultModel: '',
  defaultPrice: null, taxRate: 19
}

const EquipmentProductsPage = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const { data } = useEquipmentProducts({ page: page + 1, limit: 50, search: search || undefined })
  const mutations = useEquipmentSalesMutations()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<EquipmentProductPayload>(emptyProduct)

  const openCreate = () => { setForm(emptyProduct); setEditingId(null); setDialogOpen(true) }
  const openEdit = (p: EquipmentProduct) => {
    setForm({ name: p.name, description: p.description, category: p.category, defaultBrand: p.defaultBrand, defaultModel: p.defaultModel, defaultPrice: p.defaultPrice, taxRate: p.taxRate })
    setEditingId(p.id); setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!form.name) return Swal.fire('Validación', 'El nombre es obligatorio', 'warning')
    try {
      if (editingId) {
        await mutations.updateProduct.mutateAsync({ id: editingId, payload: form })
      } else {
        await mutations.createProduct.mutateAsync(form)
      }
      setDialogOpen(false)
      Swal.fire(editingId ? 'Actualizado' : 'Creado', '', 'success')
    } catch { Swal.fire('Error', 'No se pudo guardar', 'error') }
  }

  const handleDelete = async (id: number, name: string) => {
    const result = await Swal.fire({ title: 'Desactivar producto', text: `¿Desactivar "${name}"?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Desactivar' })
    if (result.isConfirmed) { mutations.deleteProduct.mutate(id, { onSuccess: () => Swal.fire('Desactivado', '', 'success') }) }
  }

  const columns = useMemo<MRT_ColumnDef<EquipmentProduct>[]>(
    () => [
      { accessorKey: 'name', header: 'Nombre', size: 260 },
      { accessorKey: 'category', header: 'Categoría', size: 170, Cell: ({ row }) => <>{row.original.category || '-'}</> },
      { accessorKey: 'defaultBrand', header: 'Marca', size: 110, Cell: ({ row }) => <>{row.original.defaultBrand || '-'}</> },
      { accessorKey: 'defaultModel', header: 'Modelo', size: 110, Cell: ({ row }) => <>{row.original.defaultModel || '-'}</> },
      {
        accessorKey: 'defaultPrice',
        header: 'Precio',
        size: 150,
        Cell: ({ row }) => <>{row.original.defaultPrice ? `${Number(row.original.defaultPrice).toLocaleString('es-CO')}` : '-'}</>
      },
      { accessorKey: 'taxRate', header: 'IVA %', size: 90, Cell: ({ row }) => <>{row.original.taxRate}%</> }
    ],
    []
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate('/equipment-sales')}
        sx={{ mb: 1, color: 'text.secondary', textTransform: 'none', fontWeight: 600 }}
      >
        Volver a cotizaciones
      </Button>

      <LmsPageHeader
        title='Catálogo de Productos'
        subtitle='Productos que se pueden cotizar en venta de equipos'
        icon={<Inventory2Outlined />}
        actions={
          <Button variant='contained' startIcon={<Add />} onClick={openCreate} sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}>
            Nuevo producto
          </Button>
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard label='Productos' value={data?.total ?? 0} icon={<Inventory2Outlined />} tone='teal' />
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <MaterialReactTable
          {...purchaseTableStyle}
          columns={columns}
          data={data?.data ?? []}
          manualPagination
          manualFiltering
          enableColumnFilters={false}
          enableSorting={false}
          rowCount={data?.total ?? 0}
          state={{ pagination: { pageIndex: page, pageSize: 50 }, globalFilter: search }}
          onPaginationChange={(updater) => {
            const next = typeof updater === 'function' ? updater({ pageIndex: page, pageSize: 50 }) : updater
            setPage(next.pageIndex)
          }}
          onGlobalFilterChange={(value) => { setSearch(value ?? ''); setPage(0) }}
          muiTablePaginationProps={{ rowsPerPageOptions: [50] }}
          muiSearchTextFieldProps={{ ...purchaseTableStyle.muiSearchTextFieldProps, placeholder: 'Buscar productos...' }}
          enablePinning
          initialState={{ columnPinning: { right: ['mrt-row-actions'] } }}
          enableRowActions
          getRowId={(row, index) => String(row.id ?? `row-${index}`)}
          renderRowActions={({ row }) => (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton size='small' color='primary' onClick={() => openEdit(row.original)}><Edit fontSize='small' /></IconButton>
              <IconButton size='small' color='error' onClick={() => handleDelete(row.original.id, row.original.name)}><Delete fontSize='small' /></IconButton>
            </Box>
          )}
          renderEmptyRowsFallback={() => (
            <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>No hay productos</Box>
          )}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField label='Nombre *' fullWidth value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label='Categoría' fullWidth value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder='Ej: Equipos médicos, Industriales' />
            </Grid>
            <Grid item xs={6}>
              <TextField label='Marca por defecto' fullWidth value={form.defaultBrand} onChange={(e) => setForm({ ...form, defaultBrand: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label='Modelo por defecto' fullWidth value={form.defaultModel} onChange={(e) => setForm({ ...form, defaultModel: e.target.value })} />
            </Grid>
            <Grid item xs={6}>
              <TextField label='Precio sugerido' type='number' fullWidth value={form.defaultPrice || ''} onChange={(e) => setForm({ ...form, defaultPrice: parseFloat(e.target.value) || null })} />
            </Grid>
            <Grid item xs={12}>
              <TextField label='Descripción' multiline rows={3} fullWidth value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button variant='contained' onClick={handleSave} disabled={mutations.createProduct.isLoading || mutations.updateProduct.isLoading}>
            {editingId ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

export default EquipmentProductsPage
