import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import {
  AssessmentOutlined,
  AttachMoneyOutlined,
  GroupsOutlined,
  HourglassTopOutlined,
  PaymentsOutlined,
  TrendingUpOutlined,
  GridOnOutlined,
  HistoryOutlined,
  PercentOutlined,
  PictureAsPdfOutlined,
  ReceiptLongOutlined,
  RefreshOutlined,
  ScheduleOutlined,
  SendOutlined,
  SentimentSatisfiedOutlined,
  SettingsOutlined,
  WarningAmberOutlined
} from '@mui/icons-material'
import LmsPageHeader from 'src/Components/lms/admin/LmsPageHeader'
import LmsStatCard, {
  type LmsStatTone
} from 'src/Components/lms/admin/LmsStatCard'
import SignalLoader from 'src/Components/Common/SignalLoader'
import CollapsibleSection from 'src/Components/managementReport/CollapsibleSection'
import DataConfidenceStrip from 'src/Components/managementReport/DataConfidenceStrip'
import ActionListsSection from 'src/Components/managementReport/ActionListsSection'
import TeamSection from 'src/Components/managementReport/TeamSection'
import TrendSection from 'src/Components/managementReport/TrendSection'
import LossReasonsSection from 'src/Components/managementReport/LossReasonsSection'
import DataTable from 'src/Components/Common/DataTable'
import { type MRT_ColumnDef } from 'material-react-table'
import { userStore } from 'src/store/userStore'
import { hasPermission, PERMISSIONS } from 'src/constants/permissions'
import { brand, intent, neutral } from 'src/theme/designTokens'
import {
  downloadManagementReport,
  downloadStoredManagementReport,
  saveManagementReportConfig,
  sendManagementReport,
  useManagementReport,
  useManagementReportConfig,
  useManagementReportHistory
} from 'src/hooks/useManagementReport'
import type {
  ManagementReportBlock,
  ManagementReportLossBlock,
  ManagementReportMetric,
  ManagementReportStatus,
  StoredManagementReport
} from 'src/types/managementReport'
import { getApiErrorMessage } from 'src/utils/apiError'
import { notify } from 'src/utils/notify'

const STATUS_TONE: Record<ManagementReportStatus, LmsStatTone> = {
  green: 'green',
  yellow: 'orange',
  red: 'red',
  gray: 'gray',
  registry: 'gray'
}

const STATUS_LABEL: Record<ManagementReportStatus, string> = {
  green: 'Bien',
  yellow: 'Atención',
  red: 'Alerta',
  gray: 'Sin dato',
  registry: 'Depende del registro'
}

const STATUS_COLOR: Record<ManagementReportStatus, string> = {
  green: intent.successInk,
  yellow: intent.warningInk,
  red: intent.dangerInk,
  gray: neutral.textMuted,
  registry: neutral.textMuted
}

const STATUS_CHIP: Record<
  ManagementReportStatus,
  'success' | 'warning' | 'error' | 'default'
> = {
  green: 'success',
  yellow: 'warning',
  red: 'error',
  gray: 'default',
  registry: 'default'
}

// Metas: el texto de la pantalla (con o sin puntos) y el número que se guarda
const goalToText = (value?: number | string | null) =>
  value === null || value === undefined ? '' : String(value)

const textToGoal = (text: string, money = true): string | null => {
  const clean = text.replace(money ? /[s$.]/g : /[s%]/g, '')
  return clean || null
}

const previousMonthKey = () => {
  const now = new Date()
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(
    2,
    '0'
  )}`
}

const formatDateTime = (value: string | null) =>
  value ? new Date(value).toLocaleString('es-CO') : 'No enviado'

const coverIcon = (code: string) => {
  if (code === 'C2') return <AttachMoneyOutlined />
  if (code === 'C12') return <TrendingUpOutlined />
  if (code === 'C6') return <ReceiptLongOutlined />
  if (code === 'C11') return <PercentOutlined />
  if (code === 'C8') return <PaymentsOutlined />
  if (code === 'C14') return <HourglassTopOutlined />
  if (code === 'O4') return <ScheduleOutlined />
  if (code === 'Q1') return <WarningAmberOutlined />
  if (code === 'Q7') return <GroupsOutlined />
  return <SentimentSatisfiedOutlined />
}

// "-12 % vs mes anterior" o, si no hay con qué comparar, "sin comparación"
const changeText = (item: {
  variationDisplay: string
  comparison?: string
  status?: ManagementReportStatus
}) =>
  item.status === 'registry'
    ? 'Depende del registro'
    : item.variationDisplay === 'Sin dato' || item.variationDisplay === '—'
      ? 'sin comparación'
      : `${item.variationDisplay} vs ${item.comparison || 'mes anterior'}`

// Con valor pero sin con qué compararlo: la celda queda vacía (un guion)
const hasComparison = (metric: ManagementReportMetric) =>
  metric.status !== 'registry' &&
  !(
    metric.value !== null &&
    (metric.variationDisplay === 'Sin dato' || metric.variationDisplay === '—')
  )

// Lectura del indicador; en las cotizaciones en espera suma lo esperable
const millionsText = (value: number) =>
  `${(value / 1_000_000).toLocaleString('es-CO', { maximumFractionDigits: 0 })} M`

const metricNote = (metric: ManagementReportMetric) => {
  const detail = metric.detail as
    | { expectedValue?: number | null; winRate?: number | null }
    | undefined
  if (
    metric.code === 'C16' &&
    metric.value !== null &&
    typeof detail?.expectedValue === 'number'
  ) {
    const rate = Math.round((detail.winRate ?? 0) * 100)
    return `${metric.note} De ${millionsText(metric.value)} en espera, lo esperable es ${millionsText(detail.expectedValue)}: en los últimos 12 meses se ganó el ${rate} % de lo que se decidió.`
  }
  return metric.note
}

// Resumen de una línea de un bloque, para su cabecera plegada
const lossSummary = (loss: ManagementReportLossBlock) =>
  loss.total === 0
    ? 'No hubo cotizaciones perdidas este mes'
    : `${loss.total} cotizaciones perdidas este mes`

const blockSummary = (block: ManagementReportBlock) => {
  const alerts = block.metrics.filter((metric) => metric.status === 'red')
  const watch = block.metrics.filter((metric) => metric.status === 'yellow')
  const parts = [
    `${block.metrics.length} indicadores`,
    ...(alerts.length ? [`${alerts.length} en alerta`] : []),
    ...(watch.length ? [`${watch.length} en atención`] : [])
  ]
  return parts.join(' · ')
}

// En gris puede faltar el dato o solo la comparación: no son lo mismo
const statusLabel = (metric: ManagementReportMetric) =>
  metric.status === 'gray' && metric.value !== null
    ? 'Sin comparación'
    : STATUS_LABEL[metric.status]

// Tablas cortas dentro de una tarjeta: sin sombra propia ni scroll interno
const INLINE_TABLE = {
  enableStickyHeader: false,
  muiTableContainerProps: { sx: { maxHeight: 'none' } },
  muiTablePaperProps: {
    elevation: 0,
    sx: {
      borderRadius: '12px',
      border: `1px solid ${neutral.border}`,
      overflow: 'hidden'
    }
  }
} as const

const METRIC_COLUMNS: MRT_ColumnDef<ManagementReportMetric>[] = [
  {
    accessorKey: 'label',
    header: 'Indicador',
    muiTableBodyCellProps: { sx: { fontWeight: 600 } }
  },
  {
    accessorKey: 'display',
    header: 'Valor',
    muiTableHeadCellProps: { align: 'right' },
    muiTableBodyCellProps: ({ row }) => ({
      align: 'right',
      sx: {
        fontWeight: 700,
        color: STATUS_COLOR[row.original.status],
        whiteSpace: 'nowrap'
      }
    })
  },
  {
    accessorKey: 'variationDisplay',
    header: 'Cambio',
    Cell: ({ row }) =>
      hasComparison(row.original) ? changeText(row.original) : '—',
    muiTableHeadCellProps: { align: 'right' },
    muiTableBodyCellProps: { align: 'right', sx: { whiteSpace: 'nowrap' } }
  },
  {
    accessorKey: 'note',
    header: 'Lectura',
    Cell: ({ row }) => metricNote(row.original),
    muiTableBodyCellProps: { sx: { color: neutral.textMuted } }
  },
  {
    accessorKey: 'status',
    header: 'Estado',
    muiTableHeadCellProps: { align: 'center' },
    muiTableBodyCellProps: { align: 'center' },
    Cell: ({ row }) =>
      hasComparison(row.original) ||
      row.original.value === null ||
      row.original.status === 'registry' ? (
        <Chip
          size='small'
          variant='outlined'
          label={statusLabel(row.original)}
          color={STATUS_CHIP[row.original.status]}
        />
      ) : (
        '—'
      )
  }
]

const ManagementReportPage = () => {
  const $userStore = useStore(userStore)
  const canSeeAmounts = hasPermission(
    $userStore.permissions,
    PERMISSIONS.REPORTS_MANAGEMENT_FINANCIAL
  )
  const [month, setMonth] = useState(previousMonthKey())
  const [profile, setProfile] = useState<'full' | 'no_amounts'>(
    canSeeAmounts ? 'full' : 'no_amounts'
  )
  const [downloading, setDownloading] = useState<'pdf' | 'xlsx' | null>(null)
  const [sending, setSending] = useState(false)
  const [recipientsFull, setRecipientsFull] = useState('')
  const [recipientsNoAmounts, setRecipientsNoAmounts] = useState('')
  const [whatsappPhone, setWhatsappPhone] = useState('')
  const [includeLms, setIncludeLms] = useState(false)
  const [goalSales, setGoalSales] = useState('')
  const [goalBilled, setGoalBilled] = useState('')
  const [goalWinRate, setGoalWinRate] = useState('')
  const [savingConfig, setSavingConfig] = useState(false)

  useEffect(() => {
    if (!canSeeAmounts) setProfile('no_amounts')
  }, [canSeeAmounts])

  const {
    data: report,
    isLoading,
    isError,
    error,
    refetch,
    isFetching
  } = useManagementReport({ month, profile, enabled: Boolean(month) })
  const { data: history = [] } = useManagementReportHistory(true)
  const { data: config } = useManagementReportConfig(canSeeAmounts)

  useEffect(() => {
    if (!config) return
    setRecipientsFull(config.recipients.full.join(', '))
    setRecipientsNoAmounts(config.recipients.no_amounts.join(', '))
    setWhatsappPhone(config.whatsappPhone || '')
    setIncludeLms(Boolean(config.includeLms))
    setGoalSales(goalToText(config.goals?.approvedSales))
    setGoalBilled(goalToText(config.goals?.billed))
    setGoalWinRate(goalToText(config.goals?.winRate))
  }, [config])

  const visibleHistory = useMemo(
    () =>
      history.filter((row) => canSeeAmounts || row.profile === 'no_amounts'),
    [history, canSeeAmounts]
  )

  const handleDownload = async (format: 'pdf' | 'xlsx') => {
    try {
      setDownloading(format)
      await downloadManagementReport({ month, profile, format })
    } catch (downloadError) {
      notify.error(
        getApiErrorMessage(downloadError, 'No se pudo descargar el reporte')
      )
    } finally {
      setDownloading(null)
    }
  }

  const handleSend = async () => {
    try {
      setSending(true)
      const result = await sendManagementReport({ month, profile })
      if (result?.sent) {
        notify.success(
          `Reporte enviado a ${result.recipients?.length || 0} destinatarios`
        )
      } else {
        notify.warning(
          'El reporte se guardó, pero no hay destinatarios configurados'
        )
      }
    } catch (sendError) {
      notify.error(
        getApiErrorMessage(sendError, 'No se pudo enviar el reporte')
      )
    } finally {
      setSending(false)
    }
  }

  const parseEmails = (value: string) =>
    value
      .split(/[,;]/)
      .map((item) => item.trim())
      .filter(Boolean)

  const handleSaveConfig = async () => {
    try {
      setSavingConfig(true)
      const saved = await saveManagementReportConfig({
        recipients: {
          full: parseEmails(recipientsFull),
          no_amounts: parseEmails(recipientsNoAmounts)
        },
        whatsappPhone: whatsappPhone.trim(),
        includeLms,
        goals: {
          approvedSales: textToGoal(goalSales),
          billed: textToGoal(goalBilled),
          winRate: textToGoal(goalWinRate, false)
        }
      })
      setRecipientsFull(saved.recipients.full.join(', '))
      setRecipientsNoAmounts(saved.recipients.no_amounts.join(', '))
      setWhatsappPhone(saved.whatsappPhone || '')
      setIncludeLms(Boolean(saved.includeLms))
      setGoalSales(goalToText(saved.goals?.approvedSales))
      setGoalBilled(goalToText(saved.goals?.billed))
      setGoalWinRate(goalToText(saved.goals?.winRate))
      notify.success('Configuración guardada')
      refetch()
    } catch (configError) {
      notify.error(
        getApiErrorMessage(
          configError,
          'No se pudo guardar la configuración de envío'
        )
      )
    } finally {
      setSavingConfig(false)
    }
  }

  const handleHistoryDownload = async (
    period: string,
    rowProfile: 'full' | 'no_amounts',
    format: 'pdf' | 'xlsx'
  ) => {
    try {
      await downloadStoredManagementReport({
        period,
        profile: rowProfile,
        format
      })
    } catch (downloadError) {
      notify.error(
        getApiErrorMessage(downloadError, 'No se pudo descargar el reporte')
      )
    }
  }

  const historyColumns = useMemo<MRT_ColumnDef<StoredManagementReport>[]>(
    () => [
      { accessorKey: 'period', header: 'Periodo' },
      {
        accessorKey: 'profile',
        header: 'Versión',
        Cell: ({ row }) =>
          row.original.profile === 'full' ? 'Con valores' : 'Sin valores'
      },
      {
        accessorKey: 'sentAt',
        header: 'Envío',
        Cell: ({ row }) => formatDateTime(row.original.sentAt)
      },
      {
        id: 'download',
        header: 'Descargar',
        enableSorting: false,
        muiTableHeadCellProps: { align: 'right' },
        muiTableBodyCellProps: { align: 'right' },
        Cell: ({ row }) => (
          <>
            <Button
              size='small'
              startIcon={<PictureAsPdfOutlined />}
              onClick={() =>
                handleHistoryDownload(
                  row.original.period,
                  row.original.profile,
                  'pdf'
                )
              }
              sx={{ textTransform: 'none' }}
            >
              PDF
            </Button>
            <Button
              size='small'
              startIcon={<GridOnOutlined />}
              onClick={() =>
                handleHistoryDownload(
                  row.original.period,
                  row.original.profile,
                  'xlsx'
                )
              }
              sx={{ textTransform: 'none' }}
            >
              Excel
            </Button>
          </>
        )
      }
    ],
    []
  )

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <LmsPageHeader
        title='Reporte gerencial'
        subtitle='Los números del mes para decidir, no para archivar'
        icon={<AssessmentOutlined />}
        actions={
          <Button
            variant='outlined'
            startIcon={<RefreshOutlined />}
            onClick={() => refetch()}
            disabled={isFetching}
            sx={{ textTransform: 'none' }}
          >
            Actualizar
          </Button>
        }
      />

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: `1px solid ${neutral.border}`,
          borderRadius: 3
        }}
      >
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          alignItems={{ xs: 'stretch', md: 'center' }}
        >
          <TextField
            type='month'
            label='Mes'
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            size='small'
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 180 }}
          />

          {canSeeAmounts ? (
            <ToggleButtonGroup
              exclusive
              size='small'
              value={profile}
              onChange={(_event, next) => next && setProfile(next)}
              aria-label='Versión del reporte'
            >
              <ToggleButton value='full'>Con valores</ToggleButton>
              <ToggleButton value='no_amounts'>Sin valores</ToggleButton>
            </ToggleButtonGroup>
          ) : (
            <Chip label='Versión sin valores' variant='outlined' size='small' />
          )}

          <Box sx={{ flexGrow: 1 }} />

          <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
            <Button
              variant='contained'
              startIcon={
                downloading === 'pdf' ? (
                  <CircularProgress size={16} color='inherit' />
                ) : (
                  <PictureAsPdfOutlined />
                )
              }
              onClick={() => handleDownload('pdf')}
              disabled={Boolean(downloading) || isLoading}
              sx={{
                bgcolor: brand.main,
                textTransform: 'none',
                '&:hover': { bgcolor: brand.hover }
              }}
            >
              PDF
            </Button>
            <Button
              variant='outlined'
              startIcon={
                downloading === 'xlsx' ? (
                  <CircularProgress size={16} />
                ) : (
                  <GridOnOutlined />
                )
              }
              onClick={() => handleDownload('xlsx')}
              disabled={Boolean(downloading) || isLoading}
              sx={{ textTransform: 'none' }}
            >
              Excel
            </Button>
            <Button
              variant='outlined'
              startIcon={
                sending ? <CircularProgress size={16} /> : <SendOutlined />
              }
              onClick={handleSend}
              disabled={sending || isLoading}
              sx={{ textTransform: 'none' }}
            >
              Enviar por correo
            </Button>
          </Stack>
        </Stack>
      </Paper>

      {isLoading ? (
        <SignalLoader />
      ) : isError ? (
        <Alert severity='error'>
          {getApiErrorMessage(error, 'No se pudo cargar el reporte gerencial')}
        </Alert>
      ) : report ? (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {report.cover.map((item) => (
              <Grid item xs={12} sm={6} md={3} key={item.code}>
                <LmsStatCard
                  label={item.label}
                  value={item.display}
                  icon={coverIcon(item.code)}
                  tone={STATUS_TONE[item.status]}
                  caption={
                    item.goal
                      ? `${Math.round(item.goal.progress * 100)} % de la meta`
                      : changeText(item)
                  }
                  compact
                />
              </Grid>
            ))}
          </Grid>

          {report.dataConfidence && (
            <DataConfidenceStrip confidence={report.dataConfidence} />
          )}

          {report.alerts.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                border: `1px solid ${neutral.border}`,
                borderRadius: 3
              }}
            >
              <Stack direction='row' spacing={1} alignItems='center' mb={1}>
                <AssessmentOutlined sx={{ color: brand.ink }} />
                <Typography variant='h6'>Decisiones de este mes</Typography>
              </Stack>
              <Stack spacing={1}>
                {report.alerts.map((alert) => (
                  <Alert
                    key={`${alert.title}-${alert.detail}`}
                    severity={alert.severity === 'red' ? 'error' : 'warning'}
                  >
                    <Typography fontWeight={700}>{alert.title}</Typography>
                    <Typography variant='body2'>{alert.detail}</Typography>
                    <Typography variant='caption' color='text.secondary'>
                      Responsable: {alert.owner} · {alert.action}
                    </Typography>
                  </Alert>
                ))}
              </Stack>
            </Paper>
          )}

          {report.actionLists && (
            <ActionListsSection
              lists={report.actionLists}
              onDownloadExcel={() => handleDownload('xlsx')}
            />
          )}

          {report.trend && (
            <TrendSection
              series={report.trend.series}
              goals={report.trend.goals}
            />
          )}

          {Object.values(report.blocks).map((block) => (
            <CollapsibleSection
              key={block.key}
              id={`block-${block.key}`}
              title={block.title}
              summary={blockSummary(block)}
            >
              <Typography variant='body2' color='text.secondary' mb={1}>
                {block.question}
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <DataTable
                  columns={METRIC_COLUMNS}
                  data={block.metrics}
                  {...INLINE_TABLE}
                  enableTopToolbar={false}
                  enableBottomToolbar={false}
                  enablePagination={false}
                  enableSorting={false}
                  enableGlobalFilter={false}
                  enableColumnFilters={false}
                  getRowId={(metric) => metric.code}
                />
              </Box>
              {block.action && (
                <Alert severity='info' sx={{ mt: 1 }}>
                  {block.action}
                </Alert>
              )}
            </CollapsibleSection>
          ))}

          {report.lossReasons && (
            <CollapsibleSection
              id='loss-reasons'
              title='¿Por qué se pierde?'
              summary={lossSummary(report.lossReasons.month)}
            >
              <LossReasonsSection
                loss={report.lossReasons}
                periodLabel={report.meta.periodLabel}
              />
            </CollapsibleSection>
          )}

          {report.team && (
            <CollapsibleSection
              id='team'
              title='Equipo'
              summary='Cotizaciones, certificados, mantenimiento y compras por persona'
            >
              <TeamSection
                team={report.team}
                periodLabel={report.meta.periodLabel}
              />
            </CollapsibleSection>
          )}

          {report.noData && report.noData.length > 0 && (
            <CollapsibleSection
              id='no-data'
              title='Sin información suficiente'
              summary={`${report.noData.length} indicadores sin datos este mes`}
            >
              <Typography variant='body2'>
                {report.noData.map((item) => item.label).join(' · ')}. Mientras
                no se registren estos datos, el reporte no los muestra.
              </Typography>
            </CollapsibleSection>
          )}

          {canSeeAmounts && (
            <CollapsibleSection
              id='recipients'
              title='Destinatarios, metas y envío automático'
              summary='Correos, WhatsApp, metas y bloque de capacitación'
              icon={<SettingsOutlined />}
            >
              <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                El reporte se genera el día 3 de cada mes a las 07:00. Si no hay
                destinatarios ni WhatsApp configurados, se guarda sin enviar.
              </Typography>
              <Stack spacing={2}>
                <TextField
                  label='Gerencia (con valores)'
                  value={recipientsFull}
                  onChange={(event) => setRecipientsFull(event.target.value)}
                  helperText='Separe varios correos con coma'
                  size='small'
                  fullWidth
                />
                <TextField
                  label='Coordinación (sin valores)'
                  value={recipientsNoAmounts}
                  onChange={(event) =>
                    setRecipientsNoAmounts(event.target.value)
                  }
                  helperText='Separe varios correos con coma'
                  size='small'
                  fullWidth
                />
                <TextField
                  label='WhatsApp de gerencia (un solo número)'
                  value={whatsappPhone}
                  onChange={(event) => setWhatsappPhone(event.target.value)}
                  helperText='Recibe el PDF con valores. Un solo número, por ejemplo 318 185 9446. Déjelo vacío para no enviar por WhatsApp.'
                  inputProps={{ inputMode: 'tel' }}
                  size='small'
                  fullWidth
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeLms}
                      onChange={(event) => setIncludeLms(event.target.checked)}
                    />
                  }
                  label='Incluir bloque de capacitación (LMS)'
                />
                <Box>
                  <Button
                    variant='contained'
                    onClick={handleSaveConfig}
                    disabled={savingConfig}
                    sx={{
                      bgcolor: brand.main,
                      textTransform: 'none',
                      '&:hover': { bgcolor: brand.hover }
                    }}
                  >
                    {savingConfig ? 'Guardando…' : 'Guardar configuración'}
                  </Button>
                </Box>
              </Stack>
            </CollapsibleSection>
          )}

          <CollapsibleSection
            id='history'
            title='Historial'
            summary={`${visibleHistory.length} reportes guardados`}
            icon={<HistoryOutlined />}
          >
            <Box sx={{ overflowX: 'auto' }}>
              {visibleHistory.length === 0 ? (
                <Typography variant='body2' color='text.secondary'>
                  Todavía no hay reportes guardados.
                </Typography>
              ) : (
                <DataTable
                  columns={historyColumns}
                  data={visibleHistory}
                  {...INLINE_TABLE}
                  enableTopToolbar={false}
                  enablePagination={visibleHistory.length > 10}
                  enableGlobalFilter={false}
                  enableColumnFilters={false}
                  getRowId={(row) => String(row.id)}
                />
              )}
            </Box>
          </CollapsibleSection>
        </>
      ) : null}
    </Container>
  )
}

export default ManagementReportPage
