import { getApiErrorReason } from 'src/utils/apiError'
import React, { useMemo, useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  IconButton,
  Container,
  Button,
  ButtonGroup,
  Alert,
  Tooltip,
  Grid,
  Divider
} from '@mui/material'
import {
  CheckCircle,
  Cancel,
  AttachMoney,
  Receipt,
  Warning
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '../../utils/use-axios-private'

import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { purchaseTableStyle } from 'src/Components/Purchases/purchaseTableStyle'
import { PERMISSIONS } from 'src/constants/permissions'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { useCan } from '@utils/functions'
import { notify } from 'src/utils/notify'
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
  technicianWorkMinutes?: number | null
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

  const queryClient = useQueryClient()
  const canPerformActions = useCan(PERMISSIONS.MAINTENANCE_INVOICING_MANAGE)

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
    mutationFn: async ({
      ticketId,
      isInvoiced
    }: {
      ticketId: string
      isInvoiced: boolean
    }) => {
      const response = await axiosPrivate.put(
        `/maintenance/invoicing/tickets/${ticketId}/toggle`,
        { isInvoiced }
      )
      return response.data
    },
    onSuccess: (data) => {
      notify.success(data.message)
      queryClient.invalidateQueries({ queryKey: ['maintenance-billing'] })
    },
    onError: (error: any) => {
      notify.error(
        getApiErrorReason(error) ||
          'Error al actualizar estado de facturación'
      )
    }
  })

  const handleToggleInvoice = (ticketId: string, currentStatus: boolean) => {
    toggleInvoiceMutation.mutate({
      ticketId,
      isInvoiced: !currentStatus
    })
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

  const formatWorkMinutes = (value?: number | null) => {
    const minutes = Number(value)

    if (!Number.isFinite(minutes) || minutes <= 0) {
      return 'No registrado'
    }

    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60

    if (hours <= 0) {
      return `${remainingMinutes} min`
    }

    if (remainingMinutes <= 0) {
      return `${hours} h`
    }

    return `${hours} h ${remainingMinutes} min`
  }

  const columns = useMemo<MRT_ColumnDef<BillingTicket>[]>(
    () => [
      {
        accessorKey: 'ticketCode',
        header: 'Ticket',
        size: 120,
        Cell: ({ row }) => (
          <Typography variant='body2' fontWeight={600}>
            {row.original.ticketCode}
          </Typography>
        )
      },
      {
        accessorKey: 'customerName',
        header: 'Cliente',
        size: 180,
        Cell: ({ row }) => (
          <Box sx={{ maxWidth: 170, overflowWrap: 'anywhere' }}>
            <Typography variant='body2'>{row.original.customerName}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.customerEmail}
            </Typography>
          </Box>
        )
      },
      {
        accessorKey: 'equipmentType',
        header: 'Equipo',
        size: 170,
        Cell: ({ row }) => (
          <Box sx={{ maxWidth: 160, overflowWrap: 'anywhere' }}>
            <Typography variant='body2'>{row.original.equipmentType}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.equipmentBrand} {row.original.equipmentModel}
            </Typography>
          </Box>
        )
      },
      {
        accessorKey: 'actualCompletionDate',
        header: 'Completado',
        size: 120,
        Cell: ({ row }) => (
          <Typography variant='body2'>
            {formatDate(row.original.actualCompletionDate)}
          </Typography>
        )
      },
      {
        accessorKey: 'totalCost',
        header: 'Total',
        size: 120,
        Cell: ({ row }) => {
          const ticket = row.original
          if (ticket.totalCost > 0) {
            return (
              <Typography variant='body2' fontWeight={700} color='#00897B'>
                {formatCurrency(ticket.totalCost)}
              </Typography>
            )
          }
          if (ticket.technicianWorkMinutes) {
            return (
              <Typography variant='caption' color='text.secondary' sx={{ fontStyle: 'italic' }}>
                Solo tiempo técnico
              </Typography>
            )
          }
          return (
            <Typography variant='body2' fontWeight={700} color='#9ca3af'>
              $0
            </Typography>
          )
        }
      },
      {
        accessorKey: 'isInvoiced',
        header: 'Estado',
        size: 170,
        Cell: ({ row }) =>
          row.original.isInvoiced ? (
            <Chip label='Facturado' color='success' size='small' variant='outlined' icon={<CheckCircle />} />
          ) : (
            <Chip label='Sin facturar' color='error' size='small' variant='outlined' icon={<Cancel />} />
          )
      }
    ],
     
    []
  )

  if (error) {
    return (
      <Alert severity='error' sx={{ m: 3 }}>
        Error al cargar tickets de facturación. Por favor intente nuevamente.
      </Alert>
    )
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Control de Facturación'
        subtitle='Gestión y seguimiento de facturación de servicios de mantenimiento'
        icon={<Receipt />}
      />

      {data && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <LmsStatCard label='Total Tickets' value={data.summary.totalTickets} icon={<Receipt />} tone='blue' />
          </Grid>
          <Grid item xs={12} sm={4}>
            <LmsStatCard label='Monto Total' value={formatCurrency(data.summary.totalAmount)} icon={<AttachMoney />} tone='green' compact />
          </Grid>
          <Grid item xs={12} sm={4}>
            <LmsStatCard
              label='Filtro Activo'
              value={filter === 'not_invoiced' ? 'Sin Facturar' : filter === 'invoiced' ? 'Facturados' : 'Todos'}
              icon={<Warning />}
              tone='orange'
              compact
            />
          </Grid>
        </Grid>
      )}

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <ButtonGroup variant='outlined' fullWidth>
          <Button
            onClick={() => {
              setFilter('not_invoiced')
              setPage(0)
            }}
            variant={filter === 'not_invoiced' ? 'contained' : 'outlined'}
            sx={{
              backgroundColor:
                filter === 'not_invoiced' ? '#dc2626' : undefined,
              '&:hover': {
                backgroundColor:
                  filter === 'not_invoiced' ? '#b91c1c' : undefined
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

      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <MaterialReactTable
          {...purchaseTableStyle}
          columns={columns}
          data={data?.tickets ?? []}
          manualPagination
          rowCount={data?.pagination.totalItems ?? 0}
          state={{
            isLoading,
            pagination: { pageIndex: page, pageSize: rowsPerPage }
          }}
          onPaginationChange={(updater) => {
            const next =
              typeof updater === 'function'
                ? updater({ pageIndex: page, pageSize: rowsPerPage })
                : updater
            if (next.pageSize !== rowsPerPage) {
              setRowsPerPage(next.pageSize)
              setPage(0)
            } else {
              setPage(next.pageIndex)
            }
          }}
          muiTablePaginationProps={{ rowsPerPageOptions: [10, 20, 50, 100] }}
          enableGlobalFilter={false}
          enableColumnFilters={false}
          enableDensityToggle={false}
          enableHiding={false}
          enableSorting={false}
          enableColumnActions={false}
          enablePinning
          getRowId={(row, index) => String(row.id ?? `skeleton-${index}`)}
          initialState={{ columnPinning: { right: ['mrt-row-actions'] } }}
          enableRowActions
          displayColumnDefOptions={{
            'mrt-row-actions': { header: 'Acciones', size: 90 },
            'mrt-row-expand': { header: '', size: 50 }
          }}
          renderRowActions={({ row }) => {
            const ticket = row.original
            return (
              <Tooltip title={ticket.isInvoiced ? 'Marcar como no facturado' : 'Marcar como facturado'}>
                <span>
                  <IconButton
                    size='small'
                    onClick={() => handleToggleInvoice(ticket.id, ticket.isInvoiced)}
                    disabled={toggleInvoiceMutation.isLoading || !canPerformActions}
                    sx={{ color: ticket.isInvoiced ? 'error.main' : '#00BFA5' }}
                  >
                    {ticket.isInvoiced ? <Cancel /> : <CheckCircle />}
                  </IconButton>
                </span>
              </Tooltip>
            )
          }}
          renderDetailPanel={({ row }) => (
            <Box sx={{ py: 3, px: 2 }}>
              <Typography
                variant='h6'
                gutterBottom
                fontWeight={600}
              >
                Desglose de Costos
              </Typography>
              <Typography
                variant='body2'
                color='text.secondary'
                sx={{ mb: 1 }}
              >
                Tiempo técnico registrado:{' '}
                <strong>
                  {formatWorkMinutes(row.original.technicianWorkMinutes)}
                </strong>
              </Typography>
              <Divider sx={{ mb: 2 }} />
              {row.original.costs.length === 0 ? (
                <Alert severity='info' sx={{ mb: 2 }}>
                  Sin costos de materiales — Este servicio no registró costos de materiales. El tiempo técnico registrado queda como referencia para la facturación externa.
                </Alert>
              ) : (
                <>
              <Grid container spacing={2}>
                {row.original.costs.map((cost) => (
                  <Grid item xs={12} sm={6} md={4} key={cost.id}>
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    >
                      <Typography
                        variant='subtitle2'
                        fontWeight={700}
                        gutterBottom
                      >
                        {cost.name}
                      </Typography>
                      {cost.description && (
                        <Typography
                          variant='caption'
                          color='text.secondary'
                          display='block'
                          sx={{ mb: 1 }}
                        >
                          {cost.description}
                        </Typography>
                      )}
                      <Typography
                        variant='h6'
                        fontWeight={700}
                        color='#10b981'
                      >
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
                <Typography
                  variant='h6'
                  fontWeight={700}
                  color='white'
                >
                  Total
                </Typography>
                <Typography
                  variant='h5'
                  fontWeight={700}
                  color='white'
                >
                  {formatCurrency(row.original.totalCost)}
                </Typography>
              </Box>
                </>
              )}
            </Box>
          )}
          renderEmptyRowsFallback={() => (
            <Box sx={{ py: 8, textAlign: 'center' }}>
              <Typography variant='h6' color='text.secondary'>
                No hay tickets completados para mostrar
              </Typography>
              <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                {filter === 'not_invoiced'
            ? 'No hay tickets pendientes de facturar'
            : filter === 'invoiced'
              ? 'No hay tickets facturados'
              : 'No hay tickets completados'}
              </Typography>
            </Box>
          )}
        />
      </Paper>
    </Container>
  )
}

export default MaintenanceBilling
