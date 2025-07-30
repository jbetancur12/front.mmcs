import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  MenuBook as BookOpenIcon,
  Person as PersonIcon,
  Schedule as ScheduleIcon,
  EditNote as EditContentIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import useAxiosPrivate from '@utils/use-axios-private'

interface Course {
  id: number
  title: string
  description: string
  category: string
  instructor: string
  duration: string
  isActive: boolean
  isPublic: boolean
  totalLessons: number
  enrolledStudents: number
  rating: number
  createdAt: string
  audience: {
    employees: boolean
    clients: boolean
  }
}

interface CreateCourseData {
  title: string
  description: string
  category: string
  instructor: string
  duration: string
  isActive: boolean
  isPublic: boolean
  totalLessons: number
  audience: {
    employees: boolean
    clients: boolean
  }
}

const LmsCourseManagement: React.FC = () => {
  const navigate = useNavigate()
  const [openDialog, setOpenDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState<CreateCourseData>({
    title: '',
    description: '',
    category: '',
    instructor: '',
    duration: '',
    isActive: true,
    isPublic: false,
    totalLessons: 0,
    audience: {
      employees: false,
      clients: false
    }
  })

  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  // Mock data para cursos
  const mockCourses: Course[] = [
    {
      id: 1,
      title: 'JavaScript Avanzado',
      description: 'Aprende conceptos avanzados de JavaScript',
      category: 'Programación',
      instructor: 'Dr. Carlos Méndez',
      duration: '8 horas',
      isActive: true,
      isPublic: false,
      totalLessons: 12,
      enrolledStudents: 45,
      rating: 4.8,
      createdAt: '2024-01-15',
      audience: {
        employees: true,
        clients: false
      }
    },
    {
      id: 2,
      title: 'React Fundamentals',
      description: 'Introducción a React y sus conceptos básicos',
      category: 'Frontend',
      instructor: 'Ing. María García',
      duration: '10 horas',
      isActive: true,
      isPublic: true,
      totalLessons: 15,
      enrolledStudents: 78,
      rating: 4.6,
      createdAt: '2024-01-10',
      audience: {
        employees: true,
        clients: true
      }
    },
    {
      id: 3,
      title: 'Gestión de Proyectos',
      description: 'Metodologías y herramientas de gestión',
      category: 'Gestión',
      instructor: 'Lic. Ana López',
      duration: '6 horas',
      isActive: false,
      isPublic: false,
      totalLessons: 8,
      enrolledStudents: 23,
      rating: 4.9,
      createdAt: '2024-01-05',
      audience: {
        employees: true,
        clients: false
      }
    }
  ]

  // Query para obtener cursos (usando mock data por ahora)
  const { data: courses = mockCourses, isLoading } = useQuery<Course[]>(
    'lms-courses',
    async () => {
      // En el futuro, esto hará una llamada real a la API
      // const response = await axiosPrivate.get('/lms/courses')
      // return response.data
      return mockCourses
    }
  )

  // Mutación para crear/actualizar curso
  const saveCourseMutation = useMutation(
    async (courseData: CreateCourseData | Course) => {
      if ('id' in courseData) {
        // Actualizar curso existente
        return axiosPrivate.put(`/lms/courses/${courseData.id}`, courseData)
      } else {
        // Crear nuevo curso
        return axiosPrivate.post('/lms/courses', courseData)
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('lms-courses')
        handleCloseDialog()
      },
      onError: (error: any) => {
        console.error('Error al guardar curso:', error)
        // Aquí podrías mostrar un toast de error
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
        queryClient.invalidateQueries('lms-courses')
      },
      onError: (error: any) => {
        console.error('Error al eliminar curso:', error)
      }
    }
  )

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course)
      setFormData({
        title: course.title,
        description: course.description,
        category: course.category,
        instructor: course.instructor,
        duration: course.duration,
        isActive: course.isActive,
        isPublic: course.isPublic,
        totalLessons: course.totalLessons,
        audience: course.audience
      })
    } else {
      setEditingCourse(null)
      setFormData({
        title: '',
        description: '',
        category: '',
        instructor: '',
        duration: '',
        isActive: true,
        isPublic: false,
        totalLessons: 0,
        audience: {
          employees: false,
          clients: false
        }
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
      category: '',
      instructor: '',
      duration: '',
      isActive: true,
      isPublic: false,
      totalLessons: 0,
      audience: {
        employees: false,
        clients: false
      }
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

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}
      >
        <Typography>Cargando cursos...</Typography>
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
              <TableCell>Categoría</TableCell>
              <TableCell>Instructor</TableCell>
              <TableCell>Duración</TableCell>
              <TableCell>Lecciones</TableCell>
              <TableCell>Estudiantes</TableCell>
              <TableCell>Audiencia</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>
                  <Box>
                    <Typography variant='subtitle2' fontWeight='bold'>
                      {course.title}
                    </Typography>
                    <Typography variant='caption' color='text.secondary'>
                      {course.description}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip label={course.category} size='small' />
                </TableCell>
                <TableCell>{course.instructor}</TableCell>
                <TableCell>{course.duration}</TableCell>
                <TableCell>{course.totalLessons}</TableCell>
                <TableCell>{course.enrolledStudents}</TableCell>
                <TableCell>
                  <Box
                    sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}
                  >
                    {course.audience.employees && (
                      <Chip label='Empleados' color='primary' size='small' />
                    )}
                    {course.audience.clients && (
                      <Chip label='Clientes' color='secondary' size='small' />
                    )}
                    {!course.audience.employees && !course.audience.clients && (
                      <Chip
                        label='Sin audiencia'
                        color='default'
                        size='small'
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip
                      label={course.isActive ? 'Activo' : 'Inactivo'}
                      color={course.isActive ? 'success' : 'default'}
                      size='small'
                    />
                    {course.isPublic && (
                      <Chip label='Público' color='info' size='small' />
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size='small'
                      onClick={() => handleOpenDialog(course)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size='small'
                      color='primary'
                      onClick={() => handleEditContent(course.id)}
                      title='Editar Contenido'
                    >
                      <EditContentIcon />
                    </IconButton>
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => handleDelete(course.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Categoría'
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Instructor'
                value={formData.instructor}
                onChange={(e) =>
                  handleInputChange('instructor', e.target.value)
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Duración'
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type='number'
                label='Número de lecciones'
                value={formData.totalLessons}
                onChange={(e) =>
                  handleInputChange('totalLessons', parseInt(e.target.value))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleInputChange('isActive', e.target.checked)
                    }
                  />
                }
                label='Curso activo'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPublic}
                    onChange={(e) =>
                      handleInputChange('isPublic', e.target.checked)
                    }
                  />
                }
                label='Curso público'
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant='h6' sx={{ mb: 2, mt: 2 }}>
                Audiencia del Curso
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.audience.employees}
                    onChange={(e) =>
                      handleInputChange('audience', {
                        ...formData.audience,
                        employees: e.target.checked
                      })
                    }
                  />
                }
                label='Disponible para Empleados'
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.audience.clients}
                    onChange={(e) =>
                      handleInputChange('audience', {
                        ...formData.audience,
                        clients: e.target.checked
                      })
                    }
                  />
                }
                label='Disponible para Clientes'
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
    </Box>
  )
}

export default LmsCourseManagement
