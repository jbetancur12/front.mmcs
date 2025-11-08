import React, { useState, useMemo } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  LinearProgress,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Popover,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider
} from '@mui/material'
import {
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
  Send as SendIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  FilterList as FilterListIcon,
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Close as CloseIcon,
  School as SchoolIcon
} from '@mui/icons-material'
import { useMandatoryTrainingStatus } from '../../../hooks/useLms'

interface ComplianceRecord {
  id: number
  userId: number
  userName: string
  userEmail: string
  department: string
  courseId: number
  courseTitle: string
  assignedDate: string
  deadline: string
  completedDate?: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
  progress: number
  daysUntilDeadline: number
  isOverdue: boolean
}

interface ComplianceAlert {
  id: number
  type: 'deadline_approaching' | 'overdue' | 'not_started'
  message: string
  count: number
  severity: 'warning' | 'error' | 'info'
}

const LmsComplianceTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [reminderMessage, setReminderMessage] = useState('')
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false)
  const [detailsRecord, setDetailsRecord] = useState<ComplianceRecord | null>(null)

  // Filtros
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [filters, setFilters] = useState({
    status: [] as string[],
    department: '',
    courseId: null as number | null,
    daysUntilDeadline: null as number | null
  })

  // Fetch mandatory training status from API
  const { data: trainingData, isLoading, error } = useMandatoryTrainingStatus({
    includeCompleted: true
  })

  // Transform API data to component format
  const complianceRecords = useMemo(() => {
    if (!trainingData || !trainingData.mandatoryTraining) {
      return []
    }

    return trainingData.mandatoryTraining.map((training: any, index: number) => ({
      id: training.assignmentId || index,
      userId: training.userId,
      userName: training.userName,
      userEmail: training.userEmail || 'N/A',
      department: training.department || training.role || 'N/A',
      courseId: training.courseId,
      courseTitle: training.courseTitle,
      assignedDate: training.assignedDate,
      deadline: training.deadline,
      completedDate: training.completedDate,
      progress: training.progress || 0,
      status: training.status,
      daysUntilDeadline: training.daysUntilDeadline || 0,
      isOverdue: training.isOverdue || false
    }))
  }, [trainingData])

  // Calculate compliance alerts from data
  const complianceAlerts = useMemo((): ComplianceAlert[] => {
    if (!trainingData) return []

    const summary = trainingData.summary || {}

    return [
      {
        id: 1,
        type: 'overdue',
        message: 'Cursos vencidos que requieren atención inmediata',
        count: summary.overdue || 0,
        severity: 'error'
      },
      {
        id: 2,
        type: 'deadline_approaching',
        message: 'Cursos que vencen en los próximos 7 días',
        count: complianceRecords.filter(r => !r.isOverdue && r.daysUntilDeadline <= 7 && r.status !== 'completed').length,
        severity: 'warning'
      },
      {
        id: 3,
        type: 'not_started',
        message: 'Usuarios que no han comenzado cursos asignados',
        count: summary.pending || 0,
        severity: 'info'
      }
    ]
  }, [trainingData, complianceRecords])

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'overdue':
        return 'error'
      case 'in_progress':
        return 'warning'
      case 'pending':
        return 'info'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado'
      case 'overdue':
        return 'Vencido'
      case 'in_progress':
        return 'En Progreso'
      case 'pending':
        return 'Pendiente'
      default:
        return status
    }
  }

  const handleSendReminder = (record: ComplianceRecord) => {
    setSelectedRecord(record)
    setReminderMessage(`Recordatorio: El curso "${record.courseTitle}" ${record.isOverdue ? 'está vencido' : `vence el ${new Date(record.deadline).toLocaleDateString()}`}. Por favor, completa las lecciones restantes.`)
    setOpenDialog(true)
  }

  const handleSendReminderConfirm = () => {
    // Lógica para enviar recordatorio
    console.log('Sending reminder to:', selectedRecord?.userEmail, 'Message:', reminderMessage)
    setOpenDialog(false)
    setReminderMessage('')
    setSelectedRecord(null)
  }

  const handleViewDetails = (record: ComplianceRecord) => {
    setDetailsRecord(record)
    setOpenDetailsDialog(true)
  }

  const handleCloseDetails = () => {
    setOpenDetailsDialog(false)
    setDetailsRecord(null)
  }

  const handleAlertClick = (alertType: string) => {
    // Apply specific filters based on alert type (clear others)
    switch (alertType) {
      case 'overdue':
        setFilters({
          status: ['overdue'],
          department: '',
          courseId: null,
          daysUntilDeadline: null
        })
        setActiveTab(1) // Go to "Vencidos" tab
        break
      case 'deadline_approaching':
        setFilters({
          status: [],
          department: '',
          courseId: null,
          daysUntilDeadline: 7
        })
        setActiveTab(2) // Go to "Próximos a vencer" tab
        break
      case 'not_started':
        setFilters({
          status: ['pending'],
          department: '',
          courseId: null,
          daysUntilDeadline: null
        })
        setActiveTab(0) // Go to "Todos" tab
        break
    }
  }

  // Apply filters to compliance records
  const filteredRecords = useMemo(() => {
    let filtered = complianceRecords

    // Filter by status
    if (filters.status.length > 0) {
      filtered = filtered.filter(r => filters.status.includes(r.status))
    }

    // Filter by department
    if (filters.department) {
      filtered = filtered.filter(r => r.department === filters.department)
    }

    // Filter by course
    if (filters.courseId) {
      filtered = filtered.filter(r => r.courseId === filters.courseId)
    }

    // Filter by days until deadline
    if (filters.daysUntilDeadline !== null) {
      filtered = filtered.filter(r => r.daysUntilDeadline <= filters.daysUntilDeadline!)
    }

    return filtered
  }, [complianceRecords, filters])

  const overdueRecords = filteredRecords.filter(r => r.isOverdue)
  const approachingDeadline = filteredRecords.filter(r => !r.isOverdue && r.daysUntilDeadline <= 7 && r.status !== 'completed')
  const completedRecords = filteredRecords.filter(r => r.status === 'completed')

  // Get unique values for filter options
  const uniqueDepartments = useMemo(() => {
    return Array.from(new Set(complianceRecords.map(r => r.department))).filter(d => d && d !== 'N/A')
  }, [complianceRecords])

  const uniqueCourses = useMemo(() => {
    const courseMap = new Map<number, string>()
    complianceRecords.forEach(r => {
      if (!courseMap.has(r.courseId)) {
        courseMap.set(r.courseId, r.courseTitle)
      }
    })
    return Array.from(courseMap.entries()).map(([id, title]) => ({ id, title }))
  }, [complianceRecords])

  // Group records by course
  const recordsByCourse = useMemo(() => {
    const grouped = new Map<number, { courseTitle: string; records: ComplianceRecord[] }>()

    filteredRecords.forEach(record => {
      if (!grouped.has(record.courseId)) {
        grouped.set(record.courseId, {
          courseTitle: record.courseTitle,
          records: []
        })
      }
      grouped.get(record.courseId)!.records.push(record)
    })

    return Array.from(grouped.entries()).map(([courseId, data]) => ({
      courseId,
      courseTitle: data.courseTitle,
      records: data.records,
      totalUsers: data.records.length,
      completedUsers: data.records.filter(r => r.status === 'completed').length,
      overdueUsers: data.records.filter(r => r.isOverdue).length,
      completionRate: Math.round((data.records.filter(r => r.status === 'completed').length / data.records.length) * 100)
    }))
  }, [filteredRecords])

  // Export to CSV
  const handleExport = () => {
    const headers = ['Usuario', 'Email', 'Curso', 'Departamento', 'Estado', 'Progreso', 'Fecha límite', 'Días restantes']
    const rows = filteredRecords.map(r => [
      r.userName,
      r.userEmail,
      r.courseTitle,
      r.department,
      getStatusLabel(r.status),
      `${r.progress}%`,
      new Date(r.deadline).toLocaleDateString(),
      r.isOverdue ? `Vencido hace ${Math.abs(r.daysUntilDeadline)} días` : `${r.daysUntilDeadline} días`
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `compliance_tracker_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenFilters = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterAnchorEl(event.currentTarget)
  }

  const handleCloseFilters = () => {
    setFilterAnchorEl(null)
  }

  const handleStatusFilterChange = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: prev.status.includes(status)
        ? prev.status.filter(s => s !== status)
        : [...prev.status, status]
    }))
  }

  const handleClearFilters = () => {
    setFilters({
      status: [],
      department: '',
      courseId: null,
      daysUntilDeadline: null
    })
  }

  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.status.length > 0) count++
    if (filters.department) count++
    if (filters.courseId) count++
    if (filters.daysUntilDeadline !== null) count++
    return count
  }, [filters])

  const openFiltersPopover = Boolean(filterAnchorEl)

  // Loading state
  if (isLoading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Cargando datos de cumplimiento...
          </Typography>
        </Box>
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
          <ErrorIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" color="error" gutterBottom>
            Error al cargar datos de cumplimiento
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {error instanceof Error ? error.message : 'No se pudieron cargar los datos'}
          </Typography>
          <Button variant="contained" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Seguimiento de Cumplimiento
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitorea el progreso de cursos obligatorios y gestiona vencimientos (Solo usuarios internos)
        </Typography>
      </Box>

      {/* Alertas de cumplimiento */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {complianceAlerts.map((alert) => (
          <Grid item xs={12} md={4} key={alert.id}>
            <Alert
              severity={alert.severity}
              action={
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => handleAlertClick(alert.type)}
                >
                  Ver detalles
                </Button>
              }
            >
              <Typography variant="body2" fontWeight="medium">
                {alert.count} {alert.message}
              </Typography>
            </Alert>
          </Grid>
        ))}
      </Grid>

      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab label={`Todos (${filteredRecords.length})`} />
        <Tab label={`Vencidos (${overdueRecords.length})`} />
        <Tab label={`Próximos a vencer (${approachingDeadline.length})`} />
        <Tab label={`Completados (${completedRecords.length})`} />
        <Tab label={`Por Cursos (${recordsByCourse.length})`} />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <CardHeader 
            title="Todos los Registros de Cumplimiento"
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<FilterListIcon />}
                  size="small"
                  onClick={handleOpenFilters}
                  variant={activeFiltersCount > 0 ? 'contained' : 'outlined'}
                  color={activeFiltersCount > 0 ? 'primary' : 'inherit'}
                >
                  Filtros {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                </Button>
                <Button
                  startIcon={<DownloadIcon />}
                  size="small"
                  onClick={handleExport}
                  variant="outlined"
                >
                  Exportar
                </Button>
              </Box>
            }
          />
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Usuario</TableCell>
                    <TableCell>Curso</TableCell>
                    <TableCell>Departamento</TableCell>
                    <TableCell>Progreso</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell>Fecha límite</TableCell>
                    <TableCell>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                        <Typography variant="body1" color="text.secondary">
                          No se encontraron registros con los filtros aplicados
                        </Typography>
                        <Button
                          variant="text"
                          onClick={handleClearFilters}
                          sx={{ mt: 2 }}
                        >
                          Limpiar filtros
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {record.userName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {record.userEmail}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {record.courseTitle}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={record.department} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={record.progress}
                            sx={{ flex: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption">
                            {record.progress}%
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(record.status)}
                          color={getStatusColor(record.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2"
                          color={record.isOverdue ? 'error.main' : record.daysUntilDeadline <= 7 ? 'warning.main' : 'text.primary'}
                        >
                          {new Date(record.deadline).toLocaleDateString()}
                        </Typography>
                        {record.isOverdue && (
                          <Typography variant="caption" color="error.main">
                            Vencido hace {Math.abs(record.daysUntilDeadline)} días
                          </Typography>
                        )}
                        {!record.isOverdue && record.daysUntilDeadline <= 7 && record.status !== 'completed' && (
                          <Typography variant="caption" color="warning.main">
                            Vence en {record.daysUntilDeadline} días
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <IconButton
                            size="small"
                            title="Ver detalles"
                            onClick={() => handleViewDetails(record)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                          {record.status !== 'completed' && (
                            <IconButton
                              size="small"
                              onClick={() => handleSendReminder(record)}
                              title="Enviar recordatorio"
                            >
                              <SendIcon />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <CardHeader title="Cursos Vencidos - Acción Requerida" />
          <CardContent>
            {overdueRecords.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  ¡No hay cursos vencidos!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Todos los usuarios están al día con sus cursos obligatorios
                </Typography>
              </Box>
            ) : (
              <List>
                {overdueRecords.map((record) => (
                <ListItem key={record.id}>
                  <ListItemIcon>
                    <WarningIcon color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${record.userName} - ${record.courseTitle}`}
                    secondary={`Vencido hace ${Math.abs(record.daysUntilDeadline)} días • Progreso: ${record.progress}%`}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<SendIcon />}
                      onClick={() => handleSendReminder(record)}
                    >
                      Enviar Recordatorio
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardHeader title="Próximos Vencimientos (7 días)" />
          <CardContent>
            {approachingDeadline.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No hay vencimientos próximos
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ningún curso vence en los próximos 7 días
                </Typography>
              </Box>
            ) : (
              <List>
                {approachingDeadline.map((record) => (
                <ListItem key={record.id}>
                  <ListItemIcon>
                    <ScheduleIcon color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${record.userName} - ${record.courseTitle}`}
                    secondary={`Vence en ${record.daysUntilDeadline} días • Progreso: ${record.progress}%`}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      color="warning"
                      startIcon={<SendIcon />}
                      onClick={() => handleSendReminder(record)}
                    >
                      Recordatorio
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Card>
          <CardHeader title="Cursos Completados" />
          <CardContent>
            {completedRecords.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <ScheduleIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No hay cursos completados
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ningún usuario ha completado sus cursos obligatorios aún
                </Typography>
              </Box>
            ) : (
              <List>
                {completedRecords.map((record) => (
                <ListItem key={record.id}>
                  <ListItemIcon>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${record.userName} - ${record.courseTitle}`}
                    secondary={`Completado el ${record.completedDate ? new Date(record.completedDate).toLocaleDateString() : 'N/A'}`}
                  />
                </ListItem>
              ))}
              </List>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 4 && (
        <Card>
          <CardHeader
            title="Cursos Obligatorios - Vista por Curso"
            subheader={`${recordsByCourse.length} cursos con asignaciones`}
            action={
              <Button
                startIcon={<DownloadIcon />}
                size="small"
                onClick={handleExport}
                variant="outlined"
              >
                Exportar
              </Button>
            }
          />
          <CardContent>
            {recordsByCourse.length === 0 ? (
              <Box sx={{ py: 8, textAlign: 'center' }}>
                <SchoolIcon sx={{ fontSize: 64, color: 'action.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No hay cursos con asignaciones
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  No se encontraron cursos obligatorios con usuarios asignados
                </Typography>
              </Box>
            ) : (
              recordsByCourse.map((course) => (
              <Accordion key={course.courseId} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    <SchoolIcon color="primary" />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                        {course.courseTitle}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {course.totalUsers} usuarios asignados
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mr: 2 }}>
                      <Chip
                        label={`${course.completionRate}% Completado`}
                        color={course.completionRate >= 80 ? 'success' : course.completionRate >= 50 ? 'warning' : 'error'}
                        size="small"
                      />
                      {course.overdueUsers > 0 && (
                        <Chip
                          label={`${course.overdueUsers} Vencidos`}
                          color="error"
                          size="small"
                          icon={<WarningIcon />}
                        />
                      )}
                    </Box>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Usuario</TableCell>
                          <TableCell>Departamento</TableCell>
                          <TableCell>Progreso</TableCell>
                          <TableCell>Estado</TableCell>
                          <TableCell>Fecha límite</TableCell>
                          <TableCell>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {course.records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight="medium">
                                  {record.userName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {record.userEmail}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip label={record.department} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={record.progress}
                                  sx={{ flex: 1, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="caption">
                                  {record.progress}%
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getStatusLabel(record.status)}
                                color={getStatusColor(record.status) as any}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                color={record.isOverdue ? 'error.main' : record.daysUntilDeadline <= 7 ? 'warning.main' : 'text.primary'}
                              >
                                {new Date(record.deadline).toLocaleDateString()}
                              </Typography>
                              {record.isOverdue && (
                                <Typography variant="caption" color="error.main">
                                  Vencido hace {Math.abs(record.daysUntilDeadline)} días
                                </Typography>
                              )}
                              {!record.isOverdue && record.daysUntilDeadline <= 7 && record.status !== 'completed' && (
                                <Typography variant="caption" color="warning.main">
                                  Vence en {record.daysUntilDeadline} días
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <IconButton
                                  size="small"
                                  title="Ver detalles"
                                  onClick={() => handleViewDetails(record)}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                                {record.status !== 'completed' && (
                                  <IconButton
                                    size="small"
                                    onClick={() => handleSendReminder(record)}
                                    title="Enviar recordatorio"
                                  >
                                    <SendIcon />
                                  </IconButton>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </AccordionDetails>
              </Accordion>
            ))
            )}
          </CardContent>
        </Card>
      )}

      {/* Popover de Filtros */}
      <Popover
        open={openFiltersPopover}
        anchorEl={filterAnchorEl}
        onClose={handleCloseFilters}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 3, minWidth: 320 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Filtros</Typography>
            <IconButton size="small" onClick={handleCloseFilters}>
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider sx={{ mb: 2 }} />

          {/* Estado */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>
              Estado
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.status.includes('pending')}
                    onChange={() => handleStatusFilterChange('pending')}
                  />
                }
                label="Pendiente"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.status.includes('in_progress')}
                    onChange={() => handleStatusFilterChange('in_progress')}
                  />
                }
                label="En Progreso"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.status.includes('completed')}
                    onChange={() => handleStatusFilterChange('completed')}
                  />
                }
                label="Completado"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={filters.status.includes('overdue')}
                    onChange={() => handleStatusFilterChange('overdue')}
                  />
                }
                label="Vencido"
              />
            </FormGroup>
          </Box>

          {/* Departamento */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Departamento</InputLabel>
            <Select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              label="Departamento"
            >
              <MenuItem value="">Todos</MenuItem>
              {uniqueDepartments.map(dept => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Curso */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Curso</InputLabel>
            <Select
              value={filters.courseId || ''}
              onChange={(e) => setFilters(prev => ({ ...prev, courseId: e.target.value ? Number(e.target.value) : null }))}
              label="Curso"
            >
              <MenuItem value="">Todos</MenuItem>
              {uniqueCourses.map(course => (
                <MenuItem key={course.id} value={course.id}>{course.title}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Días hasta vencimiento */}
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel>Días hasta vencimiento</InputLabel>
            <Select
              value={filters.daysUntilDeadline !== null ? filters.daysUntilDeadline : ''}
              onChange={(e) => setFilters(prev => ({ ...prev, daysUntilDeadline: e.target.value ? Number(e.target.value) : null }))}
              label="Días hasta vencimiento"
            >
              <MenuItem value="">Todos</MenuItem>
              <MenuItem value={7}>Próximos 7 días</MenuItem>
              <MenuItem value={14}>Próximos 14 días</MenuItem>
              <MenuItem value={30}>Próximos 30 días</MenuItem>
            </Select>
          </FormControl>

          <Divider sx={{ mb: 2 }} />

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button onClick={handleClearFilters} variant="outlined" size="small">
              Limpiar
            </Button>
            <Button onClick={handleCloseFilters} variant="contained" size="small">
              Aplicar
            </Button>
          </Box>
        </Box>
      </Popover>

      {/* Dialog para enviar recordatorio */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Enviar Recordatorio
        </DialogTitle>
        <DialogContent>
          {selectedRecord && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Para: {selectedRecord.userName} ({selectedRecord.userEmail})
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Curso: {selectedRecord.courseTitle}
              </Typography>
            </Box>
          )}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Mensaje del recordatorio"
            value={reminderMessage}
            onChange={(e) => setReminderMessage(e.target.value)}
            placeholder="Escribe un mensaje personalizado..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={handleSendReminderConfirm}
            startIcon={<SendIcon />}
            disabled={!reminderMessage.trim()}
          >
            Enviar Recordatorio
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de detalles de progreso */}
      <Dialog
        open={openDetailsDialog}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Detalles de Progreso</Typography>
            <IconButton size="small" onClick={handleCloseDetails}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {detailsRecord && (
            <Box>
              {/* Header con información general */}
              <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <PersonIcon color="primary" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Usuario
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {detailsRecord.userName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {detailsRecord.userEmail}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <SchoolIcon color="primary" />
                      <Typography variant="subtitle2" color="text.secondary">
                        Curso
                      </Typography>
                    </Box>
                    <Typography variant="body1" fontWeight="medium">
                      {detailsRecord.courseTitle}
                    </Typography>
                    <Chip
                      label={detailsRecord.department}
                      size="small"
                      variant="outlined"
                      sx={{ mt: 0.5 }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Progreso y Estado */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
                  Progreso General
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Completado
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" color="primary">
                        {detailsRecord.progress}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={detailsRecord.progress}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Estado
                      </Typography>
                      <Chip
                        label={getStatusLabel(detailsRecord.status)}
                        color={getStatusColor(detailsRecord.status) as any}
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Fecha Asignación
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {new Date(detailsRecord.assignedDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ textAlign: 'center', p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Fecha Límite
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight="medium"
                        color={detailsRecord.isOverdue ? 'error.main' : detailsRecord.daysUntilDeadline <= 7 ? 'warning.main' : 'inherit'}
                      >
                        {new Date(detailsRecord.deadline).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Información de tiempo */}
              <Box sx={{ mb: 3 }}>
                <Alert
                  severity={detailsRecord.isOverdue ? 'error' : detailsRecord.daysUntilDeadline <= 7 ? 'warning' : 'info'}
                  icon={detailsRecord.isOverdue ? <WarningIcon /> : <ScheduleIcon />}
                >
                  {detailsRecord.isOverdue ? (
                    <Typography variant="body2">
                      <strong>Vencido hace {Math.abs(detailsRecord.daysUntilDeadline)} días</strong> - Se requiere acción inmediata
                    </Typography>
                  ) : detailsRecord.status === 'completed' ? (
                    <Typography variant="body2">
                      <strong>Completado el {detailsRecord.completedDate ? new Date(detailsRecord.completedDate).toLocaleDateString() : 'N/A'}</strong>
                    </Typography>
                  ) : (
                    <Typography variant="body2">
                      {detailsRecord.daysUntilDeadline <= 7 ? (
                        <>
                          <strong>Vence en {detailsRecord.daysUntilDeadline} días</strong> - Fecha límite próxima
                        </>
                      ) : (
                        <>
                          Vence en {detailsRecord.daysUntilDeadline} días
                        </>
                      )}
                    </Typography>
                  )}
                </Alert>
              </Box>

              {/* Información adicional */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="medium" sx={{ mb: 2 }}>
                  Información Adicional
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <AssignmentIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          ID de Asignación
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          #{detailsRecord.id}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Rol/Departamento
                        </Typography>
                        <Typography variant="body2" fontWeight="medium">
                          {detailsRecord.department}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Nota informativa */}
              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Para ver el contenido detallado del curso y el progreso completo por módulos y lecciones,
                  haz clic en "Ver Curso Completo" abajo.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>
            Cerrar
          </Button>
          {detailsRecord && detailsRecord.status !== 'completed' && (
            <Button
              variant="outlined"
              startIcon={<SendIcon />}
              onClick={() => {
                handleCloseDetails()
                handleSendReminder(detailsRecord)
              }}
            >
              Enviar Recordatorio
            </Button>
          )}
          <Button
            variant="contained"
            startIcon={<SchoolIcon />}
            onClick={() => {
              if (detailsRecord) {
                window.open(`/lms/courses/${detailsRecord.courseId}`, '_blank')
              }
            }}
          >
            Ver Curso Completo
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsComplianceTracker