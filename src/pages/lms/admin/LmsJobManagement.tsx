import React, { useState } from 'react'
import {
  Box,
  AlertTitle,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Tabs,
  Tab,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Divider,
  Tooltip,
  CircularProgress
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,

  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Settings as SettingsIcon,
  Dashboard as DashboardIcon,
  CleaningServices as CleanIcon,
  VideoLibrary as VideoIcon,
  EmojiEvents as CertificateIcon,
  Notifications as NotificationIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import {
  useJobDashboard,
  useQueueStats,
  useFailedJobs,
  useSchedulerStatus,
  useReminderJobStatus,
  useJobStatistics,
  useRetryFailedJob,
  useRemoveJob,
  useCleanCompletedJobs,
  usePauseQueue,
  useResumeQueue,
  useStartScheduler,
  useStopScheduler,
  useStartReminderJobs,
  useStopReminderJobs,
  useRunScheduledJob,
  useRunReminderJob,
  useTriggerCleanupJob,
  useTriggerCertificateGeneration,
  useTriggerVideoProcessing,
  useCleanOldQuizAttempts
} from '../../../hooks/useJobs'

const LmsJobManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false)
  const [certificateDialogOpen, setCertificateDialogOpen] = useState(false)
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [certificateId, setCertificateId] = useState('')
  const [videoPath, setVideoPath] = useState('')
  const [cleanupOptions, setCleanupOptions] = useState({
    cleanTempFiles: true,
    cleanExpiredSessions: true,
    cleanOldLogs: false,
    cleanFailedJobs: false,
    olderThanDays: 7
  })

  const navigate = useNavigate()

  // Data hooks
  const { isLoading: dashboardLoading, error: dashboardError } = useJobDashboard()
  const { data: queueStats, isLoading: queueLoading } = useQueueStats()
  const { data: failedJobs, isLoading: failedLoading } = useFailedJobs(10)
  const { data: schedulerStatus } = useSchedulerStatus()
  const { data: reminderStatus } = useReminderJobStatus()
  const { data: statistics } = useJobStatistics()

  // Mutation hooks
  const retryJobMutation = useRetryFailedJob()
  const removeJobMutation = useRemoveJob()
  const cleanCompletedMutation = useCleanCompletedJobs()
  const pauseQueueMutation = usePauseQueue()
  const resumeQueueMutation = useResumeQueue()
  const startSchedulerMutation = useStartScheduler()
  const stopSchedulerMutation = useStopScheduler()
  const startRemindersMutation = useStartReminderJobs()
  const stopRemindersMutation = useStopReminderJobs()
  const runScheduledJobMutation = useRunScheduledJob()
  const runReminderJobMutation = useRunReminderJob()
  const triggerCleanupMutation = useTriggerCleanupJob()
  const triggerCertificateMutation = useTriggerCertificateGeneration()
  const triggerVideoMutation = useTriggerVideoProcessing()
  const cleanQuizAttemptsMutation = useCleanOldQuizAttempts()

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleRetryJob = (jobId: string) => {
    retryJobMutation.mutate(jobId)
  }

  const handleRemoveJob = (jobId: string) => {
    removeJobMutation.mutate(jobId)
  }

  const handleCleanCompleted = () => {
    cleanCompletedMutation.mutate(24) // Clean jobs older than 24 hours
  }

  const handlePauseQueue = () => {
    pauseQueueMutation.mutate()
  }

  const handleResumeQueue = () => {
    resumeQueueMutation.mutate()
  }

  const handleStartScheduler = () => {
    startSchedulerMutation.mutate()
  }

  const handleStopScheduler = () => {
    stopSchedulerMutation.mutate()
  }

  const handleStartReminders = () => {
    startRemindersMutation.mutate()
  }

  const handleStopReminders = () => {
    stopRemindersMutation.mutate()
  }

  const handleRunScheduledJob = (jobName: string) => {
    runScheduledJobMutation.mutate(jobName)
  }

  const handleRunReminderJob = (jobName: string) => {
    runReminderJobMutation.mutate(jobName)
  }

  const handleTriggerCleanup = () => {
    triggerCleanupMutation.mutate(cleanupOptions)
    setCleanupDialogOpen(false)
  }

  const handleTriggerCertificate = () => {
    if (certificateId) {
      triggerCertificateMutation.mutate(parseInt(certificateId))
      setCertificateDialogOpen(false)
      setCertificateId('')
    }
  }

  const handleTriggerVideo = () => {
    if (videoPath) {
      triggerVideoMutation.mutate({ videoPath })
      setVideoDialogOpen(false)
      setVideoPath('')
    }
  }

  const handleCleanQuizAttempts = () => {
    cleanQuizAttemptsMutation.mutate(90) // Clean attempts older than 90 days
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
      case 'active':
        return 'success'
      case 'stopped':
      case 'paused':
        return 'error'
      case 'warning':
        return 'warning'
      default:
        return 'default'
    }
  }

  const getJobTypeIcon = (type: string) => {
    switch (type) {
      case 'certificate-generation':
        return <CertificateIcon color="warning" />
      case 'video-processing':
        return <VideoIcon color="primary" />
      case 'cleanup-expired-data':
        return <CleanIcon color="info" />
      case 'course-assignment-notification':
      case 'mandatory-course-reminder':
        return <NotificationIcon color="secondary" />
      default:
        return <ScheduleIcon />
    }
  }
  const jobGuidance = [
    'Usa el resumen para confirmar si el problema realmente está en jobs antes de intervenir.',
    'La cola sirve para investigar y recuperar fallos, no para limpiar evidencia demasiado pronto.',
    'El programador ayuda a verificar si las tareas recurrentes siguen vivas.',
    'Recordatorios se monitorean aquí, pero su lógica de negocio vive en asignaciones y notificaciones.',
    'Las acciones manuales son operativas: ejecútalas solo con un objetivo concreto.'
  ]

  if (dashboardLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    )
  }

  if (dashboardError) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Error al cargar el dashboard de jobs: {(dashboardError as any)?.message || 'Error desconocido'}
      </Alert>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant='h4' component='h1' sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                Gestión de Jobs del Sistema
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Monitoreo y control de procesos asíncronos
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Button
                variant='outlined'
                startIcon={<DashboardIcon />}
                onClick={() => navigate('/lms/admin')}
                size='small'
              >
                Volver al Dashboard
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 4 }}>
        <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={8}>
                <Typography variant='h5' sx={{ fontWeight: 700, mb: 0.5 }}>
                  Centro Operativo de Jobs
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  Esta pantalla es para soporte y monitoreo técnico, no para el flujo normal de administración académica.
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                  <Chip color='primary' icon={<ScheduleIcon />} label={`${queueStats?.waiting || 0} en cola`} />
                  <Chip color='error' icon={<ErrorIcon />} label={`${failedJobs?.length || 0} fallidos recientes`} />
                </Box>
              </Grid>
            </Grid>
            <Alert severity='info' sx={{ mt: 2 }}>
              <AlertTitle>Cuándo usarlo</AlertTitle>
              Entra aquí cuando haya síntomas concretos: certificados fallando, recordatorios atascados o tareas automáticas detenidas.
            </Alert>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 4 }}>
          <Tab label='Resumen' />
          <Tab label='Cola de Jobs' />
          <Tab label='Programador' />
          <Tab label='Recordatorios' />
          <Tab label='Acciones Manuales' />
        </Tabs>

        <Alert severity='info' sx={{ mb: 3 }}>
          {jobGuidance[activeTab]}
        </Alert>

        {activeTab === 0 && (
          <Box>
            {/* System Status Overview */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader
                    avatar={<ScheduleIcon color='primary' />}
                    title='Jobs en Cola'
                    titleTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                  <CardContent>
                    <Typography variant='h4' component='div' sx={{ fontWeight: 'bold' }}>
                      {queueStats?.waiting || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {queueStats?.active || 0} activos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader
                    avatar={<CheckCircleIcon color='success' />}
                    title='Jobs Completados'
                    titleTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                  <CardContent>
                    <Typography variant='h4' component='div' sx={{ fontWeight: 'bold' }}>
                      {queueStats?.completed || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Últimas 24h
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader
                    avatar={<ErrorIcon color='error' />}
                    title='Jobs Fallidos'
                    titleTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                  <CardContent>
                    <Typography variant='h4' component='div' sx={{ fontWeight: 'bold' }}>
                      {queueStats?.failed || 0}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Requieren atención
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardHeader
                    avatar={<SettingsIcon color='info' />}
                    title='Servicios Activos'
                    titleTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                  <CardContent>
                    <Typography variant='h4' component='div' sx={{ fontWeight: 'bold' }}>
                      {(schedulerStatus?.isRunning ? 1 : 0) + (reminderStatus?.isRunning ? 1 : 0)}/2
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Programador y Recordatorios
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Service Status */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title='Estado de Servicios' />
                  <CardContent>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <ScheduleIcon color={schedulerStatus?.isRunning ? 'success' : 'error'} />
                        </ListItemIcon>
                        <ListItemText
                          primary='Programador de Jobs'
                          secondary={`${schedulerStatus?.totalJobs || 0} jobs programados`}
                        />
                        <Chip
                          label={schedulerStatus?.isRunning ? 'Activo' : 'Detenido'}
                          color={getStatusColor(schedulerStatus?.isRunning ? 'running' : 'stopped') as any}
                          size='small'
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <NotificationIcon color={reminderStatus?.isRunning ? 'success' : 'error'} />
                        </ListItemIcon>
                        <ListItemText
                          primary='Sistema de Recordatorios'
                          secondary='Notificaciones automáticas'
                        />
                        <Chip
                          label={reminderStatus?.isRunning ? 'Activo' : 'Detenido'}
                          color={getStatusColor(reminderStatus?.isRunning ? 'running' : 'stopped') as any}
                          size='small'
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title='Jobs Fallidos Recientes' />
                  <CardContent>
                    {failedLoading ? (
                      <CircularProgress size={24} />
                    ) : failedJobs && failedJobs.length > 0 ? (
                      <List dense>
                        {failedJobs.slice(0, 3).map((job) => (
                          <ListItem key={job.id}>
                            <ListItemIcon>
                              {getJobTypeIcon(job.type)}
                            </ListItemIcon>
                            <ListItemText
                              primary={job.type}
                              secondary={`Error: ${job.error.substring(0, 50)}...`}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title='Reintentar'>
                                <IconButton
                                  size='small'
                                  onClick={() => handleRetryJob(job.id)}
                                  disabled={retryJobMutation.isLoading}
                                >
                                  <RefreshIcon fontSize='small' />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title='Eliminar'>
                                <IconButton
                                  size='small'
                                  onClick={() => handleRemoveJob(job.id)}
                                  disabled={removeJobMutation.isLoading}
                                >
                                  <DeleteIcon fontSize='small' />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        No hay jobs fallidos recientes
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            {/* Queue Management */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>Gestión de Cola de Jobs</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant='outlined'
                  onClick={handleCleanCompleted}
                  disabled={cleanCompletedMutation.isLoading}
                  startIcon={<CleanIcon />}
                >
                  Limpiar Completados
                </Button>
                <Button
                  variant='outlined'
                  color='warning'
                  onClick={handlePauseQueue}
                  disabled={pauseQueueMutation.isLoading}
                  startIcon={<StopIcon />}
                >
                  Pausar Cola
                </Button>
                <Button
                  variant='contained'
                  onClick={handleResumeQueue}
                  disabled={resumeQueueMutation.isLoading}
                  startIcon={<PlayIcon />}
                >
                  Reanudar Cola
                </Button>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader title='Jobs Fallidos' />
                  <CardContent>
                    {failedLoading ? (
                      <CircularProgress />
                    ) : failedJobs && failedJobs.length > 0 ? (
                      <List>
                        {failedJobs.map((job) => (
                          <React.Fragment key={job.id}>
                            <ListItem>
                              <ListItemIcon>
                                {getJobTypeIcon(job.type)}
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant='body1'>{job.type}</Typography>
                                    <Chip label={`${job.attempts} intentos`} size='small' />
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant='body2' color='error'>
                                      {job.error}
                                    </Typography>
                                    <Typography variant='caption' color='text.secondary'>
                                      {new Date(job.timestamp).toLocaleString()}
                                    </Typography>
                                  </Box>
                                }
                              />
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size='small'
                                  variant='outlined'
                                  onClick={() => handleRetryJob(job.id)}
                                  disabled={retryJobMutation.isLoading}
                                  startIcon={<RefreshIcon />}
                                >
                                  Reintentar
                                </Button>
                                <Button
                                  size='small'
                                  variant='outlined'
                                  color='error'
                                  onClick={() => handleRemoveJob(job.id)}
                                  disabled={removeJobMutation.isLoading}
                                  startIcon={<DeleteIcon />}
                                >
                                  Eliminar
                                </Button>
                              </Box>
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        ))}
                      </List>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        No hay jobs fallidos
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader title='Estadísticas de Cola' />
                  <CardContent>
                    {queueLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      <Box sx={{ space: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant='body2'>En Espera</Typography>
                          <Typography variant='h6'>{queueStats?.waiting || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant='body2'>Activos</Typography>
                          <Typography variant='h6' color='primary.main'>{queueStats?.active || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant='body2'>Completados</Typography>
                          <Typography variant='h6' color='success.main'>{queueStats?.completed || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant='body2'>Fallidos</Typography>
                          <Typography variant='h6' color='error.main'>{queueStats?.failed || 0}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                          <Typography variant='body2'>Retrasados</Typography>
                          <Typography variant='h6' color='warning.main'>{queueStats?.delayed || 0}</Typography>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant='body1' fontWeight='bold'>Total</Typography>
                          <Typography variant='h6' fontWeight='bold'>{queueStats?.total || 0}</Typography>
                        </Box>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            {/* Scheduler Management */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>Programador de Jobs</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {schedulerStatus?.isRunning ? (
                  <Button
                    variant='outlined'
                    color='error'
                    onClick={handleStopScheduler}
                    disabled={stopSchedulerMutation.isLoading}
                    startIcon={<StopIcon />}
                  >
                    Detener Programador
                  </Button>
                ) : (
                  <Button
                    variant='contained'
                    onClick={handleStartScheduler}
                    disabled={startSchedulerMutation.isLoading}
                    startIcon={<PlayIcon />}
                  >
                    Iniciar Programador
                  </Button>
                )}
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader title='Jobs Programados' />
                  <CardContent>
                    <List>
                      {schedulerStatus?.jobs && Object.entries(schedulerStatus.jobs).map(([jobName, jobInfo]) => (
                        <React.Fragment key={jobName}>
                          <ListItem>
                            <ListItemIcon>
                              <ScheduleIcon color={jobInfo.running ? 'success' : 'disabled'} />
                            </ListItemIcon>
                            <ListItemText
                              primary={jobName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              secondary={`Estado: ${jobInfo.running ? 'Activo' : 'Inactivo'}`}
                            />
                            <Button
                              size='small'
                              variant='outlined'
                              onClick={() => handleRunScheduledJob(jobName)}
                              disabled={runScheduledJobMutation.isLoading || !schedulerStatus?.isRunning}
                              startIcon={<PlayIcon />}
                            >
                              Ejecutar Ahora
                            </Button>
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader title='Estado del Programador' />
                  <CardContent>
                    <Box sx={{ space: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant='body2'>Estado</Typography>
                        <Chip
                          label={schedulerStatus?.isRunning ? 'Activo' : 'Detenido'}
                          color={schedulerStatus?.isRunning ? 'success' : 'error'}
                          size='small'
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant='body2'>Jobs Programados</Typography>
                        <Typography variant='h6'>{schedulerStatus?.totalJobs || 0}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            {/* Reminder Jobs Management */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>Sistema de Recordatorios</Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                {reminderStatus?.isRunning ? (
                  <Button
                    variant='outlined'
                    color='error'
                    onClick={handleStopReminders}
                    disabled={stopRemindersMutation.isLoading}
                    startIcon={<StopIcon />}
                  >
                    Detener Recordatorios
                  </Button>
                ) : (
                  <Button
                    variant='contained'
                    onClick={handleStartReminders}
                    disabled={startRemindersMutation.isLoading}
                    startIcon={<PlayIcon />}
                  >
                    Iniciar Recordatorios
                  </Button>
                )}
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader title='Jobs de Recordatorio' />
                  <CardContent>
                    <List>
                      {reminderStatus?.jobs && Object.entries(reminderStatus.jobs).map(([jobName, jobInfo]) => (
                        <React.Fragment key={jobName}>
                          <ListItem>
                            <ListItemIcon>
                              <NotificationIcon color={jobInfo.active ? 'success' : 'disabled'} />
                            </ListItemIcon>
                            <ListItemText
                              primary={jobName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              secondary={
                                <Box>
                                  <Typography variant='body2'>
                                    Estado: {jobInfo.active ? 'Activo' : 'Inactivo'}
                                  </Typography>
                                  {jobInfo.nextRun && (
                                    <Typography variant='caption' color='text.secondary'>
                                      Próxima ejecución: {jobInfo.nextRun}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                            <Button
                              size='small'
                              variant='outlined'
                              onClick={() => handleRunReminderJob(jobName)}
                              disabled={runReminderJobMutation.isLoading || !reminderStatus?.isRunning}
                              startIcon={<PlayIcon />}
                            >
                              Ejecutar Ahora
                            </Button>
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card>
                  <CardHeader title='Estadísticas de Recordatorios' />
                  <CardContent>
                    {statistics ? (
                      <Box sx={{ space: 2 }}>
                        <Typography variant='subtitle2' gutterBottom>
                          Notificaciones Enviadas (Total)
                        </Typography>
                        {Object.entries(statistics.totalNotificationsSent).map(([jobType, count]) => (
                          <Box key={jobType} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant='body2'>
                              {jobType.replace(/([A-Z])/g, ' $1').trim()}
                            </Typography>
                            <Typography variant='body2' fontWeight='bold'>
                              {count}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant='body2' color='text.secondary'>
                        Cargando estadísticas...
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 4 && (
          <Box>
            {/* Manual Actions */}
            <Typography variant='h6' gutterBottom>
              Acciones Manuales
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title='Generación de Contenido' />
                  <CardContent>
                    <Box sx={{ space: 2 }}>
                      <Button
                        fullWidth
                        variant='outlined'
                        startIcon={<CertificateIcon />}
                        onClick={() => setCertificateDialogOpen(true)}
                        sx={{ mb: 2 }}
                      >
                        Generar Certificado
                      </Button>
                      <Button
                        fullWidth
                        variant='outlined'
                        startIcon={<VideoIcon />}
                        onClick={() => setVideoDialogOpen(true)}
                      >
                        Procesar Video
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader title='Limpieza del Sistema' />
                  <CardContent>
                    <Box sx={{ space: 2 }}>
                      <Button
                        fullWidth
                        variant='outlined'
                        startIcon={<CleanIcon />}
                        onClick={() => setCleanupDialogOpen(true)}
                        sx={{ mb: 2 }}
                      >
                        Limpieza Personalizada
                      </Button>
                      <Button
                        fullWidth
                        variant='outlined'
                        startIcon={<DeleteIcon />}
                        onClick={handleCleanQuizAttempts}
                        disabled={cleanQuizAttemptsMutation.isLoading}
                      >
                        Limpiar Intentos de Quiz Antiguos
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>

      {/* Dialogs */}
      <Dialog open={cleanupDialogOpen} onClose={() => setCleanupDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Configurar Limpieza</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, space: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={cleanupOptions.cleanTempFiles}
                  onChange={(e) => setCleanupOptions(prev => ({ ...prev, cleanTempFiles: e.target.checked }))}
                />
              }
              label='Limpiar archivos temporales'
            />
            <FormControlLabel
              control={
                <Switch
                  checked={cleanupOptions.cleanExpiredSessions}
                  onChange={(e) => setCleanupOptions(prev => ({ ...prev, cleanExpiredSessions: e.target.checked }))}
                />
              }
              label='Limpiar sesiones expiradas'
            />
            <FormControlLabel
              control={
                <Switch
                  checked={cleanupOptions.cleanOldLogs}
                  onChange={(e) => setCleanupOptions(prev => ({ ...prev, cleanOldLogs: e.target.checked }))}
                />
              }
              label='Limpiar logs antiguos'
            />
            <FormControlLabel
              control={
                <Switch
                  checked={cleanupOptions.cleanFailedJobs}
                  onChange={(e) => setCleanupOptions(prev => ({ ...prev, cleanFailedJobs: e.target.checked }))}
                />
              }
              label='Limpiar jobs fallidos'
            />
            <TextField
              fullWidth
              label='Días de antigüedad'
              type='number'
              value={cleanupOptions.olderThanDays}
              onChange={(e) => setCleanupOptions(prev => ({ ...prev, olderThanDays: parseInt(e.target.value) }))}
              sx={{ mt: 2 }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCleanupDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleTriggerCleanup} variant='contained' disabled={triggerCleanupMutation.isLoading}>
            Iniciar Limpieza
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={certificateDialogOpen} onClose={() => setCertificateDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Generar Certificado</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label='ID del Certificado'
            type='number'
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCertificateDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleTriggerCertificate} variant='contained' disabled={triggerCertificateMutation.isLoading}>
            Generar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={videoDialogOpen} onClose={() => setVideoDialogOpen(false)} maxWidth='sm' fullWidth>
        <DialogTitle>Procesar Video</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label='Ruta del Video'
            value={videoPath}
            onChange={(e) => setVideoPath(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVideoDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleTriggerVideo} variant='contained' disabled={triggerVideoMutation.isLoading}>
            Procesar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsJobManagement
