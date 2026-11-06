import { useEffect, useMemo, useState } from 'react'
import { useStore } from '@nanostores/react'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography
} from '@mui/material'
import {
  AssessmentOutlined,
  AttachMoneyOutlined,
  ExpandMoreOutlined,
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
import type { ManagementReportStatus } from 'src/types/managementReport'
import { getApiErrorMessage } from 'src/utils/apiError'
import { notify } from 'src/utils/notify'

const STATUS_TONE: Record<ManagementReportStatus, LmsStatTone> = {
  green: 'green',
  yellow: 'orange',
  red: 'red',
  gray: 'teal'
}

const STATUS_LABEL: Record<ManagementReportStatus, string> = {
  green: 'Bien',
  yellow: 'Atención',
  red: 'Alerta',
  gray: 'Sin dato'
}

const STATUS_COLOR: Record<ManagementReportStatus, string> = {
  green: intent.successInk,
  yellow: intent.warningInk,
  red: intent.dangerInk,
  gray: neutral.textMuted
}

const STATUS_CHIP: Record<
  ManagementReportStatus,
  'success' | 'warning' | 'error' | 'default'
> = {
  green: 'success',
  yellow: 'warning',
  red: 'error',
  gray: 'default'
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
  if (code === 'C6/C7') return <ReceiptLongOutlined />
  if (code === 'C3') return <PercentOutlined />
  if (code === 'O4') return <ScheduleOutlined />
  if (code === 'Q1') return <WarningAmberOutlined />
  return <SentimentSatisfiedOutlined />
}

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
  const [includeLms, setIncludeLms] = useState(false)
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
    setIncludeLms(Boolean(config.includeLms))
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
        includeLms
      })
      setRecipientsFull(saved.recipients.full.join(', '))
      setRecipientsNoAmounts(saved.recipients.no_amounts.join(', '))
      setIncludeLms(Boolean(saved.includeLms))
      notify.success('Destinatarios guardados')
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
              <Grid item xs={12} sm={6} md={4} key={item.code}>
                <LmsStatCard
                  label={item.label}
                  value={item.display}
                  icon={coverIcon(item.code)}
                  tone={STATUS_TONE[item.status]}
                  caption={`vs mes anterior: ${item.variationDisplay}`}
                  compact
                />
              </Grid>
            ))}
          </Grid>

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
                <Typography variant='h6'>Alertas y decisiones</Typography>
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

          {Object.values(report.blocks).map((block) => (
            <Paper
              key={block.key}
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                border: `1px solid ${neutral.border}`,
                borderRadius: 3,
                overflowX: 'auto'
              }}
            >
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                justifyContent='space-between'
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                mb={1}
              >
                <Typography variant='h6' sx={{ color: brand.ink }}>
                  {block.title}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {block.question}
                </Typography>
              </Stack>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Indicador</TableCell>
                    <TableCell align='right'>Valor</TableCell>
                    <TableCell align='right'>vs mes anterior</TableCell>
                    <TableCell>Lectura</TableCell>
                    <TableCell align='center'>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {block.metrics.map((metric) => (
                    <TableRow key={metric.code} hover>
                      <TableCell sx={{ fontWeight: 600 }}>
                        {metric.label}
                      </TableCell>
                      <TableCell
                        align='right'
                        sx={{
                          fontWeight: 700,
                          color: STATUS_COLOR[metric.status],
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {metric.display}
                      </TableCell>
                      <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                        {metric.variationDisplay}
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>
                        {metric.note}
                      </TableCell>
                      <TableCell align='center'>
                        <Chip
                          size='small'
                          variant='outlined'
                          label={STATUS_LABEL[metric.status]}
                          color={STATUS_CHIP[metric.status]}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {block.action && (
                <Alert severity='info' sx={{ mt: 1 }}>
                  {block.action}
                </Alert>
              )}
            </Paper>
          ))}

          {canSeeAmounts && (
            <Accordion
              elevation={0}
              sx={{
                mb: 3,
                border: `1px solid ${neutral.border}`,
                borderRadius: 3,
                '&:before': { display: 'none' }
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreOutlined />}>
                <Stack direction='row' spacing={1} alignItems='center'>
                  <SettingsOutlined sx={{ color: brand.ink }} />
                  <Typography variant='h6'>
                    Destinatarios y envío automático
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ mb: 2 }}
                >
                  El reporte se genera el día 3 de cada mes a las 07:00. Si no
                  hay destinatarios configurados, se guarda sin enviar.
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
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={includeLms}
                        onChange={(event) =>
                          setIncludeLms(event.target.checked)
                        }
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
                      {savingConfig ? 'Guardando…' : 'Guardar destinatarios'}
                    </Button>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          )}

          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: `1px solid ${neutral.border}`,
              borderRadius: 3,
              overflowX: 'auto'
            }}
          >
            <Stack direction='row' spacing={1} alignItems='center' mb={1}>
              <HistoryOutlined sx={{ color: brand.ink }} />
              <Typography variant='h6'>Historial</Typography>
            </Stack>
            <Divider sx={{ mb: 1 }} />
            {visibleHistory.length === 0 ? (
              <Typography variant='body2' color='text.secondary'>
                Todavía no hay reportes guardados.
              </Typography>
            ) : (
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Periodo</TableCell>
                    <TableCell>Versión</TableCell>
                    <TableCell>Envío</TableCell>
                    <TableCell align='right'>Descargar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {visibleHistory.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.period}</TableCell>
                      <TableCell>
                        {row.profile === 'full' ? 'Con valores' : 'Sin valores'}
                      </TableCell>
                      <TableCell>{formatDateTime(row.sentAt)}</TableCell>
                      <TableCell align='right'>
                        <Button
                          size='small'
                          startIcon={<PictureAsPdfOutlined />}
                          onClick={() =>
                            handleHistoryDownload(
                              row.period,
                              row.profile,
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
                              row.period,
                              row.profile,
                              'xlsx'
                            )
                          }
                          sx={{ textTransform: 'none' }}
                        >
                          Excel
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Paper>
        </>
      ) : null}
    </Container>
  )
}

export default ManagementReportPage
