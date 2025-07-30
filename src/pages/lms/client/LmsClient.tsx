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
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider
} from '@mui/material'
import {
  MenuBook as BookOpenIcon,
  PlayCircle as PlayCircleIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  Quiz as QuizIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Star as StarIcon,
  Explore as ExploreIcon
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
  isPublic: boolean
}

interface ClientDashboardProps {
  user?: User
}

// Mock data
const mockCourses: Course[] = [
  {
    id: 1,
    title: 'Introducción a la Programación',
    description: 'Conceptos básicos de programación para principiantes',
    progress: 60,
    totalLessons: 10,
    completedLessons: 6,
    category: 'Programación',
    instructor: 'Dr. Carlos Méndez',
    duration: '6 horas',
    rating: 4.7,
    isPublic: true
  },
  {
    id: 2,
    title: 'Excel Básico',
    description: 'Aprende a usar Excel desde cero',
    progress: 30,
    totalLessons: 8,
    completedLessons: 2,
    category: 'Ofimática',
    instructor: 'Ing. María García',
    duration: '4 horas',
    rating: 4.5,
    isPublic: true
  },
  {
    id: 3,
    title: 'Comunicación Efectiva',
    description: 'Mejora tus habilidades de comunicación',
    progress: 100,
    totalLessons: 6,
    completedLessons: 6,
    category: 'Habilidades Blandas',
    instructor: 'Lic. Ana López',
    duration: '3 horas',
    rating: 4.8,
    isPublic: true
  }
]

const mockStats = {
  totalCourses: 8,
  completedCourses: 3,
  inProgressCourses: 2,
  averageProgress: 65,
  certificatesEarned: 5,
  totalHoursLearned: 25
}

const LmsClient: React.FC<ClientDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState(0)
  const navigate = useNavigate()
  const $userStore = useStore(userStore)

  // Usar el usuario del store si no se proporciona uno
  const currentUser = user || {
    id: $userStore.customer?.id || 1,
    email: $userStore.email || '',
    role: 'client',
    name: $userStore.nombre || $userStore.email || 'Cliente'
  }

  const handleLogout = () => {
    localStorage.removeItem('currentUser')
    navigate('/')
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
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
                Cursos Públicos
              </Typography>
              <Typography variant='body1' color='text.secondary'>
                Bienvenido, {currentUser.name}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Badge
                badgeContent='Cliente'
                color='info'
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
          <Tab label='Cursos Disponibles' />
          <Tab label='Certificados' />
          <Tab label='Explorar' />
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
              <CardHeader title='Mis Cursos' />
              <CardContent>
                <Grid container spacing={3}>
                  {mockCourses.map((course) => (
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
              Cursos Disponibles
            </Typography>
            <Typography color='text.secondary'>
              Funcionalidad de cursos disponibles en desarrollo...
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
              Explorar Cursos
            </Typography>
            <Typography color='text.secondary'>
              Funcionalidad de exploración en desarrollo...
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default LmsClient
