import React, { useMemo } from 'react'
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material'
import { Delete, Edit, Engineering, Visibility } from '@mui/icons-material'
import { MRT_ColumnDef, MRT_PaginationState } from 'material-react-table'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import DataTable from 'src/Components/Common/DataTable'
import EmptyState from 'src/Components/Common/EmptyState'
import { brand, intent, neutral } from 'src/theme/designTokens'
import { MaintenanceTicket } from '../../types/maintenance'
import MaintenanceStatusBadge from './MaintenanceStatusBadge'
import MaintenancePriorityBadge from './MaintenancePriorityBadge'
import { getTicketPendings } from './ticketPendings'

interface MaintenanceTicketsTableProps {
  tickets: MaintenanceTicket[]
  loading: boolean
  /** Página actual, desde 1. */
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onView: (ticket: MaintenanceTicket) => void
  onEdit: (ticket: MaintenanceTicket) => void
  /** Si se pasa, el botón de eliminar aparece solo en los tickets donde esta función devuelve true. */
  canDelete?: (ticket: MaintenanceTicket) => boolean
  onDelete?: (ticket: MaintenanceTicket) => void
}

const formatShortDate = (value?: string | null) => {
  if (!value) return ''
  try {
    return format(new Date(value), 'dd/MM/yyyy', { locale: es })
  } catch {
    return ''
  }
}

/** Lista de tickets del panel como filas, con paginación en el servidor. */
const MaintenanceTicketsTable: React.FC<MaintenanceTicketsTableProps> = ({
  tickets,
  loading,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onView,
  onEdit,
  canDelete,
  onDelete
}) => {
  const columns = useMemo<MRT_ColumnDef<MaintenanceTicket>[]>(
    () => [
      {
        header: 'Ticket',
        accessorKey: 'ticketCode',
        size: 170,
        Cell: ({ row }) => (
          <Box>
            <Typography
              variant='body2'
              sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
            >
              {row.original.ticketCode}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {formatShortDate(row.original.createdAt)}
            </Typography>
          </Box>
        )
      },
      {
        header: 'Cliente',
        accessorKey: 'customerName',
        size: 200,
        Cell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='body2' sx={{ fontWeight: 600 }}>
              {row.original.customerName}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.location}
            </Typography>
          </Box>
        )
      },
      {
        header: 'Equipo',
        accessorKey: 'equipmentType',
        size: 200,
        Cell: ({ row }) => (
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='body2'>
              {row.original.equipmentType}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {[row.original.equipmentBrand, row.original.equipmentModel]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
        )
      },
      {
        header: 'Prioridad',
        accessorKey: 'priority',
        size: 120,
        Cell: ({ row }) => (
          <MaintenancePriorityBadge
            priority={row.original.priority}
            size='small'
          />
        )
      },
      {
        header: 'Estado',
        accessorKey: 'status',
        size: 150,
        Cell: ({ row }) => (
          <MaintenanceStatusBadge status={row.original.status} />
        )
      },
      {
        header: 'Técnico',
        id: 'technician',
        size: 160,
        accessorFn: (ticket) => ticket.assignedTechnician?.name ?? '',
        Cell: ({ row }) =>
          row.original.assignedTechnician?.name ? (
            <Typography variant='body2'>
              {row.original.assignedTechnician.name}
            </Typography>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              Sin asignar
            </Typography>
          )
      },
      {
        header: 'Pendientes',
        id: 'pendings',
        size: 220,
        enableSorting: false,
        Cell: ({ row }) => {
          const pendings = getTicketPendings(row.original)
          if (!pendings.length) {
            return (
              <Typography variant='caption' color='text.secondary'>
                Al día
              </Typography>
            )
          }
          return (
            <Box display='flex' gap={0.5} flexWrap='wrap'>
              {pendings.map((pending) => (
                <Chip
                  key={pending}
                  size='small'
                  label={pending}
                  sx={{
                    backgroundColor: intent.warningSoft,
                    color: intent.warningInk,
                    fontWeight: 600
                  }}
                />
              ))}
            </Box>
          )
        }
      }
    ],
    []
  )

  const pagination: MRT_PaginationState = {
    pageIndex: Math.max(page - 1, 0),
    pageSize
  }

  return (
    <DataTable<MaintenanceTicket>
      columns={columns}
      data={tickets}
      itemLabel={['ticket', 'tickets']}
      enableGlobalFilter={false}
      enableSorting={false}
      enableFilters={false}
      manualPagination
      rowCount={totalItems}
      state={{ isLoading: loading, pagination }}
      onPaginationChange={(updater) => {
        const next =
          typeof updater === 'function' ? updater(pagination) : updater
        onPageChange(next.pageIndex + 1)
      }}
      muiTablePaginationProps={{ rowsPerPageOptions: [pageSize] }}
      getRowId={(row, index) => String(row.id ?? `skeleton-${index}`)}
      enableRowActions
      initialState={{ density: 'compact', showGlobalFilter: false }}
      muiTableBodyRowProps={({ row }) => ({
        onDoubleClick: () => onView(row.original),
        sx: { cursor: 'default' }
      })}
      renderEmptyRowsFallback={() => (
        <EmptyState
          compact
          icon={<Engineering />}
          title='No hay tickets con estos filtros'
          hint='Cambia los filtros o crea una nueva solicitud.'
        />
      )}
      renderRowActions={({ row }) => {
        const ticket = row.original
        return (
          <Box sx={{ display: 'flex' }}>
            <Tooltip title='Ver ticket'>
              <IconButton
                size='small'
                aria-label={`Ver ticket ${ticket.ticketCode}`}
                sx={{ color: brand.ink }}
                onClick={() => onView(ticket)}
              >
                <Visibility fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Editar'>
              <IconButton
                size='small'
                aria-label={`Editar ticket ${ticket.ticketCode}`}
                sx={{ color: intent.action }}
                onClick={() => onEdit(ticket)}
              >
                <Edit fontSize='small' />
              </IconButton>
            </Tooltip>
            {onDelete && canDelete?.(ticket) && (
              <Tooltip title='Eliminar'>
                <IconButton
                  size='small'
                  aria-label={`Eliminar ticket ${ticket.ticketCode}`}
                  sx={{
                    color: neutral.textMuted,
                    '&:hover': { color: intent.danger }
                  }}
                  onClick={() => onDelete(ticket)}
                >
                  <Delete fontSize='small' />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        )
      }}
    />
  )
}

export default MaintenanceTicketsTable
