import { useState } from 'react'
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  LinearProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material'
import {
  CampaignOutlined,
  EventBusy,
  Inventory2Outlined,
  ReportProblemOutlined,
  TaskAlt,
  UpcomingOutlined
} from '@mui/icons-material'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import LmsStatCard from 'src/Components/lms/admin/LmsStatCard'
import { useTechDashboard } from '@hooks/useTechManagement'
import { ComplianceGroup } from 'src/types/techManagement'
import {
  ACTIVITY_TYPE_LABELS,
  DEADLINE_STATUS,
  EVENT_TYPE_LABELS,
  formatDate,
  percent,
  SEVERITY_LABELS,
  StatusChip,
  TEAL,
  todayIso
} from './techUi'

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

const cardSx = { borderRadius: '16px', border: '1px solid #e5e7eb', height: '100%' }

const ComplianceBar = ({ label, group }: { label: string; group: Omit<ComplianceGroup, 'label'> }) => (
  <Box mb={2}>
    <Box display='flex' justifyContent='space-between' mb={0.5}>
      <Typography variant='body2' fontWeight={600}>
        {label}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        {group.executed}/{group.programmed} · {percent(group.compliance)}
      </Typography>
    </Box>
    <LinearProgress
      variant='determinate'
      value={group.compliance ?? 0}
      sx={{ height: 8, borderRadius: 4, bgcolor: '#eef2f1', '& .MuiLinearProgress-bar': { bgcolor: TEAL } }}
    />
  </Box>
)

type TabKey = 'resumen' | 'inventario' | 'cronograma' | 'tecnovigilancia' | 'alertas' | 'visita'

/** Tablero: indicador de cumplimiento del periodo, vencimientos y pendientes de tecnovigilancia. */
const TechDashboardTab = ({ customerId, onNavigate }: { customerId: string; onNavigate: (tab: TabKey) => void }) => {
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`)
  const [to, setTo] = useState(todayIso())
  const { data, isLoading, isError } = useTechDashboard(customerId, { from, to })

  if (isLoading) {
    return (
      <Box display='flex' justifyContent='center' py={6}>
        <CircularProgress />
      </Box>
    )
  }
  if (isError || !data) return <Alert severity='error'>No se pudo cargar el tablero.</Alert>

  const { counts, compliance } = data
  const monthly = data.monthly.map((row) => ({
    month: MONTHS[row.month - 1],
    Programadas: row.programmed,
    Ejecutadas: row.executed
  }))

  return (
    <Box display='flex' flexDirection='column' gap={3}>
      <Box display='flex' gap={2} flexWrap='wrap' alignItems='center'>
        <Typography variant='body2' color='text.secondary'>
          Periodo del indicador
        </Typography>
        <TextField size='small' type='date' label='Desde' value={from} onChange={(e) => setFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
        <TextField size='small' type='date' label='Hasta' value={to} onChange={(e) => setTo(e.target.value)} InputLabelProps={{ shrink: true }} />
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} lg={3}>
          <LmsStatCard
            label='Cumplimiento del cronograma'
            value={percent(compliance.total.compliance)}
            caption={`${compliance.total.executed} de ${compliance.total.programmed} actividades · oportunidad ${percent(compliance.total.timeliness)}`}
            icon={<TaskAlt />}
            tone='green'
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <LmsStatCard
            label='Equipos en inventario'
            value={counts.equipment}
            caption={`${counts.unscheduled} sin programar`}
            icon={<Inventory2Outlined />}
            tone='teal'
            onClick={() => onNavigate('inventario')}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <LmsStatCard
            label='Equipos con actividad vencida'
            value={counts.overdue}
            icon={<EventBusy />}
            tone='red'
            onClick={() => onNavigate('cronograma')}
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <LmsStatCard
            label='Vencen en 30 días'
            value={counts.upcoming}
            icon={<UpcomingOutlined />}
            tone='orange'
            onClick={() => onNavigate('cronograma')}
          />
        </Grid>
      </Grid>

      {(data.reportsOverdue > 0 || data.pendingReviews > 0 || data.pendingAlerts > 0 || !data.program) && (
        <Stack spacing={1}>
          {data.reportsOverdue > 0 && (
            <Alert severity='error' icon={<ReportProblemOutlined />}>
              {data.reportsOverdue} reporte(s) de tecnovigilancia con el plazo de reporte al INVIMA vencido.
            </Alert>
          )}
          {data.pendingReviews > 0 && (
            <Alert severity='warning'>
              {data.pendingReviews} servicio(s) no conforme(s) o correctivo(s) esperan la pregunta “¿pudo afectar a un
              paciente o usuario?” en Tecnovigilancia.
            </Alert>
          )}
          {data.pendingAlerts > 0 && (
            <Alert severity='warning' icon={<CampaignOutlined />}>
              {data.pendingAlerts} alerta(s) del INVIMA cruzan con equipos del inventario y están sin gestionar.
            </Alert>
          )}
          {!data.program && (
            <Alert severity='info'>El programa institucional de tecnovigilancia aún no está registrado.</Alert>
          )}
        </Stack>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card elevation={0} sx={cardSx}>
            <CardContent>
              <Typography variant='h6' fontWeight={600} mb={2}>
                Programadas vs. ejecutadas por mes
              </Typography>
              <Box height={280}>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray='3 3' vertical={false} />
                    <XAxis dataKey='month' />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey='Programadas' fill='#b2dfdb' radius={[4, 4, 0, 0]} />
                    <Bar dataKey='Ejecutadas' fill={TEAL} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card elevation={0} sx={cardSx}>
            <CardContent>
              <Typography variant='h6' fontWeight={600} mb={2}>
                Cumplimiento por tipo
              </Typography>
              <ComplianceBar label={ACTIVITY_TYPE_LABELS.calibration} group={compliance.byType.calibration} />
              <ComplianceBar label={ACTIVITY_TYPE_LABELS.preventive} group={compliance.byType.preventive} />
              <Typography variant='body2' color='text.secondary'>
                Correctivos atendidos en el periodo: {compliance.corrective}
              </Typography>
              {compliance.bySede.length > 1 && (
                <>
                  <Typography variant='subtitle2' fontWeight={600} mt={3} mb={1}>
                    Por sede
                  </Typography>
                  {compliance.bySede.map((group) => (
                    <ComplianceBar key={group.label} label={group.label} group={group} />
                  ))}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card elevation={0} sx={cardSx}>
        <CardContent>
          <Typography variant='h6' fontWeight={600} mb={2}>
            Reportes de tecnovigilancia abiertos
          </Typography>
          {data.openReports.length === 0 ? (
            <Typography variant='body2' color='text.secondary'>
              No hay reportes abiertos.
            </Typography>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <TableCell>Código</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Gravedad</TableCell>
                    <TableCell>Detectado</TableCell>
                    <TableCell>Plazo INVIMA</TableCell>
                    <TableCell>Semáforo</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.openReports.map((report) => (
                    <TableRow key={report.id} hover sx={{ cursor: 'pointer' }} onClick={() => onNavigate('tecnovigilancia')}>
                      <TableCell sx={{ fontWeight: 600 }}>{report.code}</TableCell>
                      <TableCell>{report.eventType ? EVENT_TYPE_LABELS[report.eventType] : '—'}</TableCell>
                      <TableCell>{report.severity ? SEVERITY_LABELS[report.severity] : 'Sin clasificar'}</TableCell>
                      <TableCell>{formatDate(report.detectedAt)}</TableCell>
                      <TableCell>{formatDate(report.reportDeadline)}</TableCell>
                      <TableCell>
                        {report.deadlineStatus && <StatusChip {...DEADLINE_STATUS[report.deadlineStatus]} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

export default TechDashboardTab
