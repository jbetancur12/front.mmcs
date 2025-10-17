import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  Avatar,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material'
import {
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Send as SendIcon,
  Group as GroupIcon,
  Person as PersonIcon
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'

interface Course {
  id: number
  title: string
  description: string
  duration: string
  category: string
}

interface User {
  id: number
  name: string
  email: string
  role: string
  department: string
}

interface Assignment {
  id: number
  courseId: number
  courseTitle: string
  assignedTo: string[]
  assignedBy: string
  deadline: string
  status: 'active' | 'completed' | 'overdue'
  progress: number
  createdAt: string
  notificationsSent: number
}

// Mock data
const mockCourses: Course[] = [
  {
    id: 1,
    title: 'Seguridad en el Trabajo',
    description: 'Curso obligatorio de seguridad laboral',
    duration: '4 horas',
    category: 'Seguridad'
  },
  {
    id: 2,
    title: 'Protección de Datos',
    description: 'Normativas de protección de datos personales',
    duration: '3 horas',
    category: 'Cumplimiento'
  },
  {
    id: 3,
    title: 'JavaScript Avanzado',
    description: 'Conceptos avanzados de programación',
    duration: '8 horas',
    category: 'Tecnología'
  }
]

const mockUsers: User[] = [
  { id: 1, name: 'Ana López', email: 'ana@company.com', role: 'employee', department: 'Desarrollo' },
  { id: 2, name: 'Carlos Méndez', email: 'carlos@company.com', role: 'employee', department: 'Desarrollo' },
  { id: 3, name: 'María García', email: 'maria@company.com', role: 'employee', department: 'Marketing' },
  { id: 4, name: 'Roberto Silva', email: 'roberto@company.com', role: 'employee', department: 'Ventas' }
]

const mockAssignments: Assignment[] = [
  {
    id: 1,
    courseId: 1,
    courseTitle: 'Seguridad en el Trabajo',
    assignedTo: ['Desarrollo', 'Marketing'],
    assignedBy: 'Admin',
    deadline: '2024-02-15',
    status: 'active',
    progress: 65,
    createdAt: '2024-01-15',
    notificationsSent: 2
  },
  {
    id: 2,
    courseId: 2,
    courseTitle: 'Protección de Datos',
    assignedTo: ['Todos los empleados'],
    assignedBy: 'Admin',
    deadline: '2024-02-10',
    status: 'overdue',
    progress: 30,
    createdAt: '2024-01-10',
    notificationsSent: 5
  }
]

const LmsCourseAssignmentInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0)
  const [assignments, setAssignments] = useState(mockAssignments)
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<number | ''>('')
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [selectedDepartment, setSelectedDepartment] = useState<string>('')
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [assignmentType, setAssignmentType] = useState<'individual' | 'department' | 'all'>('individual')

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleCreateAssignment = () => {
    // Lógica para crear nueva asignación
    console.log('Creating assignment:', {
      courseId: selectedCourse,
      users: selectedUsers,
      department: selectedDepartment,
      deadline,
      type: assignmentType
    })
    setOpenDialog(false)
    // Reset form
    setSelectedCourse('')
    setSelectedUsers([])
    setSelectedDepartment('')
    setDeadline(null)
  }

  const handleSendNotification = (assignmentId: number) => {
    // Lógica para enviar notificación
    console.log('Sending notification for assignment:', assignmentId)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'overdue':
        return 'error'
      case 'active':
        return 'warning'
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
      case 'active':
        return 'Activo'
      default:
        return status
    }
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Asignaciones de Cursos
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Gestiona las asignaciones de cursos y notificaciones
          </Typography>
        </Box>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Asignaciones Activas" />
          <Tab label="Crear Asignación" />
          <Tab label="Notificaciones" />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Asignaciones Activas ({assignments.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setActiveTab(1)}
              >
                Nueva Asignación
              </Button>
            </Box>

            <Grid container spacing={3}>
              {assignments.map((assignment) => (
                <Grid item xs={12} key={assignment.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <AssignmentIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="h6" component="div">
                                {assignment.courseTitle}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Asignado por {assignment.assignedBy} el {new Date(assignment.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Chip
                              label={getStatusLabel(assignment.status)}
                              color={getStatusColor(assignment.status) as any}
                              size="small"
                            />
                          </Box>

                          <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Asignado a:
                              </Typography>
                              <Typography variant="body2">
                                {assignment.assignedTo.join(', ')}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Fecha límite:
                              </Typography>
                              <Typography variant="body2">
                                {new Date(assignment.deadline).toLocaleDateString()}
                              </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Progreso promedio:
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={assignment.progress}
                                  sx={{ flex: 1, height: 6, borderRadius: 3 }}
                                />
                                <Typography variant="caption">
                                  {assignment.progress}%
                                </Typography>
                              </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                              <Typography variant="caption" color="text.secondary">
                                Notificaciones enviadas:
                              </Typography>
                              <Typography variant="body2">
                                {assignment.notificationsSent}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => handleSendNotification(assignment.id)}
                            title="Enviar recordatorio"
                          >
                            <NotificationsIcon />
                          </IconButton>
                          <IconButton size="small" title="Editar asignación">
                            <EditIcon />
                          </IconButton>
                          <IconButton size="small" color="error" title="Eliminar asignación">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Card>
              <CardHeader title="Crear Nueva Asignación" />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Seleccionar Curso</InputLabel>
                      <Select
                        value={selectedCourse}
                        label="Seleccionar Curso"
                        onChange={(e) => setSelectedCourse(e.target.value as number)}
                      >
                        {mockCourses.map((course) => (
                          <MenuItem key={course.id} value={course.id}>
                            {course.title} ({course.duration})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <DatePicker
                      label="Fecha límite"
                      value={deadline}
                      onChange={(newValue) => setDeadline(newValue)}
                      slotProps={{ textField: { fullWidth: true } }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Tipo de Asignación</InputLabel>
                      <Select
                        value={assignmentType}
                        label="Tipo de Asignación"
                        onChange={(e) => setAssignmentType(e.target.value as any)}
                      >
                        <MenuItem value="individual">Usuarios Individuales</MenuItem>
                        <MenuItem value="department">Por Departamento</MenuItem>
                        <MenuItem value="all">Todos los Empleados</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {assignmentType === 'department' && (
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Departamento</InputLabel>
                        <Select
                          value={selectedDepartment}
                          label="Departamento"
                          onChange={(e) => setSelectedDepartment(e.target.value)}
                        >
                          <MenuItem value="Desarrollo">Desarrollo</MenuItem>
                          <MenuItem value="Marketing">Marketing</MenuItem>
                          <MenuItem value="Ventas">Ventas</MenuItem>
                          <MenuItem value="Recursos Humanos">Recursos Humanos</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  {assignmentType === 'individual' && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mb: 2 }}>
                        Seleccionar Usuarios:
                      </Typography>
                      <List>
                        {mockUsers.map((user) => (
                          <ListItem
                            key={user.id}
                            button
                            onClick={() => {
                              if (selectedUsers.includes(user.id)) {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                              } else {
                                setSelectedUsers([...selectedUsers, user.id])
                              }
                            }}
                          >
                            <ListItemIcon>
                              <PersonIcon />
                            </ListItemIcon>
                            <ListItemText
                              primary={user.name}
                              secondary={`${user.email} - ${user.department}`}
                            />
                            <ListItemSecondaryAction>
                              {selectedUsers.includes(user.id) && (
                                <CheckCircleIcon color="success" />
                              )}
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button variant="outlined" onClick={() => setActiveTab(0)}>
                        Cancelar
                      </Button>
                      <Button
                        variant="contained"
                        onClick={handleCreateAssignment}
                        disabled={!selectedCourse || !deadline}
                        startIcon={<AssignmentIcon />}
                      >
                        Crear Asignación
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Centro de Notificaciones
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Notificaciones Pendientes"
                    avatar={<NotificationsIcon color="warning" />}
                  />
                  <CardContent>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <WarningIcon color="warning" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Recordatorio de vencimiento"
                          secondary="Protección de Datos - Vence en 2 días"
                        />
                        <Button size="small" startIcon={<SendIcon />}>
                          Enviar
                        </Button>
                      </ListItem>
                      <Divider />
                      <ListItem>
                        <ListItemIcon>
                          <ScheduleIcon color="info" />
                        </ListItemIcon>
                        <ListItemText
                          primary="Recordatorio semanal"
                          secondary="Seguridad en el Trabajo - Progreso 65%"
                        />
                        <Button size="small" startIcon={<SendIcon />}>
                          Enviar
                        </Button>
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardHeader
                    title="Estadísticas de Notificaciones"
                    avatar={<NotificationsIcon color="primary" />}
                  />
                  <CardContent>
                    <Box sx={{ space: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Enviadas hoy</Typography>
                        <Typography variant="h6" color="primary.main">23</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Esta semana</Typography>
                        <Typography variant="h6" color="success.main">156</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="body2">Tasa de apertura</Typography>
                        <Typography variant="h6" color="info.main">78%</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  )
}

export default LmsCourseAssignmentInterface