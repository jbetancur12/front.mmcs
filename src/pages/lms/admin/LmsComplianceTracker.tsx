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
  CircularProgress
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
  Error as ErrorIcon
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

  // Fetch mandatory training status from API
  const { data: trainingData, isLoading, error } = useMandatoryTrainingStatus({
    includeCompleted: true
  })

  // Transform API data to component format
  const complianceRecords = useMemo(() => {
    if (!trainingData || !trainingData.data || !trainingData.data.mandatoryTraining) {
      return []
    }

    return trainingData.data.mandatoryTraining.map((training: any, index: number) => ({
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
    if (!trainingData || !trainingData.data) return []

    const summary = trainingData.data.summary || {}

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

  const overdueRecords = complianceRecords.filter(r => r.isOverdue)
  const approachingDeadline = complianceRecords.filter(r => !r.isOverdue && r.daysUntilDeadline <= 7 && r.status !== 'completed')
  const completedRecords = complianceRecords.filter(r => r.status === 'completed')

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
                <Button size="small" color="inherit">
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
        <Tab label={`Todos (${complianceRecords.length})`} />
        <Tab label={`Vencidos (${overdueRecords.length})`} />
        <Tab label={`Próximos a vencer (${approachingDeadline.length})`} />
        <Tab label={`Completados (${completedRecords.length})`} />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <CardHeader 
            title="Todos los Registros de Cumplimiento"
            action={
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button startIcon={<FilterListIcon />} size="small">
                  Filtros
                </Button>
                <Button startIcon={<DownloadIcon />} size="small">
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
                  {complianceRecords.map((record) => (
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
                          <IconButton size="small" title="Ver detalles">
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
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <CardHeader title="Cursos Vencidos - Acción Requerida" />
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardHeader title="Próximos Vencimientos (7 días)" />
          <CardContent>
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
          </CardContent>
        </Card>
      )}

      {activeTab === 3 && (
        <Card>
          <CardHeader title="Cursos Completados" />
          <CardContent>
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
          </CardContent>
        </Card>
      )}

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
    </Box>
  )
}

export default LmsComplianceTracker