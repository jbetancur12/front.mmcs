import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  LinearProgress,
  IconButton,
  Paper,
  Divider,
  Stack,
  Alert,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Badge,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material'
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  AccessTime as AccessTimeIcon,
  NotificationImportant as NotificationIcon
} from '@mui/icons-material'
import { useMandatoryTrainingAnalytics } from '../../../hooks/useLms'

// Color palette for consistency
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

interface MandatoryTrainingTrackerProps {
  onCourseClick?: (courseId: number) => void
  onUserClick?: (userId: number) => void
  showBulkActions?: boolean
}

const MandatoryTrainingTracker: React.FC<MandatoryTrainingTrackerProps> = ({
  onCourseClick,
  onUserClick,
  showBulkActions = true
}) => {
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [showEscalationDialog, setShowEscalationDialog] = useState(false)
  const [selectedEscalation, setSelectedEscalation] = useState<any>(null)

  // Fetch mandatory training analytics
  const {
    data: analyticsData,
    isLoading,
    error,
    refetch
  } = useMandatoryTrainingAnalytics({
    status: selectedStatus || undefined,
    includeEscalation: true
  })

  const courses = analyticsData?.courses || []
  const overall = analyticsData?.overall || {}
  const escalationSummary = analyticsData?.escalationSummary || {}

  const handleRefresh = () => {
    refetch()
  }

  const handleEscalationClick = (escalation: any) => {
    setSelectedEscalation(escalation)
    setShowEscalationDialog(true)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return colors.success
      case 'in_progress':
        return colors.info
      case 'overdue':
        return colors.error
      case 'pending':
        return colors.warning
      default:
        return colors.gray[400]
    }
  }

  const getUrgencyLevel = (course: any) => {
    if (course.deadlines?.overdue > 0) return 'critical'
    if (course.deadlines?.dueThisWeek > 0) return 'warning'
    if (course.progress?.completed / course.totalAssigned < 0.5) return 'info'
    return 'normal'
  }

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical':
        return colors.error
      case 'warning':
        return colors.warning
      case 'info':
        return colors.info
      default:
        return colors.gray[400]
    }
  }

  if (isLoading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Seguimiento de Entrenamiento Obligatorio
          </Typography>
          <Stack spacing={2}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" height={60} />
            ))}
          </Stack>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Alert severity="error">
            Error al cargar datos de entrenamiento obligatorio
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
            Seguimiento de Entrenamiento Obligatorio
          </Typography>
          <Box display="flex" gap={1}>
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
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.success} 100%)`,
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {overall.totalMandatoryCourses || 0}
                  </Typography>
                  <Typography variant="body2" opacity={0.9}>
                    Cursos Obligatorios
                  </Typography>
                </Box>
                <AssignmentIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                background: escalationSummary.overdueUsers > 0 
                  ? `linear-gradient(135deg, ${colors.error} 0%, #b91c1c 100%)`
                  : `linear-gradient(135deg, ${colors.success} 0%, #047857 100%)`,
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {escalationSummary.overdueUsers || 0}
                  </Typography>
                  <Typography variant="body2" opacity={0.9}>
                    Usuarios Vencidos
                  </Typography>
                </Box>
                <ErrorIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Paper
              sx={{
                p: 2,
                background: `linear-gradient(135deg, ${colors.warning} 0%, #ea580c 100%)`,
                color: 'white'
              }}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {escalationSummary.urgentDeadlines || 0}
                  </Typography>
                  <Typography variant="body2" opacity={0.9}>
                    Vencen Esta Semana
                  </Typography>
                </Box>
                <ScheduleIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </Paper>
          </Grid>

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
                    {overall.overallCompletionRate || 0}%
                  </Typography>
                  <Typography variant="body2" opacity={0.9}>
                    Tasa de Cumplimiento
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, opacity: 0.8 }} />
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Escalation Alerts */}
        {(escalationSummary.totalCritical > 0 || escalationSummary.totalWarning > 0) && (
          <Alert 
            severity={escalationSummary.totalCritical > 0 ? "error" : "warning"}
            sx={{ mb: 3 }}
            action={
              <Button 
                color="inherit" 
                size="small"
                onClick={() => setShowEscalationDialog(true)}
              >
                Ver Detalles
              </Button>
            }
          >
            {escalationSummary.totalCritical > 0 && (
              <>
                {escalationSummary.totalCritical} alertas críticas requieren atención inmediata.
              </>
            )}
            {escalationSummary.totalWarning > 0 && (
              <>
                {escalationSummary.totalWarning} advertencias de cumplimiento.
              </>
            )}
          </Alert>
        )}

        {/* Filters */}
        <Box display="flex" gap={2} mb={3}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Estado</InputLabel>
            <Select
              value={selectedStatus}
              label="Estado"
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value="pending">Pendiente</MenuItem>
              <MenuItem value="in_progress">En Progreso</MenuItem>
              <MenuItem value="completed">Completado</MenuItem>
              <MenuItem value="overdue">Vencido</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Courses Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: colors.gray[50] }}>
                <TableCell>Curso</TableCell>
                <TableCell align="center">Asignados</TableCell>
                <TableCell align="center">Completados</TableCell>
                <TableCell align="center">Vencidos</TableCell>
                <TableCell align="center">Progreso</TableCell>
                <TableCell align="center">Estado</TableCell>
                <TableCell align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.map((course: any) => {
                const completionRate = course.totalAssigned > 0 
                  ? Math.round((course.progress.completed / course.totalAssigned) * 100)
                  : 0
                const urgencyLevel = getUrgencyLevel(course)
                
                return (
                  <TableRow key={course.courseId} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {course.courseTitle}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                          <Chip
                            size="small"
                            label={urgencyLevel === 'critical' ? 'Crítico' : 
                                  urgencyLevel === 'warning' ? 'Urgente' : 
                                  urgencyLevel === 'info' ? 'Atención' : 'Normal'}
                            color={urgencyLevel === 'critical' ? 'error' : 
                                   urgencyLevel === 'warning' ? 'warning' : 
                                   urgencyLevel === 'info' ? 'info' : 'default'}
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" fontWeight="medium">
                        {course.totalAssigned}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        color={colors.success}
                      >
                        {course.progress.completed}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography 
                        variant="body2" 
                        fontWeight="medium"
                        color={course.deadlines?.overdue > 0 ? colors.error : colors.gray[500]}
                      >
                        {course.deadlines?.overdue || 0}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ minWidth: 80 }}>
                        <LinearProgress
                          variant="determinate"
                          value={completionRate}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: colors.gray[200],
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: completionRate >= 80 ? colors.success :
                                             completionRate >= 50 ? colors.warning : colors.error
                            }
                          }}
                        />
                        <Typography variant="caption" color="textSecondary" mt={0.5}>
                          {completionRate}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        size="small"
                        label={course.courseStatus}
                        color={course.courseStatus === 'published' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => onCourseClick?.(course.courseId)}
                      >
                        Ver Detalles
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {courses.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography color="textSecondary">
              No hay cursos obligatorios configurados
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Escalation Details Dialog */}
      <Dialog
        open={showEscalationDialog}
        onClose={() => setShowEscalationDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <NotificationIcon color="warning" />
            Alertas de Escalación
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" mb={2}>
            Resumen de alertas críticas y advertencias que requieren atención.
          </Typography>
          
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, border: `1px solid ${colors.error}` }}>
                <Typography variant="h6" color="error" gutterBottom>
                  Alertas Críticas ({escalationSummary.totalCritical || 0})
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <ErrorIcon color="error" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Usuarios con entrenamiento vencido"
                      secondary={`${escalationSummary.overdueUsers || 0} usuarios`}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, border: `1px solid ${colors.warning}` }}>
                <Typography variant="h6" color="warning.main" gutterBottom>
                  Advertencias ({escalationSummary.totalWarning || 0})
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon>
                      <WarningIcon color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Vencimientos próximos"
                      secondary={`${escalationSummary.urgentDeadlines || 0} usuarios`}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEscalationDialog(false)}>
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default MandatoryTrainingTracker
// @ts-nocheck
