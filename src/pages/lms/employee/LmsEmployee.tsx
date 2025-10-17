import React, { useState, useEffect } from 'react'
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
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider
} from '@mui/material'
import {
  MenuBook as BookOpenIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  Logout as LogoutIcon,
  Warning as WarningIcon,
  Assignment as AssignmentIcon,
  Star as StarIcon,
  PlayArrow as PlayArrowIcon,
  EmojiEvents as AwardIcon
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useStore } from '@nanostores/react'
import { userStore } from '../../../store/userStore'
import LmsNotificationCenter from '../shared/LmsNotificationCenter'

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

interface MandatoryCourse extends Course {
  isMandatory: boolean
  deadline?: string
  daysUntilDeadline?: number
  isOverdue?: boolean
}

// Mock data para cursos obligatorios
const mockMandatoryCourses: MandatoryCourse[] = [
  {
    id: 1,
    title: 'Seguridad en el Trabajo',
    description: 'Curso obligatorio de seguridad laboral',
    progress: 60,
    totalLessons: 8,
    completedLessons: 5,
    category: 'Seguridad',
    instructor: 'Dr. Carlos Méndez',
    duration: '4 horas',
    rating: 4.8,
    isMandatory: true,
    deadline: '2024-02-15',
    daysUntilDeadline: 5,
    isOverdue: false
  },
  {
    id: 2,
    title: 'Protección de Datos',
    description: 'Normativas de protección de datos personales',
    progress: 0,
    totalLessons: 6,
    completedLessons: 0,
    category: 'Cumplimiento',
    instructor: 'Lic. Ana López',
    duration: '3 horas',
    rating: 4.7,
    isMandatory: true,
    deadline: '2024-02-10',
    daysUntilDeadline: -2,
    isOverdue: true
  }
]

// Mock data para cursos opcionales
const mockOptionalCourses: Course[] = [
  {
    id: 3,
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
    id: 4,
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
    id: 5,
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

// Mock data para cursos recomendados
const mockRecommendedCourses: Course[] = [
  {
    id: 6,
    title: 'Comunicación Efectiva',
    description: 'Mejora tus habilidades de comunicación',
    progress: 0,
    totalLessons: 10,
    completedLessons: 0,
    category: 'Habilidades Blandas',
    instructor: 'Dra. Patricia Ruiz',
    duration: '5 horas',
    rating: 4.9
  },
  {
    id: 7,
    title: 'Liderazgo Transformacional',
    description: 'Desarrolla habilidades de liderazgo moderno',
    progress: 0,
    totalLessons: 12,
    completedLessons: 0,
    category: 'Liderazgo',
    instructor: 'Ing. Roberto Silva',
    duration: '7 horas',
    rating: 4.8
  }
]

const mockStats = {
  totalCourses: 15,
  completedCourses: 8,
  inProgressCourses: 4,
  averageProgress: 73,
  certificatesEarned: 12,
  totalHoursLearned: 45,
  mandatoryCourses: 2,
  mandatoryCompleted: 0,
  overdueTraining: 1
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
          <Tab label='Cursos Obligatorios' />
          <Tab label='Cursos Opcionales' />
          <Tab label='Notificaciones' />
        </Tabs>

        {activeTab === 0 && (
          <Box>
            {/* Alertas importantes */}
            {mockStats.overdueTraining > 0 && (
              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  <strong>¡Atención!</strong> Tienes {mockStats.overdueTraining} curso(s) obligatorio(s) vencido(s).
                  <Button size="small" sx={{ ml: 2 }} onClick={() => setActiveTab(1)}>
                    Ver cursos obligatorios
                  </Button>
                </Typography>
              </Alert>
            )}

            {/* Estadísticas principales */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} lg={3}>
                <Card>
                  <CardHeader
                    avatar={<AssignmentIcon color='error' />}
                    title='Cursos Obligatorios'
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
                      {mockStats.mandatoryCourses}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {mockStats.mandatoryCompleted} completados
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
                    avatar={<AwardIcon color='warning' />}
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

            {/* Resumen de progreso */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardHeader title='Cursos en Progreso' />
                  <CardContent>
                    <List>
                      {[...mockMandatoryCourses, ...mockOptionalCourses]
                        .filter((course) => course.progress > 0 && course.progress < 100)
                        .slice(0, 4)
                        .map((course) => (
                          <React.Fragment key={course.id}>
                            <ListItem 
                              button 
                              onClick={() => handleCourseClick(course.id)}
                              sx={{ px: 0 }}
                            >
                              <ListItemIcon>
                                <Avatar sx={{ bgcolor: 'isMandatory' in course && course.isMandatory ? 'error.main' : 'primary.main', width: 40, height: 40 }}>
                                  <BookOpenIcon />
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body1" fontWeight="medium">
                                      {course.title}
                                    </Typography>
                                    {'isMandatory' in course && course.isMandatory && (
                                      <Chip label="Obligatorio" size="small" color="error" />
                                    )}
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {course.instructor} • {course.duration}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                                      <LinearProgress
                                        variant="determinate"
                                        value={course.progress}
                                        sx={{ flex: 1, mr: 2, height: 6, borderRadius: 3 }}
                                      />
                                      <Typography variant="caption" color="text.secondary">
                                        {course.progress}%
                                      </Typography>
                                    </Box>
                                  </Box>
                                }
                              />
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<PlayArrowIcon />}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCourseClick(course.id)
                                }}
                              >
                                Continuar
                              </Button>
                            </ListItem>
                            <Divider />
                          </React.Fragment>
                        ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 2 }}>
                  <CardHeader title="Próximos Vencimientos" />
                  <CardContent>
                    {mockMandatoryCourses
                      .filter(course => course.daysUntilDeadline && course.daysUntilDeadline <= 7)
                      .map(course => (
                        <Box key={course.id} sx={{ mb: 2, p: 2, border: 1, borderColor: course.isOverdue ? 'error.main' : 'warning.main', borderRadius: 1 }}>
                          <Typography variant="body2" fontWeight="medium" color={course.isOverdue ? 'error.main' : 'warning.main'}>
                            {course.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {course.isOverdue 
                              ? `Vencido hace ${Math.abs(course.daysUntilDeadline!)} días`
                              : `Vence en ${course.daysUntilDeadline} días`
                            }
                          </Typography>
                        </Box>
                      ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader title="Logros Recientes" />
                  <CardContent>
                    <List dense>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><AwardIcon color="warning" /></ListItemIcon>
                        <ListItemText 
                          primary="Certificado obtenido"
                          secondary="Gestión de Proyectos"
                        />
                      </ListItem>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon><CheckCircleIcon color="success" /></ListItemIcon>
                        <ListItemText 
                          primary="Curso completado"
                          secondary="React Fundamentals"
                        />
                      </ListItem>
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}

        {activeTab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>
                Cursos Obligatorios
              </Typography>
              <Chip 
                label={`${mockStats.overdueTraining} vencidos`} 
                color="error" 
                size="small"
                sx={{ display: mockStats.overdueTraining > 0 ? 'flex' : 'none' }}
              />
            </Box>
            
            <Grid container spacing={3}>
              {mockMandatoryCourses.map((course) => (
                <Grid item xs={12} md={6} key={course.id}>
                  <Card 
                    variant='outlined'
                    sx={{ 
                      cursor: 'pointer',
                      border: course.isOverdue ? 2 : 1,
                      borderColor: course.isOverdue ? 'error.main' : course.daysUntilDeadline && course.daysUntilDeadline <= 7 ? 'warning.main' : 'divider'
                    }}
                    onClick={() => handleCourseClick(course.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                        <Avatar sx={{ bgcolor: course.isOverdue ? 'error.main' : 'warning.main', mr: 2 }}>
                          {course.isOverdue ? <WarningIcon /> : <AssignmentIcon />}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant='h6' component='div'>
                              {course.title}
                            </Typography>
                            <Chip 
                              label="OBLIGATORIO" 
                              size="small" 
                              color="error"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </Box>
                          <Typography variant='body2' color='text.secondary'>
                            {course.instructor} • {course.duration}
                          </Typography>
                          {course.deadline && (
                            <Typography 
                              variant='caption' 
                              color={course.isOverdue ? 'error.main' : course.daysUntilDeadline && course.daysUntilDeadline <= 7 ? 'warning.main' : 'text.secondary'}
                              sx={{ fontWeight: 'medium' }}
                            >
                              {course.isOverdue 
                                ? `⚠️ Vencido hace ${Math.abs(course.daysUntilDeadline!)} días`
                                : `📅 Vence en ${course.daysUntilDeadline} días`
                              }
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                        {course.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant='caption' color='text.secondary'>
                          {course.completedLessons}/{course.totalLessons} lecciones
                        </Typography>
                        <Chip
                          label={`${course.progress}%`}
                          color={course.progress > 0 ? 'success' : 'default'}
                          size='small'
                        />
                      </Box>
                      
                      <LinearProgress
                        variant='determinate'
                        value={course.progress}
                        sx={{ 
                          height: 8, 
                          borderRadius: 4,
                          backgroundColor: 'grey.200',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: course.isOverdue ? 'error.main' : course.progress > 0 ? 'success.main' : 'warning.main'
                          }
                        }}
                      />
                      
                      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                        <Button
                          variant={course.progress > 0 ? 'outlined' : 'contained'}
                          size="small"
                          fullWidth
                          startIcon={<PlayArrowIcon />}
                          color={course.isOverdue ? 'error' : 'primary'}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCourseClick(course.id)
                          }}
                        >
                          {course.progress > 0 ? 'Continuar' : 'Comenzar'}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {activeTab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant='h6'>
                Cursos Opcionales
              </Typography>
              <Typography variant='body2' color='text.secondary'>
                {mockOptionalCourses.length} cursos disponibles
              </Typography>
            </Box>
            
            <Grid container spacing={3}>
              {mockOptionalCourses.map((course) => (
                <Grid item xs={12} md={6} lg={4} key={course.id}>
                  <Card
                    variant='outlined'
                    sx={{ cursor: 'pointer', height: '100%' }}
                    onClick={() => handleCourseClick(course.id)}
                  >
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                          <BookOpenIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant='h6' component='div'>
                            {course.title}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            {course.instructor}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant='caption'>{course.rating}</Typography>
                        </Box>
                      </Box>
                      
                      <Typography variant='body2' color='text.secondary' sx={{ mb: 2 }}>
                        {course.description}
                      </Typography>
                      
                      <Chip 
                        label={course.category} 
                        size="small" 
                        variant="outlined" 
                        sx={{ mb: 2 }}
                      />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant='caption' color='text.secondary'>
                          {course.completedLessons}/{course.totalLessons} lecciones
                        </Typography>
                        <Typography variant='caption' color='text.secondary'>
                          {course.duration}
                        </Typography>
                      </Box>
                      
                      {course.progress > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant='caption'>Progreso</Typography>
                            <Typography variant='caption'>{course.progress}%</Typography>
                          </Box>
                          <LinearProgress
                            variant='determinate'
                            value={course.progress}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                        </Box>
                      )}
                      
                      <Button
                        variant={course.progress > 0 ? 'outlined' : 'contained'}
                        size="small"
                        fullWidth
                        startIcon={<PlayArrowIcon />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCourseClick(course.id)
                        }}
                      >
                        {course.progress === 100 ? 'Revisar' : course.progress > 0 ? 'Continuar' : 'Comenzar'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {activeTab === 3 && (
          <Box>
            <LmsNotificationCenter userRole="employee" userId={currentUser.id} />
          </Box>
        )}
      </Box>
    </Box>
  )
}

export default LmsEmployee
