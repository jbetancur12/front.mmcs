import React, { useMemo, useState } from 'react'
import { Box, Chip, Paper, Typography } from '@mui/material'
import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { useRbacAudit } from '../../hooks/useRbac'
import { RbacAuditAction, RbacAuditItem } from '../../types/rbac'
import { getRoleLabelEs } from 'src/constants/roles'

const ACTION_META: Record<
  RbacAuditAction,
  { label: string; color: 'success' | 'error' | 'info' | 'warning' | 'default' }
> = {
  grant: { label: 'Capacidad otorgada', color: 'success' },
  revoke: { label: 'Capacidad retirada', color: 'error' },
  role_create: { label: 'Rol creado', color: 'info' },
  role_update: { label: 'Rol editado', color: 'default' },
  role_activate: { label: 'Rol activado', color: 'success' },
  role_deactivate: { label: 'Rol desactivado', color: 'warning' }
}

const FIELD_LABELS: Record<string, string> = {
  name: 'nombre',
  description: 'descripción',
  isActive: 'activo'
}

/** Resume qué cambió en una fila del historial, en una frase corta. */
export const describeAuditChange = (item: RbacAuditItem): string => {
  if (item.action === 'grant' || item.action === 'revoke') return ''
  const before = item.before ?? {}
  const after = item.after ?? {}
  if (item.action === 'role_create') return String(after.name ?? '')
  const fields = Object.keys({ ...before, ...after }).filter(
    (field) => before[field] !== after[field]
  )
  return fields
    .map((field) => {
      const label = FIELD_LABELS[field] ?? field
      return `${label}: ${String(before[field] ?? '—')} → ${String(after[field] ?? '—')}`
    })
    .join(' · ')
}

const RbacAuditTable: React.FC = () => {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 25 })
  const { data, isLoading, isFetching, isError } = useRbacAudit({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize
  })

  const columns = useMemo<MRT_ColumnDef<RbacAuditItem>[]>(
    () => [
      {
        header: 'Fecha',
        id: 'createdAt',
        size: 170,
        accessorFn: (row) =>
          new Date(row.createdAt).toLocaleString('es-CO', {
            dateStyle: 'medium',
            timeStyle: 'short'
          })
      },
      {
        header: 'Quién',
        id: 'actor',
        size: 200,
        accessorFn: (row) => row.actor?.nombre ?? 'Usuario eliminado',
        Cell: ({ row }) => (
          <Box>
            <Typography variant='body2' fontWeight={600}>
              {row.original.actor?.nombre ?? 'Usuario eliminado'}
            </Typography>
            {row.original.actor?.email && (
              <Typography variant='caption' color='text.secondary'>
                {row.original.actor.email}
              </Typography>
            )}
          </Box>
        )
      },
      {
        header: 'Acción',
        id: 'action',
        size: 170,
        accessorFn: (row) => ACTION_META[row.action]?.label ?? row.action,
        Cell: ({ row }) => {
          const meta = ACTION_META[row.original.action]
          return (
            <Chip
              size='small'
              color={meta?.color ?? 'default'}
              variant='outlined'
              label={meta?.label ?? row.original.action}
            />
          )
        }
      },
      {
        header: 'Rol',
        id: 'role',
        size: 170,
        accessorFn: (row) =>
          row.roleName ? getRoleLabelEs(row.roleName) : '—'
      },
      {
        header: 'Capacidad / detalle',
        id: 'detail',
        size: 330,
        accessorFn: (row) => row.permissionKey ?? describeAuditChange(row),
        Cell: ({ row }) =>
          row.original.permissionKey ? (
            <Typography
              variant='body2'
              sx={{ fontFamily: 'monospace', fontWeight: 600 }}
            >
              {row.original.permissionKey}
            </Typography>
          ) : (
            <Typography variant='body2'>
              {describeAuditChange(row.original) || '—'}
            </Typography>
          )
      },
      {
        header: 'IP',
        id: 'ip',
        size: 130,
        accessorFn: (row) => row.ip ?? '—'
      }
    ],
    []
  )

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <MaterialReactTable
        columns={columns}
        data={data?.items ?? []}
        localization={MRT_Localization_ES}
        getRowId={(row) => String(row.id)}
        manualPagination
        rowCount={data?.total ?? 0}
        onPaginationChange={setPagination}
        state={{
          isLoading,
          showProgressBars: isFetching,
          pagination,
          showAlertBanner: isError
        }}
        muiToolbarAlertBannerProps={
          isError
            ? { color: 'error', children: 'No se pudo cargar la auditoría.' }
            : undefined
        }
        enableTopToolbar={false}
        enableColumnActions={false}
        enableColumnFilters={false}
        enableGlobalFilter={false}
        enableSorting={false}
        enableDensityToggle={false}
        enableFullScreenToggle={false}
        enableHiding={false}
        muiTableHeadCellProps={{ sx: { bgcolor: '#f5f5f5', fontWeight: 600 } }}
        muiTableBodyRowProps={{
          sx: { '&:hover': { bgcolor: 'rgba(0,191,165,0.04)' } }
        }}
        muiBottomToolbarProps={{ sx: { bgcolor: '#fafafa' } }}
        renderEmptyRowsFallback={() => (
          <Typography color='text.secondary' align='center' sx={{ py: 4 }}>
            Aún no hay cambios registrados.
          </Typography>
        )}
      />
    </Paper>
  )
}

export default RbacAuditTable
