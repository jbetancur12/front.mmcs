import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
  type MRT_RowSelectionState
} from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { Box, Button, Grid, IconButton, MenuItem, TextField, Tooltip, Typography } from '@mui/material'
import {
  Add,
  CalendarMonth,
  Delete,
  Edit,
  EventBusy,
  HelpOutline,
  Inventory2Outlined,
  QrCode2,
  Sync,
  TaskAlt,
  UpcomingOutlined,
  UploadFile,
  Visibility,
  SupportAgent
} from '@mui/icons-material'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import {
  techErrorMessage,
  useDeleteEquipment,
  useEquipmentFilters,
  useEquipmentList,
  useSyncCertificates,
  useTechDashboard
} from '@hooks/useTechManagement'
import { CustomerEquipment, ScheduleStatus } from 'src/types/techManagement'
import {
  ACTIVITY_TYPE_LABELS,
  confirmAction,
  formatDate,
  notifyError,
  notifySuccess,
  primaryButtonSx,
  RISK_CLASSES,
  SCHEDULE_STATUS,
  StatusChip,
  TEAL,
  tableStyleProps
} from './techUi'
import { useTechAccess } from './useTechAccess'
import EquipmentFormDialog from './EquipmentFormDialog'
import ImportEquipmentDialog from './ImportEquipmentDialog'
import EquipmentQrDialog from './EquipmentQrDialog'
import { ScheduleActivityDialog, ServiceRequestDialog } from './ScheduleDialogs'

/**
 * Inventario de equipos de la institución. Se arma solo a partir de los certificados emitidos por Metromedics y se
 * completa a mano o con un Excel (equipos atendidos por terceros).
 */
const InventoryTab = ({ customerId }: { customerId: string }) => {
  const navigate = useNavigate()
  const access = useTechAccess(customerId)
  const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 25 })
  const [search, setSearch] = useState('')
  const [scheduleStatus, setScheduleStatus] = useState<ScheduleStatus | ''>('')
  const [sede, setSede] = useState('')
  const [service, setService] = useState('')
  const [riskClass, setRiskClass] = useState('')
  const [rowSelection, setRowSelection] = useState<MRT_RowSelectionState>({})
  const [editing, setEditing] = useState<CustomerEquipment | null | undefined>(undefined)
  const [importOpen, setImportOpen] = useState(false)
  const [qrFor, setQrFor] = useState<CustomerEquipment | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [requestOpen, setRequestOpen] = useState(false)

  const params = {
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    search: search || undefined,
    scheduleStatus: scheduleStatus || undefined,
    sede: sede || undefined,
    service: service || undefined,
    riskClass: riskClass || undefined
  }
  const { data, isLoading, isFetching, isError } = useEquipmentList(customerId, params)
  const { data: filters } = useEquipmentFilters(customerId)
  const { data: dashboard } = useTechDashboard(customerId)
  const sync = useSyncCertificates(customerId)
  const remove = useDeleteEquipment(customerId)

  const selectedIds = Object.keys(rowSelection)
    .filter((key) => rowSelection[key])
    .map(Number)

  const toggleStatus = (status: ScheduleStatus) => {
    setScheduleStatus((prev) => (prev === status ? '' : status))
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const handleSync = async () => {
    try {
      await sync.mutateAsync()
      notifySuccess('Inventario sincronizado con los certificados')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo sincronizar'))
    }
  }

  const handleDelete = async (equipment: CustomerEquipment) => {
    const ok = await confirmAction(
      `¿Eliminar ${equipment.name}?`,
      'El equipo sale del inventario; su historial queda guardado.',
      'Eliminar'
    )
    if (!ok) return
    try {
      await remove.mutateAsync(equipment.id)
      notifySuccess('Equipo eliminado')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo eliminar el equipo'))
    }
  }

  const columns = useMemo<MRT_ColumnDef<CustomerEquipment>[]>(
    () => [
      {
        header: 'Equipo',
        id: 'name',
        size: 220,
        Cell: ({ row }) => (
          <Box>
            <Typography fontWeight={600} fontSize={14}>
              {row.original.name}
            </Typography>
            <Typography variant='caption' color='text.secondary'>
              {[row.original.brand, row.original.model].filter(Boolean).join(' · ') || '—'}
            </Typography>
          </Box>
        )
      },
      { header: 'Serie', accessorFn: (row) => row.serie || '—', id: 'serie', size: 110 },
      { header: 'Activo fijo', accessorFn: (row) => row.activoFijo || '—', id: 'activoFijo', size: 110 },
      {
        header: 'Sede / servicio',
        id: 'sede',
        size: 160,
        accessorFn: (row) => [row.sede, row.service].filter(Boolean).join(' · ') || '—'
      },
      { header: 'Riesgo', accessorFn: (row) => row.riskClass || '—', id: 'riskClass', size: 70 },
      {
        header: 'Próxima actividad',
        id: 'nextDueDate',
        size: 150,
        Cell: ({ row }) =>
          row.original.nextDueDate ? (
            <Box>
              <Typography fontSize={14}>{formatDate(row.original.nextDueDate)}</Typography>
              <Typography variant='caption' color='text.secondary'>
                {row.original.nextDueType ? ACTIVITY_TYPE_LABELS[row.original.nextDueType] : ''}
              </Typography>
            </Box>
          ) : (
            '—'
          )
      },
      {
        header: 'Estado',
        id: 'scheduleStatus',
        size: 130,
        Cell: ({ row }) => <StatusChip {...SCHEDULE_STATUS[row.original.scheduleStatus]} />
      }
    ],
    []
  )

  const counts = dashboard?.counts

  return (
    <Box display='flex' flexDirection='column' gap={3}>
      <Grid container spacing={3}>
        <Grid item xs={6} lg={3}>
          <LmsStatCard
            label='Vencidos'
            value={counts?.overdue ?? '—'}
            icon={<EventBusy />}
            tone='red'
            active={scheduleStatus === 'vencido'}
            onClick={() => toggleStatus('vencido')}
          />
        </Grid>
        <Grid item xs={6} lg={3}>
          <LmsStatCard
            label='Próximos 30 días'
            value={counts?.upcoming ?? '—'}
            icon={<UpcomingOutlined />}
            tone='orange'
            active={scheduleStatus === 'proximo'}
            onClick={() => toggleStatus('proximo')}
          />
        </Grid>
        <Grid item xs={6} lg={3}>
          <LmsStatCard
            label='Al día'
            value={counts ? counts.equipment - counts.overdue - counts.upcoming - counts.unscheduled : '—'}
            icon={<TaskAlt />}
            tone='green'
            active={scheduleStatus === 'al_dia'}
            onClick={() => toggleStatus('al_dia')}
          />
        </Grid>
        <Grid item xs={6} lg={3}>
          <LmsStatCard
            label='Sin programar'
            value={counts?.unscheduled ?? '—'}
            icon={<HelpOutline />}
            tone='blue'
            active={scheduleStatus === 'sin_programar'}
            onClick={() => toggleStatus('sin_programar')}
          />
        </Grid>
      </Grid>

      <MaterialReactTable
        columns={columns}
        data={data?.items ?? []}
        localization={MRT_Localization_ES}
        getRowId={(row, index) => (row?.id != null ? String(row.id) : `cargando-${index}`)}
        manualPagination
        manualFiltering
        rowCount={data?.total ?? 0}
        onPaginationChange={setPagination}
        onGlobalFilterChange={(value: string | undefined) => {
          setSearch(value || '')
          setPagination((prev) => ({ ...prev, pageIndex: 0 }))
        }}
        enableRowSelection={access.canManageInventory}
        onRowSelectionChange={setRowSelection}
        state={{
          isLoading,
          showProgressBars: isFetching,
          pagination,
          globalFilter: search,
          rowSelection,
          showAlertBanner: isError,
          columnPinning: { right: ['mrt-row-actions'] }
        }}
        initialState={{ showGlobalFilter: true, density: 'comfortable' }}
        muiToolbarAlertBannerProps={isError ? { color: 'error', children: 'No se pudo cargar el inventario.' } : undefined}
        enablePinning
        enableColumnFilters={false}
        enableSorting={false}
        enableColumnActions={false}
        enableRowActions
        positionActionsColumn='last'
        displayColumnDefOptions={{ 'mrt-row-actions': { header: 'Acciones', size: 150 } }}
        {...tableStyleProps}
        renderTopToolbarCustomActions={() => (
          <Box display='flex' gap={1} flexWrap='wrap' alignItems='center'>
            <TextField select size='small' label='Sede' value={sede} onChange={(e) => setSede(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value=''>Todas</MenuItem>
              {filters?.sedes.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
            <TextField select size='small' label='Servicio' value={service} onChange={(e) => setService(e.target.value)} sx={{ minWidth: 140 }}>
              <MenuItem value=''>Todos</MenuItem>
              {filters?.services.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
            <TextField select size='small' label='Riesgo' value={riskClass} onChange={(e) => setRiskClass(e.target.value)} sx={{ minWidth: 100 }}>
              <MenuItem value=''>Todos</MenuItem>
              {RISK_CLASSES.map((value) => (
                <MenuItem key={value} value={value}>
                  {value}
                </MenuItem>
              ))}
            </TextField>
            {access.canManageInventory && selectedIds.length > 0 && (
              <>
                <Button size='small' startIcon={<CalendarMonth />} onClick={() => setScheduleOpen(true)} sx={{ textTransform: 'none' }}>
                  Programar ({selectedIds.length})
                </Button>
                <Button size='small' startIcon={<SupportAgent />} onClick={() => setRequestOpen(true)} sx={{ textTransform: 'none' }}>
                  Solicitar servicio
                </Button>
              </>
            )}
          </Box>
        )}
        renderToolbarInternalActions={() =>
          access.canManageInventory ? (
            <Box display='flex' gap={1} alignItems='center' flexWrap='wrap'>
              <Tooltip title='Traer los certificados nuevos al inventario'>
                <span>
                  <IconButton onClick={handleSync} disabled={sync.isLoading} aria-label='Sincronizar con certificados'>
                    <Sync />
                  </IconButton>
                </span>
              </Tooltip>
              <Button size='small' startIcon={<UploadFile />} onClick={() => setImportOpen(true)} sx={{ textTransform: 'none' }}>
                Importar
              </Button>
              <Button size='small' variant='contained' startIcon={<Add />} onClick={() => setEditing(null)} sx={primaryButtonSx}>
                Nuevo equipo
              </Button>
            </Box>
          ) : null
        }
        renderRowActions={({ row }) => (
          <Box display='flex' gap={0.5}>
            <Tooltip title='Hoja de vida'>
              <IconButton
                size='small'
                sx={{ color: TEAL }}
                onClick={() => navigate(`/tech-management/customers/${customerId}/equipment/${row.original.id}`)}
              >
                <Visibility fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Código QR'>
              <IconButton size='small' onClick={() => setQrFor(row.original)}>
                <QrCode2 fontSize='small' />
              </IconButton>
            </Tooltip>
            {access.canManageInventory && (
              <>
                <Tooltip title='Editar'>
                  <IconButton size='small' color='primary' onClick={() => setEditing(row.original)}>
                    <Edit fontSize='small' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Eliminar'>
                  <IconButton size='small' color='error' onClick={() => handleDelete(row.original)}>
                    <Delete fontSize='small' />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        )}
        renderEmptyRowsFallback={() => (
          <Box py={6} textAlign='center' color='text.secondary'>
            <Inventory2Outlined sx={{ fontSize: 40, mb: 1 }} />
            <Typography>No hay equipos con estos filtros.</Typography>
          </Box>
        )}
      />

      <EquipmentFormDialog
        customerId={customerId}
        open={editing !== undefined}
        equipment={editing}
        onClose={() => setEditing(undefined)}
      />
      <ImportEquipmentDialog customerId={customerId} open={importOpen} onClose={() => setImportOpen(false)} />
      <EquipmentQrDialog
        customerId={customerId}
        equipment={qrFor}
        canManage={access.canManageInventory}
        onClose={() => setQrFor(null)}
      />
      <ScheduleActivityDialog
        customerId={customerId}
        equipmentIds={selectedIds}
        open={scheduleOpen}
        onClose={() => {
          setScheduleOpen(false)
          setRowSelection({})
        }}
      />
      <ServiceRequestDialog
        customerId={customerId}
        equipmentIds={selectedIds}
        open={requestOpen}
        onClose={() => {
          setRequestOpen(false)
          setRowSelection({})
        }}
      />
    </Box>
  )
}

export default InventoryTab
