import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
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
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  TablePagination,
  Tooltip,
  CircularProgress
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EditNote as EditContentIcon,
  Visibility as PreviewIcon,
  Assignment as AssignIcon,
  Analytics as AnalyticsIcon,
  Publish as PublishIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'
import { getCourseAudienceLabel } from '../../../utils/lmsAudience'
import SignaturePad from '../../../Components/Maintenance/SignaturePad'
import { useCertificateTemplates } from '../../../hooks/useLms'

interface Course {
  id: number
  title: string
  description: string
  slug: string
  status: 'draft' | 'published' | 'archived'
  audience: 'internal' | 'client' | 'both'
  is_mandatory: boolean
  has_certificate: boolean
  estimated_duration_minutes: number
  certificate_duration_text?: string | null
  show_duration_on_certificate?: boolean
  certificate_template_id?: number | null
  certificate_signer_left_name?: string | null
  certificate_signer_left_role?: string | null
  certificate_signer_left_signature?: string | null
  certificate_signer_right_name?: string | null
  certificate_signer_right_role?: string | null
  certificate_signer_right_signature?: string | null
  created_by: number
  created_at: string
  updated_at: string
  certificateTemplate?: {
    id: number
    name: string
    is_default?: boolean
  }
  modules?: CourseModule[]
  assignments?: CourseAssignment[]
  _count?: {
    modules: number
    assignments: number
    progress: number
  }
}

interface CourseModule {
  id: number
  title: string
  description: string
  order: number
  course_id: number
  lessons?: CourseLesson[]
}

interface CourseLesson {
  id: number
  title: string
  content_type: 'text' | 'video' | 'quiz'
  order: number
  module_id: number
  estimated_minutes?: number
  duration_minutes?: number
}

interface CourseAssignment {
  id: number
  course_id: number
  all_employees: boolean
  role?: string
  assigned_at: string
}

const getDerivedCourseDuration = (course?: Pick<Course, 'estimated_duration_minutes' | 'modules'> | null) => {
  if (!course) {
    return 0
  }

  if (Number.isFinite(course.estimated_duration_minutes) && course.estimated_duration_minutes > 0) {
    return course.estimated_duration_minutes
  }

  const totalMinutes = (course.modules || []).reduce((courseMinutes, module) => {
    const moduleMinutes = (module.lessons || []).reduce((lessonMinutes, lesson) => {
      const estimatedMinutes = lesson.estimated_minutes ?? lesson.duration_minutes ?? 0
      return lessonMinutes + (Number.isFinite(estimatedMinutes) ? estimatedMinutes : 0)
    }, 0)

    return courseMinutes + moduleMinutes
  }, 0)

  return totalMinutes > 0 ? totalMinutes : 0
}

interface CreateCourseData {
  title: string
  description: string
  audience: 'internal' | 'client' | 'both'
  is_mandatory: boolean
  has_certificate: boolean
  estimated_duration_minutes: number
  certificate_duration_text: string
  show_duration_on_certificate: boolean
  certificate_template_id: number | null | ''
  certificate_signer_left_name: string
  certificate_signer_left_role: string
  certificate_signer_left_signature: string | null
  certificate_signer_right_name: string
  certificate_signer_right_role: string
  certificate_signer_right_signature: string | null
}

interface CourseFormErrors {
  title?: string
  description?: string
  estimated_duration_minutes?: string
  certificate_duration_text?: string
  certificate_template_id?: string
}

interface CourseActionDialogState {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  tone: 'primary' | 'warning' | 'error'
  onConfirm: (() => void) | null
}

const audienceOptions = [
  {
    value: 'internal' as const,
    label: 'Empleados internos',
    helper: 'Solo aparecerá para usuarios internos y podrá usarse en asignaciones obligatorias.'
  },
  {
    value: 'client' as const,
    label: 'Clientes',
    helper: 'Solo aparecerá para usuarios cliente. Hoy funciona como catálogo, no como asignación obligatoria.'
  },
  {
    value: 'both' as const,
    label: 'Ambos',
    helper: 'El curso estará disponible para internos y clientes; las asignaciones obligatorias siguen aplicando solo a internos.'
  }
]

const durationPresets = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hora', value: 60 },
  { label: '2 horas', value: 120 }
]

const LmsCourseManagement: React.FC = () => {
  const navigate = useNavigate()
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [formErrors, setFormErrors] = useState<CourseFormErrors>({})
  const [courseActionDialog, setCourseActionDialog] = useState<CourseActionDialogState>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Confirmar',
    tone: 'primary',
    onConfirm: null
  })
  const [formData, setFormData] = useState<CreateCourseData>({
    title: '',
    description: '',
    audience: 'internal',
    is_mandatory: false,
    has_certificate: false,
    estimated_duration_minutes: 60,
    certificate_duration_text: '',
    show_duration_on_certificate: false,
    certificate_template_id: '',
    certificate_signer_left_name: '',
    certificate_signer_left_role: '',
    certificate_signer_left_signature: '',
    certificate_signer_right_name: '',
    certificate_signer_right_role: '',
    certificate_signer_right_signature: ''
  })

  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()
  const { data: certificateTemplates = [] } = useCertificateTemplates()

  // Query para obtener cursos
  const { data: coursesResponse, isLoading, error } = useQuery<{courses: Course[], total: number}>(
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
        setSnackbar({
          open: true,
          message: 'Error al cargar los cursos: ' + (error.response?.data?.message || error.message),
          severity: 'error'
        })
      }
    }
  )

  const courses = coursesResponse?.courses || []
  const totalCourses = coursesResponse?.total || 0

  // Mutación para crear/actualizar curso
  const saveCourseMutation = useMutation(
    async (courseData: CreateCourseData | Course) => {
      if ('id' in courseData) {
        // Actualizar curso existente
        const updateData = {
          title: courseData.title,
          description: courseData.description,
          audience: courseData.audience,
          is_mandatory: courseData.is_mandatory,
          has_certificate: courseData.has_certificate,
          estimated_duration_minutes: courseData.estimated_duration_minutes,
          certificate_duration_text: courseData.certificate_duration_text,
          show_duration_on_certificate: courseData.show_duration_on_certificate,
          certificate_template_id: courseData.certificate_template_id || null,
          certificate_signer_left_name: courseData.certificate_signer_left_name || '',
          certificate_signer_left_role: courseData.certificate_signer_left_role || '',
          certificate_signer_left_signature: courseData.certificate_signer_left_signature || null,
          certificate_signer_right_name: courseData.certificate_signer_right_name || '',
          certificate_signer_right_role: courseData.certificate_signer_right_role || '',
          certificate_signer_right_signature: courseData.certificate_signer_right_signature || null
        }
        return axiosPrivate.put(`/lms/courses/${courseData.id}`, updateData)
      } else {
        // Crear nuevo curso
        return axiosPrivate.post('/lms/courses', courseData)
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-courses'])
        handleCloseDialog()
        setSnackbar({
          open: true,
          message: editingCourse ? 'Curso actualizado exitosamente' : 'Curso creado exitosamente',
          severity: 'success'
        })
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: 'Error al guardar curso: ' + (error.response?.data?.error?.message || error.response?.data?.message || error.message),
          severity: 'error'
        })
      }
    }
  )

  // Mutación para eliminar curso
  const deleteCourseMutation = useMutation(
    async (courseId: number) => {
      return axiosPrivate.delete(`/lms/courses/${courseId}`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-courses'])
        setSnackbar({
          open: true,
          message: 'Curso eliminado exitosamente',
          severity: 'success'
        })
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: 'Error al eliminar curso: ' + (error.response?.data?.error?.message || error.response?.data?.message || error.message),
          severity: 'error'
        })
      }
    }
  )

  // Mutación para publicar curso
  const publishCourseMutation = useMutation(
    async (courseId: number) => {
      return axiosPrivate.post(`/lms/courses/${courseId}/publish`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-courses'])
        setSnackbar({
          open: true,
          message: 'Curso publicado exitosamente',
          severity: 'success'
        })
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: 'Error al publicar curso: ' + (error.response?.data?.error?.message || error.response?.data?.message || error.message),
          severity: 'error'
        })
      }
    }
  )

  // Mutación para archivar curso
  const archiveCourseMutation = useMutation(
    async (courseId: number) => {
      return axiosPrivate.post(`/lms/courses/${courseId}/archive`)
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-courses'])
        setSnackbar({
          open: true,
          message: 'Curso archivado exitosamente',
          severity: 'success'
        })
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: 'Error al archivar curso: ' + (error.response?.data?.error?.message || error.response?.data?.message || error.message),
          severity: 'error'
        })
      }
    }
  )

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course)
      setFormData({
        title: course.title,
        description: course.description,
        audience: course.audience,
        is_mandatory: course.is_mandatory,
        has_certificate: course.has_certificate,
        estimated_duration_minutes: getDerivedCourseDuration(course),
        certificate_duration_text: course.certificate_duration_text || '',
        show_duration_on_certificate: Boolean(course.show_duration_on_certificate),
        certificate_template_id: course.certificate_template_id || '',
        certificate_signer_left_name: course.certificate_signer_left_name || '',
        certificate_signer_left_role: course.certificate_signer_left_role || '',
        certificate_signer_left_signature: course.certificate_signer_left_signature || '',
        certificate_signer_right_name: course.certificate_signer_right_name || '',
        certificate_signer_right_role: course.certificate_signer_right_role || '',
        certificate_signer_right_signature: course.certificate_signer_right_signature || ''
      })
    } else {
      setEditingCourse(null)
      setFormData({
        title: '',
        description: '',
        audience: 'internal',
        is_mandatory: false,
        has_certificate: false,
        estimated_duration_minutes: 60,
        certificate_duration_text: '',
        show_duration_on_certificate: false,
        certificate_template_id: '',
        certificate_signer_left_name: '',
        certificate_signer_left_role: '',
        certificate_signer_left_signature: '',
        certificate_signer_right_name: '',
        certificate_signer_right_role: '',
        certificate_signer_right_signature: ''
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingCourse(null)
    setFormData({
      title: '',
      description: '',
      audience: 'internal',
      is_mandatory: false,
      has_certificate: false,
      estimated_duration_minutes: 60,
      certificate_duration_text: '',
      show_duration_on_certificate: false,
      certificate_template_id: '',
      certificate_signer_left_name: '',
      certificate_signer_left_role: '',
      certificate_signer_left_signature: '',
      certificate_signer_right_name: '',
      certificate_signer_right_role: '',
      certificate_signer_right_signature: ''
    })
  }

  const handleSubmit = () => {
    const nextErrors: CourseFormErrors = {}
    const trimmedTitle = formData.title.trim()
    const trimmedDescription = formData.description.trim()

    if (trimmedTitle.length < 5) {
      nextErrors.title = 'Usa un título más descriptivo, de al menos 5 caracteres.'
    }

    if (trimmedDescription.length < 20) {
      nextErrors.description = 'Describe el objetivo del curso con al menos 20 caracteres.'
    }

    if (!Number.isFinite(formData.estimated_duration_minutes) || formData.estimated_duration_minutes < 1) {
      nextErrors.estimated_duration_minutes = 'La duración debe ser de al menos 1 minuto.'
    }

    if (formData.show_duration_on_certificate && formData.certificate_duration_text.trim().length > 120) {
      nextErrors.certificate_duration_text = 'Usa un texto corto, de máximo 120 caracteres.'
    }

    if (formData.has_certificate && !formData.certificate_template_id) {
      nextErrors.certificate_template_id = 'Selecciona la plantilla que emitirá este curso.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors)
      setSnackbar({
        open: true,
        message: 'Revisa los campos obligatorios antes de guardar.',
        severity: 'error'
      })
      return
    }

    const normalizedFormData: CreateCourseData = {
      ...formData,
      title: trimmedTitle,
      description: trimmedDescription,
      is_mandatory: formData.audience === 'client' ? false : formData.is_mandatory,
      certificate_duration_text: formData.certificate_duration_text.trim(),
      certificate_template_id: formData.has_certificate && formData.certificate_template_id
        ? Number(formData.certificate_template_id)
        : null,
      certificate_signer_left_name: formData.certificate_signer_left_name.trim(),
      certificate_signer_left_role: formData.certificate_signer_left_role.trim(),
      certificate_signer_left_signature: formData.certificate_signer_left_signature || null,
      certificate_signer_right_name: formData.certificate_signer_right_name.trim(),
      certificate_signer_right_role: formData.certificate_signer_right_role.trim(),
      certificate_signer_right_signature: formData.certificate_signer_right_signature || null,
      show_duration_on_certificate: formData.has_certificate
        ? formData.show_duration_on_certificate
        : false
    }

    setFormErrors({})

    if (editingCourse) {
      saveCourseMutation.mutate({ ...editingCourse, ...normalizedFormData })
    } else {
      saveCourseMutation.mutate(normalizedFormData)
    }
  }

  const handleDelete = (courseId: number) => {
    const course = courses.find((item) => item.id === courseId)
    setCourseActionDialog({
      open: true,
      title: 'Eliminar curso',
      description: `Vas a eliminar "${course?.title || 'este curso'}". Esta acción no se puede deshacer.`,
      confirmLabel: 'Eliminar curso',
      tone: 'error',
      onConfirm: () => deleteCourseMutation.mutate(courseId)
    })
  }

  const handlePublishCourse = (courseId: number) => {
    const course = courses.find((item) => item.id === courseId)
    setCourseActionDialog({
      open: true,
      title: 'Publicar curso',
      description: `"${course?.title || 'Este curso'}" quedará visible para la audiencia seleccionada. Asegúrate de que el contenido esté listo antes de publicarlo.`,
      confirmLabel: 'Publicar curso',
      tone: 'primary',
      onConfirm: () => publishCourseMutation.mutate(courseId)
    })
  }

  const handleArchiveCourse = (courseId: number) => {
    const course = courses.find((item) => item.id === courseId)
    setCourseActionDialog({
      open: true,
      title: 'Archivar curso',
      description: `"${course?.title || 'Este curso'}" dejará de estar disponible para nuevos estudiantes, pero conservará su historial y analíticas.`,
      confirmLabel: 'Archivar curso',
      tone: 'warning',
      onConfirm: () => archiveCourseMutation.mutate(courseId)
    })
  }

  const handleCloseCourseActionDialog = () => {
    setCourseActionDialog({
      open: false,
      title: '',
      description: '',
      confirmLabel: 'Confirmar',
      tone: 'primary',
      onConfirm: null
    })
  }

  const handleConfirmCourseAction = () => {
    courseActionDialog.onConfirm?.()
    handleCloseCourseActionDialog()
  }

  const handleInputChange = (field: keyof CreateCourseData, value: any) => {
    setFormData((prev) => {
      const nextFormData = {
        ...prev,
        [field]: value
      }

      if (field === 'audience' && value === 'client') {
        nextFormData.is_mandatory = false
      }

      if (field === 'has_certificate' && value === false) {
        nextFormData.show_duration_on_certificate = false
        nextFormData.certificate_template_id = ''
      }

      return nextFormData
    })
    setFormErrors((prev) => ({
      ...prev,
      [field]: undefined
    }))
  }

  const handleEditContent = (courseId: number) => {
    navigate(`/lms/admin/courses/${courseId}/content`)
  }

  const handlePreviewCourse = (courseId: number) => {
    navigate(`/lms/course/${courseId}/preview`)
  }

  const handleAssignCourse = (courseId: number) => {
    navigate(`/lms/admin/assignments?courseId=${courseId}&tab=create`)
  }

  const canManageAssignments = (course: Course) => course.audience !== 'client'

  const handleViewAnalytics = (courseId: number) => {
    navigate(`/lms/admin/analytics?courseId=${courseId}`)
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success'
      case 'draft':
        return 'warning'
      case 'archived':
        return 'default'
      default:
        return 'default'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published':
        return 'Publicado'
      case 'draft':
        return 'Borrador'
      case 'archived':
        return 'Archivado'
      default:
        return status
    }
  }

  const formatDuration = (minutes: number) => {
    const safeMinutes = Number.isFinite(minutes) ? minutes : 0
    const hours = Math.floor(safeMinutes / 60)
    const mins = safeMinutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const selectedAudienceOption = audienceOptions.find(option => option.value === formData.audience)
  const isSaveDisabled = saveCourseMutation.isLoading
    || formData.title.trim().length === 0
    || formData.description.trim().length === 0
    || formData.estimated_duration_minutes < 1

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh',
          flexDirection: 'column'
        }}
      >
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Cargando cursos...</Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Error al cargar los cursos. Por favor, intenta nuevamente.
        </Alert>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant='h4' component='h1'>
          Gestión de Cursos
        </Typography>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Crear Curso
        </Button>
      </Box>

      <Alert severity='info' sx={{ mb: 3 }}>
        Define aquí la ficha base del curso. Después podrás editar contenido, publicar el curso y
        configurar asignaciones desde las acciones de cada fila.
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Audiencia</TableCell>
              <TableCell>Duración</TableCell>
              <TableCell>Módulos</TableCell>
              <TableCell>Progreso</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Box sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      No hay cursos disponibles
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={() => handleOpenDialog()}
                      sx={{ mt: 2 }}
                    >
                      Crear primer curso
                    </Button>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <Box>
                      <Typography variant='subtitle2' fontWeight='bold'>
                        {course.title}
                      </Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {course.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                        <Chip
                          label={getStatusLabel(course.status)}
                          color={getStatusColor(course.status) as any}
                          size='small'
                          variant='outlined'
                        />
                        {course.is_mandatory && (
                          <Chip label='Obligatorio' color='error' size='small' />
                        )}
                        {course.has_certificate && (
                          <Chip label='Con certificado' color='info' size='small' />
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={getCourseAudienceLabel(course.audience)} 
                      color={course.audience === 'both' ? 'primary' : 'default'}
                      size='small' 
                    />
                  </TableCell>
                  <TableCell>{formatDuration(getDerivedCourseDuration(course))}</TableCell>
                  <TableCell>{course._count?.modules || 0}</TableCell>
                  <TableCell>{course._count?.progress || 0} usuarios</TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(course.status)}
                      color={getStatusColor(course.status) as any}
                      size='small'
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Editar curso">
                        <IconButton
                          size='small'
                          onClick={() => handleOpenDialog(course)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar contenido">
                        <IconButton
                          size='small'
                          color='primary'
                          onClick={() => handleEditContent(course.id)}
                        >
                          <EditContentIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Vista previa">
                        <IconButton
                          size='small'
                          color='info'
                          onClick={() => handlePreviewCourse(course.id)}
                        >
                          <PreviewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Asignar curso">
                        <span>
                          <IconButton
                            size='small'
                            color='secondary'
                            disabled={!canManageAssignments(course)}
                            onClick={() => handleAssignCourse(course.id)}
                          >
                            <AssignIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Ver analíticas">
                        <IconButton
                          size='small'
                          color='success'
                          onClick={() => handleViewAnalytics(course.id)}
                        >
                          <AnalyticsIcon />
                        </IconButton>
                      </Tooltip>

                      {/* Botón de Publicar - solo para cursos en draft o archived */}
                      {(course.status === 'draft' || course.status === 'archived') && (
                        <Tooltip title={course.status === 'draft' ? 'Publicar curso' : 'Desarchive y publicar'}>
                          <IconButton
                            size='small'
                            sx={{ color: '#2e7d32' }}
                            onClick={() => handlePublishCourse(course.id)}
                          >
                            <PublishIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      {/* Botón de Archivar - solo para cursos publicados */}
                      {course.status === 'published' && (
                        <Tooltip title="Archivar curso">
                          <IconButton
                            size='small'
                            sx={{ color: '#ed6c02' }}
                            onClick={() => handleArchiveCourse(course.id)}
                          >
                            <ArchiveIcon />
                          </IconButton>
                        </Tooltip>
                      )}

                      <Tooltip title="Eliminar curso">
                        <IconButton
                          size='small'
                          color='error'
                          onClick={() => handleDelete(course.id)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalCourses}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </TableContainer>

      {/* Dialog para crear/editar curso */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth='md'
        fullWidth
      >
        <DialogTitle>
          {editingCourse ? 'Editar Curso' : 'Crear Nuevo Curso'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <Alert severity='info'>
                Completa primero la ficha base del curso. Luego podrás editar contenido, publicar y configurar asignaciones si la audiencia incluye usuarios internos.
              </Alert>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Título del curso'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                error={Boolean(formErrors.title)}
                helperText={formErrors.title || 'Debe ayudar a identificar el curso en catálogo, reportes y certificados.'}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label='Descripción'
                value={formData.description}
                onChange={(e) =>
                  handleInputChange('description', e.target.value)
                }
                error={Boolean(formErrors.description)}
                helperText={formErrors.description || 'Explica qué aprenderá la persona y cuándo conviene asignar o recomendar este curso.'}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Audiencia</InputLabel>
                <Select
                  value={formData.audience}
                  label='Audiencia'
                  onChange={(e) => handleInputChange('audience', e.target.value)}
                >
                  {audienceOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type='number'
                label='Duración estimada (minutos)'
                value={formData.estimated_duration_minutes}
                onChange={(e) =>
                  handleInputChange('estimated_duration_minutes', parseInt(e.target.value) || 0)
                }
                error={Boolean(formErrors.estimated_duration_minutes)}
                helperText={formErrors.estimated_duration_minutes || 'La duración alimenta catálogo, analíticas y expectativas del estudiante.'}
                required
                inputProps={{ min: 1 }}
              />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                {durationPresets.map((preset) => (
                  <Chip
                    key={preset.value}
                    label={preset.label}
                    clickable
                    color={formData.estimated_duration_minutes === preset.value ? 'primary' : 'default'}
                    variant={formData.estimated_duration_minutes === preset.value ? 'filled' : 'outlined'}
                    onClick={() => handleInputChange('estimated_duration_minutes', preset.value)}
                  />
                ))}
              </Box>
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 1 }}>
                Usa un preset rápido o ajusta minutos exactos si el curso requiere una duración especial.
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label='Texto para duración en certificado'
                value={formData.certificate_duration_text}
                onChange={(e) => handleInputChange('certificate_duration_text', e.target.value)}
                error={Boolean(formErrors.certificate_duration_text)}
                helperText={
                  formErrors.certificate_duration_text
                    || 'Ejemplo: 40 horas, 16 horas intensivas o 3 jornadas. Si lo dejas vacío, usaremos la duración calculada.'
                }
                disabled={!formData.has_certificate}
              />
            </Grid>
            <Grid item xs={12}>
              <Alert severity='info'>
                <strong>{selectedAudienceOption?.label}:</strong> {selectedAudienceOption?.helper}
              </Alert>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_mandatory}
                    onChange={(e) =>
                      handleInputChange('is_mandatory', e.target.checked)
                    }
                    disabled={formData.audience === 'client'}
                  />
                }
                label='Curso obligatorio'
              />
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                Úsalo cuando el curso deba entrar al flujo de asignaciones y recordatorios para usuarios internos.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.has_certificate}
                    onChange={(e) =>
                      handleInputChange('has_certificate', e.target.checked)
                    }
                  />
                }
                label='Genera certificado'
              />
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                Actívalo si al completar el curso se debe emitir un certificado descargable.
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.show_duration_on_certificate}
                    onChange={(e) =>
                      handleInputChange('show_duration_on_certificate', e.target.checked)
                    }
                    disabled={!formData.has_certificate}
                  />
                }
                label='Mostrar duración en certificado'
              />
              <Typography variant='caption' color='text.secondary' sx={{ display: 'block', mt: 0.5 }}>
                Cuando esté activo, el certificado mostrará el texto anterior o, si está vacío, la duración calculada del curso.
              </Typography>
            </Grid>
            {formData.has_certificate && (
              <Grid item xs={12}>
                <FormControl fullWidth error={Boolean(formErrors.certificate_template_id)}>
                  <InputLabel>Plantilla del certificado</InputLabel>
                  <Select
                    value={formData.certificate_template_id}
                    label='Plantilla del certificado'
                    onChange={(e) => handleInputChange('certificate_template_id', e.target.value)}
                  >
                    <MenuItem value=''>
                      <em>Selecciona una plantilla</em>
                    </MenuItem>
                    {certificateTemplates.map((template) => (
                      <MenuItem key={template.id} value={template.id}>
                        {template.name}
                        {template.isDefault || template.is_default ? ' (Por defecto)' : ''}
                      </MenuItem>
                    ))}
                  </Select>
                  <Typography variant='caption' color={formErrors.certificate_template_id ? 'error' : 'text.secondary'} sx={{ mt: 0.75 }}>
                    {formErrors.certificate_template_id || 'Cada curso puede apuntar a una plantilla distinta, sin depender de una sola global.'}
                  </Typography>
                </FormControl>
              </Grid>
            )}
            {formData.has_certificate && (
              <>
                <Grid item xs={12}>
                  <Alert severity='info'>
                    Los firmantes quedan guardados en el curso. Así puedes reutilizar la misma plantilla en varios cursos, pero cambiar personas, cargos y firmas según cada capacitación.
                  </Alert>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant='outlined' sx={{ p: 2.5, height: '100%' }}>
                    <Typography variant='h6' sx={{ mb: 1 }}>Firma izquierda</Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                      Úsala para instructor, facilitador o responsable académico.
                    </Typography>
                    <SignaturePad
                      value={formData.certificate_signer_left_signature}
                      onChange={(nextValue) => handleInputChange('certificate_signer_left_signature', nextValue || '')}
                      label='Firma izquierda'
                      helperText='Puedes dibujarla o subir una imagen.'
                      height={150}
                    />
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label='Nombre firmante izquierda'
                          value={formData.certificate_signer_left_name}
                          onChange={(e) => handleInputChange('certificate_signer_left_name', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label='Cargo firmante izquierda'
                          value={formData.certificate_signer_left_role}
                          onChange={(e) => handleInputChange('certificate_signer_left_role', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Paper variant='outlined' sx={{ p: 2.5, height: '100%' }}>
                    <Typography variant='h6' sx={{ mb: 1 }}>Firma derecha</Typography>
                    <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                      Úsala para director técnico, gerente o aprobador final.
                    </Typography>
                    <SignaturePad
                      value={formData.certificate_signer_right_signature}
                      onChange={(nextValue) => handleInputChange('certificate_signer_right_signature', nextValue || '')}
                      label='Firma derecha'
                      helperText='Puedes dibujarla o subir una imagen.'
                      height={150}
                    />
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label='Nombre firmante derecha'
                          value={formData.certificate_signer_right_name}
                          onChange={(e) => handleInputChange('certificate_signer_right_name', e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label='Cargo firmante derecha'
                          value={formData.certificate_signer_right_role}
                          onChange={(e) => handleInputChange('certificate_signer_right_role', e.target.value)}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </>
            )}
            {formData.audience === 'client' && formData.is_mandatory && (
              <Grid item xs={12}>
                <Alert severity='warning'>
                  Los cursos solo para clientes se manejan hoy como catálogo. Aunque puedas marcarlo como obligatorio, el flujo activo de asignaciones y recordatorios se usa para audiencias internas.
                </Alert>
              </Grid>
            )}
            {formData.audience === 'client' && (
              <Grid item xs={12}>
                <Alert severity='info'>
                  Para clientes el curso queda disponible en catálogo. Si necesitas un flujo obligatorio, hoy debe plantearse como audiencia <strong>Ambos</strong> o <strong>Empleados internos</strong>.
                </Alert>
              </Grid>
            )}
            {formData.has_certificate && (
              <Grid item xs={12}>
                <Alert severity='success'>
                  Este curso podrá emitir certificados cuando el participante complete el contenido requerido y apruebe los quizzes asociados. También podrás decidir si la duración aparece o no en el documento.
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant='contained'
            disabled={isSaveDisabled}
          >
            {saveCourseMutation.isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={courseActionDialog.open}
        onClose={handleCloseCourseActionDialog}
        maxWidth='sm'
        fullWidth
      >
        <DialogTitle>{courseActionDialog.title}</DialogTitle>
        <DialogContent>
          <Alert
            severity={
              courseActionDialog.tone === 'error'
                ? 'error'
                : courseActionDialog.tone === 'warning'
                  ? 'warning'
                  : 'info'
            }
            sx={{ mt: 1 }}
          >
            {courseActionDialog.description}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCourseActionDialog}>Cancelar</Button>
          <Button
            onClick={handleConfirmCourseAction}
            color={courseActionDialog.tone}
            variant='contained'
          >
            {courseActionDialog.confirmLabel}
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

export default LmsCourseManagement
