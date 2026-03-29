import React, { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  AlertTitle,
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Avatar,
  LinearProgress,
  Tabs,
  Tab
} from '@mui/material'
import {
  Assignment as AssignmentIcon,
  ArrowForward as ArrowForwardIcon,
  AutoStories as CourseIcon,
  Notifications as NotificationsIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Add as AddIcon,
} from '@mui/icons-material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import useAxiosPrivate from '@utils/use-axios-private'
import { useQuery, useQueryClient, useMutation } from 'react-query'
import Swal from 'sweetalert2'

interface Course {
  id: number
  title: string
  description: string
  duration: string
  category: string
  audience?: 'internal' | 'client' | 'both'
}

// Backend response interface
interface BackendAssignment {
  id: number
  course_id: number
  course: {
    id: number
    title: string
    description: string
    is_mandatory: boolean
    audience: string
  }
  assignment_type?: string
  user_ids?: number[]
  department?: string
  all_employees: boolean
  role?: string
  deadline: string | null
  created_by: number
  creator?: {
    id: number
    nombre: string
    email: string
  }
  created_at: string
  updated_at: string
  progress_stats: {
    totalUsers: number
    completedUsers: number
    inProgressUsers: number
    notStartedUsers: number
    avgProgress: number
  }
  status: 'active' | 'completed' | 'overdue'
  days_until_deadline?: number | null
  urgency?: {
    level: 'critical' | 'high' | 'medium' | 'normal' | 'resolved'
    label: string
    daysUntilDeadline: number | null
  }
  assigned_to: string[]
  affected_users_count: number
  reminder_summary?: {
    totalNotifications: number
    reminderNotifications: number
    manualReminderNotifications: number
    unreadReminderNotifications: number
    lastNotificationAt: string | null
    lastReminderAt: string | null
    lastManualReminderAt: string | null
    lastReminderType: string | null
  }
}

// Frontend interface (for compatibility)
interface Assignment {
  id: number
  courseId: number
  courseTitle: string
  assignedTo: string[]
  assignedBy: string
  deadline: string
  status: 'active' | 'completed' | 'overdue'
  daysUntilDeadline: number | null
  urgency: {
    level: 'critical' | 'high' | 'medium' | 'normal' | 'resolved'
    label: string
    daysUntilDeadline: number | null
  }
  progress: number
  createdAt: string
  reminderSummary: {
    totalNotifications: number
    reminderNotifications: number
    manualReminderNotifications: number
    unreadReminderNotifications: number
    lastNotificationAt: string | null
    lastReminderAt: string | null
    lastManualReminderAt: string | null
    lastReminderType: string | null
  }
}

// Transform backend assignment to frontend format
const transformAssignment = (backendAssignment: BackendAssignment): Assignment => {
  return {
    id: backendAssignment.id,
    courseId: backendAssignment.course_id,
    courseTitle: backendAssignment.course.title,
    assignedTo: backendAssignment.assigned_to,
    assignedBy: backendAssignment.creator?.nombre || 'Admin',
    deadline: backendAssignment.deadline || '',
    status: backendAssignment.status,
    daysUntilDeadline: backendAssignment.days_until_deadline ?? backendAssignment.urgency?.daysUntilDeadline ?? null,
    urgency: backendAssignment.urgency || {
      level: backendAssignment.status === 'overdue' ? 'critical' : backendAssignment.status === 'completed' ? 'resolved' : 'normal',
      label: backendAssignment.status === 'overdue' ? 'Vencida' : backendAssignment.status === 'completed' ? 'Completada' : 'Activa',
      daysUntilDeadline: backendAssignment.days_until_deadline ?? null
    },
    progress: Math.round(backendAssignment.progress_stats.avgProgress || 0),
    createdAt: backendAssignment.created_at,
    reminderSummary: backendAssignment.reminder_summary || {
      totalNotifications: 0,
      reminderNotifications: 0,
      manualReminderNotifications: 0,
      unreadReminderNotifications: 0,
      lastNotificationAt: null,
      lastReminderAt: null,
      lastManualReminderAt: null,
      lastReminderType: null
    }
  }
}

const getApiMessage = (error: any, fallback: string) =>
  error?.response?.data?.error?.message
  || error?.response?.data?.message
  || error?.message
  || fallback

const formatRelativeDate = (value?: string | null) => {
  if (!value) return 'Sin seguimiento todavía'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Sin seguimiento todavía'

  return date.toLocaleString('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  })
}

const getUrgencyColor = (level: Assignment['urgency']['level']) => {
  switch (level) {
    case 'critical':
      return 'error'
    case 'high':
      return 'warning'
    case 'medium':
      return 'info'
    case 'resolved':
      return 'success'
    default:
      return 'default'
  }
}

const formatDeadlineInsight = (assignment: Assignment) => {
  if (!assignment.deadline) return 'Sin fecha límite'
  if (assignment.status === 'completed') return 'Completada'
  if (assignment.status === 'overdue' && typeof assignment.daysUntilDeadline === 'number') {
    return `Vencida hace ${Math.abs(assignment.daysUntilDeadline)} día(s)`
  }
  if (typeof assignment.daysUntilDeadline === 'number' && assignment.daysUntilDeadline <= 7) {
    return `Vence en ${assignment.daysUntilDeadline} día(s)`
  }
  return new Date(assignment.deadline).toLocaleDateString()
}

const LmsCourseAssignmentInterface: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = searchParams.get('tab') === 'create' ? 1 : 0
  const courseIdFromSearch = Number(searchParams.get('courseId') || '')
  const statusFromSearch = searchParams.get('status') || 'all'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [selectedCourse, setSelectedCourse] = useState<number | ''>(
    Number.isFinite(courseIdFromSearch) && courseIdFromSearch > 0 ? courseIdFromSearch : ''
  )
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'active' | 'completed' | 'overdue'>(
    statusFromSearch === 'active' || statusFromSearch === 'completed' || statusFromSearch === 'overdue'
      ? statusFromSearch
      : 'all'
  )
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [assignmentType, setAssignmentType] = useState<'role' | 'all'>('role')
  const page = 0
  const rowsPerPage = 10

  // Edit modal states
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null)
  const [editDeadline, setEditDeadline] = useState<Date | null>(null)

  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  const { data: coursesResponse } = useQuery<{ courses: Course[], total: number }>(
    ['lms-courses', page, rowsPerPage],
    async () => {
      const response = await axiosPrivate.get('/lms/courses', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          include: 'modules,assignments,_count'
        }
      })
      return response.data
    },
    {
      keepPreviousData: true,
      onError: (error: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar cursos',
          text: error.response?.data?.message || error.message || 'Ocurrió un error'
        })
      }
    }
  )
  // Get all assignments
  const { data: assignmentsResponse } = useQuery<{ assignments: BackendAssignment[], total: number, page: number, limit: number, summary?: { total: number, active: number, completed: number, overdue: number, withoutFollowUp: number, needingAttention: number } }>(
    ['lms-all-assignments', page, rowsPerPage, selectedCourse, selectedStatus],
    async () => {
      const response = await axiosPrivate.get('/lms/assignments/all', {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          courseId: selectedCourse || undefined,
          status: selectedStatus === 'all' ? undefined : selectedStatus
        }
      })
      return response.data.data
    },
    {
      keepPreviousData: true,
      onError: (error: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al cargar asignaciones',
          text: error.response?.data?.message || error.message || 'Ocurrió un error'
        })
      }
    }
  )


  // Mutations
  const createAssignmentMutation = useMutation(
    async (data: { courseId: number; type: string; role?: string; deadline: Date | null }) => {
      const course = courses.find(c => c.id === data.courseId)
      const response = await axiosPrivate.post(
        `/lms/assignments/courses/${data.courseId}/assign`,
        {
          role: data.type === 'role' ? data.role : undefined,
          all_employees: data.type === 'all',
          deadline: data.deadline ? data.deadline.toISOString() : null,
          send_notification: true,
          notification_message: `Tienes un nuevo curso asignado: ${course?.title || 'Curso'}`
        }
      )
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-all-assignments'])
        Swal.fire({
          icon: 'success',
          title: 'Asignación creada',
          text: 'La regla quedó lista y ya puedes revisar su progreso o reenviar recordatorios.',
          timer: 2000
        })
        setActiveTab(0) // Volver al tab de asignaciones
        const nextParams = new URLSearchParams(searchParams)
        nextParams.set('tab', 'active')
        if (selectedCourse) {
          nextParams.set('courseId', String(selectedCourse))
        }
        if (selectedStatus !== 'all') {
          nextParams.set('status', selectedStatus)
        }
        setSearchParams(nextParams, { replace: true })
      },
      onError: (error: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al crear asignación',
          text: getApiMessage(error, 'No se pudo crear la asignación.')
        })
      }
    }
  )

  const updateAssignmentMutation = useMutation(
    async (data: { id: number; deadline?: string }) => {
      const response = await axiosPrivate.put(
        `/lms/assignments/assignments/${data.id}`,
        {
          deadline: data.deadline
        }
      )
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-all-assignments'])
        Swal.fire({
          icon: 'success',
          title: 'Asignación actualizada',
          text: 'La nueva fecha límite ya quedó guardada.',
          timer: 2000
        })
      },
      onError: (error: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al actualizar asignación',
          text: getApiMessage(error, 'No se pudo actualizar la asignación.')
        })
      }
    }
  )

  const deleteAssignmentMutation = useMutation(
    async (assignmentId: number) => {
      await axiosPrivate.delete(`/lms/assignments/assignments/${assignmentId}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-all-assignments'])
        Swal.fire({
          icon: 'success',
          title: 'Asignación eliminada',
          text: 'La regla ya no estará activa para ese curso.',
          timer: 2000
        })
      },
      onError: (error: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar asignación',
          text: getApiMessage(error, 'No se pudo eliminar la asignación.')
        })
      }
    }
  )

  const sendNotificationMutation = useMutation(
    async (assignmentId: number) => {
      const response = await axiosPrivate.post('/lms/analytics/reminders/trigger-manual', {
        assignmentIds: [assignmentId]
      })
      return response.data.data
    },
    {
      onSuccess: (data: any) => {
        Swal.fire({
          icon: 'success',
          title: 'Recordatorio enviado',
          text: `${data?.totalNotifications || 0} notificación(es) enviadas para esta asignación.`,
          timer: 2000
        })
        queryClient.invalidateQueries(['lms-all-assignments'])
        queryClient.invalidateQueries(['analytics', 'mandatory-training'])
      },
      onError: (error: any) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al enviar recordatorio',
          text: getApiMessage(error, 'No se pudo enviar el recordatorio.')
        })
      }
    }
  )

  const courses = coursesResponse?.courses || []
  const assignableCourses = courses.filter((course) => course.audience !== 'client')
  const assignments = (assignmentsResponse?.assignments || []).map(transformAssignment)
  const assignmentSummary = assignmentsResponse?.summary || {
    total: assignments.length,
    active: assignments.filter((assignment) => assignment.status === 'active').length,
    completed: assignments.filter((assignment) => assignment.status === 'completed').length,
    overdue: assignments.filter((assignment) => assignment.status === 'overdue').length,
    withoutFollowUp: assignments.filter((assignment) => assignment.urgency.level === 'medium').length,
    needingAttention: assignments.filter((assignment) => assignment.urgency.level === 'critical' || assignment.urgency.level === 'high').length
  }
  const selectedCourseData = useMemo(
    () =>
      assignableCourses.find((course) => course.id === selectedCourse)
      || courses.find((course) => course.id === selectedCourse),
    [assignableCourses, courses, selectedCourse]
  )
  const assignmentGuidance = [
    'Revisa primero las asignaciones activas para evitar duplicar reglas o fechas límite.',
    'Crea nuevas asignaciones solo para cursos internos o compartidos que realmente deban ser obligatorios.'
  ]

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', newValue === 1 ? 'create' : 'active')
    if (selectedCourse) {
      nextParams.set('courseId', String(selectedCourse))
    } else {
      nextParams.delete('courseId')
    }
    if (selectedStatus !== 'all') {
      nextParams.set('status', selectedStatus)
    } else {
      nextParams.delete('status')
    }
    setSearchParams(nextParams, { replace: true })
  }

  const syncCourseInSearch = (courseId: number | '') => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', activeTab === 1 ? 'create' : 'active')
    if (courseId) {
      nextParams.set('courseId', String(courseId))
    } else {
      nextParams.delete('courseId')
    }
    if (selectedStatus !== 'all') {
      nextParams.set('status', selectedStatus)
    } else {
      nextParams.delete('status')
    }
    setSearchParams(nextParams, { replace: true })
  }

  const handleCourseSelection = (courseId: number | '') => {
    setSelectedCourse(courseId)
    syncCourseInSearch(courseId)
  }

  const handleStatusSelection = (status: 'all' | 'active' | 'completed' | 'overdue') => {
    setSelectedStatus(status)
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set('tab', activeTab === 1 ? 'create' : 'active')
    if (selectedCourse) {
      nextParams.set('courseId', String(selectedCourse))
    } else {
      nextParams.delete('courseId')
    }
    if (status !== 'all') {
      nextParams.set('status', status)
    } else {
      nextParams.delete('status')
    }
    setSearchParams(nextParams, { replace: true })
  }

  const handleCreateAssignment = () => {
    if (!selectedCourse || !deadline) {
      Swal.fire({
        icon: 'warning',
        title: 'Campos requeridos',
        text: 'Debes seleccionar un curso y una fecha límite'
      })
      return
    }

    if (assignmentType === 'role' && !selectedRole) {
      Swal.fire({
        icon: 'warning',
        title: 'Rol requerido',
        text: 'Debes seleccionar un rol'
      })
      return
    }

    const selectedCourseData = assignableCourses.find((course) => course.id === selectedCourse)
    if (!selectedCourseData) {
      Swal.fire({
        icon: 'warning',
        title: 'Curso no asignable',
        text: 'Las asignaciones LMS solo aplican a cursos internos o de audiencia mixta.'
      })
      return
    }

    // Set deadline to end of day (23:59:59) to avoid timezone issues
    const deadlineEndOfDay = new Date(deadline)
    deadlineEndOfDay.setHours(23, 59, 59, 999)

    createAssignmentMutation.mutate({
      courseId: selectedCourse as number,
      type: assignmentType,
      role: selectedRole,
      deadline: deadlineEndOfDay
    })

    setSelectedRole('')
    setDeadline(null)
  }

  const handleSendNotification = (assignmentId: number) => {
    Swal.fire({
      icon: 'question',
      title: '¿Enviar recordatorio?',
      text: 'Se enviará un recordatorio a todos los usuarios asignados',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        sendNotificationMutation.mutate(assignmentId)
      }
    })
  }

  const handleDeleteAssignment = (assignmentId: number) => {
    Swal.fire({
      icon: 'warning',
      title: '¿Eliminar asignación?',
      text: 'Esta acción no se puede deshacer',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33'
    }).then((result) => {
      if (result.isConfirmed) {
        deleteAssignmentMutation.mutate(assignmentId)
      }
    })
  }

  const handleOpenEditDialog = (assignment: Assignment) => {
    setEditingAssignment(assignment)
    setEditDeadline(assignment.deadline ? new Date(assignment.deadline) : null)
    setEditDialogOpen(true)
  }

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false)
    setEditingAssignment(null)
    setEditDeadline(null)
  }

  const handleSaveEdit = () => {
    if (!editingAssignment || !editDeadline) {
      Swal.fire({
        icon: 'warning',
        title: 'Fecha requerida',
        text: 'Debes seleccionar una nueva fecha límite'
      })
      return
    }

    // Set deadline to end of day (23:59:59) to avoid timezone issues
    const deadlineEndOfDay = new Date(editDeadline)
    deadlineEndOfDay.setHours(23, 59, 59, 999)

    updateAssignmentMutation.mutate({
      id: editingAssignment.id,
      deadline: deadlineEndOfDay.toISOString()
    })

    handleCloseEditDialog()
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

  const goToCoursePreview = (courseId: number) => {
    navigate(`/lms/course/${courseId}/preview`)
  }

  const goToCourseContent = (courseId: number) => {
    navigate(`/lms/admin/courses/${courseId}/content`)
  }

  return (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', p: 3 }}>
          <Card sx={{ mb: 3, borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                    Centro de Asignaciones LMS
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Esta pantalla se enfoca en obligatoriedad y fechas límite de usuarios internos. Los clientes siguen en modo catálogo.
                  </Typography>
                  {selectedCourseData && (
                    <Alert severity="success" sx={{ mt: 2 }}>
                      Estás trabajando sobre <strong>{selectedCourseData.title}</strong>. Ya no necesitas volver a buscar el curso para crear o revisar sus reglas.
                    </Alert>
                  )}
                </Grid>
                <Grid item xs={12} md={4}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
                    <Chip color="primary" icon={<AssignmentIcon />} label={`${assignmentSummary.total} regla(s)`} />
                    <Chip color="error" label={`${assignmentSummary.overdue} vencida(s)`} variant="outlined" />
                    <Chip color="warning" label={`${assignmentSummary.needingAttention} por atender`} variant="outlined" />
                    <Chip color="info" label={`${assignmentSummary.withoutFollowUp} sin seguimiento`} variant="outlined" />
                    <Chip color="warning" icon={<NotificationsIcon />} label="Recordatorios desde cada regla" />
                  </Box>
                </Grid>
              </Grid>
              <Alert severity="info" sx={{ mt: 2 }}>
                <AlertTitle>Flujo recomendado</AlertTitle>
                1. Revisa asignaciones activas. 2. Crea o ajusta la regla. 3. Si hace falta, envía el recordatorio desde la misma asignación.
              </Alert>
            </CardContent>
          </Card>

        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
          <Tab label="Asignaciones Activas" />
          <Tab label="Crear Asignación" />
        </Tabs>

        <Alert severity="info" sx={{ mb: 3 }}>
          {assignmentGuidance[activeTab]}
        </Alert>

          {activeTab === 0 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
              <Typography variant="h6">
                Asignaciones Activas ({assignments.length})
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 280 }}>
                  <InputLabel>Filtrar por curso</InputLabel>
                  <Select
                    value={selectedCourse}
                    label="Filtrar por curso"
                    onChange={(e) => handleCourseSelection((e.target.value as number) || '')}
                  >
                    <MenuItem value="">Todos los cursos</MenuItem>
                    {assignableCourses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Estado</InputLabel>
                  <Select
                    value={selectedStatus}
                    label="Estado"
                    onChange={(e) => handleStatusSelection(e.target.value as 'all' | 'active' | 'completed' | 'overdue')}
                  >
                    <MenuItem value="all">Todos</MenuItem>
                    <MenuItem value="active">Activas</MenuItem>
                    <MenuItem value="completed">Completadas</MenuItem>
                    <MenuItem value="overdue">Vencidas</MenuItem>
                  </Select>
                </FormControl>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleTabChange({} as React.SyntheticEvent, 1)}
                >
                  Nueva Asignación
                </Button>
              </Box>
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
                            <Chip
                              label={assignment.urgency.label}
                              color={getUrgencyColor(assignment.urgency.level) as any}
                              size="small"
                              variant="outlined"
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
                                {formatDeadlineInsight(assignment)}
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
                                Seguimiento:
                              </Typography>
                              <Typography variant="body2">
                                {assignment.reminderSummary.reminderNotifications > 0
                                  ? `${assignment.reminderSummary.reminderNotifications} recordatorio(s)`
                                  : 'Sin recordatorios'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Último: {formatRelativeDate(
                                  assignment.reminderSummary.lastReminderAt
                                  || assignment.reminderSummary.lastNotificationAt
                                )}
                              </Typography>
                            </Grid>
                          </Grid>

                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                            {assignment.reminderSummary.manualReminderNotifications > 0 && (
                              <Chip
                                size="small"
                                color="info"
                                variant="outlined"
                                label={`${assignment.reminderSummary.manualReminderNotifications} manual(es)`}
                              />
                            )}
                            {assignment.reminderSummary.unreadReminderNotifications > 0 && (
                              <Chip
                                size="small"
                                color="warning"
                                label={`${assignment.reminderSummary.unreadReminderNotifications} sin leer`}
                              />
                            )}
                            {assignment.status !== 'completed' && assignment.reminderSummary.lastReminderAt === null && (
                              <Chip
                                size="small"
                                color="info"
                                variant="outlined"
                                label="Enviar primer seguimiento"
                              />
                            )}
                          </Box>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<CourseIcon />}
                            onClick={() => goToCourseContent(assignment.courseId)}
                          >
                            Contenido
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<ArrowForwardIcon />}
                            onClick={() => goToCoursePreview(assignment.courseId)}
                          >
                            Vista previa
                          </Button>
                          <IconButton
                            size="small"
                            onClick={() => handleSendNotification(assignment.id)}
                            title={assignment.reminderSummary.lastReminderAt ? 'Reenviar recordatorio' : 'Enviar primer recordatorio'}
                          >
                            <NotificationsIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            title="Editar asignación"
                            onClick={() => handleOpenEditDialog(assignment)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            title="Eliminar asignación"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              {assignments.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    No hay asignaciones para los filtros actuales. Ajusta el curso, el estado o crea una nueva regla.
                  </Alert>
                </Grid>
              )}
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
                        onChange={(e) => handleCourseSelection(e.target.value as number)}
                      >
                        {assignableCourses.map((course) => (
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
                        <MenuItem value="role">Por Rol</MenuItem>
                        <MenuItem value="all">Todos los Empleados</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  {assignmentType === 'role' && (
                    <Grid item xs={12}>
                      <FormControl fullWidth>
                        <InputLabel>Rol</InputLabel>
                        <Select
                          value={selectedRole}
                          label="Rol"
                          onChange={(e) => setSelectedRole(e.target.value)}
                        >
                          <MenuItem value="admin">Administrador</MenuItem>
                          <MenuItem value="Training Manager">Gestor de Capacitación</MenuItem>
                          <MenuItem value="metrologist">Metrólogo</MenuItem>
                          <MenuItem value="technician">Técnico de Mantenimiento</MenuItem>
                          <MenuItem value="mantenimiento">Mantenimiento</MenuItem>
                          <MenuItem value="maintenance_coordinator">Coordinador de Mantenimiento</MenuItem>
                          <MenuItem value="comp_admin">Administrador de Compras</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Las asignaciones y fechas límite del LMS se aplican solo a usuarios internos. Los cursos de cliente se consumen por catálogo.
                    </Typography>
                    {selectedCourseData && (
                      <Alert severity="info" sx={{ mt: 2 }}>
                        Curso seleccionado: <strong>{selectedCourseData.title}</strong>. Si necesitas ajustar el contenido antes de asignarlo, puedes abrir el editor desde las reglas activas o volver a Gestión de Cursos.
                      </Alert>
                    )}
                  </Grid>

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

      </Box>

      {/* Edit Assignment Modal */}
      <Dialog
        open={editDialogOpen}
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            <Typography variant="h6">Editar Asignación</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          {editingAssignment && (
            <Box sx={{ pt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Curso
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, fontWeight: 500 }}>
                {editingAssignment.courseTitle}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Asignado a
              </Typography>
              <Typography variant="body1" sx={{ mb: 3 }}>
                {editingAssignment.assignedTo.join(', ')}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Fecha límite actual
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: 'warning.main' }}>
                {editingAssignment.deadline
                  ? new Date(editingAssignment.deadline).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Sin fecha límite'}
              </Typography>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Nueva fecha límite
              </Typography>
              <DatePicker
                label="Seleccionar nueva fecha"
                value={editDeadline}
                onChange={(newValue) => setEditDeadline(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true
                  }
                }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleCloseEditDialog}
            variant="outlined"
            color="inherit"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            color="primary"
            startIcon={<EditIcon />}
          >
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  )
}

export default LmsCourseAssignmentInterface
