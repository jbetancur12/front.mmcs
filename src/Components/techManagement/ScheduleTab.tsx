import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MaterialReactTable, type MRT_ColumnDef, type MRT_PaginationState } from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { Box, IconButton, MenuItem, TextField, Tooltip, Typography } from '@mui/material'
import { AttachFile, Block, CheckCircleOutline, Delete, Visibility } from '@mui/icons-material'
import {
  techErrorMessage,
  techPaths,
  useActivities,
  useDeleteActivity,
  useUpdateActivity
} from '@hooks/useTechManagement'
import { EquipmentActivity } from 'src/types/techManagement'
import {
  ACTIVITY_TYPE_LABELS,
  confirmAction,
  formatDate,
  notifyError,
  notifySuccess,
  StatusChip,
  TEAL,
  tableStyleProps,
  todayIso
} from './techUi'
import { useTechAccess } from './useTechAccess'
import { ExecuteActivityDialog } from './ScheduleDialogs'

const STATUS_FILTERS = [
  { value: 'pending', label: 'Pendientes' },
  { value: 'overdue', label: 'Vencidas' },
  { value: 'executed', label: 'Ejecutadas' },
  { value: 'cancelled', label: 'Canceladas' },
  { value: '', label: 'Todas' }
]

const activityState = (activity: EquipmentActivity) => {
  if (activity.status === 'executed') {
    return activity.result === 'no_conforme'
      ? { label: 'No conforme', color: 'error' as const }
      : { label: 'Ejecutada', color: 'success' as const }
  }
  if (activity.status === 'cancelled') return { label: 'Cancelada', color: 'default' as const }
  if (activity.dueDate && activity.dueDate < todayIso()) return { label: 'Vencida', color: 'error' as const }
  return { label: 'Pendiente', color: 'warning' as const }
}

/** Cronograma de mantenimiento y calibración: lo programado, lo vencido y lo ejecutado con su evidencia. */
const ScheduleTab = ({ customerId }: { customerId: string }) => {
  const navigate = useNavigate()
  const access = useTechAccess(customerId)
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 25 })
  const [status, setStatus] = useState('pending')
  const [type, setType] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [executing, setExecuting] = useState<EquipmentActivity | null>(null)

  const { data, isLoading, isFetching, isError } = useActivities(customerId, {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    status: status === 'overdue' ? undefined : status || undefined,
    overdue: status === 'overdue' ? 'true' : undefined,
    type: type || undefined,
    from: from || undefined,
    to: to || undefined
  })
  const update = useUpdateActivity(customerId)
  const remove = useDeleteActivity(customerId)

  const resetPage = () => setPagination((prev) => ({ ...prev, pageIndex: 0 }))

  const handleCancel = async (activity: EquipmentActivity) => {
    if (!(await confirmAction('¿Cancelar esta actividad?', 'Deja de contar en el indicador de cumplimiento.', 'Cancelar actividad'))) return
    try {
      await update.mutateAsync({ id: activity.id, payload: { status: 'cancelled' } })
      notifySuccess('Actividad cancelada')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo cancelar'))
    }
  }

  const handleDelete = async (activity: EquipmentActivity) => {
    if (!(await confirmAction('¿Eliminar esta actividad?', undefined, 'Eliminar'))) return
    try {
      await remove.mutateAsync(activity.id)
      notifySuccess('Actividad eliminada')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo eliminar'))
    }
  }

  const downloadEvidence = async (activity: EquipmentActivity) => {
    try {
      await techPaths.downloadFile(techPaths.evidence(customerId, activity.id), activity.evidenceName || 'evidencia')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo descargar la evidencia'))
    }
  }

  const columns = useMemo<MRT_ColumnDef<EquipmentActivity>[]>(
    () => [
      {
        header: 'Equipo',
        id: 'equipment',
        size: 240,
        Cell: ({ row }) => (
          <Box>
            <Typography fontWeight={600} fontSize={14}>
              {row.original.equipment?.name || '—'}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {[row.original.equipment?.serie && `Serie ${row.original.equipment.serie}`, row.original.equipment?.sede]
                .filter(Boolean)
                .join(' · ')}
            </Typography>
          </Box>
        )
      },
      { header: 'Actividad', id: 'type', size: 170, accessorFn: (row) => ACTIVITY_TYPE_LABELS[row.type] },
      { header: 'Programada', id: 'dueDate', size: 120, accessorFn: (row) => formatDate(row.dueDate) },
      { header: 'Ejecutada', id: 'executedAt', size: 120, accessorFn: (row) => formatDate(row.executedAt) },
      {
        header: 'Por',
        id: 'origin',
        size: 140,
        accessorFn: (row) =>
          row.status !== 'executed' ? '—' : row.origin === 'third_party' ? row.provider || 'Otro proveedor' : 'Metromedics'
      },
      { header: 'Estado', id: 'status', size: 130, Cell: ({ row }) => <StatusChip {...activityState(row.original)} /> }
    ],
    []
  )

  return (
    <>
      <MaterialReactTable
        columns={columns}
        data={data?.items ?? []}
        localization={MRT_Localization_ES}
        getRowId={(row, index) => (row?.id != null ? String(row.id) : `cargando-${index}`)}
        manualPagination
        rowCount={data?.total ?? 0}
        onPaginationChange={setPagination}
        state={{
          isLoading,
          showProgressBars: isFetching,
          pagination,
          showAlertBanner: isError,
          columnPinning: { right: ['mrt-row-actions'] }
        }}
        initialState={{ density: 'comfortable' }}
        muiToolbarAlertBannerProps={isError ? { color: 'error', children: 'No se pudo cargar el cronograma.' } : undefined}
        enablePinning
        enableGlobalFilter={false}
        enableColumnFilters={false}
        enableSorting={false}
        enableColumnActions={false}
        enableRowActions
        positionActionsColumn='last'
        displayColumnDefOptions={{ 'mrt-row-actions': { header: 'Acciones', size: 150 } }}
        {...tableStyleProps}
        renderTopToolbarCustomActions={() => (
          <Box display='flex' gap={1} flexWrap='wrap'>
            <TextField
              select
              size='small'
              label='Estado'
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                resetPage()
              }}
              sx={{ minWidth: 140 }}
            >
              {STATUS_FILTERS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size='small'
              label='Tipo'
              value={type}
              onChange={(e) => {
                setType(e.target.value)
                resetPage()
              }}
              sx={{ minWidth: 160 }}
            >
              <MenuItem value=''>Todos</MenuItem>
              {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <TextField size='small' type='date' label='Desde' value={from} onChange={(e) => {
                setFrom(e.target.value)
                resetPage()
              }} InputLabelProps={{ shrink: true }} />
            <TextField size='small' type='date' label='Hasta' value={to} onChange={(e) => {
                setTo(e.target.value)
                resetPage()
              }} InputLabelProps={{ shrink: true }} />
          </Box>
        )}
        renderRowActions={({ row }) => {
          const activity = row.original
          return (
            <Box display='flex' gap={0.5}>
              <Tooltip title='Hoja de vida del equipo'>
                <IconButton
                  size='small'
                  sx={{ color: TEAL }}
                  onClick={() => navigate(`/tech-management/customers/${customerId}/equipment/${activity.customerEquipmentId}`)}
                >
                  <Visibility fontSize='small' />
                </IconButton>
              </Tooltip>
              {activity.evidenceName && (
                <Tooltip title={`Evidencia: ${activity.evidenceName}`}>
                  <IconButton size='small' onClick={() => downloadEvidence(activity)}>
                    <AttachFile fontSize='small' />
                  </IconButton>
                </Tooltip>
              )}
              {access.canManageInventory && activity.status === 'pending' && (
                <>
                  <Tooltip title='Registrar ejecución'>
                    <IconButton size='small' color='success' onClick={() => setExecuting(activity)}>
                      <CheckCircleOutline fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Cancelar'>
                    <IconButton size='small' onClick={() => handleCancel(activity)}>
                      <Block fontSize='small' />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title='Eliminar'>
                    <IconButton size='small' color='error' onClick={() => handleDelete(activity)}>
                      <Delete fontSize='small' />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Box>
          )
        }}
        renderEmptyRowsFallback={() => (
          <Box py={6} textAlign='center' color='text.secondary'>
            <Typography>No hay actividades con estos filtros.</Typography>
          </Box>
        )}
      />
      <ExecuteActivityDialog customerId={customerId} open={!!executing} activity={executing} onClose={() => setExecuting(null)} />
    </>
  )
}

export default ScheduleTab
