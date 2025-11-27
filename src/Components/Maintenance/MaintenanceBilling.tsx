import React, { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Collapse,
  Button,
  ButtonGroup,
  CircularProgress,
  Alert,
  Tooltip,
  TablePagination,
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material'
import {
  ExpandMore,
  ExpandLess,
  CheckCircle,
  Cancel,
  AttachMoney,
  Receipt,
  Warning
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { toast } from 'react-toastify'
import useAxiosPrivate from '../../utils/use-axios-private'

interface MaintenanceTicketCost {
  id: string
  name: string
  description?: string
  amount: number
  createdAt: string
}

interface BillingTicket {
  id: string
  ticketCode: string
  customerName: string
  customerEmail: string
  equipmentType: string
  equipmentBrand: string
  equipmentModel: string
  actualCompletionDate: string
  isInvoiced: boolean
  createdAt: string
  updatedAt: string
  totalCost: number
  costs: MaintenanceTicketCost[]
}

interface BillingResponse {
  tickets: BillingTicket[]
  pagination: {
    currentPage: number
    itemsPerPage: number
    totalItems: number
    totalPages: number
  }
  summary: {
    filter: string
    totalTickets: number
    totalAmount: number
  }
}

type FilterType = 'all' | 'invoiced' | 'not_invoiced'

const MaintenanceBilling: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>('not_invoiced')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(20)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const queryClient = useQueryClient()
  const axiosPrivate = useAxiosPrivate()

  // Fetch billing tickets
  const { data, isLoading, error } = useQuery<BillingResponse>({
    queryKey: ['maintenance-billing', filter, page, rowsPerPage],
    queryFn: async () => {
      const response = await axiosPrivate.get(
        `/maintenance/invoicing/tickets`,
        {
          params: {
            filter,
            page: page + 1,
            limit: rowsPerPage
          }
        }
      )
      return response.data
    },
    staleTime: 1000 * 60 * 3 // 3 minutes
  })

  // Toggle invoice status mutation
  const toggleInvoiceMutation = useMutation({
    mutationFn: async ({ ticketId, isInvoiced }: { ticketId: string; isInvoiced: boolean }) => {
      const response = await axiosPrivate.put(
        `/maintenance/invoicing/tickets/${ticketId}/toggle`,
        { isInvoiced }
      )
      return response.data
    },
    onSuccess: (data) => {
      toast.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['maintenance-billing'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Error al actualizar estado de facturación')
    }
  })

  const handleToggleExpand = (ticketId: string) => {
    setExpandedRow(expandedRow === ticketId ? null : ticketId)
  }

  const handleToggleInvoice = (ticketId: string, currentStatus: boolean) => {
    toggleInvoiceMutation.mutate({
      ticketId,
      isInvoiced: !currentStatus
    })
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Error al cargar tickets de facturación. Por favor intente nuevamente.
      </Alert>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Control de Facturación
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Gestión y seguimiento de facturación de servicios de mantenimiento
        </Typography>
      </Box>

      {/* Summary Cards */}
      {data && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Receipt sx={{ fontSize: 40, color: '#3b82f6' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Tickets
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {data.summary.totalTickets}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <AttachMoney sx={{ fontSize: 40, color: '#10b981' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Monto Total
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="#10b981">
                      {formatCurrency(data.summary.totalAmount)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card elevation={2}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Warning sx={{ fontSize: 40, color: '#f59e0b' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Filtro Activo
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {filter === 'not_invoiced'
                        ? 'Sin Facturar'
                        : filter === 'invoiced'
                        ? 'Facturados'
                        : 'Todos'}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <ButtonGroup variant="outlined" fullWidth>
          <Button
            onClick={() => {
              setFilter('not_invoiced')
              setPage(0)
            }}
            variant={filter === 'not_invoiced' ? 'contained' : 'outlined'}
            sx={{
              backgroundColor: filter === 'not_invoiced' ? '#dc2626' : undefined,
              '&:hover': {
                backgroundColor: filter === 'not_invoiced' ? '#b91c1c' : undefined
              }
            }}
          >
            Sin Facturar
          </Button>
          <Button
            onClick={() => {
              setFilter('invoiced')
              setPage(0)
            }}
            variant={filter === 'invoiced' ? 'contained' : 'outlined'}
            sx={{
              backgroundColor: filter === 'invoiced' ? '#10b981' : undefined,
              '&:hover': {
                backgroundColor: filter === 'invoiced' ? '#059669' : undefined
              }
            }}
          >
            Facturados
          </Button>
          <Button
            onClick={() => {
              setFilter('all')
              setPage(0)
            }}
            variant={filter === 'all' ? 'contained' : 'outlined'}
            sx={{
              backgroundColor: filter === 'all' ? '#3b82f6' : undefined,
              '&:hover': {
                backgroundColor: filter === 'all' ? '#2563eb' : undefined
              }
            }}
          >
            Todos
          </Button>
        </ButtonGroup>
      </Paper>

      {/* Table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead sx={{ backgroundColor: '#f3f4f6' }}>
            <TableRow>
              <TableCell width={50} />
              <TableCell>
                <Typography fontWeight={700}>Ticket</Typography>
              </TableCell>
              <TableCell>
                <Typography fontWeight={700}>Cliente</Typography>
              </TableCell>
              <TableCell>
                <Typography fontWeight={700}>Equipo</Typography>
              </TableCell>
              <TableCell>
                <Typography fontWeight={700}>Fecha Completado</Typography>
              </TableCell>
              <TableCell align="right">
                <Typography fontWeight={700}>Total</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography fontWeight={700}>Estado</Typography>
              </TableCell>
              <TableCell align="center">
                <Typography fontWeight={700}>Acciones</Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <CircularProgress />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Cargando tickets...
                  </Typography>
                </TableCell>
              </TableRow>
            ) : data?.tickets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                  <Typography variant="h6" color="text.secondary">
                    No hay tickets con costos para mostrar
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {filter === 'not_invoiced'
                      ? 'No hay tickets pendientes de facturar'
                      : filter === 'invoiced'
                      ? 'No hay tickets facturados'
                      : 'No hay tickets completados con costos'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              data?.tickets.map((ticket) => (
                <React.Fragment key={ticket.id}>
                  {/* Main Row */}
                  <TableRow hover>
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleExpand(ticket.id)}
                      >
                        {expandedRow === ticket.id ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {ticket.ticketCode}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{ticket.customerName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ticket.customerEmail}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{ticket.equipmentType}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ticket.equipmentBrand} {ticket.equipmentModel}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(ticket.actualCompletionDate)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body1" fontWeight={700} color="#10b981">
                        {formatCurrency(ticket.totalCost)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {ticket.isInvoiced ? (
                        <Chip
                          label="Facturado"
                          color="success"
                          size="small"
                          icon={<CheckCircle />}
                        />
                      ) : (
                        <Chip
                          label="Sin Facturar"
                          color="error"
                          size="small"
                          icon={<Cancel />}
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip
                        title={
                          ticket.isInvoiced
                            ? 'Marcar como no facturado'
                            : 'Marcar como facturado'
                        }
                      >
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleToggleInvoice(ticket.id, ticket.isInvoiced)}
                            disabled={toggleInvoiceMutation.isPending}
                            sx={{
                              color: ticket.isInvoiced ? '#dc2626' : '#10b981',
                              '&:hover': {
                                backgroundColor: ticket.isInvoiced
                                  ? 'rgba(220, 38, 38, 0.1)'
                                  : 'rgba(16, 185, 129, 0.1)'
                              }
                            }}
                          >
                            {ticket.isInvoiced ? <Cancel /> : <CheckCircle />}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Row - Cost Details */}
                  <TableRow>
                    <TableCell colSpan={8} sx={{ py: 0, backgroundColor: '#fafafa' }}>
                      <Collapse in={expandedRow === ticket.id} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 3, px: 2 }}>
                          <Typography variant="h6" gutterBottom fontWeight={600}>
                            Desglose de Costos
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          <Grid container spacing={2}>
                            {ticket.costs.map((cost, index) => (
                              <Grid item xs={12} sm={6} md={4} key={cost.id}>
                                <Paper
                                  elevation={1}
                                  sx={{
                                    p: 2,
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                  }}
                                >
                                  <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                                    {cost.name}
                                  </Typography>
                                  {cost.description && (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      display="block"
                                      sx={{ mb: 1 }}
                                    >
                                      {cost.description}
                                    </Typography>
                                  )}
                                  <Typography variant="h6" fontWeight={700} color="#10b981">
                                    {formatCurrency(cost.amount)}
                                  </Typography>
                                </Paper>
                              </Grid>
                            ))}
                          </Grid>
                          <Box
                            sx={{
                              mt: 3,
                              p: 2,
                              backgroundColor: '#10b981',
                              borderRadius: '8px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <Typography variant="h6" fontWeight={700} color="white">
                              Total
                            </Typography>
                            <Typography variant="h5" fontWeight={700} color="white">
                              {formatCurrency(ticket.totalCost)}
                            </Typography>
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {data && (
          <TablePagination
            component="div"
            count={data.pagination.totalItems}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50, 100]}
            labelRowsPerPage="Filas por página"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        )}
      </TableContainer>
    </Box>
  )
}

export default MaintenanceBilling
