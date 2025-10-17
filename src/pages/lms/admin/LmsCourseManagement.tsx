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
  Analytics as AnalyticsIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

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
  created_by: number
  created_at: string
  updated_at: string
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
}

interface CourseAssignment {
  id: number
  course_id: number
  all_employees: boolean
  role?: string
  assigned_at: string
}

interface CreateCourseData {
  title: string
  description: string
  audience: 'internal' | 'client' | 'both'
  is_mandatory: boolean
  has_certificate: boolean
  estimated_duration_minutes: number
}

const LmsCourseManagement: React.FC = () => {
  const navigate = useNavigate()
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  const [formData, setFormData] = useState<CreateCourseData>({
    title: '',
    description: '',
    audience: 'internal',
    is_mandatory: false,
    has_certificate: false,
    estimated_duration_minutes: 60
  })

  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

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
          estimated_duration_minutes: courseData.estimated_duration_minutes
        }
        return axiosPrivate.put(`/lms/courses/${courseData.id}`, updateData)
      } else {
        // Crear nuevo curso
        return axiosPrivate.post('/lms/courses', courseData)
      }
    },
    {
      onSuccess: (response) => {
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
          message: 'Error al guardar curso: ' + (error.response?.data?.message || error.message),
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
          message: 'Error al eliminar curso: ' + (error.response?.data?.message || error.message),
          severity: 'error'
        })
      }
    }
  )

  // Mutación para cambiar estado del curso
  const updateCourseStatusMutation = useMutation(
    async ({ courseId, status }: { courseId: number, status: 'draft' | 'published' | 'archived' }) => {
      return axiosPrivate.patch(`/lms/courses/${courseId}/status`, { status })
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['lms-courses'])
        setSnackbar({
          open: true,
          message: 'Estado del curso actualizado exitosamente',
          severity: 'success'
        })
      },
      onError: (error: any) => {
        setSnackbar({
          open: true,
          message: 'Error al actualizar estado: ' + (error.response?.data?.message || error.message),
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
        estimated_duration_minutes: course.estimated_duration_minutes
      })
    } else {
      setEditingCourse(null)
      setFormData({
        title: '',
        description: '',
        audience: 'internal',
        is_mandatory: false,
        has_certificate: false,
        estimated_duration_minutes: 60
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
      estimated_duration_minutes: 60
    })
  }

  const handleSubmit = () => {
    if (editingCourse) {
      saveCourseMutation.mutate({ ...editingCourse, ...formData })
    } else {
      saveCourseMutation.mutate(formData)
    }
  }

  const handleDelete = (courseId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este curso?')) {
      deleteCourseMutation.mutate(courseId)
    }
  }

  const handleInputChange = (field: keyof CreateCourseData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleEditContent = (courseId: number) => {
    navigate(`/lms/admin/courses/${courseId}/content`)
  }

  const handlePreviewCourse = (courseId: number) => {
    navigate(`/lms/course/${courseId}/preview`)
  }

  const handleAssignCourse = (courseId: number) => {
    navigate(`/lms/admin/courses/${courseId}/assignments`)
  }

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

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'internal':
        return 'Interno'
      case 'client':
        return 'Cliente'
      case 'both':
        return 'Ambos'
      default:
        return audience
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

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
                      label={getAudienceLabel(course.audience)} 
                      color={course.audience === 'both' ? 'primary' : 'default'}
                      size='small' 
                    />
                  </TableCell>
                  <TableCell>{formatDuration(course.estimated_duration_minutes)}</TableCell>
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
                        <IconButton
                          size='small'
                          color='secondary'
                          onClick={() => handleAssignCourse(course.id)}
                        >
                          <AssignIcon />
                        </IconButton>
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
              <TextField
                fullWidth
                label='Título del curso'
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
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
                  <MenuItem value='internal'>Empleados internos</MenuItem>
                  <MenuItem value='client'>Clientes</MenuItem>
                  <MenuItem value='both'>Ambos</MenuItem>
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
                required
                inputProps={{ min: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_mandatory}
                    onChange={(e) =>
                      handleInputChange('is_mandatory', e.target.checked)
                    }
                  />
                }
                label='Curso obligatorio'
              />
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
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant='contained'
            disabled={saveCourseMutation.isLoading}
          >
            {saveCourseMutation.isLoading ? 'Guardando...' : 'Guardar'}
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
