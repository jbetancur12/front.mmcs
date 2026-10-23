import { useMemo } from 'react'
import {
  EmailOutlined,
  PhoneOutlined,
  TaskAltOutlined,
  VisibilityOutlined
} from '@mui/icons-material'
import { Avatar, Box, IconButton, Tooltip, Typography } from '@mui/material'
import { type MRT_ColumnDef } from 'material-react-table'
import { useNavigate } from 'react-router-dom'

import DataTable from '../Common/DataTable'
import EmptyState from '../Common/EmptyState'
import StatusPill from '../Common/StatusPill'
import { CustomerSummary } from './dashboardCertificates'

interface DashboardTableProps {
  customers: CustomerSummary[]
}

/** Clientes con certificados por vencer: los más urgentes arriba. */
const DashboardTable: React.FC<DashboardTableProps> = ({ customers }) => {
  const navigate = useNavigate()
  const openCustomer = (customerId: number) =>
    navigate(`/customers/certificates-due/${customerId}`)

  const columns = useMemo<MRT_ColumnDef<CustomerSummary>[]>(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Cliente',
        size: 300,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#00BFA5',
                fontSize: 14,
                fontWeight: 700
              }}
            >
              {row.original.nombre.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant='body2' fontWeight={600}>
                {row.original.nombre}
              </Typography>
              <Typography variant='caption' color='text.secondary'>
                NIT {row.original.identificacion}
              </Typography>
            </Box>
          </Box>
        )
      },
      {
        accessorKey: 'email',
        header: 'Contacto',
        size: 260,
        Cell: ({ row }) => (
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <EmailOutlined sx={{ fontSize: 16, color: '#6b7280' }} />
              <Typography variant='body2'>{row.original.email}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <PhoneOutlined sx={{ fontSize: 16, color: '#6b7280' }} />
              <Typography variant='caption' color='text.secondary'>
                {row.original.telefono}
              </Typography>
            </Box>
          </Box>
        )
      },
      {
        accessorKey: 'ciudad',
        header: 'Ubicación',
        size: 170,
        Cell: ({ row }) => (
          <Box>
            <Typography variant='body2'>{row.original.ciudad}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {row.original.departamento}
            </Typography>
          </Box>
        )
      },
      {
        accessorKey: 'expired',
        header: 'Vencidos',
        size: 120,
        Cell: ({ cell }) =>
          cell.getValue<number>() > 0 ? (
            <StatusPill
              size='small'
              tone='error'
              label={`${cell.getValue<number>().toLocaleString('es-CO')}`}
            />
          ) : (
            <Typography variant='body2' color='text.secondary'>
              —
            </Typography>
          )
      },
      {
        accessorKey: 'upcoming',
        header: 'Próximos',
        size: 120,
        Cell: ({ cell }) =>
          cell.getValue<number>() > 0 ? (
            <StatusPill
              size='small'
              tone='warning'
              label={`${cell.getValue<number>().toLocaleString('es-CO')}`}
            />
          ) : (
            <Typography variant='body2' color='text.secondary'>
              —
            </Typography>
          )
      },
      {
        accessorKey: 'total',
        header: 'Certificados',
        size: 120,
        Cell: ({ cell }) => cell.getValue<number>().toLocaleString('es-CO')
      }
    ],
    []
  )

  return (
    <DataTable<CustomerSummary>
      columns={columns}
      data={customers}
      itemLabel={['cliente', 'clientes']}
      searchPlaceholder='Buscar por cliente, NIT, correo o ciudad'
      enableRowActions
      initialState={{
        sorting: [{ id: 'expired', desc: true }],
        pagination: { pageIndex: 0, pageSize: 25 }
      }}
      muiTablePaginationProps={{ rowsPerPageOptions: [10, 25, 50, 100] }}
      muiTableContainerProps={{ sx: { maxHeight: 'none' } }}
      muiTableBodyRowProps={({ row }) => ({
        onClick: () => openCustomer(row.original.id),
        sx: { cursor: 'pointer' }
      })}
      renderRowActions={({ row }) => (
        <Tooltip title='Ver certificados'>
          <IconButton
            size='small'
            aria-label={`Ver certificados de ${row.original.nombre}`}
            sx={{ color: '#00695C' }}
            onClick={(event) => {
              event.stopPropagation()
              openCustomer(row.original.id)
            }}
          >
            <VisibilityOutlined fontSize='small' />
          </IconButton>
        </Tooltip>
      )}
      renderEmptyRowsFallback={() => (
        <EmptyState
          icon={<TaskAltOutlined />}
          title='Ningún cliente coincide'
          hint='Prueba con otra búsqueda o quita el filtro de los indicadores.'
        />
      )}
    />
  )
}

export default DashboardTable
