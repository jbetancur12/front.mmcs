import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography
} from '@mui/material'
import {
  ArrowBack,
  AttachFile,
  Build,
  CalendarMonth,
  CheckCircleOutline,
  Download,
  Edit,
  EventAvailable,
  MedicalServices,
  QrCode2,
  ReportProblemOutlined,
  Science
} from '@mui/icons-material'
import { techErrorMessage, techPaths, useEquipmentDetail } from '@hooks/useTechManagement'
import { EquipmentActivity } from 'src/types/techManagement'
import EquipmentFormDialog from 'src/Components/techManagement/EquipmentFormDialog'
import EquipmentQrDialog from 'src/Components/techManagement/EquipmentQrDialog'
import ReportFormDialog from 'src/Components/techManagement/ReportFormDialog'
import { ExecuteActivityDialog, ScheduleActivityDialog } from 'src/Components/techManagement/ScheduleDialogs'
import { useTechAccess } from 'src/Components/techManagement/useTechAccess'
import {
  ACTIVITY_TYPE_LABELS,
  ALERT_TYPE_LABELS,
  DEADLINE_STATUS,
  formatDate,
  MATCH_STATUS,
  notifyError,
  REPORT_STATUS,
  SCHEDULE_STATUS,
  StatusChip,
  todayIso
} from 'src/Components/techManagement/techUi'

const whiteCardSx = { borderRadius: '16px', border: '1px solid #e5e7eb', height: '100%' }
const emeraldButtonSx = {
  background: 'linear-gradient(135deg, #10b981, #059669)',
  color: 'white',
  textTransform: 'none',
  fontWeight: 600,
  '&:hover': { background: 'linear-gradient(135deg, #059669, #047857)' }
}

const Indicator = ({ icon, color, label, value, caption }: { icon: React.ReactElement; color: string; label: string; value: string; caption?: string }) => (
  <Card elevation={0} sx={whiteCardSx}>
    <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: `${color}1a`, color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </Box>
      <Box minWidth={0}>
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>
        <Typography variant='h5' fontWeight='bold'>
          {value}
        </Typography>
        {caption && (
          <Typography variant='caption' color='text.secondary'>
            {caption}
          </Typography>
        )}
      </Box>
    </CardContent>
  </Card>
)

const activityChip = (activity: EquipmentActivity) => {
  if (activity.status === 'executed') {
    return activity.result === 'no_conforme' ? { label: 'No conforme', color: 'error' as const } : { label: 'Ejecutada', color: 'success' as const }
  }
  if (activity.status === 'cancelled') return { label: 'Cancelada', color: 'default' as const }
  if (activity.dueDate && activity.dueDate < todayIso()) return { label: 'Vencida', color: 'error' as const }
  return { label: 'Pendiente', color: 'warning' as const }
}

/** Hoja de vida del equipo: datos, historial de servicios con evidencias, certificados y tecnovigilancia. */
const EquipmentDetailPage = () => {
  const { customerId = '', equipmentId = '' } = useParams()
  const navigate = useNavigate()
  const access = useTechAccess(customerId)
  const { data: equipment, isLoading, isError } = useEquipmentDetail(customerId, equipmentId)
  const [tab, setTab] = useState(0)
  const [editing, setEditing] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [executing, setExecuting] = useState<EquipmentActivity | null | undefined>(undefined)
  const [reporting, setReporting] = useState(false)

  if (isLoading) {
    return (
      <Box display='flex' justifyContent='center' py={8}>
        <CircularProgress />
      </Box>
    )
  }
  if (isError || !equipment) {
    return (
      <Container maxWidth='xl' sx={{ py: 3 }}>
        <Alert severity='error'>No se encontró el equipo.</Alert>
      </Container>
    )
  }

  const lastExecuted = (type: string) =>
    equipment.activities.find((activity) => activity.type === type && activity.status === 'executed')?.executedAt || null

  const downloadEvidence = async (activity: EquipmentActivity) => {
    try {
      await techPaths.downloadFile(techPaths.evidence(customerId, activity.id), activity.evidenceName || 'evidencia')
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo descargar la evidencia'))
    }
  }

  const downloadCertificate = async (filePath: string, name: string) => {
    try {
      await techPaths.downloadFile(`/files/download/${filePath}`, `${name || 'certificado'}.pdf`)
    } catch (error) {
      notifyError(techErrorMessage(error, 'No se pudo descargar el certificado'))
    }
  }

  const details: [string, string | null | undefined][] = [
    ['Marca', equipment.brand],
    ['Modelo', equipment.model],
    ['Serie', equipment.serie],
    ['Activo fijo', equipment.activoFijo],
    ['Sede', equipment.sede],
    ['Servicio', equipment.service],
    ['Ubicación', equipment.location],
    ['Clase de riesgo', equipment.riskClass],
    ['Registro sanitario', equipment.invimaRegistry],
    ['Lote', equipment.lot],
    ['Fabricante', equipment.manufacturer],
    ['Proveedor responsable', equipment.responsibleProvider],
    ['Calibración cada', equipment.calibrationPeriodMonths ? `${equipment.calibrationPeriodMonths} meses` : null],
    ['Preventivo cada', equipment.maintenancePeriodMonths ? `${equipment.maintenancePeriodMonths} meses` : null]
  ]

  return (
    <Container maxWidth='xl' sx={{ py: 3 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(`/tech-management/customers/${customerId}?tab=inventario`)}
        sx={{ textTransform: 'none', fontWeight: 600, mb: 2 }}
      >
        Inventario
      </Button>

      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, #10b981, #059669)',
          color: 'white',
          p: { xs: 3, md: 4 },
          mb: 3
        }}
      >
        <Box sx={{ position: 'absolute', width: 220, height: 220, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.08)', top: -80, right: -60 }} />
        <Box sx={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)', bottom: -60, right: 120 }} />
        <Box display='flex' gap={2.5} alignItems='center' flexWrap='wrap' position='relative'>
          <Avatar sx={{ width: 72, height: 72, bgcolor: 'rgba(255,255,255,0.2)' }}>
            <MedicalServices sx={{ fontSize: 40 }} />
          </Avatar>
          <Box flex={1} minWidth={220}>
            <Typography variant='h4' fontWeight='bold'>
              {equipment.name}
            </Typography>
            <Typography sx={{ opacity: 0.9 }}>
              {[equipment.brand, equipment.model, equipment.serie && `Serie ${equipment.serie}`].filter(Boolean).join(' · ') || 'Sin marca ni serie'}
            </Typography>
            <Typography variant='body2' sx={{ opacity: 0.85 }}>
              {[equipment.sede, equipment.service, equipment.location].filter(Boolean).join(' · ')}
            </Typography>
          </Box>
          <Box display='flex' gap={1} flexWrap='wrap'>
            <Tooltip title='Código QR'>
              <IconButton onClick={() => setQrOpen(true)} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)' }}>
                <QrCode2 />
              </IconButton>
            </Tooltip>
            {access.canManageInventory && (
              <Tooltip title='Editar'>
                <IconButton onClick={() => setEditing(true)} sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.15)' }}>
                  <Edit />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </Box>

      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <Indicator
            icon={<EventAvailable />}
            color='#f59e0b'
            label='Próxima actividad'
            value={formatDate(equipment.nextDueDate)}
            caption={equipment.nextDueType ? `${ACTIVITY_TYPE_LABELS[equipment.nextDueType]} · ${SCHEDULE_STATUS[equipment.scheduleStatus].label}` : SCHEDULE_STATUS[equipment.scheduleStatus].label}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Indicator icon={<Science />} color='#3b82f6' label='Última calibración' value={formatDate(lastExecuted('calibration'))} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Indicator icon={<Build />} color='#10b981' label='Último preventivo' value={formatDate(lastExecuted('preventive'))} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Indicator
            icon={<ReportProblemOutlined />}
            color='#ef4444'
            label='Reportes de tecnovigilancia'
            value={String(equipment.reports.length)}
            caption={`${equipment.alertMatches.filter((match) => match.status === 'pendiente').length} alerta(s) INVIMA pendiente(s)`}
          />
        </Grid>
      </Grid>

      {(access.canManageInventory || access.canWriteSurveillance) && (
        <Box display='flex' gap={1.5} flexWrap='wrap' mb={3}>
          {access.canManageInventory && (
            <>
              <Button startIcon={<CalendarMonth />} onClick={() => setScheduleOpen(true)} sx={emeraldButtonSx}>
                Programar actividad
              </Button>
              <Button
                startIcon={<CheckCircleOutline />}
                onClick={() => setExecuting(null)}
                sx={{ ...emeraldButtonSx, background: 'linear-gradient(135deg, #3b82f6, #2563eb)', '&:hover': { background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' } }}
              >
                Registrar servicio no programado
              </Button>
            </>
          )}
          {access.canWriteSurveillance && (
            <Button variant='outlined' color='error' startIcon={<ReportProblemOutlined />} onClick={() => setReporting(true)} sx={{ textTransform: 'none', fontWeight: 600 }}>
              Reportar evento o incidente
            </Button>
          )}
        </Box>
      )}

      <Card elevation={0} sx={{ ...whiteCardSx, mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, value: number) => setTab(value)}
          variant='fullWidth'
          sx={{
            minHeight: 64,
            '& .MuiTab-root': { minHeight: 64, textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: '#10b981 !important' },
            '& .MuiTabs-indicator': { bgcolor: '#10b981', height: 3 }
          }}
        >
          <Tab label='Historial de servicios' />
          <Tab label={`Certificados (${equipment.certificates.length})`} />
          <Tab label='Tecnovigilancia' />
          <Tab label='Datos del equipo' />
        </Tabs>
      </Card>

      <Card elevation={0} sx={whiteCardSx}>
        <CardContent sx={{ overflowX: 'auto' }}>
          {tab === 0 &&
            (equipment.activities.length === 0 ? (
              <Typography color='text.secondary'>Sin actividades registradas.</Typography>
            ) : (
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Actividad</TableCell>
                    <TableCell>Programada</TableCell>
                    <TableCell>Ejecutada</TableCell>
                    <TableCell>Por</TableCell>
                    <TableCell>Observaciones</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align='right'>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {equipment.activities.map((activity) => (
                    <TableRow key={activity.id} hover>
                      <TableCell>{ACTIVITY_TYPE_LABELS[activity.type]}</TableCell>
                      <TableCell>{formatDate(activity.dueDate)}</TableCell>
                      <TableCell>{formatDate(activity.executedAt)}</TableCell>
                      <TableCell>
                        {activity.status !== 'executed' ? '—' : activity.origin === 'third_party' ? activity.provider || 'Otro proveedor' : 'Metromedics'}
                      </TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>{activity.notes || '—'}</TableCell>
                      <TableCell>
                        <StatusChip {...activityChip(activity)} />
                      </TableCell>
                      <TableCell align='right'>
                        {activity.evidenceName && (
                          <Tooltip title={`Evidencia: ${activity.evidenceName}`}>
                            <IconButton size='small' onClick={() => downloadEvidence(activity)}>
                              <AttachFile fontSize='small' />
                            </IconButton>
                          </Tooltip>
                        )}
                        {access.canManageInventory && activity.status === 'pending' && (
                          <Tooltip title='Registrar ejecución'>
                            <IconButton size='small' color='success' onClick={() => setExecuting(activity)}>
                              <CheckCircleOutline fontSize='small' />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ))}

          {tab === 1 &&
            (equipment.certificates.length === 0 ? (
              <Typography color='text.secondary'>Este equipo no tiene certificados emitidos por Metromedics.</Typography>
            ) : (
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Certificado</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Calibración</TableCell>
                    <TableCell>Próxima</TableCell>
                    <TableCell>Historial</TableCell>
                    <TableCell align='right'>Descargar</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {equipment.certificates.map((certificate) => (
                    <TableRow key={certificate.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{certificate.name}</TableCell>
                      <TableCell>{certificate.certificateType?.name || '—'}</TableCell>
                      <TableCell>{formatDate(certificate.calibrationDate)}</TableCell>
                      <TableCell>{formatDate(certificate.nextCalibrationDate)}</TableCell>
                      <TableCell>{certificate.certificateHistories?.length || 0} calibración(es)</TableCell>
                      <TableCell align='right'>
                        <IconButton size='small' aria-label='Descargar certificado' onClick={() => downloadCertificate(certificate.filePath, certificate.name)}>
                          <Download fontSize='small' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ))}

          {tab === 2 && (
            <Stack spacing={3}>
              <Box>
                <Typography variant='subtitle1' fontWeight={600} mb={1}>
                  Reportes
                </Typography>
                {equipment.reports.length === 0 ? (
                  <Typography color='text.secondary'>Sin reportes de tecnovigilancia.</Typography>
                ) : (
                  <Table size='small'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Código</TableCell>
                        <TableCell>Detectado</TableCell>
                        <TableCell>Plazo</TableCell>
                        <TableCell>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {equipment.reports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell sx={{ fontWeight: 600 }}>{report.code}</TableCell>
                          <TableCell>{formatDate(report.detectedAt)}</TableCell>
                          <TableCell>{formatDate(report.reportDeadline)}</TableCell>
                          <TableCell>
                            <Box display='flex' gap={1}>
                              <StatusChip {...REPORT_STATUS[report.status]} />
                              {report.deadlineStatus && <StatusChip {...DEADLINE_STATUS[report.deadlineStatus]} />}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </Box>
              <Box>
                <Typography variant='subtitle1' fontWeight={600} mb={1}>
                  Alertas del INVIMA
                </Typography>
                {equipment.alertMatches.length === 0 ? (
                  <Typography color='text.secondary'>Ninguna alerta cruza con este equipo.</Typography>
                ) : (
                  equipment.alertMatches.map((match) => (
                    <Box key={match.id} display='flex' gap={1} alignItems='center' flexWrap='wrap' mb={1}>
                      <StatusChip {...MATCH_STATUS[match.status]} />
                      <Typography variant='body2'>
                        <strong>{match.alert?.code}</strong> · {match.alert?.title} ({match.alert ? ALERT_TYPE_LABELS[match.alert.type] : ''})
                      </Typography>
                    </Box>
                  ))
                )}
              </Box>
            </Stack>
          )}

          {tab === 3 && (
            <Grid container spacing={2}>
              {details.map(([label, value]) => (
                <Grid item xs={12} sm={6} md={4} key={label}>
                  <Typography variant='caption' color='text.secondary'>
                    {label}
                  </Typography>
                  <Typography>{value || '—'}</Typography>
                </Grid>
              ))}
              {equipment.notes && (
                <Grid item xs={12}>
                  <Typography variant='caption' color='text.secondary'>
                    Observaciones
                  </Typography>
                  <Typography>{equipment.notes}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </CardContent>
      </Card>

      <EquipmentFormDialog customerId={customerId} open={editing} equipment={equipment} onClose={() => setEditing(false)} />
      {qrOpen && <EquipmentQrDialog customerId={customerId} equipment={equipment} canManage={access.canManageInventory} onClose={() => setQrOpen(false)} />}
      <ScheduleActivityDialog customerId={customerId} equipmentIds={[equipment.id]} open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
      <ExecuteActivityDialog
        customerId={customerId}
        open={executing !== undefined}
        activity={executing}
        equipmentId={equipment.id}
        onClose={() => setExecuting(undefined)}
      />
      <ReportFormDialog customerId={customerId} open={reporting} defaultEquipmentId={equipment.id} onClose={() => setReporting(false)} />
    </Container>
  )
}

export default EquipmentDetailPage
