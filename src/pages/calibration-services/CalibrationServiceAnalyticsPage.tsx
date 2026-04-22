import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'
import EngineeringOutlinedIcon from '@mui/icons-material/EngineeringOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { alpha } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { useQuery } from 'react-query'
import { axiosPrivate } from '@utils/api'
import {
  CALIBRATION_SERVICE_SLA_COLORS,
  CALIBRATION_SERVICE_STATUS_COLORS,
  CALIBRATION_SERVICE_STATUS_LABELS
} from '../../constants/calibrationServices'
import {
  useCalibrationAssignableMetrologists,
  useCalibrationServiceAnalytics
} from '../../hooks/useCalibrationServices'
import {
  CalibrationServiceAnalyticsFilters,
  CalibrationServiceCustomer,
  CalibrationServiceSlaIndicatorColor,
  CalibrationServiceStatus,
  CalibrationServiceUserSummary
} from '../../types/calibrationService'

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
  { value: 'ods_issued', label: 'ODS emitida' },
  { value: 'pending_programming', label: 'Pendiente de programación' },
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

interface CalibrationCustomersResponse {
  customers: CalibrationServiceCustomer[]
}

const KpiCard = ({
  color = ui.green,
  icon,
  label,
  value
}: {
  color?: string
  icon: ReactNode
  label: string
  value: string | number
}) => (
  <Card elevation={0} sx={{ ...cardSx, height: '100%' }}>
    <CardContent sx={{ p: 2.5 }}>
      <Stack direction='row' justifyContent='space-between' spacing={2}>
        <Box>
          <Typography
            variant='caption'
            sx={{ color: ui.muted, fontWeight: 800, letterSpacing: '.08em' }}
          >
            {label.toUpperCase()}
          </Typography>
          <Typography variant='h4' sx={{ mt: 1, color: ui.text, fontWeight: 800 }}>
            {value}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '12px',
            display: 'grid',
            placeItems: 'center',
            color,
            backgroundColor: alpha(color, 0.1)
          }}
        >
          {icon}
        </Box>
      </Stack>
    </CardContent>
  </Card>
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

  const { data: customerData } = useQuery({
    queryKey: ['calibration-service-analytics-customers'],
    queryFn: async () => {
      const response = await axiosPrivate.get<CalibrationCustomersResponse>(
        '/customers',
        {
          params: {
            scope: 'calibration',
            page: 1,
            limit: 100
          }
        }
      )
      return response.data
    },
    staleTime: 5 * 60 * 1000
  })
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

  const { data, isFetching, isLoading, refetch } =
    useCalibrationServiceAnalytics(filters)

  const totalServices = data?.summary.totalServices ?? 0
  const warningOrOverdue =
    (data?.slaCounts.yellow ?? 0) + (data?.slaCounts.red ?? 0)
  const maxFunnelValue = Math.max(
    1,
    ...(data?.funnel ?? []).map((item) => item.count)
  )
  const maxMetrologistValue = Math.max(
    1,
    ...(data?.metrologists ?? []).map((item) => item.total)
  )

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: ui.surface, minHeight: '100%' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        justifyContent='space-between'
        alignItems={{ xs: 'flex-start', md: 'center' }}
        spacing={2}
        mb={3}
      >
        <Box>
          <Button
            variant='text'
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => navigate('/calibration-services')}
            sx={{ color: ui.greenDark, textTransform: 'none', fontWeight: 700, mb: 1 }}
          >
            Volver a la bandeja
          </Button>
          <Typography variant='h4' sx={{ color: ui.text, fontWeight: 800 }}>
            Analíticas de calibración
          </Typography>
          <Typography variant='body2' sx={{ mt: 1, color: ui.muted, maxWidth: 820 }}>
            Vista gerencial para seguimiento de SLA, embudo operativo,
            novedades, cortes, facturación y carga por metrólogo.
          </Typography>
        </Box>
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
      </Stack>

      {data?.limitedTechnicalView ? (
        <Alert severity='info' sx={{ mb: 3 }}>
          Estás viendo una analítica técnica limitada a los servicios asignados a
          tu usuario. Los valores comerciales se ocultan.
        </Alert>
      ) : null}

      <Card elevation={0} sx={{ ...cardSx, mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2}>
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
              <TextField
                fullWidth
                select
                label='Con novedades'
                value={hasAdjustments}
                onChange={(event) => setHasAdjustments(event.target.value)}
              >
                {yesNoOptions.map((option) => (
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
                label='Con cortes'
                value={hasCuts}
                onChange={(event) => setHasCuts(event.target.value)}
              >
                {yesNoOptions.map((option) => (
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
                label='Con factura'
                value={hasInvoice}
                onChange={(event) => setHasInvoice(event.target.value)}
              >
                {yesNoOptions.map((option) => (
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
                label='Doc. pendiente'
                value={hasPendingDocumentControl}
                onChange={(event) =>
                  setHasPendingDocumentControl(event.target.value)
                }
              >
                {yesNoOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
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
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={3}>
              <KpiCard
                label='Servicios'
                value={numberFormatter.format(totalServices)}
                icon={<AnalyticsOutlinedIcon />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <KpiCard
                color={ui.info}
                label='Activos'
                value={numberFormatter.format(data?.summary.activeServices ?? 0)}
                icon={<TimelineOutlinedIcon />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <KpiCard
                color={warningOrOverdue > 0 ? ui.warning : ui.green}
                label='Alertas SLA'
                value={numberFormatter.format(warningOrOverdue)}
                icon={<WarningAmberOutlinedIcon />}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <KpiCard
                color={ui.error}
                label='Novedades'
                value={numberFormatter.format(data?.summary.servicesWithAdjustments ?? 0)}
                icon={<AssignmentTurnedInOutlinedIcon />}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={4}>
              <KpiCard
                label='Valor cotizado'
                value={formatCurrency(data?.summary.quotedValue)}
                icon={<AnalyticsOutlinedIcon />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <KpiCard
                color={ui.warning}
                label='Novedades aprobadas'
                value={formatCurrency(data?.summary.approvedAdjustmentValue)}
                icon={<AssignmentTurnedInOutlinedIcon />}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <KpiCard
                color={ui.info}
                label='Facturado'
                value={formatCurrency(data?.summary.invoicedValue)}
                icon={<TimelineOutlinedIcon />}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} md={5}>
              <Card elevation={0} sx={{ ...cardSx, height: '100%' }}>
                <CardContent>
                  <Typography variant='h6' sx={{ fontWeight: 800, mb: 2 }}>
                    Semáforo SLA
                  </Typography>
                  <Stack spacing={1.5}>
                    {slaOptions
                      .filter((option) => option.value !== FILTER_ALL)
                      .map((option) => {
                        const count =
                          data?.slaCounts[
                            option.value as CalibrationServiceSlaIndicatorColor
                          ] ?? 0
                        const percent = totalServices ? (count / totalServices) * 100 : 0
                        return (
                          <Box key={option.value}>
                            <Stack direction='row' justifyContent='space-between' mb={0.5}>
                              <Typography variant='body2' sx={{ fontWeight: 700 }}>
                                {option.label}
                              </Typography>
                              <Typography variant='body2' sx={{ color: ui.muted }}>
                                {count}
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant='determinate'
                              value={percent}
                              sx={{
                                height: 8,
                                borderRadius: 999,
                                backgroundColor: alpha(ui.muted, 0.12),
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor:
                                    option.value === 'red'
                                      ? ui.error
                                      : option.value === 'yellow'
                                        ? ui.warning
                                        : option.value === 'blue'
                                          ? ui.info
                                          : option.value === 'gray'
                                            ? ui.muted
                                            : ui.green
                                }
                              }}
                            />
                          </Box>
                        )
                      })}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={7}>
              <Card elevation={0} sx={{ ...cardSx, height: '100%' }}>
                <CardContent>
                  <Typography variant='h6' sx={{ fontWeight: 800, mb: 2 }}>
                    Embudo operativo
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
                              backgroundColor: alpha(ui.green, 0.12),
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: ui.green
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
                  <Typography variant='h6' sx={{ fontWeight: 800, mb: 2 }}>
                    Carga por metrólogo
                  </Typography>
                  <Stack spacing={1.5}>
                    {(data?.metrologists ?? []).slice(0, 8).map((metrologist) => (
                      <Box key={metrologist.key}>
                        <Stack direction='row' justifyContent='space-between' mb={0.5}>
                          <Typography variant='body2' sx={{ fontWeight: 800 }}>
                            <EngineeringOutlinedIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                            {metrologist.metrologistName}
                          </Typography>
                          <Typography variant='body2' sx={{ color: ui.muted }}>
                            {metrologist.total}
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant='determinate'
                          value={(metrologist.total / maxMetrologistValue) * 100}
                          sx={{
                            height: 8,
                            borderRadius: 999,
                            backgroundColor: alpha(ui.info, 0.12),
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: ui.info
                            }
                          }}
                        />
                        <Typography variant='caption' sx={{ color: ui.muted }}>
                          En ejecución: {metrologist.inExecution} · SLA alerta/vencido:{' '}
                          {metrologist.warningOrOverdue} · Pendiente cierre:{' '}
                          {metrologist.pendingClosure}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card elevation={0} sx={{ ...cardSx, height: '100%' }}>
                <CardContent>
                  <Typography variant='h6' sx={{ fontWeight: 800, mb: 2 }}>
                    Riesgos administrativos
                  </Typography>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6}>
                      <Paper variant='outlined' sx={{ p: 2, borderRadius: '12px' }}>
                        <Typography variant='caption' sx={{ color: ui.muted, fontWeight: 800 }}>
                          CORTES BORRADOR
                        </Typography>
                        <Typography variant='h5' sx={{ fontWeight: 800 }}>
                          {data?.cuts.draft ?? 0}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper variant='outlined' sx={{ p: 2, borderRadius: '12px' }}>
                        <Typography variant='caption' sx={{ color: ui.muted, fontWeight: 800 }}>
                          LISTOS FACTURA
                        </Typography>
                        <Typography variant='h5' sx={{ fontWeight: 800 }}>
                          {data?.cuts.ready_for_invoicing ?? 0}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper variant='outlined' sx={{ p: 2, borderRadius: '12px' }}>
                        <Typography variant='caption' sx={{ color: ui.muted, fontWeight: 800 }}>
                          DOC. PENDIENTE
                        </Typography>
                        <Typography variant='h5' sx={{ fontWeight: 800 }}>
                          {data?.cuts.document_pending ?? 0}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper variant='outlined' sx={{ p: 2, borderRadius: '12px' }}>
                        <Typography variant='caption' sx={{ color: ui.muted, fontWeight: 800 }}>
                          LISTOS CIERRE
                        </Typography>
                        <Typography variant='h5' sx={{ fontWeight: 800 }}>
                          {data?.cuts.final_close_ready ?? 0}
                        </Typography>
                      </Paper>
                    </Grid>
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
                  label={`${data?.tableRows.length ?? 0} servicios`}
                  color='success'
                  variant='outlined'
                />
              </Stack>
              <TableContainer>
                <Table size='small'>
                  <TableHead>
                    <TableRow>
                      <TableCell>Servicio</TableCell>
                      <TableCell>Cliente</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Semáforo</TableCell>
                      <TableCell>Metrólogo</TableCell>
                      <TableCell align='right'>Novedades</TableCell>
                      <TableCell align='right'>Cortes</TableCell>
                      <TableCell align='right'>Valor</TableCell>
                      <TableCell align='right'>Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(data?.tableRows ?? []).slice(0, 30).map((row) => (
                      <TableRow hover key={row.id}>
                        <TableCell>
                          <Typography variant='body2' sx={{ fontWeight: 800 }}>
                            {row.serviceCode}
                          </Typography>
                          <Typography variant='caption' sx={{ color: ui.muted }}>
                            {row.odsCode || row.quoteCode || 'Sin ODS'}
                          </Typography>
                        </TableCell>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            label={CALIBRATION_SERVICE_STATUS_LABELS[row.status]}
                            color={CALIBRATION_SERVICE_STATUS_COLORS[row.status]}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size='small'
                            label={slaLabels[row.slaColor] || row.slaLabel}
                            color={CALIBRATION_SERVICE_SLA_COLORS[row.slaColor]}
                            variant={row.slaColor === 'gray' ? 'outlined' : 'filled'}
                          />
                        </TableCell>
                        <TableCell>{row.metrologistName || 'Sin asignar'}</TableCell>
                        <TableCell align='right'>{row.adjustmentsCount}</TableCell>
                        <TableCell align='right'>
                          <Stack direction='row' justifyContent='flex-end' spacing={1}>
                            <span>{row.cutsCount}</span>
                            {row.hasPendingDocumentControl ? (
                              <WarningAmberOutlinedIcon
                                color='warning'
                                sx={{ fontSize: 16 }}
                              />
                            ) : null}
                          </Stack>
                        </TableCell>
                        <TableCell align='right'>
                          {formatCurrency(row.totalValue)}
                        </TableCell>
                        <TableCell align='right'>
                          <Button
                            size='small'
                            onClick={() => navigate(`/calibration-services/${row.id}`)}
                            sx={{ textTransform: 'none', fontWeight: 700 }}
                          >
                            Ver detalle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  )
}

export default CalibrationServiceAnalyticsPage
