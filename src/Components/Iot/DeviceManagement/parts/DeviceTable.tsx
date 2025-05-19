import MaterialReactTable, { MRT_ColumnDef } from 'material-react-table'
import { DeviceIot } from '../../types'
import { IconButton, Stack } from '@mui/material'
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
      cell.getValue<string>() === 'online' ? 'En línea' : 'Offline'
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
}

export const DeviceTable = ({ data, onEdit, onDelete }: DeviceTableProps) => (
  <MaterialReactTable
    columns={deviceColumns}
    data={data}
    enableColumnFilters={false}
    enablePagination
    enableRowActions={true}
    renderRowActions={({ row }) => (
      <Stack direction='row' spacing={1}>
        <IconButton color='primary' onClick={() => onEdit(row.original)}>
          <Edit />
        </IconButton>
        <IconButton color='secondary' onClick={() => onDelete(row.original)}>
          <Delete />
        </IconButton>
      </Stack>
    )}
  />
)
