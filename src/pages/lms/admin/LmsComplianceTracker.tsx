import React, { useState } from 'react'
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
  TextField
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
  FilterList as FilterListIcon
} from '@mui/icons-material'

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

// Mock data
const mockComplianceRecords: ComplianceRecord[] = [
  {
    id: 1,
    userId: 1,
    userName: 'Ana López',
    userEmail: 'ana@company.com',
    department: 'Desarrollo',
    courseId: 1,
    courseTitle: 'Seguridad en el Trabajo',
    assignedDate: '2024-01-15',
    deadline: '2024-02-15',
    progress: 75,
    status: 'in_progress',
    daysUntilDeadline: 5,
    isOverdue: false
  },
  {
    id: 2,
    userId: 2,
    userName: 'Carlos Méndez',
    userEmail: 'carlos@company.com',
    department: 'Desarrollo',
    courseId: 2,
    courseTitle: 'Protección de Datos',
    assignedDate: '2024-01-10',
    deadline: '2024-02-10',
    progress: 0,
    status: 'overdue',
    daysUntilDeadline: -2,
    isOverdue: true
  },
  {
    id: 3,
    userId: 3,
    userName: 'María García',
    userEmail: 'maria@company.com',
    department: 'Marketing',
    courseId: 1,
    courseTitle: 'Seguridad en el Trabajo',
    assignedDate: '2024-01-15',
    deadline: '2024-02-15',
    completedDate: '2024-01-25',
    progress: 100,
    status: 'completed',
    daysUntilDeadline: 5,
    isOverdue: false
  }
]

const mockComplianceAlerts: ComplianceAlert[] = [
  {
    id: 1,
    type: 'overdue',
    message: 'Cursos vencidos que requieren atención inmediata',
    count: 12,
    severity: 'error'
  },
  {
    id: 2,
    type: 'deadline_approaching',
    message: 'Cursos que vencen en los próximos 7 días',
    count: 23,
    severity: 'warning'
  },
  {
    id: 3,
    type: 'not_started',
    message: 'Usuarios que no han comenzado cursos asignados',
    count: 8,
    severity: 'info'
  }
]

const LmsComplianceTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [complianceRecords, setComplianceRecords] = useState(mockComplianceRecords)
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [reminderMessage, setReminderMessage] = useState('')

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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Seguimiento de Cumplimiento
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitorea el progreso de cursos obligatorios y gestiona vencimientos
        </Typography>
      </Box>

      {/* Alertas de cumplimiento */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {mockComplianceAlerts.map((alert) => (
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