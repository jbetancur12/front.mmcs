import React, { useState, useMemo } from 'react'
import { PERMISSIONS } from 'src/constants/permissions'
import { useCan } from '@utils/functions'
import {
  Box,
  Button,
  IconButton,
  Chip,
  Grid,
  Tooltip,
  Typography
} from '@mui/material'
import { type MRT_Cell, type MRT_ColumnDef } from 'material-react-table'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import DataTable from 'src/Components/Common/DataTable'
import DeleteIcon from '@mui/icons-material/Delete'
import EditIcon from '@mui/icons-material/Edit'
import VisibilityIcon from '@mui/icons-material/Visibility'
import {
  Add,
  CheckCircle,
  FolderOpen,
  NotificationsActive,
  ReportProblemOutlined
} from '@mui/icons-material'
import {
  NON_CONFORM_EXACT_FILTERS,
  NON_CONFORM_SORTABLE_FIELDS,
  useDeleteNonConformWorkReport,
  useNonConformWorkReportAlerts,
  useNonConformWorkReportCounts,
  useNonConformWorkReportsPaginated
} from '@hooks/nonConform/useNonConformWorkReports'
import {
  useKeepPageInRange,
  useServerTableState
} from 'src/hooks/useServerTable'
import { NonConformWorkReport } from './NonConformWorkReport.types'
import { format } from 'date-fns'
import Swal from 'sweetalert2'
import { NonConformWorkReportAlert } from './NonConformWorkReport.types'
import { notify } from 'src/utils/notify'

// Traducciones y mapeos
const impactMap: Record<string, string> = {
  High: 'Alta',
  Medium: 'Media',
  Low: 'Baja'
}
const probabilityMap: Record<string, string> = {
  High: 'Alta',
  Medium: 'Media',
  Low: 'Baja'
}
const riskLevelMap: Record<string, string> = {
  Critical: 'Crítico',
  High: 'Alto',
  Medium: 'Media',
  Low: 'Baja',
  'Very Low': 'Muy Baja',
  'Not evaluated': 'No evaluado'
}
const statusMap: Record<
  string,
  { label: string; color: 'success' | 'error' | 'warning' | 'default' }
> = {
  Open: { label: 'Abierta', color: 'warning' },
  Closed: { label: 'Cerrada', color: 'success' },
  Abierta: { label: 'Abierta', color: 'warning' },
  Cerrada: { label: 'Cerrada', color: 'success' }
}
const acceptanceMap: Record<
  string,
  { label: string; color: 'success' | 'error' }
> = {
  Accepted: { label: 'Aceptado', color: 'success' },
  'No accepted': { label: 'No aceptado', color: 'error' },
  Aceptado: { label: 'Aceptado', color: 'success' },
  'No aceptado': { label: 'No aceptado', color: 'error' }
}

type ChipColor = 'success' | 'error' | 'warning' | 'info' | 'default'

// Color por significado (Chip outlined, igual que el resto de listados)
const riskLevelColor = (nivel: string): ChipColor => {
  switch (nivel) {
    case 'Crítico':
      return 'error'
    case 'Alto':
      return 'warning'
    case 'Media':
      return 'info'
    case 'Baja':
    case 'Muy Baja':
      return 'success'
    default:
      return 'default'
  }
}
const impactProbColor = (valor: string): ChipColor => {
  switch (valor) {
    case 'Alta':
      return 'error'
    case 'Media':
      return 'warning'
    case 'Baja':
    case 'Muy Baja':
      return 'success'
    default:
      return 'default'
  }
}

const EMPTY_REPORTS: NonConformWorkReport[] = []
const EMPTY_ALERTS: NonConformWorkReportAlert[] = []

interface NonConformWorkReportTableProps {
  onEdit?: (row: NonConformWorkReport) => void
  onView?: (row: NonConformWorkReport) => void
  onCreate?: () => void
}

const NonConformWorkReportTable: React.FC<NonConformWorkReportTableProps> = ({
  onEdit,
  onView,
  onCreate
}) => {
  const canManage = useCan(PERMISSIONS.NONCONFORM_REPORT_MANAGE)
  const { data: alerts = EMPTY_ALERTS, isLoading: alertsLoading } =
    useNonConformWorkReportAlerts()
  const deleteReport = useDeleteNonConformWorkReport()
  const [showOnlyAlerts, setShowOnlyAlerts] = useState(false)

  // El listado se pagina, busca, ordena y filtra en el servidor. "Con revisión
  // pendiente" muestra en el cliente los reportes de `/alerts`, que llegan
  // completos.
  const server = useServerTableState({
    sortableFields: NON_CONFORM_SORTABLE_FIELDS,
    exactFilters: NON_CONFORM_EXACT_FILTERS
  })
  const {
    data: reportsPage,
    isLoading: pageLoading,
    isFetching: pageFetching
  } = useNonConformWorkReportsPaginated(server.params, {
    enabled: !showOnlyAlerts
  })
  useKeepPageInRange(
    showOnlyAlerts ? undefined : reportsPage?.totalPages,
    server.pagination.pageIndex,
    server.setPagination
  )
  const { data: counts } = useNonConformWorkReportCounts()
  const rows = reportsPage?.items ?? EMPTY_REPORTS
  const loading = showOnlyAlerts ? alertsLoading : pageLoading
  const toggleAlerts = (value: boolean) => {
    setShowOnlyAlerts(value)
    server.goToFirstPage()
  }
  // "Abiertos" y "Cerrados" filtran por la misma columna Estatus del servidor
  const statusFilter = server.columnFilters.find((f) => f.id === 'status')
    ?.value as string | undefined
  const toggleStatus = (value: 'Open' | 'Closed') => {
    setShowOnlyAlerts(false)
    server.setColumnFilters((old) => [
      ...old.filter((f) => f.id !== 'status'),
      ...(statusFilter === value ? [] : [{ id: 'status', value }])
    ])
  }

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: '¿Está seguro de eliminar este reporte?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })
    if (!result.isConfirmed) return
    try {
      await deleteReport.mutateAsync(id)
      await Swal.fire({
        icon: 'success',
        title: '¡Eliminado!',
        text: 'El reporte fue eliminado correctamente.'
      })
    } catch (err) {
      notify.error('Error al eliminar el reporte')
    }
  }

  const columns = useMemo<MRT_ColumnDef<NonConformWorkReport>[]>(
    () => [
      {
        accessorKey: 'tncCode',
        header: 'Código TNC',
        size: 150,
        enableColumnFilter: false,
        Cell: ({ cell }: { cell: MRT_Cell<NonConformWorkReport> }) => (
          <Typography variant='body2' fontWeight={600}>
            {cell.getValue<string>()}
          </Typography>
        ),
        sortingFn: (rowA, rowB, columnId) => {
          return rowA
            .getValue<string>(columnId)
            .localeCompare(rowB.getValue<string>(columnId), undefined, {
              numeric: true,
              sensitivity: 'base'
            })
        }
      },
      {
        accessorKey: 'tncAcceptance',
        header: 'Aceptación',
        size: 150,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ cell }: { cell: MRT_Cell<NonConformWorkReport> }) => {
          const value = cell.getValue<string>()
          const acceptance = acceptanceMap[value] || {
            label: value,
            color: 'default'
          }
          return (
            <Chip
              label={acceptance.label}
              color={acceptance.color}
              size='small'
              variant='outlined'
            />
          )
        }
      },
      {
        accessorKey: 'iso17025Clause',
        header: 'Numeral ISO 17025',
        size: 170,
        enableSorting: false,
        enableColumnFilter: false
      },
      {
        accessorKey: 'registerDate',
        header: 'Fecha de registro',
        size: 140,
        enableColumnFilter: false,
        Cell: ({ cell }: { cell: MRT_Cell<NonConformWorkReport> }) => {
          const value = cell.getValue<string>()
          return <span>{value ? format(new Date(value), 'dd/MM/yyyy') : ''}</span>
        }
      },
      {
        accessorKey: 'detectedBy',
        header: 'Detectado por',
        size: 200,
        // La búsqueda global ya busca en "Detectado por".
        enableSorting: false,
        enableColumnFilter: false
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        size: 130,
        filterVariant: 'select',
        filterSelectOptions: [
          { text: 'Abierta', value: 'Open' },
          { text: 'Cerrada', value: 'Closed' }
        ],
        Cell: ({ cell }: { cell: MRT_Cell<NonConformWorkReport> }) => {
          const value = cell.getValue<string>()
          const status = statusMap[value] || {
            label: value,
            color: 'default'
          }
          return (
            <Chip
              label={status.label}
              color={status.color}
              size='small'
              variant='outlined'
            />
          )
        }
      },
      {
        accessorKey: 'impactWeight',
        header: 'Impacto',
        size: 130,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ cell }: { cell: MRT_Cell<NonConformWorkReport> }) => {
          const value = cell.getValue<string>()
          const displayValue = impactMap[value] || value
          return (
            <Chip
              label={displayValue}
              color={impactProbColor(displayValue)}
              size='small'
              variant='outlined'
            />
          )
        }
      },
      {
        accessorKey: 'probability',
        header: 'Probabilidad',
        size: 130,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ cell }: { cell: MRT_Cell<NonConformWorkReport> }) => {
          const value = cell.getValue<string>()
          const displayValue = probabilityMap[value] || value
          return (
            <Chip
              label={displayValue}
              color={impactProbColor(displayValue)}
              size='small'
              variant='outlined'
            />
          )
        }
      },
      {
        accessorKey: 'riskLevel',
        header: 'Nivel de riesgo',
        size: 150,
        filterVariant: 'select',
        filterSelectOptions: [
          'Critical',
          'High',
          'Medium',
          'Low',
          'Very Low'
        ].map((value) => ({ text: riskLevelMap[value], value })),
        Cell: ({ cell }: { cell: MRT_Cell<NonConformWorkReport> }) => {
          const value = cell.getValue<string>()
          const displayValue = riskLevelMap[value] || value
          return (
            <Chip
              label={displayValue}
              color={riskLevelColor(displayValue)}
              size='small'
              variant='outlined'
            />
          )
        }
      }
    ],
    []
  )

  const filteredRows = showOnlyAlerts ? alerts : rows

  const openCount = counts?.open ?? 0
  const closedCount = counts?.closed ?? 0

  return (
    <>
      <LmsPageHeader
        title='Trabajo no conforme'
        subtitle='Reportes TNC, su nivel de riesgo y las revisiones pendientes'
        icon={<ReportProblemOutlined />}
        actions={
          canManage ? (
            <Button
              variant='contained'
              startIcon={<Add />}
              onClick={onCreate}
              sx={{
                bgcolor: '#00BFA5',
                whiteSpace: 'nowrap',
                '&:hover': { bgcolor: '#00ACC1' }
              }}
            >
              Nuevo reporte
            </Button>
          ) : undefined
        }
      />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='Abiertos'
            value={openCount}
            icon={<FolderOpen />}
            tone='orange'
            active={!showOnlyAlerts && statusFilter === 'Open'}
            onClick={() => toggleStatus('Open')}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='Cerrados'
            value={closedCount}
            icon={<CheckCircle />}
            tone='green'
            active={!showOnlyAlerts && statusFilter === 'Closed'}
            onClick={() => toggleStatus('Closed')}
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <LmsStatCard
            variant='quiet'
            label='Con revisión pendiente'
            value={alerts.length}
            icon={<NotificationsActive />}
            tone='red'
            active={showOnlyAlerts}
            onClick={
              alerts.length > 0
                ? () => toggleAlerts(!showOnlyAlerts)
                : undefined
            }
          />
        </Grid>
      </Grid>

      <DataTable
        columns={columns}
        data={filteredRows}
        itemLabel={['reporte', 'reportes']}
        searchPlaceholder='Buscar reportes'
        {...(showOnlyAlerts
          ? {
              onPaginationChange: server.setPagination,
              onSortingChange: server.setSorting,
              onColumnFiltersChange: server.setColumnFilters,
              onGlobalFilterChange: server.setGlobalFilter
            }
          : { ...server.tableProps, rowCount: reportsPage?.totalItems ?? 0 })}
        state={{
          ...server.tableState,
          isLoading: loading,
          showProgressBars: !showOnlyAlerts && pageFetching && !pageLoading
        }}
        enableRowActions
        initialState={{ density: 'compact' }}
        renderRowActions={({ row }) => (
          <Box sx={{ display: 'flex' }}>
            <Tooltip title='Ver'>
              <IconButton
                size='small'
                aria-label={`Ver reporte ${row.original.tncCode}`}
                sx={{ color: '#00695C' }}
                onClick={() => onView && onView(row.original)}
              >
                <VisibilityIcon fontSize='small' />
              </IconButton>
            </Tooltip>
            {canManage && (
              <>
                <Tooltip title='Editar'>
                  <IconButton
                    size='small'
                    aria-label={`Editar reporte ${row.original.tncCode}`}
                    sx={{ color: '#2563eb' }}
                    onClick={() => onEdit && onEdit(row.original)}
                  >
                    <EditIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
                <Tooltip title='Eliminar'>
                  <IconButton
                    size='small'
                    color='error'
                    aria-label={`Eliminar reporte ${row.original.tncCode}`}
                    onClick={() =>
                      row.original.id && handleDelete(row.original.id)
                    }
                  >
                    <DeleteIcon fontSize='small' />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        )}
      />
    </>
  )
}

export default NonConformWorkReportTable
