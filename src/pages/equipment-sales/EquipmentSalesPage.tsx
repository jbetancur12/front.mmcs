import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Button, Card, CardContent, Chip, Grid, IconButton,
  TablePagination, TextField, Tooltip, Typography
} from '@mui/material'
import { Add, ChevronRight, Edit, Send, CheckCircle, Cancel, Inventory, Group } from '@mui/icons-material'
import { useEquipmentQuotations, useEquipmentSalesMutations } from '../../hooks/useEquipmentSales'
import { EQUIPMENT_QUOTATION_STATUS_LABELS, EQUIPMENT_QUOTATION_STATUS_COLORS } from '../../constants/equipmentSales'
import { EquipmentQuotation } from '../../types/equipmentSales'
import Swal from 'sweetalert2'

const EquipmentSalesPage = () => {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(50)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useEquipmentQuotations({
    page: page + 1,
    limit: rowsPerPage,
    search: search || undefined,
    status: statusFilter || undefined
  })
  const mutations = useEquipmentSalesMutations()

  const handleSend = async (id: number) => {
    const result = await Swal.fire({
      title: 'Enviar cotización',
      text: '¿Estás seguro de marcar esta cotización como enviada al cliente?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    })
    if (result.isConfirmed) {
      mutations.sendQuotation.mutate(id)
    }
  }

  const handleAccept = async (id: number) => {
    const result = await Swal.fire({
      title: 'Aceptar cotización',
      text: '¿Marcar esta cotización como aceptada por el cliente?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, aceptar',
      cancelButtonText: 'Cancelar'
    })
    if (result.isConfirmed) {
      mutations.acceptQuotation.mutate(id)
    }
  }

  const handleReject = async (id: number) => {
    const { value: reason } = await Swal.fire({
      title: 'Rechazar cotización',
      input: 'textarea',
      inputLabel: 'Motivo del rechazo',
      inputPlaceholder: 'Ingresa el motivo...',
      showCancelButton: true,
      confirmButtonText: 'Rechazar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    })
    if (reason !== undefined) {
      mutations.rejectQuotation.mutate({ id, reason })
    }
  }

  const statuses = ['', 'draft', 'sent', 'accepted', 'ready_for_invoicing', 'rejected', 'invoiced', 'cancelled']

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant='h5' sx={{ fontWeight: 700 }}>Cotizaciones - Venta de Equipos</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant='text' startIcon={<Group />} onClick={() => navigate('/calibration-services/customers')}>
            Clientes
          </Button>
          <Button variant='outlined' startIcon={<Inventory />} onClick={() => navigate('/equipment-sales/products')}>
            Productos
          </Button>
          <Button variant='contained' startIcon={<Add />} onClick={() => navigate('/equipment-sales/new')}>
            Nueva Cotización
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField size='small' placeholder='Buscar por código o cliente...' value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0) }} sx={{ minWidth: 280 }} />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {statuses.map((s) => (
            <Chip key={s} label={s ? EQUIPMENT_QUOTATION_STATUS_LABELS[s] : 'Todas'}
              color={statusFilter === s ? 'primary' : 'default'}
              variant={statusFilter === s ? 'filled' : 'outlined'}
              onClick={() => { setStatusFilter(s); setPage(0) }} />
          ))}
        </Box>
      </Box>

      {isLoading ? (
        <Typography>Cargando...</Typography>
      ) : (
        <>
          <Grid container spacing={2}>
            {data?.data.map((q: EquipmentQuotation) => (
              <Grid item xs={12} sm={6} md={4} key={q.id}>
                <Card sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
                  onClick={() => navigate(`/equipment-sales/${q.id}`)}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant='subtitle1' sx={{ fontWeight: 600 }}>{q.quoteCode}</Typography>
                      <Chip label={EQUIPMENT_QUOTATION_STATUS_LABELS[q.status]}
                        size='small' sx={{ backgroundColor: EQUIPMENT_QUOTATION_STATUS_COLORS[q.status], color: '#fff' }} />
                    </Box>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
                      {q.customer?.nombre || 'Cliente no especificado'}
                    </Typography>
                    <Typography variant='body2'>
                      <strong>Total:</strong> ${Number(q.grandTotal).toLocaleString('es-CO', { minimumFractionDigits: 2 })}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {new Date(q.createdAt).toLocaleDateString('es-CO')}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 0.5 }}>
                      {q.status === 'draft' && (
                        <>
                          <Tooltip title='Editar'><IconButton size='small' onClick={(e) => { e.stopPropagation(); navigate(`/equipment-sales/${q.id}/edit`) }}><Edit fontSize='small' /></IconButton></Tooltip>
                          <Tooltip title='Enviar'><IconButton size='small' onClick={(e) => { e.stopPropagation(); handleSend(q.id) }}><Send fontSize='small' /></IconButton></Tooltip>
                        </>
                      )}
                      {q.status === 'sent' && (
                        <>
                          <Tooltip title='Aceptar'><IconButton size='small' onClick={(e) => { e.stopPropagation(); handleAccept(q.id) }}><CheckCircle fontSize='small' color='success' /></IconButton></Tooltip>
                          <Tooltip title='Rechazar'><IconButton size='small' onClick={(e) => { e.stopPropagation(); handleReject(q.id) }}><Cancel fontSize='small' color='error' /></IconButton></Tooltip>
                        </>
                      )}
                      <Tooltip title='Ver detalle'><IconButton size='small' onClick={(e) => { e.stopPropagation(); navigate(`/equipment-sales/${q.id}`) }}><ChevronRight fontSize='small' /></IconButton></Tooltip>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
          {data && (
            <TablePagination component='div' count={data.total} page={page} onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0) }}
              labelRowsPerPage='Filas por página' />
          )}
        </>
      )}
    </Box>
  )
}

export default EquipmentSalesPage
