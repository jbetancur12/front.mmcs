import React, { useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Badge,
  LinearProgress,
  Grid,
  Tabs,
  Tab,
  Paper,
  Chip,
  Avatar
} from '@mui/material'
import {
  MenuBook as BookOpenIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Logout as LogoutIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'

interface User {
  id: number
  email: string
  role: string
  name: string
}

interface Course {
  id: number
  title: string
  description: string
  progress: number
  totalLessons: number
  completedLessons: number
  category: string
  instructor: string
  duration: string
  rating: number
  image?: string
}

interface EmployeeDashboardProps {
  user?: User
}

// Mock data
const mockCourses: Course[] = [
  {
    id: 1,
    title: 'JavaScript Avanzado',
    description: 'Aprende conceptos avanzados de JavaScript',
    progress: 75,
    totalLessons: 12,
    completedLessons: 9,
    category: 'Programación',
    instructor: 'Dr. Carlos Méndez',
    duration: '8 horas',
    rating: 4.8
  },
  {
    id: 2,
    title: 'React Fundamentals',
    description: 'Introducción a React y sus conceptos básicos',
    progress: 45,
    totalLessons: 15,
    completedLessons: 7,
    category: 'Frontend',
    instructor: 'Ing. María García',
    duration: '10 horas',
    rating: 4.6
  },
  {
    id: 3,
    title: 'Gestión de Proyectos',
    description: 'Metodologías y herramientas de gestión',
    progress: 100,
    totalLessons: 8,
    completedLessons: 8,
    category: 'Gestión',
    instructor: 'Lic. Ana López',
    duration: '6 horas',
    rating: 4.9
  }
]

const mockStats = {
  totalCourses: 15,
  completedCourses: 8,
  inProgressCourses: 4,
  averageProgress: 73,
  certificatesEarned: 12,
  totalHoursLearned: 45
}

const LmsEmployee: React.FC<EmployeeDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0)
  const navigate = useNavigate()
  const $userStore = useStore(userStore)

  // Usar el usuario del store si no se proporciona uno
  const currentUser = user || {
    id: $userStore.customer?.id || 1,
    email: $userStore.email || '',
    role: 'employee',
    name: $userStore.nombre || $userStore.email || 'Empleado'
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handleCourseClick = (courseId: number) => {
    // Navegar al curso específico
    console.log('Navegando al curso:', courseId)
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50' }}>
      {/* Header */}
      <Paper elevation={1} sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Box
          sx={{
            maxWidth: 'xl',
            mx: 'auto',
            px: { xs: 2, sm: 3, lg: 4 },
            py: 2
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box>
              <Typography
                variant='h4'
                component='h1'
                sx={{ fontWeight: 'bold', color: 'text.primary' }}
              >
                Mi Aprendizaje
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Bienvenido, {currentUser.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge
                badgeContent='Empleado'
                color='secondary'
                sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}
              />
              <Button
                variant='outlined'
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                size='small'
              >
                Cerrar Sesión
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Box
        sx={{ maxWidth: 'xl', mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 4 }}
      >
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 4 }}>
          <Tab label='Mi Progreso' />
          <Tab label='Cursos Activos' />
          <Tab label='Certificados' />
          <Tab label='Recomendados' />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            {/* Estadísticas principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<BookOpenIcon color='primary' />}
                    title='Cursos Totales'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {mockStats.totalCourses}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {mockStats.completedCourses} completados
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<TrendingUpIcon color='success' />}
                    title='Progreso Promedio'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {mockStats.averageProgress}%
                    </Typography>
                    <LinearProgress
                      variant='determinate'
                      value={mockStats.averageProgress}
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<CheckCircleIcon color='warning' />}
                    title='Certificados'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {mockStats.certificatesEarned}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Obtenidos
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<ScheduleIcon color='info' />}
                    title='Horas Aprendidas'
                    titleTypographyProps={{
                      variant: 'body2',
                      color: 'text.secondary'
                    }}
                  />
                  <CardContent>
                    <Typography
                      variant='h4'
                      component='div'
                      sx={{ fontWeight: 'bold' }}
                    >
                      {mockStats.totalHoursLearned}h
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      Este año
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Cursos en progreso */}
            <Card>
              <CardHeader title='Cursos en Progreso' />
              <CardContent>
                <Grid container spacing={3}>
                  {mockCourses
                    .filter((course) => course.progress < 100)
                    .map((course) => (
                      <Grid item xs={12} md={6} lg={4} key={course.id}>
                        <Card
                          variant='outlined'
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleCourseClick(course.id)}
                        >
                          <CardContent>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                mb: 2
                              }}
                            >
                              <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                                <BookOpenIcon />
                              </Avatar>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant='h6' component='div'>
                                  {course.title}
                                </Typography>
                                <Typography
                                  variant='body2'
                                  color='text.secondary'
                                >
                                  {course.instructor}
                                </Typography>
                              </Box>
                              <Chip
                                label={`${course.progress}%`}
                                color={
                                  course.progress > 50 ? 'success' : 'warning'
                                }
                                size='small'
                              />
                            </Box>
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
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 1
                              }}
                            >
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {course.completedLessons}/{course.totalLessons}{' '}
                                lecciones
                              </Typography>
                              <Typography
                                variant='caption'
                                color='text.secondary'
                              >
                                {course.duration}
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant='determinate'
                              value={course.progress}
                              sx={{ height: 6, borderRadius: 3 }}
                            />
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Cursos Activos
            </Typography>
            <Typography color='text.secondary'>
              Funcionalidad de cursos activos en desarrollo...
            </Typography>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Mis Certificados
            </Typography>
            <Typography color='text.secondary'>
              Funcionalidad de certificados en desarrollo...
            </Typography>
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            <Typography variant='h6' sx={{ mb: 2 }}>
              Cursos Recomendados
            </Typography>
            <Typography color='text.secondary'>
              Funcionalidad de recomendaciones en desarrollo...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default LmsEmployee
