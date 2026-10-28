import CalibrationServiceStageTimesCard from './CalibrationServiceStageTimesCard'
import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  CircularProgress,
  Container,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material'
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined'
import ExpandLessOutlinedIcon from '@mui/icons-material/ExpandLessOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import MaterialReactTable, {
  type MRT_ColumnDef,
  type MRT_PaginationState
} from 'material-react-table'
import { MRT_Localization_ES } from 'material-react-table/locales/es'
import { useNavigate } from 'react-router-dom'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { axiosPrivate } from '@utils/api'
import CalibrationServiceStatusChip from './CalibrationServiceStatusChip'
import {
  CALIBRATION_SERVICE_SLA_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS
} from '../../constants/calibrationServices'
import {
  useCalibrationAssignableMetrologists,
  useCalibrationServiceAnalytics
} from '../../hooks/useCalibrationServices'
import { useCalibrationCustomerOptions } from '../../hooks/calibration/useCalibrationCustomerOptions'
import {
  CalibrationServiceAnalyticsFilters,
  CalibrationServiceAnalyticsResponse,
  CalibrationServiceAnalyticsTableRow,
  CalibrationServiceSlaIndicatorColor,
  CalibrationServiceStatus,
  CalibrationServiceUserSummary
} from '../../types/calibrationService'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'

const FILTER_ALL = 'all'

const ui = {
  green: '#10b981',
  greenDark: '#059669',
  greenLight: '#f0fdf4',
  warning: '#d97706',
  error: '#dc2626',
  info: '#2563eb',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#e5e7eb',
  surface: '#f9fafb',
  white: '#ffffff'
}

const statusOptions: Array<{
  value: CalibrationServiceStatus | typeof FILTER_ALL
  label: string
}> = [
  { value: FILTER_ALL, label: 'Todos los estados' },
  { value: 'draft', label: 'Borrador' },
  { value: 'pending_approval', label: 'Cotización enviada' },
  { value: 'rejected', label: 'Rechazada' },
  { value: 'approved', label: 'Aprobada por cliente' },
  { value: 'ods_issued', label: 'ODS emitida · pendiente de programar' },
  { value: 'scheduled', label: 'Programada' },
  { value: 'in_execution', label: 'En ejecución' },
  { value: 'technically_completed', label: 'Finalizada técnicamente' },
  { value: 'cancelled', label: 'Cancelada' },
  { value: 'closed', label: 'Cerrada' }
]

const slaOptions: Array<{
  value: CalibrationServiceSlaIndicatorColor | typeof FILTER_ALL
  label: string
}> = [
  { value: FILTER_ALL, label: 'Todo el semáforo' },
  { value: 'green', label: 'En tiempo' },
  { value: 'yellow', label: 'En alerta' },
  { value: 'red', label: 'Vencido' },
  { value: 'gray', label: 'Sin iniciar' },
  { value: 'blue', label: 'Cerrado/completo' }
]

const yesNoOptions = [
  { value: FILTER_ALL, label: 'Todos' },
  { value: 'true', label: 'Sí' },
  { value: 'false', label: 'No' }
] as const

const phaseLabels: Record<string, string> = {
  draft: 'Borrador',
  pending_approval: 'Cotización enviada',
  approved: 'Aprobada',
  ods_issued: 'ODS emitida',
  pending_programming: 'Pendiente programación',
  scheduled: 'Programada',
  in_execution: 'En ejecución',
  technically_completed: 'Finalizada técnicamente',
  with_cut: 'Con corte',
  invoiced: 'Facturada',
  documented: 'Control documental',
  closed: 'Cerrada',
  cancelled: 'Cancelada',
  rejected: 'Rechazada'
}

const adjustmentStatusLabels: Record<string, string> = {
  reported: 'Reportada',
  under_review: 'En revisión',
  approved: 'Aprobada comercialmente',
  rejected: 'Rechazada',
  pending_customer_approval: 'Pendiente aprobación cliente',
  customer_approved: 'Aprobada por cliente',
  customer_rejected: 'Rechazada por cliente',
  auto_accepted: 'Aceptada automáticamente'
}

const adjustmentTypeLabels: Record<string, string> = {
  quantity_more: 'Cantidad mayor a la cotizada',
  quantity_less: 'Cantidad menor a la cotizada',
  extra_item: 'Ítem no cotizado',
  item_removed: 'Ítem retirado',
  scope_change: 'Cambio de alcance',
  other: 'Otra novedad'
}

const cutIndicatorLabels: Record<string, string> = {
  draft: 'Cortes en borrador',
  ready_for_invoicing: 'Cortes listos para facturar',
  invoiced: 'Cortes facturados',
  document_pending: 'Servicios con control documental pendiente',
  final_close_ready: 'Servicios listos para cierre final'
}

const slaLabels: Record<CalibrationServiceSlaIndicatorColor, string> = {
  gray: 'Sin iniciar',
  green: 'En tiempo',
  yellow: 'En alerta',
  red: 'Vencido',
  blue: 'Completado'
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0
})

const numberFormatter = new Intl.NumberFormat('es-CO')

const compactCurrencyFormatter = new Intl.NumberFormat('es-CO', {
  notation: 'compact',
  maximumFractionDigits: 1
})

const cardSx = {
  border: `1px solid ${ui.border}`,
  borderRadius: '16px',
  boxShadow: 'none',
  backgroundColor: ui.white
}

const secondaryButtonSx = {
  borderRadius: '12px',
  textTransform: 'none',
  fontWeight: 700,
  minHeight: 42,
  borderColor: ui.border,
  color: ui.text,
  backgroundColor: ui.white,
  '&:hover': {
    borderColor: ui.green,
    color: ui.greenDark,
    backgroundColor: ui.greenLight
  }
}

const formatCurrency = (value?: number | null) =>
  value === null || value === undefined ? 'Restringido' : currencyFormatter.format(value)

const formatCompactCurrency = (value?: number | null) =>
  value === null || value === undefined
    ? 'Restringido'
    : `$ ${compactCurrencyFormatter.format(value)}`

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Sin fecha'
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime())
    ? 'Sin fecha'
    : parsed.toLocaleDateString('es-CO')
}

const parseBooleanFilter = (value: string) => {
  if (value === FILTER_ALL) {
    return undefined
  }

  return value === 'true'
}

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10)

const YesNoSelect = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <TextField fullWidth select label={label} value={value} onChange={(e) => onChange(e.target.value)}>
    {yesNoOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
  </TextField>
)

const CalibrationServiceAnalyticsPage = () => {
  const navigate = useNavigate()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [status, setStatus] = useState<CalibrationServiceStatus | typeof FILTER_ALL>(
    FILTER_ALL
  )
  const [slaColor, setSlaColor] = useState<
    CalibrationServiceSlaIndicatorColor | typeof FILTER_ALL
  >(FILTER_ALL)
  const [hasAdjustments, setHasAdjustments] = useState<string>(FILTER_ALL)
  const [hasCuts, setHasCuts] = useState<string>(FILTER_ALL)
  const [hasInvoice, setHasInvoice] = useState<string>(FILTER_ALL)
  const [hasPendingDocumentControl, setHasPendingDocumentControl] =
    useState<string>(FILTER_ALL)
  const [customerId, setCustomerId] = useState<string>(FILTER_ALL)
  const [metrologistId, setMetrologistId] = useState<string>(FILTER_ALL)
  const [areFiltersOpen, setAreFiltersOpen] = useState(false)
  const [isFinancialTrendOpen, setIsFinancialTrendOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [tablePagination, setTablePagination] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })

  const { data: customerData } = useCalibrationCustomerOptions()
  const { data: metrologists = [] } = useCalibrationAssignableMetrologists()

  const filters: CalibrationServiceAnalyticsFilters = {}
  if (dateFrom) filters.dateFrom = dateFrom
  if (dateTo) filters.dateTo = dateTo
  if (status !== FILTER_ALL) filters.status = status
  if (slaColor !== FILTER_ALL) filters.slaColor = slaColor
  if (customerId !== FILTER_ALL) filters.customerId = Number(customerId)
  if (metrologistId !== FILTER_ALL) {
    filters.metrologistId =
      metrologistId === 'unassigned' ? 'unassigned' : Number(metrologistId)
  }
  if (hasAdjustments !== FILTER_ALL) {
    filters.hasAdjustments = parseBooleanFilter(hasAdjustments)
  }
  if (hasCuts !== FILTER_ALL) {
    filters.hasCuts = parseBooleanFilter(hasCuts)
  }
  if (hasInvoice !== FILTER_ALL) {
    filters.hasInvoice = parseBooleanFilter(hasInvoice)
  }
  if (hasPendingDocumentControl !== FILTER_ALL) {
    filters.hasPendingDocumentControl = parseBooleanFilter(hasPendingDocumentControl)
  }
  filters.tableLimit = tablePagination.pageSize
  filters.tableOffset = tablePagination.pageIndex * tablePagination.pageSize

  const { data, isFetching, isLoading, refetch } =
    useCalibrationServiceAnalytics(filters)

  useEffect(() => {
    setTablePagination((current) => ({ ...current, pageIndex: 0 }))
  }, [
    dateFrom,
    dateTo,
    status,
    slaColor,
    customerId,
    metrologistId,
    hasAdjustments,
    hasCuts,
    hasInvoice,
    hasPendingDocumentControl
  ])

  const totalServices = data?.summary.totalServices ?? 0
  const activeFiltersCount = [
    dateFrom,
    dateTo,
    status !== FILTER_ALL,
    slaColor !== FILTER_ALL,
    customerId !== FILTER_ALL,
    metrologistId !== FILTER_ALL,
    hasAdjustments !== FILTER_ALL,
    hasCuts !== FILTER_ALL,
    hasInvoice !== FILTER_ALL,
    hasPendingDocumentControl !== FILTER_ALL
  ].filter(Boolean).length
  const percentOfTotal = (count: number) => (totalServices ? Math.round((count / totalServices) * 100) : 0)
  const isUnassigned = (name: string) => /sin metr/i.test(name)
  const overdueCount = data?.slaCounts.red ?? 0
  const unassignedCount = (data?.metrologists ?? [])
    .filter((item) => isUnassigned(item.metrologistName))
    .reduce((acc, item) => acc + item.total, 0)
  const approvedValue = Number(data?.summary.approvedQuotedValue ?? 0)
  const invoicedShare = approvedValue
    ? Math.round((Number(data?.summary.invoicedValue ?? 0) / approvedValue) * 100)
    : 0
  const SLA_COLORS: Record<string, string> = {
    green: '#00BFA5',
    yellow: '#f59e0b',
    red: '#ef4444',
    gray: '#9ca3af',
    blue: '#3b82f6'
  }
  const slaSegments = slaOptions
    .filter((option) => option.value !== FILTER_ALL)
    .map((option) => ({
      value: option.value as string,
      label: option.label,
      color: SLA_COLORS[option.value as string],
      count: data?.slaCounts[option.value as CalibrationServiceSlaIndicatorColor] ?? 0
    }))
  const maxFunnelValue = Math.max(
    1,
    ...(data?.funnel ?? []).map((item) => item.count)
  )
  const maxMetrologistValue = Math.max(
    1,
    ...(data?.metrologists ?? []).map((item) => item.total)
  )
  const analyticsTableColumns = useMemo<
    MRT_ColumnDef<CalibrationServiceAnalyticsTableRow>[]
  >(
    () => [
      {
        accessorKey: 'serviceCode',
        header: 'Servicio',
        Cell: ({ row }) => (
          <Box>
            <Typography variant='body2' sx={{ fontWeight: 800 }}>
              {row.original.serviceCode}
            </Typography>
            <Typography variant='caption' sx={{ color: ui.muted }}>
              {row.original.odsCode || row.original.quoteCode || 'Sin ODS'}
            </Typography>
          </Box>
        )
      },
      {
        accessorKey: 'customerName',
        header: 'Cliente'
      },
      {
        accessorKey: 'status',
        header: 'Estado',
        Cell: ({ row }) => (
          <CalibrationServiceStatusChip status={row.original.status} />
        )
      },
      {
        accessorKey: 'slaColor',
        header: 'Semáforo',
        Cell: ({ row }) => (
          <Chip
            size='small'
            label={slaLabels[row.original.slaColor] || row.original.slaLabel}
            color={CALIBRATION_SERVICE_SLA_COLORS[row.original.slaColor]}
            variant={row.original.slaColor === 'gray' ? 'outlined' : 'filled'}
          />
        )
      },
      {
        accessorKey: 'metrologistName',
        header: 'Metrólogo',
        Cell: ({ row }) => row.original.metrologistName || 'Sin asignar'
      },
      {
        accessorKey: 'adjustmentsCount',
        header: 'Novedades',
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' }
      },
      {
        accessorKey: 'cutsCount',
        header: 'Cortes',
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        Cell: ({ row }) => (
          <Stack direction='row' justifyContent='flex-end' spacing={1}>
            <span>{row.original.cutsCount}</span>
            {row.original.hasPendingDocumentControl ? (
              <WarningAmberOutlinedIcon color='warning' sx={{ fontSize: 16 }} />
            ) : null}
          </Stack>
        )
      },
      {
        accessorKey: 'totalValue',
        header: 'Valor',
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        Cell: ({ row }) => formatCurrency(row.original.totalValue)
      },
      {
        id: 'actions',
        header: 'Acción',
        enableSorting: false,
        muiTableBodyCellProps: { align: 'right' },
        muiTableHeadCellProps: { align: 'right' },
        Cell: ({ row }) => (
          <Button
            size='small'
            onClick={() => navigate(`/calibration-services/${row.original.id}`)}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Ver detalle
          </Button>
        )
      }
    ],
    [navigate]
  )

  const exportToExcel = async () => {
    setIsExporting(true)
    try {
      const XLSX = await import('xlsx')
      const exportFilters: CalibrationServiceAnalyticsFilters = {
        ...filters,
        tableAll: true,
        tableLimit: undefined,
        tableOffset: undefined
      }
      const response = await axiosPrivate.get<CalibrationServiceAnalyticsResponse>(
        '/calibration-services/analytics',
        {
          params: exportFilters
        }
      )
      const exportData = response.data

      if (!exportData) {
        return
      }

      const workbook = XLSX.utils.book_new()
      const selectedCustomer =
        customerData?.customers.find((customer) => String(customer.id) === customerId)
          ?.nombre || 'Todos'
      const selectedMetrologist =
        metrologistId === 'unassigned'
          ? 'Sin metrólogo asignado'
          : metrologists.find(
              (metrologist: CalibrationServiceUserSummary) =>
                String(metrologist.id) === metrologistId
            )?.nombre || 'Todos'

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet([
          {
            'Fecha inicial': dateFrom || 'Sin filtro',
            'Fecha final': dateTo || 'Sin filtro',
            Cliente: selectedCustomer,
            Metrólogo: selectedMetrologist,
            Estado:
              statusOptions.find((option) => option.value === status)?.label ||
              'Todos los estados',
            Semáforo:
              slaOptions.find((option) => option.value === slaColor)?.label ||
              'Todo el semáforo',
            'Servicios visibles': exportData.summary.totalServices,
            'Servicios activos': exportData.summary.activeServices,
            'Servicios con novedades': exportData.summary.servicesWithAdjustments,
            'Servicios con cortes': exportData.summary.servicesWithCuts,
            'Valor cotizado total': exportData.summary.quotedValue ?? 'Restringido',
            'Valor cotizado aprobado':
              exportData.summary.approvedQuotedValue ?? 'Restringido',
            'Valor novedades aprobadas':
              exportData.summary.approvedAdjustmentValue ?? 'Restringido',
            'Valor facturado': exportData.summary.invoicedValue ?? 'Restringido'
          }
        ]),
        'Resumen'
      )

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          Object.entries(exportData.slaCounts).map(([key, value]) => ({
            Semáforo:
              slaLabels[key as CalibrationServiceSlaIndicatorColor] || key,
            Cantidad: value
          }))
        ),
        'SLA'
      )

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          exportData.funnel.map((item) => ({
            Fase: phaseLabels[item.phase] || item.phase,
            Cantidad: item.count
          }))
        ),
        'Embudo'
      )

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          exportData.metrologists.map((metrologist) => ({
            Metrólogo: metrologist.metrologistName,
            Total: metrologist.total,
            Programados: metrologist.scheduled,
            'En ejecución': metrologist.inExecution,
            'Finalizados técnicamente': metrologist.technicallyCompleted,
            'SLA alerta o vencido': metrologist.warningOrOverdue,
            'Pendiente cierre': metrologist.pendingClosure
          }))
        ),
        'Metrólogos'
      )

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet([
          {
            Categoría: 'Total novedades',
            Detalle: 'Novedades registradas',
            Cantidad: exportData.adjustments.total
          },
          ...Object.entries(exportData.adjustments.byStatus).map(([key, value]) => ({
            Categoría: 'Por estado',
            Detalle: adjustmentStatusLabels[key] || key,
            Cantidad: value
          })),
          ...Object.entries(exportData.adjustments.byType).map(([key, value]) => ({
            Categoría: 'Por tipo',
            Detalle: adjustmentTypeLabels[key] || key,
            Cantidad: value
          }))
        ]),
        'Novedades'
      )

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          Object.entries(exportData.cuts).map(([key, value]) => ({
            Indicador: cutIndicatorLabels[key] || key,
            Cantidad: value
          }))
        ),
        'Cortes'
      )

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          (exportData.financialTrend ?? []).map((row) => ({
            Mes: row.monthLabel,
            'Valor cotizado total': row.quotedValue,
            'Valor cotizado aprobado': row.approvedQuotedValue,
            'Valor novedades aprobadas': row.approvedAdjustmentValue,
            'Valor facturado': row.invoicedValue
          }))
        ),
        'Tendencia financiera'
      )

      XLSX.utils.book_append_sheet(
        workbook,
        XLSX.utils.json_to_sheet(
          exportData.tableRows.map((row) => ({
            Servicio: row.serviceCode,
            Cotización: row.quoteCode || '',
            ODS: row.odsCode || '',
            Cliente: row.customerName,
            Estado: CALIBRATION_SERVICE_STATUS_LABELS[row.status] || row.status,
            Semáforo: slaLabels[row.slaColor] || row.slaLabel,
            Fase: row.activePhase ? phaseLabels[row.activePhase] || row.activePhase : '',
            Metrólogo: row.metrologistName || 'Sin asignar',
            Novedades: row.adjustmentsCount,
            Cortes: row.cutsCount,
            'Control documental pendiente': row.hasPendingDocumentControl
              ? 'Sí'
              : 'No',
            Valor: row.totalValue ?? 'Restringido',
            'Última actualización': row.updatedAt
              ? new Date(row.updatedAt).toLocaleString('es-CO')
              : ''
          }))
        ),
        'Servicios'
      )

      const fileName = `analiticas_calibracion_${new Date()
        .toISOString()
        .slice(0, 10)}.xlsx`
      XLSX.writeFile(workbook, fileName)
    } finally {
      setIsExporting(false)
    }
  }

  const applyDatePreset = (preset: 'all' | 'current_month' | 'last_30_days') => {
    const today = new Date()

    if (preset === 'all') {
      setDateFrom('')
      setDateTo('')
      return
    }

    if (preset === 'current_month') {
      setDateFrom(formatDateInput(new Date(today.getFullYear(), today.getMonth(), 1)))
      setDateTo(formatDateInput(today))
      return
    }

    const fromDate = new Date(today)
    fromDate.setDate(today.getDate() - 30)
    setDateFrom(formatDateInput(fromDate))
    setDateTo(formatDateInput(today))
  }

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Button
        variant='text'
        startIcon={<ArrowBackOutlinedIcon />}
        onClick={() => navigate('/calibration-services')}
        sx={{ color: 'text.secondary', textTransform: 'none', fontWeight: 600, mb: 1 }}
      >
        Volver a la bandeja
      </Button>
      <LmsPageHeader
        title='Analíticas de calibración'
        subtitle='Vista gerencial para seguimiento de SLA, embudo operativo, novedades, cortes, facturación y carga por metrólogo.'
        icon={<AnalyticsOutlinedIcon />}
        actions={
          <>
            <Button
              variant='outlined'
              startIcon={<RefreshOutlinedIcon />}
              onClick={() => {
                void refetch()
              }}
              disabled={isFetching}
              sx={secondaryButtonSx}
            >
              Actualizar
            </Button>
            <Button
              variant='contained'
              startIcon={<DownloadOutlinedIcon />}
              onClick={() => {
                void exportToExcel()
              }}
              disabled={!data || isExporting}
              sx={{ bgcolor: '#00BFA5', whiteSpace: 'nowrap', '&:hover': { bgcolor: '#00ACC1' } }}
            >
              {isExporting ? 'Generando...' : 'Descargar Excel'}
            </Button>
          </>
        }
      />

      {data?.limitedTechnicalView ? (
        <Alert severity='info' sx={{ mb: 3 }}>
          Estás viendo una analítica técnica limitada a los servicios asignados a
          tu usuario. Los valores comerciales se ocultan.
        </Alert>
      ) : null}

      <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent='space-between'
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={1.5}
          >
            <Box>
              <Typography variant='subtitle1' sx={{ fontWeight: 800 }}>
                Filtros analíticos
              </Typography>
              <Typography variant='body2' sx={{ color: ui.muted }}>
                {activeFiltersCount
                  ? `${activeFiltersCount} filtro(s) aplicado(s)`
                  : 'Sin filtros aplicados. La vista muestra todo el universo visible.'}
              </Typography>
            </Box>
            <Stack direction='row' spacing={1}>
              {activeFiltersCount ? (
                <Button
                  variant='text'
                  onClick={() => {
                    setDateFrom('')
                    setDateTo('')
                    setStatus(FILTER_ALL)
                    setSlaColor(FILTER_ALL)
                    setCustomerId(FILTER_ALL)
                    setMetrologistId(FILTER_ALL)
                    setHasAdjustments(FILTER_ALL)
                    setHasCuts(FILTER_ALL)
                    setHasInvoice(FILTER_ALL)
                    setHasPendingDocumentControl(FILTER_ALL)
                  }}
                  sx={{ color: ui.muted, textTransform: 'none', fontWeight: 700 }}
                >
                  Limpiar
                </Button>
              ) : null}
              <Button
                variant='outlined'
                startIcon={<FilterListOutlinedIcon />}
                endIcon={
                  areFiltersOpen ? <ExpandLessOutlinedIcon /> : <ExpandMoreOutlinedIcon />
                }
                onClick={() => setAreFiltersOpen((current) => !current)}
                sx={secondaryButtonSx}
              >
                {areFiltersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
              </Button>
            </Stack>
          </Stack>

          <Collapse in={areFiltersOpen} timeout='auto' unmountOnExit>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              sx={{ mt: 2 }}
            >
              <Typography variant='body2' sx={{ color: ui.muted, fontWeight: 700 }}>
                Fecha rápida:
              </Typography>
              <Button
                size='small'
                variant={!dateFrom && !dateTo ? 'contained' : 'outlined'}
                onClick={() => applyDatePreset('all')}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Todo
              </Button>
              <Button
                size='small'
                variant='outlined'
                onClick={() => applyDatePreset('current_month')}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Mes actual
              </Button>
              <Button
                size='small'
                variant='outlined'
                onClick={() => applyDatePreset('last_30_days')}
                sx={{ textTransform: 'none', fontWeight: 700 }}
              >
                Últimos 30 días
              </Button>
            </Stack>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label='Desde'
                type='date'
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label='Hasta'
                type='date'
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label='Estado'
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as CalibrationServiceStatus | typeof FILTER_ALL)
                }
              >
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label='Semáforo'
                value={slaColor}
                onChange={(event) =>
                  setSlaColor(
                    event.target.value as CalibrationServiceSlaIndicatorColor | typeof FILTER_ALL
                  )
                }
              >
                {slaOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label='Cliente'
                value={customerId}
                onChange={(event) => setCustomerId(event.target.value)}
              >
                <MenuItem value={FILTER_ALL}>Todos los clientes</MenuItem>
                {(customerData?.customers ?? []).map((customer) => (
                  <MenuItem key={customer.id} value={String(customer.id)}>
                    {customer.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                select
                label='Metrólogo'
                value={metrologistId}
                onChange={(event) => setMetrologistId(event.target.value)}
              >
                <MenuItem value={FILTER_ALL}>Todos los metrólogos</MenuItem>
                <MenuItem value='unassigned'>Sin metrólogo asignado</MenuItem>
                {metrologists.map((metrologist: CalibrationServiceUserSummary) => (
                  <MenuItem key={metrologist.id} value={String(metrologist.id)}>
                    {metrologist.nombre}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <YesNoSelect label='Con novedades' value={hasAdjustments} onChange={setHasAdjustments} />
            </Grid>
            <Grid item xs={12} md={3}>
              <YesNoSelect label='Con cortes' value={hasCuts} onChange={setHasCuts} />
            </Grid>
            <Grid item xs={12} md={3}>
              <YesNoSelect label='Con factura' value={hasInvoice} onChange={setHasInvoice} />
            </Grid>
            <Grid item xs={12} md={3}>
              <YesNoSelect label='Doc. pendiente' value={hasPendingDocumentControl} onChange={setHasPendingDocumentControl} />
            </Grid>
          </Grid>
          </Collapse>
        </CardContent>
      </Card>

      {isLoading ? (
        <Stack alignItems='center' py={8}>
          <CircularProgress />
          <Typography variant='body2' sx={{ mt: 2, color: ui.muted }}>
            Calculando analíticas...
          </Typography>
        </Stack>
      ) : (
        <>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={6} md={3}>
              <LmsStatCard
                label='Servicios'
                value={numberFormatter.format(totalServices)}
                caption={`${numberFormatter.format(data?.summary.activeServices ?? 0)} activos`}
                icon={<AnalyticsOutlinedIcon />}
                tone='teal'
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <LmsStatCard
                label='SLA vencido'
                value={numberFormatter.format(overdueCount)}
                caption={`${percentOfTotal(overdueCount)}% del total`}
                icon={<WarningAmberOutlinedIcon />}
                tone={overdueCount > 0 ? 'red' : 'green'}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <LmsStatCard
                label='Sin metrólogo'
                value={numberFormatter.format(unassignedCount)}
                caption={`${percentOfTotal(unassignedCount)}% del total`}
                icon={<EngineeringOutlinedIcon />}
                tone={unassignedCount > 0 ? 'orange' : 'green'}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <LmsStatCard
                label='Con novedades'
                value={numberFormatter.format(data?.summary.servicesWithAdjustments ?? 0)}
                icon={<AssignmentTurnedInOutlinedIcon />}
                tone='blue'
              />
            </Grid>
          </Grid>

          <CalibrationServiceStageTimesCard />

          <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
            <CardContent>
              <Typography variant='h6' sx={{ fontWeight: 700 }}>
                Resumen financiero
              </Typography>
              <Typography variant='body2' sx={{ color: ui.muted, mb: 2 }}>
                Lo cotizado, lo aprobado y lo que ya se facturó.
              </Typography>
              <Grid container spacing={2}>
                {[
                  { label: 'Cotizado', value: data?.summary.quotedValue },
                  { label: 'Cotizado aprobado', value: data?.summary.approvedQuotedValue },
                  { label: 'Novedades aprobadas', value: data?.summary.approvedAdjustmentValue },
                  { label: 'Facturado', value: data?.summary.invoicedValue }
                ].map((item) => (
                  <Grid item xs={12} sm={6} md={3} key={item.label}>
                    <Typography variant='body2' sx={{ color: ui.muted }}>
                      {item.label}
                    </Typography>
                    <Typography variant='h5' sx={{ fontWeight: 700, color: ui.text }}>
                      {formatCurrency(item.value)}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ mt: 2.5 }}>
                <Stack direction='row' justifyContent='space-between' mb={0.5}>
                  <Typography variant='body2' sx={{ fontWeight: 600 }}>
                    Facturado sobre lo aprobado
                  </Typography>
                  <Typography variant='body2' sx={{ fontWeight: 700 }}>
                    {invoicedShare}%
                  </Typography>
                </Stack>
                <LinearProgress
                  variant='determinate'
                  value={Math.min(invoicedShare, 100)}
                  sx={{ height: 10, borderRadius: 999, backgroundColor: '#E0F7F4', '& .MuiLinearProgress-bar': { borderRadius: 999, backgroundColor: '#00BFA5' } }}
                />
              </Box>
            </CardContent>
          </Card>

          <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
            <CardContent>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent='space-between'
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                spacing={1.5}
              >
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 800 }}>
                    Tendencia financiera
                  </Typography>
                  <Typography variant='body2' sx={{ color: ui.muted }}>
                    Compara mes a mes lo cotizado, aprobado, ajustado por novedades
                    y facturado.
                  </Typography>
                </Box>
                <Button
                  variant='outlined'
                  endIcon={
                    isFinancialTrendOpen ? (
                      <ExpandLessOutlinedIcon />
                    ) : (
                      <ExpandMoreOutlinedIcon />
                    )
                  }
                  onClick={() => setIsFinancialTrendOpen((current) => !current)}
                  sx={secondaryButtonSx}
                >
                  {isFinancialTrendOpen ? 'Ocultar gráfica' : 'Ver gráfica'}
                </Button>
              </Stack>

              <Collapse in={isFinancialTrendOpen} timeout='auto' unmountOnExit>
                <Box sx={{ height: 340, mt: 3 }}>
                  {data?.limitedTechnicalView ? (
                    <Alert severity='info'>
                      Esta tendencia contiene valores comerciales y no está disponible
                      para la vista técnica limitada.
                    </Alert>
                  ) : (data?.financialTrend ?? []).length ? (
                    <ResponsiveContainer width='100%' height='100%'>
                      <LineChart
                        data={data?.financialTrend ?? []}
                        margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray='3 3' stroke={ui.border} />
                        <XAxis
                          dataKey='monthLabel'
                          tick={{ fill: ui.muted, fontSize: 12 }}
                          axisLine={{ stroke: ui.border }}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(value) => formatCompactCurrency(Number(value))}
                          tick={{ fill: ui.muted, fontSize: 12 }}
                          axisLine={{ stroke: ui.border }}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value, name) => [
                            formatCurrency(Number(value)),
                            String(name)
                          ]}
                          labelFormatter={(label) => `Mes: ${label}`}
                        />
                        <Legend />
                        <Line
                          type='monotone'
                          dataKey='quotedValue'
                          name='Cotizado total'
                          stroke={ui.green}
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type='monotone'
                          dataKey='approvedQuotedValue'
                          name='Cotizado aprobado'
                          stroke={ui.info}
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type='monotone'
                          dataKey='approvedAdjustmentValue'
                          name='Novedades aprobadas'
                          stroke={ui.warning}
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                        <Line
                          type='monotone'
                          dataKey='invoicedValue'
                          name='Facturado'
                          stroke={ui.error}
                          strokeWidth={2.5}
                          dot={{ r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Alert severity='info'>
                      No hay datos financieros mensuales para los filtros actuales.
                    </Alert>
                  )}
                </Box>
              </Collapse>
            </CardContent>
          </Card>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={5}>
              <Card elevation={0} sx={{ ...cardSx, height: '100%' }}>
                <CardContent>
                  <Typography variant='h6' sx={{ fontWeight: 700 }}>
                    Semáforo SLA
                  </Typography>
                  <Typography variant='body2' sx={{ color: ui.muted, mb: 2 }}>
                    Cómo va cada servicio frente a su plazo.
                  </Typography>
                  <Box sx={{ display: 'flex', height: 16, borderRadius: 999, overflow: 'hidden', mb: 2.5 }} role='img' aria-label='Reparto de servicios por estado del semáforo'>
                    {slaSegments.map((segment) => (
                      <Box key={segment.value} title={`${segment.label}: ${segment.count}`} sx={{ width: `${percentOfTotal(segment.count)}%`, backgroundColor: segment.color }} />
                    ))}
                  </Box>
                  <Stack spacing={1.25}>
                    {slaSegments.map((segment) => (
                      <Stack key={segment.value} direction='row' alignItems='center' spacing={1.5}>
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: segment.color, flexShrink: 0 }} />
                        <Typography variant='body2' sx={{ flexGrow: 1 }}>
                          {segment.label}
                        </Typography>
                        <Typography variant='body2' sx={{ fontWeight: 700 }}>
                          {numberFormatter.format(segment.count)}
                        </Typography>
                        <Typography variant='body2' sx={{ color: ui.muted, minWidth: 44, textAlign: 'right' }}>
                          {percentOfTotal(segment.count)}%
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={7}>
              <Card elevation={0} sx={{ ...cardSx, height: '100%' }}>
                <CardContent>
                  <Typography variant='h6' sx={{ fontWeight: 700 }}>
                    Embudo operativo
                  </Typography>
                  <Typography variant='body2' sx={{ color: ui.muted, mb: 2 }}>
                    Cuántos servicios hay en cada etapa.
                  </Typography>
                  <Stack spacing={1.2}>
                    {(data?.funnel ?? []).map((item) => (
                      <Grid container spacing={1} alignItems='center' key={item.phase}>
                        <Grid item xs={12} md={4}>
                          <Typography variant='body2' sx={{ fontWeight: 700 }}>
                            {phaseLabels[item.phase] || item.phase}
                          </Typography>
                        </Grid>
                        <Grid item xs={9} md={7}>
                          <LinearProgress
                            variant='determinate'
                            value={(item.count / maxFunnelValue) * 100}
                            sx={{
                              height: 10,
                              borderRadius: 999,
                              backgroundColor: '#E0F7F4',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#00BFA5'
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={3} md={1}>
                          <Typography variant='body2' sx={{ textAlign: 'right' }}>
                            {item.count}
                          </Typography>
                        </Grid>
                      </Grid>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ ...cardSx, height: '100%' }}>
                <CardContent>
                  <Typography variant='h6' sx={{ fontWeight: 700 }}>
                    Carga por metrólogo
                  </Typography>
                  <Typography variant='body2' sx={{ color: ui.muted, mb: 2 }}>
                    Servicios por persona. En ámbar, los que aún no tienen a quién asignarse.
                  </Typography>
                  <Stack spacing={1.75}>
                    {(data?.metrologists ?? []).slice(0, 8).map((metrologist) => {
                      const unassigned = isUnassigned(metrologist.metrologistName)
                      const barColor = unassigned ? '#f59e0b' : '#00BFA5'
                      return (
                        <Box key={metrologist.key}>
                          <Stack direction='row' justifyContent='space-between' mb={0.5}>
                            <Typography variant='body2' sx={{ fontWeight: 600, color: unassigned ? '#b45309' : ui.text }}>
                              {metrologist.metrologistName}
                            </Typography>
                            <Typography variant='body2' sx={{ fontWeight: 700 }}>
                              {metrologist.total}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant='determinate'
                            value={(metrologist.total / maxMetrologistValue) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 999,
                              backgroundColor: unassigned ? '#fff7ed' : '#E0F7F4',
                              '& .MuiLinearProgress-bar': { borderRadius: 999, backgroundColor: barColor }
                            }}
                          />
                          <Typography variant='caption' sx={{ color: ui.muted }}>
                            {metrologist.inExecution} en ejecución, {metrologist.warningOrOverdue} con SLA en alerta o vencido, {metrologist.pendingClosure} por cerrar
                          </Typography>
                        </Box>
                      )
                    })}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ ...cardSx, height: '100%' }}>
                <CardContent>
                  <Typography variant='h6' sx={{ fontWeight: 700 }}>
                    Pendientes administrativos
                  </Typography>
                  <Typography variant='body2' sx={{ color: ui.muted, mb: 2 }}>
                    Cortes y documentos que esperan una acción.
                  </Typography>
                  <Grid container spacing={1.5}>
                    {[
                      { label: 'Cortes en borrador', value: data?.cuts.draft ?? 0, hint: 'Falta enviarlos' },
                      { label: 'Listos para facturar', value: data?.cuts.ready_for_invoicing ?? 0, hint: 'Pueden pasar a facturación' },
                      { label: 'Documentos pendientes', value: data?.cuts.document_pending ?? 0, hint: 'Falta control documental' },
                      { label: 'Listos para cierre', value: data?.cuts.final_close_ready ?? 0, hint: 'Se pueden cerrar' }
                    ].map((item) => (
                      <Grid item xs={6} key={item.label}>
                        <Paper variant='outlined' sx={{ p: 2, borderRadius: '12px', borderColor: ui.border }}>
                          <Typography variant='h5' sx={{ fontWeight: 700, color: item.value > 0 ? ui.text : ui.muted }}>
                            {item.value}
                          </Typography>
                          <Typography variant='body2' sx={{ fontWeight: 600 }}>
                            {item.label}
                          </Typography>
                          <Typography variant='caption' sx={{ color: ui.muted }}>
                            {item.hint}
                          </Typography>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card elevation={0} sx={cardSx}>
            <CardContent>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                justifyContent='space-between'
                spacing={1}
                mb={2}
              >
                <Box>
                  <Typography variant='h6' sx={{ fontWeight: 800 }}>
                    Servicios para seguimiento
                  </Typography>
                  <Typography variant='body2' sx={{ color: ui.muted }}>
                    Última actualización: {formatDate(data?.generatedAt)}
                  </Typography>
                </Box>
                <Chip
                  label={`${data?.tableTotalItems ?? 0} servicios`}
                  color='success'
                  variant='outlined'
                />
              </Stack>
              <MaterialReactTable
                columns={analyticsTableColumns}
                data={data?.tableRows ?? []}
                localization={MRT_Localization_ES}
                enableColumnActions={false}
                enableColumnFilters={false}
                enableDensityToggle={false}
                enableFullScreenToggle={false}
                enableGlobalFilter={false}
                enableHiding={false}
                enablePagination
                enableSorting={false}
                manualPagination
                rowCount={data?.tableTotalItems ?? 0}
                onPaginationChange={setTablePagination}
                state={{
                  isLoading: isFetching,
                  pagination: tablePagination
                }}
                initialState={{
                  density: 'comfortable'
                }}
                muiTablePaperProps={{
                  elevation: 0,
                  sx: {
                    border: `1px solid ${ui.border}`,
                    borderRadius: '14px',
                    overflow: 'hidden'
                  }
                }}
                muiTableHeadCellProps={{
                  sx: {
                    backgroundColor: ui.surface,
                    color: ui.text,
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '.04em'
                  }
                }}
                muiTableBodyCellProps={{
                  sx: {
                    borderColor: ui.border,
                    color: ui.text
                  }
                }}
                muiTablePaginationProps={{
                  rowsPerPageOptions: [10, 20, 50, 100]
                }}
              />
            </CardContent>
          </Card>
        </>
      )}
    </Container>
  )
}

export default CalibrationServiceAnalyticsPage
