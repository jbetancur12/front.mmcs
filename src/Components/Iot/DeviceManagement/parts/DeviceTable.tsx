import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { DeviceIot } from '../../types'
import { Chip, IconButton, Stack } from '@mui/material'
import { purchaseTableStyle } from 'src/Components/Purchases/purchaseTableStyle'
import { Delete, Edit } from '@mui/icons-material'

export const deviceColumns: MRT_ColumnDef<DeviceIot>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'imei', header: 'IMEI' },
  { accessorKey: 'name', header: 'Nombre' },
  {
    accessorKey: 'customer.nombre',
    header: 'Cliente',
    Cell: ({ cell }) => cell.getValue<string>() || 'Sin Cliente'
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    Cell: ({ cell }) =>
      cell.getValue<string>() === 'online' ? (
        <Chip label='En línea' size='small' color='success' variant='outlined' />
      ) : (
        <Chip label='Offline' size='small' variant='outlined' />
      )
  },
  {
    accessorKey: 'lastSeen',
    header: 'Última conexión',
    Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleString()
  }
]

export interface DeviceTableProps {
  data: DeviceIot[]
  onEdit: (device: DeviceIot) => void
  onDelete: (device: DeviceIot) => void
  /** Editar y eliminar solo para quien puede gestionar dispositivos */
  canManage?: boolean
}

export const DeviceTable = ({
  data,
  onEdit,
  onDelete,
  canManage = true
}: DeviceTableProps) => (
  <MaterialReactTable
    {...purchaseTableStyle}
    columns={deviceColumns}
    data={data}
    enableColumnFilters={false}
    enablePagination
    enablePinning
    initialState={{ columnPinning: { right: ['mrt-row-actions'] } }}
    enableRowActions={canManage}
    renderRowActions={({ row }) => (
      <Stack direction='row' spacing={1}>
        <IconButton color='primary' onClick={() => onEdit(row.original)}>
          <Edit />
        </IconButton>
        <IconButton color='error' onClick={() => onDelete(row.original)}>
          <Delete />
        </IconButton>
      </Stack>
    )}
  />
)
