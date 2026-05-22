import { useState } from 'react'
import {
  Box, Button, Dialog, DialogActions, DialogContent,
  DialogTitle, Grid, IconButton, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography, Paper, TablePagination
} from '@mui/material'
import { Add, Edit, Delete } from '@mui/icons-material'
import Swal from 'sweetalert2'
import { useEquipmentProducts, useEquipmentSalesMutations } from '../../hooks/useEquipmentSales'
import { EquipmentProduct, EquipmentProductPayload } from '../../types/equipmentSales'

const emptyProduct: EquipmentProductPayload = {
  name: '', description: '', category: '', defaultBrand: '', defaultModel: '',
  defaultPrice: null, taxRate: 19
}

const EquipmentProductsPage = () => {
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

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 700 }}>Catálogo de Productos - Venta de Equipos</Typography>
        <Button variant='contained' startIcon={<Add />} onClick={openCreate}>Nuevo Producto</Button>
      </Box>

      <TextField size='small' placeholder='Buscar productos...' value={search}
        onChange={(e) => { setSearch(e.target.value); setPage(0) }} sx={{ mb: 2, minWidth: 300 }} />

      <TableContainer component={Paper} variant='outlined'>
        <Table size='small'>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Marca</TableCell>
              <TableCell>Modelo</TableCell>
              <TableCell align='right'>Precio sugerido</TableCell>
              <TableCell align='right'>IVA %</TableCell>
              <TableCell align='right'>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.map((p: EquipmentProduct) => (
              <TableRow key={p.id} hover>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.category || '-'}</TableCell>
                <TableCell>{p.defaultBrand || '-'}</TableCell>
                <TableCell>{p.defaultModel || '-'}</TableCell>
                <TableCell align='right'>
                  {p.defaultPrice ? `$${Number(p.defaultPrice).toLocaleString('es-CO')}` : '-'}
                </TableCell>
                <TableCell align='right'>{p.taxRate}%</TableCell>
                <TableCell align='right'>
                  <IconButton size='small' onClick={() => openEdit(p)}><Edit fontSize='small' /></IconButton>
                  <IconButton size='small' color='error' onClick={() => handleDelete(p.id, p.name)}><Delete fontSize='small' /></IconButton>
                </TableCell>
              </TableRow>
            ))}
            {(!data?.data || data.data.length === 0) && (
              <TableRow><TableCell colSpan={7} align='center'><Typography variant='body2' color='text.secondary'>No hay productos</Typography></TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      {data && <TablePagination component='div' count={data.total} page={page} onPageChange={(_, p) => setPage(p)}
        rowsPerPage={50} rowsPerPageOptions={[50]} labelRowsPerPage='' />}

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
    </Box>
  )
}

export default EquipmentProductsPage
