import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  LinearProgress,
  MenuItem,
  Paper,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material'
import {
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Download as DownloadIcon,
  Groups as GroupsIcon,
  MenuBook as CoursesIcon,
  Refresh as RefreshIcon,
  School as CertificateIcon,
  Warning as WarningIcon
} from '@mui/icons-material'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { es } from 'date-fns/locale'
import { useSearchParams } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts'
import {
  useComprehensiveDashboard,
  useMandatoryTrainingAnalytics
} from '../../../hooks/useLms'
import { LmsQuizAnalyticsPanel } from './LmsQuizAnalytics'

type DashboardFilters = {
  startDate?: string
  endDate?: string
  userType?: string
  courseStatus?: string
}

const ANALYTICS_TABS = [
  'summary',
  'courses',
  'users',
  'compliance',
  'quizzes'
] as const

const getAnalyticsTabIndex = (value: string | null) => {
  const tabIndex = ANALYTICS_TABS.indexOf(
    (value as (typeof ANALYTICS_TABS)[number]) || 'summary'
  )

  return tabIndex >= 0 ? tabIndex : 0
}

const CHART_COLORS = ['#059669', '#2563eb', '#d97706', '#dc2626']

const safeNumber = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback

const toCsv = (rows: Array<Array<string | number>>) => rows.map((row) => row.join(',')).join('\n')

const downloadCsv = (filename: string, csvContent: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const formatPercent = (value: unknown) => `${Math.round(safeNumber(value))}%`

const formatDate = (value?: string | null) => {
  if (!value) return 'Sin dato'
  return new Date(value).toLocaleString('es-CO')
}

const LmsAnalytics: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState(() =>
    getAnalyticsTabIndex(searchParams.get('tab'))
  )
  const [filters, setFilters] = useState<{
    startDate: Date | null
    endDate: Date | null
    userType: 'all' | 'internal' | 'client'
    courseStatus: 'all' | 'draft' | 'published' | 'archived'
  }>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
    userType: 'all',
    courseStatus: 'published'
  })

  const apiFilters: DashboardFilters = useMemo(
    () => ({
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString(),
      userType: filters.userType === 'all' ? undefined : filters.userType,
      courseStatus: filters.courseStatus === 'all' ? undefined : filters.courseStatus
    }),
    [filters]
  )

  const {
    data: dashboard,
    isLoading,
    isFetching,
    error,
    refetch
  } = useComprehensiveDashboard(apiFilters)

  const { data: mandatoryTraining } = useMandatoryTrainingAnalytics(
    {
      startDate: filters.startDate?.toISOString(),
      endDate: filters.endDate?.toISOString()
    },
    {
      enabled: activeTab === 3
    }
  )

  const metrics = dashboard?.metrics || {}
  const userAnalytics = dashboard?.userAnalytics || {}
  const courseMetrics = dashboard?.courseMetrics || {}
  const quizAnalytics = dashboard?.quizAnalytics || {}
  const assignmentStatus = dashboard?.assignmentStatus || {}
  const recentActivity = Array.isArray(dashboard?.recentActivity) ? dashboard.recentActivity : []
  const generatedAt = dashboard?.generatedAt

  useEffect(() => {
    const nextTab = getAnalyticsTabIndex(searchParams.get('tab'))
    if (nextTab !== activeTab) {
      setActiveTab(nextTab)
    }
  }, [activeTab, searchParams])

  const completionDistribution = [
    {
      name: 'Internos',
      completionRate: safeNumber(userAnalytics.completionRateByUserType?.internal)
    },
    {
      name: 'Clientes',
      completionRate: safeNumber(userAnalytics.completionRateByUserType?.client)
    }
  ]

  const userMix = [
    { name: 'Internos', value: safeNumber(userAnalytics.internalUsers) },
    { name: 'Clientes', value: safeNumber(userAnalytics.clientUsers) }
  ].filter((item) => item.value > 0)

  const topCourses = Array.isArray(courseMetrics.topPerformingCourses)
    ? courseMetrics.topPerformingCourses
    : []
  const underperformingCourses = Array.isArray(courseMetrics.underperformingCourses)
    ? courseMetrics.underperformingCourses
    : []
  const progressDistribution = Array.isArray(userAnalytics.progressDistribution)
    ? userAnalytics.progressDistribution
    : []
  const complianceByRole = Array.isArray(assignmentStatus.complianceByRole)
    ? assignmentStatus.complianceByRole
    : []

  const handleExport = () => {
    const rows: Array<Array<string | number>> = [
      ['Metrica', 'Valor'],
      ['Total usuarios', safeNumber(metrics.totalUsers)],
      ['Usuarios activos', safeNumber(metrics.activeUsers)],
      ['Total cursos', safeNumber(metrics.totalCourses)],
      ['Total certificados', safeNumber(metrics.totalCertificates)],
      ['Tasa de finalizacion', safeNumber(metrics.completionRate)],
      ['Asignaciones pendientes', safeNumber(metrics.pendingAssignments)],
      ['Capacitaciones vencidas', safeNumber(metrics.overdueTraining)],
      ['Cursos publicados', safeNumber(courseMetrics.publishedCourses)],
      ['Cursos borrador', safeNumber(courseMetrics.draftCourses)],
      ['Score promedio quiz', safeNumber(quizAnalytics.averageScore)],
      ['Intentos promedio quiz', safeNumber(quizAnalytics.averageAttempts)]
    ]

    downloadCsv(
      `lms-analytics-${new Date().toISOString().split('T')[0]}.csv`,
      toCsv(rows)
    )
  }

  const handleTabChange = (_: React.SyntheticEvent, value: number) => {
    setActiveTab(value)
    const nextParams = new URLSearchParams(searchParams)
    const tabId = ANALYTICS_TABS[value]

    if (tabId === 'summary') {
      nextParams.delete('tab')
    } else {
      nextParams.set('tab', tabId)
    }

    setSearchParams(nextParams, { replace: true })
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
      <Box sx={{ p: 3 }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            mb: 3
          }}
        >
          <Box>
            <Typography variant='h4' component='h1' gutterBottom>
              Analíticas LMS
            </Typography>
            <Typography color='text.secondary'>
              Panel real basado en el backend actual del LMS. Sin datos demo ni resúmenes
              simulados.
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant='outlined'
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
              disabled={isFetching}
            >
              Refrescar
            </Button>
            <Button variant='contained' startIcon={<DownloadIcon />} onClick={handleExport}>
              Exportar CSV
            </Button>
          </Stack>
        </Box>

        <Alert severity='info' sx={{ mb: 3 }}>
          Usa este panel para responder tres preguntas rápidas: cuántos usuarios están activos, qué cursos están funcionando mejor y dónde se está frenando la finalización. Ajusta fechas y tipo de usuario antes de exportar.
        </Alert>

        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant='subtitle2' sx={{ mb: 1.5 }}>
            Filtros de análisis
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
            El rango de fechas define la ventana del reporte. Tipo de usuario y estado del curso te ayudan a aislar si el comportamiento cambia entre internos, clientes o contenidos todavía no publicados.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={3}>
              <DatePicker
                label='Desde'
                value={filters.startDate}
                onChange={(value) => setFilters((current) => ({ ...current, startDate: value }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <DatePicker
                label='Hasta'
                value={filters.endDate}
                onChange={(value) => setFilters((current) => ({ ...current, endDate: value }))}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label='Tipo de usuario'
                value={filters.userType}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    userType: event.target.value as 'all' | 'internal' | 'client'
                  }))
                }
              >
                <MenuItem value='all'>Todos</MenuItem>
                <MenuItem value='internal'>Internos</MenuItem>
                <MenuItem value='client'>Clientes</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                select
                fullWidth
                label='Estado del curso'
                value={filters.courseStatus}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    courseStatus: event.target.value as
                      | 'all'
                      | 'draft'
                      | 'published'
                      | 'archived'
                  }))
                }
              >
                <MenuItem value='all'>Todos</MenuItem>
                <MenuItem value='draft'>Borrador</MenuItem>
                <MenuItem value='published'>Publicado</MenuItem>
                <MenuItem value='archived'>Archivado</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {generatedAt ? (
          <Alert severity='info' sx={{ mb: 3 }}>
            Reporte generado: {formatDate(generatedAt)}
          </Alert>
        ) : null}

        {error ? (
          <Alert severity='error' sx={{ mb: 3 }}>
            No se pudieron cargar las analíticas reales del LMS.
          </Alert>
        ) : null}

        {isLoading ? (
          <Typography color='text.secondary'>Cargando analíticas reales...</Typography>
        ) : (
          <>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
              <Chip label={`Ventana: ${filters.startDate ? filters.startDate.toLocaleDateString('es-CO') : 'Sin inicio'} - ${filters.endDate ? filters.endDate.toLocaleDateString('es-CO') : 'Sin fin'}`} variant='outlined' />
              <Chip label={`Usuarios: ${filters.userType === 'all' ? 'Todos' : filters.userType === 'internal' ? 'Internos' : 'Clientes'}`} variant='outlined' />
              <Chip label={`Cursos: ${filters.courseStatus === 'all' ? 'Todos' : filters.courseStatus === 'draft' ? 'Borrador' : filters.courseStatus === 'published' ? 'Publicados' : 'Archivados'}`} variant='outlined' />
            </Stack>

            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction='row' spacing={2} alignItems='center'>
                      <GroupsIcon color='primary' />
                      <Box>
                        <Typography variant='h4'>{safeNumber(metrics.totalUsers)}</Typography>
                        <Typography color='text.secondary'>Usuarios</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction='row' spacing={2} alignItems='center'>
                      <CoursesIcon color='success' />
                      <Box>
                        <Typography variant='h4'>{safeNumber(metrics.totalCourses)}</Typography>
                        <Typography color='text.secondary'>Cursos</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction='row' spacing={2} alignItems='center'>
                      <CertificateIcon color='info' />
                      <Box>
                        <Typography variant='h4'>{safeNumber(metrics.totalCertificates)}</Typography>
                        <Typography color='text.secondary'>Certificados</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Stack direction='row' spacing={2} alignItems='center'>
                      <AssignmentIcon color='warning' />
                      <Box>
                        <Typography variant='h4'>{formatPercent(metrics.completionRate)}</Typography>
                        <Typography color='text.secondary'>Finalización</Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
              <Tab label='Resumen' />
              <Tab label='Cursos' />
              <Tab label='Usuarios' />
              <Tab label='Cumplimiento' />
              <Tab label='Quizzes' />
            </Tabs>

            {activeTab === 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12} lg={8}>
                  <Card>
                    <CardHeader title='Distribución de finalización por tipo de usuario' />
                    <CardContent sx={{ height: 320 }}>
                      <ResponsiveContainer width='100%' height='100%'>
                        <BarChart data={completionDistribution}>
                          <CartesianGrid strokeDasharray='3 3' />
                          <XAxis dataKey='name' />
                          <YAxis domain={[0, 100]} />
                          <RechartsTooltip />
                          <Bar dataKey='completionRate' fill={CHART_COLORS[0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} lg={4}>
                  <Card sx={{ height: '100%' }}>
                    <CardHeader title='Mezcla de usuarios LMS' />
                    <CardContent sx={{ height: 320 }}>
                      {userMix.length > 0 ? (
                        <ResponsiveContainer width='100%' height='100%'>
                          <PieChart>
                            <Pie
                              data={userMix}
                              dataKey='value'
                              nameKey='name'
                              outerRadius={90}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {userMix.map((entry, index) => (
                                <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Typography color='text.secondary'>Sin datos de usuarios para el rango seleccionado.</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12}>
                  <Card>
                    <CardHeader title='Actividad reciente' />
                    <CardContent>
                      {recentActivity.length === 0 ? (
                        <Typography color='text.secondary'>
                          No hay actividad reciente reportada por el backend para este rango.
                        </Typography>
                      ) : (
                        <Stack spacing={2}>
                          {recentActivity.slice(0, 8).map((activity: any, index: number) => (
                            <Box
                              key={`${activity.type || 'activity'}-${index}`}
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                p: 2,
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2
                              }}
                            >
                              <Box>
                                <Typography fontWeight='bold'>
                                  {activity.title || activity.description || 'Actividad LMS'}
                                </Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  {activity.user || activity.type || 'Sistema'}
                                </Typography>
                              </Box>
                              <Typography variant='caption' color='text.secondary'>
                                {formatDate(activity.timestamp || activity.createdAt)}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : null}

            {activeTab === 1 ? (
              <Grid container spacing={3}>
                <Grid item xs={12} lg={7}>
                  <Card>
                    <CardHeader title='Cursos con mejor desempeño' />
                    <CardContent>
                      <TableContainer>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Curso</TableCell>
                              <TableCell align='right'>Finalizacion</TableCell>
                              <TableCell align='right'>Usuarios</TableCell>
                              <TableCell align='center'>Tipo</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {topCourses.map((course: any) => (
                              <TableRow key={course.courseId}>
                                <TableCell>{course.title}</TableCell>
                                <TableCell align='right'>{formatPercent(course.completionRate)}</TableCell>
                                <TableCell align='right'>{safeNumber(course.totalUsers)}</TableCell>
                                <TableCell align='center'>
                                  {course.isMandatory ? (
                                    <Chip label='Obligatorio' size='small' color='warning' />
                                  ) : (
                                    <Chip label='Opcional' size='small' variant='outlined' />
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} lg={5}>
                  <Card>
                    <CardHeader title='Cursos con bajo desempeño' />
                    <CardContent>
                      {underperformingCourses.length === 0 ? (
                        <Alert severity='success'>No hay cursos por debajo del umbral actual.</Alert>
                      ) : (
                        <Stack spacing={2}>
                          {underperformingCourses.map((course: any) => (
                            <Box key={course.courseId}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant='body2'>{course.title}</Typography>
                                <Typography variant='body2' color='text.secondary'>
                                  {formatPercent(course.completionRate)}
                                </Typography>
                              </Box>
                              <LinearProgress
                                variant='determinate'
                                value={safeNumber(course.completionRate)}
                                color='warning'
                              />
                            </Box>
                          ))}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : null}

            {activeTab === 2 ? (
              <Grid container spacing={3}>
                <Grid item xs={12} lg={6}>
                    <Card>
                    <CardHeader title='Distribución de progreso' />
                    <CardContent sx={{ height: 320 }}>
                      {progressDistribution.length > 0 ? (
                        <ResponsiveContainer width='100%' height='100%'>
                          <AreaChart data={progressDistribution}>
                            <CartesianGrid strokeDasharray='3 3' />
                            <XAxis dataKey='range' />
                            <YAxis />
                            <RechartsTooltip />
                            <Area type='monotone' dataKey='count' stroke={CHART_COLORS[1]} fill={CHART_COLORS[1]} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <Typography color='text.secondary'>Sin distribucion de progreso disponible.</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} lg={6}>
                  <Card>
                    <CardHeader title='Estado real del aprendizaje' />
                    <CardContent>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant='body2' color='text.secondary'>
                            Usuarios internos
                          </Typography>
                          <Typography variant='h5'>{safeNumber(userAnalytics.internalUsers)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant='body2' color='text.secondary'>
                            Usuarios cliente
                          </Typography>
                          <Typography variant='h5'>{safeNumber(userAnalytics.clientUsers)}</Typography>
                        </Box>
                        <Box>
                          <Typography variant='body2' color='text.secondary'>
                            Usuarios activos
                          </Typography>
                          <Typography variant='h5'>{safeNumber(userAnalytics.activeUsers)}</Typography>
                        </Box>
                        <Alert severity='info'>
                          El backend actual entrega un resumen confiable de usuarios, pero no aún un ranking
                          rico de engagement por persona en esta pantalla.
                        </Alert>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : null}

            {activeTab === 3 ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Alert
                    severity={safeNumber(assignmentStatus.overdueAssignments) > 0 ? 'warning' : 'success'}
                    icon={safeNumber(assignmentStatus.overdueAssignments) > 0 ? <WarningIcon /> : <CheckCircleIcon />}
                  >
                    Asignaciones pendientes: {safeNumber(assignmentStatus.pendingAssignments || metrics.pendingAssignments)}.
                    Vencidas: {safeNumber(assignmentStatus.overdueAssignments || metrics.overdueTraining)}.
                  </Alert>
                </Grid>
                <Grid item xs={12} lg={7}>
                  <Card>
                    <CardHeader title='Cumplimiento por rol' />
                    <CardContent>
                      {complianceByRole.length === 0 ? (
                        <Typography color='text.secondary'>
                          No hay detalle por rol disponible para este rango.
                        </Typography>
                      ) : (
                        <TableContainer>
                          <Table>
                            <TableHead>
                              <TableRow>
                                <TableCell>Rol</TableCell>
                                <TableCell align='right'>Cumplimiento</TableCell>
                                <TableCell align='right'>Total usuarios</TableCell>
                                <TableCell align='right'>Vencidos</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {complianceByRole.map((role: any, index: number) => (
                                <TableRow key={`${role.role || 'role'}-${index}`}>
                                  <TableCell>{role.role || 'Sin rol'}</TableCell>
                                  <TableCell align='right'>{formatPercent(role.complianceRate)}</TableCell>
                                  <TableCell align='right'>{safeNumber(role.totalUsers)}</TableCell>
                                  <TableCell align='right'>{safeNumber(role.overdueUsers)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} lg={5}>
                    <Card>
                      <CardHeader title='Resumen de alertas obligatorias' />
                      <CardContent>
                        <Stack spacing={2}>
                          <Typography>
                          Críticas: {safeNumber(mandatoryTraining?.escalationSummary?.totalCritical)}
                          </Typography>
                        <Typography>
                          Advertencias: {safeNumber(mandatoryTraining?.escalationSummary?.totalWarning)}
                        </Typography>
                        <Typography>
                          Usuarios vencidos: {safeNumber(mandatoryTraining?.escalationSummary?.overdueUsers)}
                        </Typography>
                        <Typography>
                          Fechas urgentes: {safeNumber(mandatoryTraining?.escalationSummary?.urgentDeadlines)}
                        </Typography>
                        <Typography>
                          Promedio quiz: {formatPercent(quizAnalytics.averageScore)}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            ) : null}

            {activeTab === 4 ? <LmsQuizAnalyticsPanel /> : null}
          </>
        )}
      </Box>
    </LocalizationProvider>
  )
}

export default LmsAnalytics
