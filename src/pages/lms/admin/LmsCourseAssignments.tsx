import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker'

interface Course {
  id: number
  title: string
  description: string
  is_mandatory: boolean
  audience: 'internal' | 'client' | 'both'
}

interface CourseAssignment {
  id: number
  course_id: number
  all_employees: boolean
  role?: string
  deadline?: string
  assigned_at: string
  assigned_by: number
  _count?: {
    users: number
  }
}

interface Role {
  id: number
  name: string
  description: string
}

interface User {
  id: number
  nombre: string
  email: string
  roles: Role[]
}

const LmsCourseAssignments: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [assignToAll, setAssignToAll] = useState(false)
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [snackbar, setSnackbar] = useState({ 
    open: false, 
    message: '', 
    severity: 'success' as 'success' | 'error' 
  })

  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  // Query para obtener el curso
  const { data: course, isLoading: courseLoading } = useQuery<Course>(
    ['lms-course', courseId],
    async () => {
      const response = await axiosPrivate.get(`/lms/courses/${courseId}`)
      return response.data
    }
  )

  // Query para obtener asignaciones del curso
  const { data: assignments = [], isLoading: assignmentsLoading } = useQuery<CourseAssignment[]>(
    ['lms-course-assignments', courseId],
    async () => {
      const response = await axiosPrivate.get(`/lms/courses/${courseId}/assignments`)
      return response.data
    }
  )

  // Query para obtener roles disponibles
  const { data: roles = [] } = useQuery<Role[]>(
    'roles',
    async () => {
      const response = await axiosPrivate.get('/roles')
      return response.data
    }
  )

  // Query para obtener usuarios asignados
  const { data: assignedUsers = [] } = useQuery<User[]>(
    ['lms-course-assigned-users', courseId],
    async () => {
      const response = await axiosPrivate.get(`/lms/courses/${courseId}/assigned-users`)
      return response.data
    }
  )

  // Mutación para crear asignación
  const createAssignmentMutation = useMutation(
    async (assignmentData: {
      all_employees: boolean
      roles?: string[]
      deadline?: string
    }) => {
      return axiosPrivate.post(`/lms/courses/${courseId}/assignments`, assignmentData)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-course-assignments', courseId])
        queryClient.invalidateQueries(['lms-course-assigned-users', courseId])
        handleCloseDialog()
        setSnackbar({
          open: true,
          message: 'Asignación creada exitosamente',
          severity: 'success'
        })
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: 'Error al crear asignación: ' + (error.response?.data?.message || error.message),
          severity: 'error'
        })
      }
    }
  )

  // Mutación para eliminar asignación
  const deleteAssignmentMutation = useMutation(
    async (assignmentId: number) => {
      return axiosPrivate.delete(`/lms/assignments/${assignmentId}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-course-assignments', courseId])
        queryClient.invalidateQueries(['lms-course-assigned-users', courseId])
        setSnackbar({
          open: true,
          message: 'Asignación eliminada exitosamente',
          severity: 'success'
        })
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: 'Error al eliminar asignación: ' + (error.response?.data?.message || error.message),
          severity: 'error'
        })
      }
    }
  )

  const handleOpenDialog = () => {
    setSelectedRoles([])
    setAssignToAll(false)
    setDeadline(null)
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setSelectedRoles([])
    setAssignToAll(false)
    setDeadline(null)
  }

  const handleRoleToggle = (roleName: string) => {
    setSelectedRoles(prev => 
      prev.includes(roleName)
        ? prev.filter(r => r !== roleName)
        : [...prev, roleName]
    )
  }

  const handleSubmit = () => {
    const assignmentData = {
      all_employees: assignToAll,
      roles: assignToAll ? undefined : selectedRoles,
      deadline: deadline ? deadline.toISOString() : undefined
    }

    createAssignmentMutation.mutate(assignmentData)
  }

  const handleDeleteAssignment = (assignmentId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta asignación?')) {
      deleteAssignmentMutation.mutate(assignmentId)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (courseLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography>Cargando curso...</Typography>
      </Box>
    )
  }

  if (!course) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Curso no encontrado
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton
          onClick={() => navigate('/lms/admin/courses')}
          sx={{ mr: 2 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant='h4' component='h1'>
            Asignaciones: {course.title}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Gestiona quién tiene acceso a este curso
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Nueva Asignación
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Información del curso */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardHeader title="Información del Curso" />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Descripción
                </Typography>
                <Typography variant="body2">
                  {course.description}
                </Typography>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Audiencia
                </Typography>
                <Chip 
                  label={course.audience === 'internal' ? 'Empleados' : course.audience === 'client' ? 'Clientes' : 'Ambos'}
                  size="small"
                />
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Tipo
                </Typography>
                <Chip 
                  label={course.is_mandatory ? 'Obligatorio' : 'Opcional'}
                  color={course.is_mandatory ? 'error' : 'default'}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Estadísticas */}
          <Card sx={{ mt: 2 }}>
            <CardHeader title="Estadísticas" />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssignmentIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6">
                    {assignments.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Asignaciones activas
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6">
                    {assignedUsers.length}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Usuarios asignados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Lista de asignaciones */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardHeader title="Asignaciones Activas" />
            <CardContent>
              {assignmentsLoading ? (
                <Typography>Cargando asignaciones...</Typography>
              ) : assignments.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <AssignmentIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                  <Typography color="text.secondary" gutterBottom>
                    No hay asignaciones configuradas
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Crea una asignación para que los usuarios puedan acceder al curso
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Tipo</TableCell>
                        <TableCell>Detalles</TableCell>
                        <TableCell>Fecha límite</TableCell>
                        <TableCell>Asignado</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignments.map((assignment) => (
                        <TableRow key={assignment.id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {assignment.all_employees ? (
                                <>
                                  <GroupIcon sx={{ mr: 1, color: 'primary.main' }} />
                                  <Typography variant="body2">
                                    Todos los empleados
                                  </Typography>
                                </>
                              ) : (
                                <>
                                  <PersonIcon sx={{ mr: 1, color: 'secondary.main' }} />
                                  <Typography variant="body2">
                                    Por rol
                                  </Typography>
                                </>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            {assignment.all_employees ? (
                              <Chip label="Todos" color="primary" size="small" />
                            ) : (
                              <Chip label={assignment.role || 'Rol específico'} size="small" />
                            )}
                          </TableCell>
                          <TableCell>
                            {assignment.deadline ? (
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <ScheduleIcon sx={{ mr: 1, fontSize: 16, color: 'warning.main' }} />
                                <Typography variant="caption">
                                  {formatDate(assignment.deadline)}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography variant="caption" color="text.secondary">
                                Sin fecha límite
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              {formatDate(assignment.assigned_at)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteAssignment(assignment.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>

          {/* Lista de usuarios asignados */}
          {assignedUsers.length > 0 && (
            <Card sx={{ mt: 2 }}>
              <CardHeader title={`Usuarios Asignados (${assignedUsers.length})`} />
              <CardContent>
                <List dense>
                  {assignedUsers.slice(0, 10).map((user) => (
                    <ListItem key={user.id}>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={user.nombre}
                        secondary={`${user.email} • ${user.roles.map(r => r.name).join(', ')}`}
                      />
                    </ListItem>
                  ))}
                  {assignedUsers.length > 10 && (
                    <ListItem>
                      <ListItemText
                        primary={
                          <Typography variant="caption" color="text.secondary">
                            Y {assignedUsers.length - 10} usuarios más...
                          </Typography>
                        }
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>

      {/* Dialog para crear asignación */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Nueva Asignación de Curso</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={assignToAll}
                  onChange={(e) => setAssignToAll(e.target.checked)}
                />
              }
              label="Asignar a todos los empleados"
            />
            
            {!assignToAll && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Seleccionar roles:
                </Typography>
                <List dense>
                  {roles.map((role) => (
                    <ListItem key={role.id} dense>
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={selectedRoles.includes(role.name)}
                          onChange={() => handleRoleToggle(role.name)}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={role.name}
                        secondary={role.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}

            <Box sx={{ mt: 3 }}>
              <DateTimePicker
                label="Fecha límite (opcional)"
                value={deadline}
                onChange={(newValue) => setDeadline(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true
                  }
                }}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={createAssignmentMutation.isLoading || (!assignToAll && selectedRoles.length === 0)}
          >
            {createAssignmentMutation.isLoading ? 'Creando...' : 'Crear Asignación'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default LmsCourseAssignments
