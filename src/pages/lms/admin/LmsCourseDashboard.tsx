import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  LinearProgress,
  Rating
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Visibility as ViewIcon,
  Settings as SettingsIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  TrendingUp as TrendingUpIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  EditNote as EditContentIcon
} from '@mui/icons-material'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useNavigate } from 'react-router-dom'
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
  units: any[]
  status: 'draft' | 'published' | 'archived'
  completionRate: number
  lastUpdated: string
}

const LmsCourseDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [openCourseDialog, setOpenCourseDialog] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [newCourse, setNewCourse] = useState({
    title: '',
    description: '',
    category: '',
    instructor: '',
    duration: '',
    audience: {
      employees: false,
      clients: false
    }
  })

  const axiosPrivate = useAxiosPrivate()
  const queryClient = useQueryClient()

  // Mock data para cursos del admin
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
      },
      units: [
        { id: 1, title: 'Introducción', type: 'video', duration: '45 min' },
        { id: 2, title: 'Variables', type: 'text', duration: '30 min' },
        { id: 3, title: 'Quiz', type: 'quiz', duration: '15 min' }
      ],
      status: 'published',
      completionRate: 78,
      lastUpdated: '2024-01-20'
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
      },
      units: [
        { id: 1, title: 'Componentes', type: 'video', duration: '60 min' },
        { id: 2, title: 'Props', type: 'text', duration: '45 min' }
      ],
      status: 'published',
      completionRate: 85,
      lastUpdated: '2024-01-18'
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
      },
      units: [
        { id: 1, title: 'Metodologías', type: 'video', duration: '90 min' }
      ],
      status: 'draft',
      completionRate: 0,
      lastUpdated: '2024-01-12'
    },
    {
      id: 4,
      title: 'Node.js Backend',
      description: 'Desarrollo de APIs con Node.js',
      category: 'Backend',
      instructor: 'Dr. Juan Pérez',
      duration: '12 horas',
      isActive: true,
      isPublic: false,
      totalLessons: 18,
      enrolledStudents: 34,
      rating: 4.5,
      createdAt: '2024-01-25',
      audience: {
        employees: true,
        clients: false
      },
      units: [
        { id: 1, title: 'Express.js', type: 'video', duration: '75 min' },
        { id: 2, title: 'MongoDB', type: 'text', duration: '60 min' }
      ],
      status: 'published',
      completionRate: 65,
      lastUpdated: '2024-01-28'
    }
  ]

  // Query para obtener cursos del admin
  const { data: courses = mockCourses, isLoading } = useQuery<Course[]>(
    'lms-admin-courses',
    async () => {
      // En el futuro, esto hará una llamada real a la API
      // const response = await axiosPrivate.get('/lms/admin/courses')
      // return response.data
      return mockCourses
    }
  )

  // Mutación para crear/actualizar curso
  const saveCourseMutation = useMutation(
    async (courseData: Partial<Course>) => {
      if (editingCourse) {
        return axiosPrivate.put(`/lms/courses/${editingCourse.id}`, courseData)
      } else {
        return axiosPrivate.post('/lms/courses', courseData)
      }
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('lms-admin-courses')
        setOpenCourseDialog(false)
        setEditingCourse(null)
        setNewCourse({
          title: '',
          description: '',
          category: '',
          instructor: '',
          duration: '',
          audience: { employees: false, clients: false }
        })
      },
      onError: (error: any) => {
        console.error('Error al guardar curso:', error)
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
        queryClient.invalidateQueries('lms-admin-courses')
      },
      onError: (error: any) => {
        console.error('Error al eliminar curso:', error)
      }
    }
  )

  const handleCreateCourse = () => {
    setEditingCourse(null)
    setOpenCourseDialog(true)
  }

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course)
    setNewCourse({
      title: course.title,
      description: course.description,
      category: course.category,
      instructor: course.instructor,
      duration: course.duration,
      audience: course.audience
    })
    setOpenCourseDialog(true)
  }

  const handleDeleteCourse = (courseId: number) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este curso?')) {
      deleteCourseMutation.mutate(courseId)
    }
  }

  const handleSaveCourse = () => {
    const courseData = {
      ...newCourse,
      status: 'draft' as const,
      isActive: true,
      isPublic: false,
      totalLessons: 0,
      enrolledStudents: 0,
      rating: 0,
      createdAt: new Date().toISOString().split('T')[0],
      lastUpdated: new Date().toISOString().split('T')[0],
      completionRate: 0,
      units: []
    }
    saveCourseMutation.mutate(courseData)
  }

  const handleTestCourse = (courseId: number) => {
    navigate(`/lms/course/${courseId}/preview`)
  }

  const handleEditContent = (courseId: number) => {
    navigate(`/lms/admin/courses/${courseId}/content`)
  }

  const handleViewCourse = (courseId: number) => {
    navigate(`/lms/course/${courseId}`)
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckIcon />
      case 'draft':
        return <WarningIcon />
      case 'archived':
        return <SettingsIcon />
      default:
        return <SettingsIcon />
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
        return 'Desconocido'
    }
  }

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      filterCategory === 'all' || course.category === filterCategory
    const matchesStatus =
      filterStatus === 'all' || course.status === filterStatus

    return matchesSearch && matchesCategory && matchesStatus
  })

  const categories = [...new Set(courses.map((course) => course.category))]
  const totalCourses = courses.length
  const publishedCourses = courses.filter(
    (c) => c.status === 'published'
  ).length
  // const draftCourses = courses.filter((c) => c.status === 'draft').length
  const totalStudents = courses.reduce((sum, c) => sum + c.enrolledStudents, 0)
  const avgRating =
    courses.reduce((sum, c) => sum + c.rating, 0) / courses.length

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
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3
        }}
      >
        <Box>
          <Typography variant='h4' component='h1'>
            Mis Cursos
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Gestiona y prueba todos tus cursos creados
          </Typography>
        </Box>
        <Button
          variant='contained'
          startIcon={<AddIcon />}
          onClick={handleCreateCourse}
        >
          Crear Nuevo Curso
        </Button>
      </Box>

      {/* Estadísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <SchoolIcon
                  sx={{ fontSize: 40, color: 'primary.main', mr: 2 }}
                />
                <Box>
                  <Typography variant='h4'>{totalCourses}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Total Cursos
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckIcon
                  sx={{ fontSize: 40, color: 'success.main', mr: 2 }}
                />
                <Box>
                  <Typography variant='h4'>{publishedCourses}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Publicados
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PeopleIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
                <Box>
                  <Typography variant='h4'>{totalStudents}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Estudiantes
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TrendingUpIcon
                  sx={{ fontSize: 40, color: 'warning.main', mr: 2 }}
                />
                <Box>
                  <Typography variant='h4'>{avgRating.toFixed(1)}</Typography>
                  <Typography variant='body2' color='text.secondary'>
                    Rating Promedio
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filtros */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems='center'>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label='Buscar cursos...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size='small'
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={filterCategory}
                  label='Categoría'
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <MenuItem value='all'>Todas las categorías</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size='small'>
                <InputLabel>Estado</InputLabel>
                <Select
                  value={filterStatus}
                  label='Estado'
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <MenuItem value='all'>Todos los estados</MenuItem>
                  <MenuItem value='published'>Publicados</MenuItem>
                  <MenuItem value='draft'>Borradores</MenuItem>
                  <MenuItem value='archived'>Archivados</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant='outlined'
                onClick={() => {
                  setSearchTerm('')
                  setFilterCategory('all')
                  setFilterStatus('all')
                }}
              >
                Limpiar
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_e, newValue) => setActiveTab(newValue)}
        >
          <Tab label={`Todos (${filteredCourses.length})`} />
          <Tab
            label={`Publicados (${filteredCourses.filter((c) => c.status === 'published').length})`}
          />
          <Tab
            label={`Borradores (${filteredCourses.filter((c) => c.status === 'draft').length})`}
          />
        </Tabs>
      </Box>

      {/* Lista de cursos */}
      <Grid container spacing={3}>
        {filteredCourses
          .filter((course) => {
            if (activeTab === 0) return true
            if (activeTab === 1) return course.status === 'published'
            if (activeTab === 2) return course.status === 'draft'
            return true
          })
          .map((course) => (
            <Grid item xs={12} md={6} lg={4} key={course.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {course.title.charAt(0)}
                    </Avatar>
                  }
                  action={
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Chip
                        icon={getStatusIcon(course.status)}
                        label={getStatusLabel(course.status)}
                        color={getStatusColor(course.status)}
                        size='small'
                      />
                    </Box>
                  }
                  title={course.title}
                  subheader={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant='caption'>
                        {course.instructor}
                      </Typography>
                      <Typography variant='caption'>•</Typography>
                      <Typography variant='caption'>
                        {course.duration}
                      </Typography>
                    </Box>
                  }
                />
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography
                    variant='body2'
                    color='text.secondary'
                    sx={{ mb: 2 }}
                  >
                    {course.description}
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 2
                    }}
                  >
                    <Chip
                      label={course.category}
                      size='small'
                      variant='outlined'
                    />
                    <Chip
                      label={
                        course.audience.employees ? 'Empleados' : 'Clientes'
                      }
                      size='small'
                      color='primary'
                    />
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2
                    }}
                  >
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <PeopleIcon fontSize='small' />
                      <Typography variant='caption'>
                        {course.enrolledStudents}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <SchoolIcon fontSize='small' />
                      <Typography variant='caption'>
                        {course.totalLessons}
                      </Typography>
                    </Box>
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <Rating value={course.rating} readOnly size='small' />
                    </Box>
                  </Box>

                  {course.status === 'published' && (
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1
                        }}
                      >
                        <Typography variant='caption'>
                          Progreso promedio
                        </Typography>
                        <Typography variant='caption'>
                          {course.completionRate}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant='determinate'
                        value={course.completionRate}
                        sx={{ height: 6, borderRadius: 3 }}
                      />
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size='small'
                      variant='outlined'
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewCourse(course.id)}
                    >
                      Ver
                    </Button>
                    <Button
                      size='small'
                      variant='outlined'
                      startIcon={<PlayIcon />}
                      onClick={() => handleTestCourse(course.id)}
                    >
                      Probar
                    </Button>
                    <Button
                      size='small'
                      variant='outlined'
                      startIcon={<EditContentIcon />}
                      onClick={() => handleEditContent(course.id)}
                    >
                      Contenido
                    </Button>
                    <Button
                      size='small'
                      variant='outlined'
                      startIcon={<EditIcon />}
                      onClick={() => handleEditCourse(course)}
                    >
                      Editar
                    </Button>
                    <IconButton
                      size='small'
                      color='error'
                      onClick={() => handleDeleteCourse(course.id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
      </Grid>

      {filteredCourses.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <SchoolIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant='h6' color='text.secondary' gutterBottom>
            No se encontraron cursos
          </Typography>
          <Typography color='text.secondary'>
            {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
              ? 'Intenta ajustar los filtros de búsqueda'
              : 'Crea tu primer curso para comenzar'}
          </Typography>
        </Box>
      )}

      {/* Dialog para crear/editar curso */}
      <Dialog
        open={openCourseDialog}
        onClose={() => setOpenCourseDialog(false)}
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
                value={newCourse.title}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, title: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label='Descripción'
                value={newCourse.description}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, description: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Categoría'
                value={newCourse.category}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, category: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Instructor'
                value={newCourse.instructor}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, instructor: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label='Duración'
                value={newCourse.duration}
                onChange={(e) =>
                  setNewCourse({ ...newCourse, duration: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant='subtitle2' gutterBottom>
                Audiencia del Curso
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant={
                    newCourse.audience.employees ? 'contained' : 'outlined'
                  }
                  onClick={() =>
                    setNewCourse({
                      ...newCourse,
                      audience: {
                        ...newCourse.audience,
                        employees: !newCourse.audience.employees
                      }
                    })
                  }
                >
                  Empleados
                </Button>
                <Button
                  variant={
                    newCourse.audience.clients ? 'contained' : 'outlined'
                  }
                  onClick={() =>
                    setNewCourse({
                      ...newCourse,
                      audience: {
                        ...newCourse.audience,
                        clients: !newCourse.audience.clients
                      }
                    })
                  }
                >
                  Clientes
                </Button>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCourseDialog(false)}>Cancelar</Button>
          <Button
            onClick={handleSaveCourse}
            variant='contained'
            disabled={
              !newCourse.title ||
              !newCourse.description ||
              !newCourse.category ||
              !newCourse.instructor
            }
          >
            {editingCourse ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default LmsCourseDashboard
