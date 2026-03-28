import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  IconButton,
  Paper,
  Stack,
  Alert,
  Skeleton,
  Tooltip,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox
} from '@mui/material'
import {
  Notifications as NotificationsIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  Email as EmailIcon,
  Settings as SettingsIcon
} from '@mui/icons-material'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts'
import { 
  useReminderAnalytics, 
  usePendingNotificationStatus, 
  useTriggerManualReminders,
  useMandatoryTrainingAnalytics 
} from '../../../hooks/useLms'

// Color palette
const colors = {
  primary: '#10b981',
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#3b82f6',
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    700: '#374151',
    800: '#1f2937'
  }
}

interface ReminderSystemIntegrationProps {
  onSettingsClick?: () => void
}

const ReminderSystemIntegration: React.FC<ReminderSystemIntegrationProps> = ({
  onSettingsClick
}) => {
  const [manualReminderDialog, setManualReminderDialog] = useState(false)
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([])
  const [customMessage, setCustomMessage] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('week')

  // Fetch reminder analytics
  const {
    data: reminderAnalytics,
    isLoading: analyticsLoading,
    error: analyticsError,
    refetch: refetchAnalytics
  } = useReminderAnalytics({
    startDate: getStartDate(selectedPeriod),
    endDate: new Date().toISOString()
  })

  // Fetch pending notification status
  const {
    data: pendingStatus,
    isLoading: statusLoading,
    error: statusError,
    refetch: refetchStatus
  } = usePendingNotificationStatus()

  // Fetch mandatory training data for manual reminders
  const {
    data: mandatoryTrainingData
  } = useMandatoryTrainingAnalytics({
    includeEscalation: true
  })

  // Manual reminder mutation
  const triggerManualRemindersMutation = useTriggerManualReminders()

  function getStartDate(period: string): string {
    const now = new Date()
    switch (period) {
      case 'day':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case 'month':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  }

  const handleRefresh = () => {
    refetchAnalytics()
    refetchStatus()
  }

  const handleTriggerManualReminders = () => {
    if (selectedAssignments.length === 0) return

    triggerManualRemindersMutation.mutate({
      assignmentIds: selectedAssignments,
      customMessage: customMessage || undefined
    }, {
      onSuccess: () => {
        setManualReminderDialog(false)
        setSelectedAssignments([])
        setCustomMessage('')
      }
    })
  }

  const analytics = reminderAnalytics?.analytics || {}
  const pending = pendingStatus || {}
  const courses = mandatoryTrainingData?.courses || []

  // Prepare effectiveness chart data
  const effectivenessData = Object.entries(analytics.byType || {}).map(([type, data]: [string, any]) => ({
    type: type.replace('_', ' ').toUpperCase(),
    readRate: data.readRate,
    actionRate: data.actionRate,
    total: data.total
  }))

  // Prepare delivery status pie chart
  const deliveryData = [
    { name: 'Enviados', value: analytics.deliveryStatus?.sent || 0, color: colors.info },
    { name: 'Entregados', value: analytics.deliveryStatus?.delivered || 0, color: colors.primary },
    { name: 'Leídos', value: analytics.deliveryStatus?.read || 0, color: colors.warning },
    { name: 'Con Acción', value: analytics.deliveryStatus?.acted || 0, color: colors.success }
  ].filter(item => item.value > 0)

  if (analyticsLoading || statusLoading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Sistema de Recordatorios Automáticos
          </Typography>
          <Stack spacing={2}>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} variant="rectangular" height={80} />
            ))}
          </Stack>
        </CardContent>
      </Card>
    )
  }

  if (analyticsError || statusError) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Alert severity="error">
            Error al cargar datos del sistema de recordatorios
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" fontWeight="bold">
            Sistema de Recordatorios Automáticos
          </Typography>
          <Box display="flex" gap={1}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Período</InputLabel>
              <Select
                value={selectedPeriod}
                label="Período"
                onChange={(e) => setSelectedPeriod(e.target.value)}
              >
                <MenuItem value="day">Último Día</MenuItem>
                <MenuItem value="week">Última Semana</MenuItem>
                <MenuItem value="month">Último Mes</MenuItem>
              </Select>
            </FormControl>
            <Tooltip title="Configurar recordatorios">
              <IconButton onClick={onSettingsClick} size="small">
                <SettingsIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Actualizar datos">
              <IconButton onClick={handleRefresh} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                background: `linear-gradient(135deg, ${colors.info} 0%, #2563eb 100%)`,
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {reminderAnalytics?.totalReminders || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Recordatorios Enviados
                  </Typography>
                </Box>
                <SendIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                background: pending.total > 0 
                  ? `linear-gradient(135deg, ${colors.warning} 0%, #ea580c 100%)`
                  : `linear-gradient(135deg, ${colors.success} 0%, #047857 100%)`,
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {pending.total || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Notificaciones Pendientes
                  </Typography>
                </Box>
                <Badge badgeContent={pending.byPriority?.high || 0} color="error">
                  <NotificationsIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Badge>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                background: `linear-gradient(135deg, ${colors.success} 0%, #047857 100%)`,
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {analytics.byPriority?.high?.actionRate || 0}%
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tasa de Respuesta
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                background: pending.averageAge > 24 
                  ? `linear-gradient(135deg, ${colors.error} 0%, #b91c1c 100%)`
                  : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.success} 100%)`,
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {pending.averageAge || 0}h
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    Tiempo Promedio Pendiente
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3} mb={3}>
          {/* Effectiveness Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Efectividad por Tipo de Recordatorio
              </Typography>
              <Box height={250}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={effectivenessData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="type" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      fontSize={12}
                    />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="readRate" fill={colors.warning} name="Tasa de Lectura %" />
                    <Bar dataKey="actionRate" fill={colors.success} name="Tasa de Acción %" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Delivery Status Pie Chart */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Estado de Entrega de Notificaciones
              </Typography>
              <Box height={250}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deliveryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {deliveryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Manual Reminder Section */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              Recordatorios Manuales
            </Typography>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => setManualReminderDialog(true)}
              sx={{
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.success} 100%)`
              }}
            >
              Enviar Recordatorio Manual
            </Button>
          </Box>
          
          <Typography variant="body2" color="textSecondary">
            Envía recordatorios personalizados para cursos obligatorios específicos.
          </Typography>
        </Paper>

        {/* Pending Notifications Details */}
        {pending.total > 0 && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Notificaciones Pendientes de Entrega
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Por Tipo:
                </Typography>
                <List dense>
                  {Object.entries(pending.byType || {}).map(([type, count]: [string, any]) => (
                    <ListItem key={type}>
                      <ListItemIcon>
                        <EmailIcon color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={type.replace('_', ' ').toUpperCase()}
                        secondary={`${count} notificaciones`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Por Prioridad:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Alta Prioridad"
                      secondary={`${pending.byPriority?.high || 0} notificaciones`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Prioridad Normal"
                      secondary={`${pending.byPriority?.normal || 0} notificaciones`}
                    />
                  </ListItem>
                </List>
              </Grid>
            </Grid>

            {pending.oldestPending && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                La notificación más antigua lleva {pending.oldestPending.ageHours} horas pendiente de entrega.
              </Alert>
            )}
          </Paper>
        )}
      </CardContent>

      {/* Manual Reminder Dialog */}
      <Dialog
        open={manualReminderDialog}
        onClose={() => setManualReminderDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <SendIcon color="primary" />
            Enviar Recordatorio Manual
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Selecciona los cursos para los cuales deseas enviar recordatorios manuales.
          </Typography>
          
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              Cursos Obligatorios Disponibles:
            </Typography>
            <List>
              {courses.map((course: any) => (
                <ListItem key={course.courseId}>
                  <ListItemIcon>
                    <Checkbox
                      checked={selectedAssignments.includes(course.courseId)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (e.target.checked) {
                          setSelectedAssignments(prev => [...prev, course.courseId])
                        } else {
                          setSelectedAssignments(prev => prev.filter(id => id !== course.courseId))
                        }
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={course.courseTitle}
                    secondary={`${course.progress?.notStarted || 0} usuarios sin iniciar, ${course.deadlines?.overdue || 0} vencidos`}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Mensaje personalizado (opcional)"
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Ingresa un mensaje personalizado para el recordatorio..."
            helperText="Si no se especifica, se usará el mensaje predeterminado"
          />
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => setManualReminderDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleTriggerManualReminders}
            disabled={selectedAssignments.length === 0 || triggerManualRemindersMutation.isLoading}
            startIcon={<SendIcon />}
          >
            {triggerManualRemindersMutation.isLoading ? 'Enviando...' : 'Enviar Recordatorios'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default ReminderSystemIntegration
